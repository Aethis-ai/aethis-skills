#!/usr/bin/env node
// Emit the actual MCP tools/list response for compatibility validation.
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const [serverEntry, output] = process.argv.slice(2);
if (!serverEntry || !output) {
  console.error("usage: emit-mcp-tools-list.mjs <built-mcp-server> <output-json>");
  process.exit(2);
}
const server = resolve(serverEntry);
const sdkRoot = resolve(dirname(server), "..", "node_modules", "@modelcontextprotocol", "sdk");
const { Client } = await import(pathToFileURL(resolve(sdkRoot, "dist", "esm", "client", "index.js")).href);
const { StdioClientTransport } = await import(pathToFileURL(resolve(sdkRoot, "dist", "esm", "client", "stdio.js")).href);
const client = new Client({ name: "aethis-skills-compatibility", version: "0.5.0" });
const transport = new StdioClientTransport({ command: process.execPath, args: [server] });
try {
  await client.connect(transport);
  writeFileSync(output, JSON.stringify(await client.listTools(), null, 2) + "\n");
} finally {
  await client.close();
}
