#!/usr/bin/env node
// Validate this skills dependency subset against an emitted MCP tools/list contract.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.env.AETHIS_SKILLS_ROOT || ".");
const manifestPath = resolve(root, "tools.json");
const schemaPath = process.env.AETHIS_MCP_TOOLS_LIST;
if (!schemaPath) {
  console.error("ERROR: AETHIS_MCP_TOOLS_LIST must name an emitted MCP tools/list JSON file.");
  process.exit(1);
}
let manifest, inventory;
try { manifest = JSON.parse(readFileSync(manifestPath)); inventory = JSON.parse(readFileSync(resolve(schemaPath))); }
catch (error) { console.error(`ERROR: could not read compatibility input: ${error.message}`); process.exit(1); }
if (!Array.isArray(inventory.tools)) { console.error("ERROR: emitted tools/list schema has no tools array."); process.exit(1); }
const actual = new Map();
for (const tool of inventory.tools) {
  const properties = tool?.inputSchema?.properties;
  if (!tool?.name || !properties || Array.isArray(properties) || typeof properties !== "object") {
    console.error(`ERROR: emitted tools/list entry ${tool?.name || "<unnamed>"} has no readable inputSchema.properties.`);
    process.exit(1);
  }
  actual.set(tool.name, new Set(Object.keys(properties)));
}
const declared = Object.values(manifest.tools).flatMap((group) => Object.entries(group));
const skillPaths = ["policy-to-ruleset", "train-validate-publish", "decide-with-trace", "regression-compare"]
  .map((name) => resolve(root, "skills", name, "SKILL.md"));
const skillTexts = skillPaths.map((path) => ({ path, text: readFileSync(path, "utf8") }));
const skillText = skillTexts.map(({ text }) => text).join("\n");
const refs = new Set(skillText.match(/aethis_[a-z_]+/g) || []);
const declaredByName = new Map(declared);
let failed = false;
for (const tool of refs) {
  if (!actual.has(tool)) { console.error(`ERROR: skill references missing tool ${tool}`); failed = true; }
  if (!declaredByName.has(tool)) { console.error(`ERROR: skill references undeclared dependency ${tool}`); failed = true; }
}
for (const [name, spec] of declared) {
  const fields = actual.get(name);
  if (!fields) { console.error(`ERROR: declared dependency missing from emitted schema: ${name}`); failed = true; continue; }
  for (const parameter of [...(spec.required_params || []), ...(spec.optional_params || [])]) if (!fields.has(parameter)) { console.error(`ERROR: ${name} uses unavailable parameter ${parameter}`); failed = true; }
}
// Skills declare their actual calls in an intentionally tiny, auditable
// grammar: <!-- aethis-call: aethis_tool(param_a, param_b) -->. This avoids
// pretending to parse arbitrary Markdown while binding every prose tool
// reference in each skill to emitted schema parameters.
for (const { path, text } of skillTexts) {
  const contracts = [...text.matchAll(/<!--\s*aethis-call:\s*(aethis_[a-z_]+)\(([^)]*)\)\s*-->/g)]
    .map(([, tool, parameters]) => [tool, parameters.trim() ? parameters.split(",").map((parameter) => parameter.trim()) : []]);
  const contractedTools = new Set(contracts.map(([tool]) => tool));
  const localRefs = new Set(text.match(/aethis_[a-z_]+/g) || []);
  for (const tool of localRefs) if (!contractedTools.has(tool)) {
    console.error(`ERROR: ${path} references ${tool} without an aethis-call contract.`);
    failed = true;
  }
  for (const [tool, parameters] of contracts) {
    const fields = actual.get(tool);
    for (const parameter of parameters) {
      if (!/^[a-z][a-z0-9_]*$/.test(parameter)) { console.error(`ERROR: malformed ${tool} parameter ${parameter}`); failed = true; continue; }
      if (!fields?.has(parameter)) { console.error(`ERROR: skill call ${tool} uses unavailable parameter ${parameter}`); failed = true; }
      const spec = declaredByName.get(tool);
      if (!spec?.required_params?.includes(parameter) && !spec?.optional_params?.includes(parameter)) {
        console.error(`ERROR: skill call ${tool} uses undeclared parameter ${parameter}`); failed = true;
      }
    }
  }
}
if (!failed) console.log(`OK: ${declared.length} skill dependencies validated against ${inventory.tools.length} emitted MCP tools`);
process.exit(failed ? 1 : 0);
