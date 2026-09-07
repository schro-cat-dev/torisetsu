import type { Parent, Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import type { DetailLayoutPolicy } from "./types";

export type MarkdownSanitizationChangeCode =
  | "control_character_removed"
  | "raw_html_removed"
  | "unsafe_link_removed"
  | "image_removed"
  | "reference_link_flattened";

export interface MarkdownSanitizationChange {
  code: MarkdownSanitizationChangeCode;
  count: number;
}

export interface MarkdownSanitizationResult {
  markdown: string;
  changes: ReadonlyArray<MarkdownSanitizationChange>;
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: "-",
    fences: true,
  });
const SAFE_LINK_PROTOCOLS = new Set(["http", "https", "mailto"]);

function hasChildren(node: Root | RootContent): node is Root | (RootContent & Parent) {
  return "children" in node && Array.isArray(node.children);
}

function isSafeUrl(url: string, policy: DetailLayoutPolicy) {
  const normalizedUrl = url.trim();
  if (
    normalizedUrl.length === 0 ||
    normalizedUrl.startsWith("//") ||
    normalizedUrl.startsWith("\\") ||
    /[\u0000-\u001f\u007f]/.test(normalizedUrl)
  ) {
    return false;
  }

  const protocolMatch = normalizedUrl.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!protocolMatch) {
    return true;
  }

  const protocol = protocolMatch[1].toLowerCase();
  return (
    SAFE_LINK_PROTOCOLS.has(protocol) &&
    policy.allowedLinkProtocols.includes(protocol)
  );
}

function recordChange(
  changes: Map<MarkdownSanitizationChangeCode, number>,
  code: MarkdownSanitizationChangeCode,
) {
  changes.set(code, (changes.get(code) ?? 0) + 1);
}

function sanitizeChildren(
  parent: Parent,
  policy: DetailLayoutPolicy,
  changes: Map<MarkdownSanitizationChangeCode, number>,
) {
  const safeChildren: RootContent[] = [];

  for (const child of parent.children as RootContent[]) {
    if (child.type === "html") {
      recordChange(changes, "raw_html_removed");
      continue;
    }

    if (child.type === "image" || child.type === "imageReference") {
      recordChange(changes, "image_removed");
      if (child.alt) {
        safeChildren.push({ type: "text", value: child.alt });
      }
      continue;
    }

    if (child.type === "definition") {
      recordChange(changes, "reference_link_flattened");
      continue;
    }

    if (child.type === "linkReference") {
      recordChange(changes, "reference_link_flattened");
      sanitizeChildren(child, policy, changes);
      safeChildren.push(...(child.children as RootContent[]));
      continue;
    }

    if (child.type === "link" && !isSafeUrl(child.url, policy)) {
      recordChange(changes, "unsafe_link_removed");
      sanitizeChildren(child, policy, changes);
      safeChildren.push(...(child.children as RootContent[]));
      continue;
    }

    if (hasChildren(child)) {
      sanitizeChildren(child, policy, changes);
    }
    safeChildren.push(child);
  }

  parent.children = safeChildren;
}

export function sanitizeMarkdownForDisplay(
  markdown: string,
  policy: DetailLayoutPolicy,
): MarkdownSanitizationResult {
  const changes = new Map<MarkdownSanitizationChangeCode, number>();
  const normalizedMarkdown = markdown.replace(
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
    () => {
      recordChange(changes, "control_character_removed");
      return "";
    },
  );
  const tree = markdownProcessor.parse(normalizedMarkdown) as Root;
  sanitizeChildren(tree, policy, changes);

  return {
    markdown: markdownProcessor.stringify(tree),
    changes: [...changes.entries()].map(([code, count]) => ({ code, count })),
  };
}
