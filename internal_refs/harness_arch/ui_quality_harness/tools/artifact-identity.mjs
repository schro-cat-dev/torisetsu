import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function sha256(value) {
  const input = typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value);
  return createHash("sha256").update(input).digest("hex");
}

export async function fileSha256(filePath) {
  return sha256(await readFile(filePath));
}
