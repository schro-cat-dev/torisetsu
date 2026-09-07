const SNAPSHOT_VERSION = "ui-dom-snapshot.v2";

export async function captureUiDomSnapshot(page, config) {
  if (config.waitForSelector) await page.waitForSelector(config.waitForSelector);

  return page.evaluate(({ snapshotVersion, captureConfig }) => {
    const allElements = Array.from(document.querySelectorAll("body *"));
    const domOrderByElement = new Map(allElements.map((element, index) => [element, index]));

    function isVisible(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    }

    function visibleText(element) {
      if (!element || !isVisible(element)) return "";
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const parts = [];
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        if (parent && isVisible(parent) && parent.getAttribute("aria-hidden") !== "true") {
          const value = (node.textContent ?? "").replace(/\s+/gu, " ").trim();
          if (value) parts.push(value);
        }
        node = walker.nextNode();
      }
      return parts.join(" ");
    }

    function box(element) {
      if (!element || !isVisible(element)) return { x: 0, y: 0, width: 0, height: 0 };
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
    }

    const infoEntries = (captureConfig.infos ?? []).map((info) => ({ config: info, element: document.querySelector(info.selector) }));
    const visibleInfoEntries = infoEntries
      .filter(({ element }) => isVisible(element))
      .sort((left, right) => {
        const leftBox = left.element.getBoundingClientRect();
        const rightBox = right.element.getBoundingClientRect();
        return leftBox.top - rightBox.top || leftBox.left - rightBox.left || (domOrderByElement.get(left.element) ?? 0) - (domOrderByElement.get(right.element) ?? 0);
      });
    const visualOrderByElement = new Map(visibleInfoEntries.map(({ element }, index) => [element, index]));

    const infos = infoEntries.map(({ config: info, element }) => ({
      id: info.id,
      visible: isVisible(element),
      domOrder: element ? domOrderByElement.get(element) ?? 0 : 0,
      visualOrder: element ? visualOrderByElement.get(element) ?? 0 : 0,
      textLength: visibleText(element).length
    }));

    const items = [];
    for (const itemConfig of captureConfig.items ?? []) {
      const itemElements = Array.from(document.querySelectorAll(itemConfig.selector));
      for (const [index, itemElement] of itemElements.entries()) {
        const id = itemConfig.idAttribute ? itemElement.getAttribute(itemConfig.idAttribute) || `item-${index + 1}` : `item-${index + 1}`;
        items.push({
          id,
          visibleTextLength: visibleText(itemElement).length,
          primaryActionCount: Array.from(itemElement.querySelectorAll(itemConfig.primaryActionSelector)).filter(isVisible).length
        });
      }
    }

    const elements = [];
    for (const elementConfig of captureConfig.elements ?? []) {
      const matches = elementConfig.multiple
        ? Array.from(document.querySelectorAll(elementConfig.selector))
        : [document.querySelector(elementConfig.selector)];
      matches.forEach((element, index) => {
        const ref = elementConfig.multiple ? `${elementConfig.ref}[${index}]` : elementConfig.ref;
        elements.push({
          ref,
          role: elementConfig.role,
          visible: isVisible(element),
          visibleLabel: visibleText(element),
          variant: elementConfig.variant ?? "",
          boundingBox: box(element)
        });
      });
    }

    const consistencyGroups = (captureConfig.consistencyGroups ?? []).map((group) => ({
      id: group.id,
      refs: group.refs ?? elements.filter((element) => element.ref.startsWith(group.refPrefix)).map((element) => element.ref),
      expected: group.expected
    }));

    return {
      schemaVersion: snapshotVersion,
      snapshotId: captureConfig.captureId,
      capturedAt: new Date().toISOString(),
      infos,
      items,
      elements,
      consistencyGroups
    };
  }, { snapshotVersion: SNAPSHOT_VERSION, captureConfig: config });
}
