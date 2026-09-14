#!/usr/bin/env node
// Validate this skills dependency subset against an emitted MCP tools/list contract.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve("tools.json");
const schemaPath = process.env.AETHIS_MCP_TOOLS_LIST;
if (!schemaPath) {
  console.error("ERROR: AETHIS_MCP_TOOLS_LIST must name an emitted MCP tools/list JSON file.");
  process.exit(1);
}
let manifest, inventory;
try { manifest = JSON.parse(readFileSync(manifestPath)); inventory = JSON.parse(readFileSync(resolve(schemaPath))); }
catch (error) { console.error(`ERROR: could not read compatibility input: ${error.message}`); process.exit(1); }
if (!Array.isArray(inventory.tools)) { console.error("ERROR: emitted tools/list schema has no tools array."); process.exit(1); }
const actual = new Map(inventory.tools.map((tool) => [tool.name, new Set(tool.input_fields || [])]));
const declared = Object.values(manifest.tools).flatMap((group) => Object.entries(group));
const refs = new Set([...readFileSync("skills/policy-to-ruleset/SKILL.md", "utf8"), ...readFileSync("skills/train-validate-publish/SKILL.md", "utf8"), ...readFileSync("skills/decide-with-trace/SKILL.md", "utf8"), ...readFileSync("skills/regression-compare/SKILL.md", "utf8")].join(" ").match(/aethis_[a-z_]+/g) || []);
let failed = false;
for (const tool of refs) if (!actual.has(tool)) { console.error(`ERROR: skill references missing tool ${tool}`); failed = true; }
for (const [name, spec] of declared) {
  const fields = actual.get(name);
  if (!fields) { console.error(`ERROR: declared dependency missing from emitted schema: ${name}`); failed = true; continue; }
  for (const parameter of [...(spec.required_params || []), ...(spec.optional_params || [])]) if (!fields.has(parameter)) { console.error(`ERROR: ${name} uses unavailable parameter ${parameter}`); failed = true; }
}
if (!failed) console.log(`OK: ${declared.length} skill dependencies validated against ${inventory.tools.length} emitted MCP tools`);
process.exit(failed ? 1 : 0);
