#!/usr/bin/env node
// Regression cases for the emitted MCP tools/list compatibility boundary.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "tools.json"), "utf8"));
const specs = Object.values(manifest.tools).flatMap((group) => Object.entries(group));
const completeInventory = {
  tools: specs.map(([name, spec]) => ({
    name,
    input_fields: [...(spec.required_params || []), ...(spec.optional_params || [])],
  })),
};
const directory = mkdtempSync(join(tmpdir(), "aethis-skills-tool-surface-"));

function check(name, inventory, expectedStatus) {
  const schema = join(directory, `${name}.json`);
  if (inventory) writeFileSync(schema, JSON.stringify(inventory));
  const result = spawnSync(process.execPath, ["scripts/check-tool-surface.mjs"], {
    cwd: root,
    env: inventory ? { ...process.env, AETHIS_MCP_TOOLS_LIST: schema } : { ...process.env, AETHIS_MCP_TOOLS_LIST: "" },
    encoding: "utf8",
  });
  if (result.status !== expectedStatus) {
    throw new Error(`${name}: expected exit ${expectedStatus}, got ${result.status}: ${result.stderr || result.stdout}`);
  }
}

try {
  check("complete", completeInventory, 0);
  check("missing-tool", { tools: completeInventory.tools.filter((tool) => tool.name !== "aethis_set_tests") }, 1);
  check("renamed-parameter", {
    tools: completeInventory.tools.map((tool) => tool.name === "aethis_set_tests"
      ? { ...tool, input_fields: ["project_id", "replacement_cases"] }
      : tool),
  }, 1);
  check("schema-unavailable", null, 1);
  console.log("OK: emitted tools/list negative compatibility cases passed");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
