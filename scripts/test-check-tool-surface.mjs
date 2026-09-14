#!/usr/bin/env node
// Regression cases for the emitted MCP tools/list compatibility boundary.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "tools.json"), "utf8"));
const specs = Object.values(manifest.tools).flatMap((group) => Object.entries(group));
const directory = mkdtempSync(join(tmpdir(), "aethis-skills-tool-surface-"));
const emittedSchema = join(directory, "emitted-tools-list.json");
if (process.env.AETHIS_MCP_SERVER) {
  const emitted = spawnSync(process.execPath, ["scripts/emit-mcp-tools-list.mjs", process.env.AETHIS_MCP_SERVER, emittedSchema], {
    cwd: root,
    encoding: "utf8",
  });
  if (emitted.status !== 0) throw new Error(`could not emit real tools/list: ${emitted.stderr || emitted.stdout}`);
}
const completeInventory = process.env.AETHIS_MCP_SERVER
  ? JSON.parse(readFileSync(emittedSchema, "utf8"))
  : {
  // This is the MCP tools/list wire shape, captured from the built P3 server.
  tools: specs.map(([name, spec]) => ({ name, inputSchema: { type: "object", properties: Object.fromEntries([...new Set([...spec.required_params || [], ...spec.optional_params || []])].map((parameter) => [parameter, { type: "string" }])) } })),
  };

function check(name, inventory, expectedStatus, mutate) {
  const schema = join(directory, `${name}.json`);
  if (inventory) writeFileSync(schema, JSON.stringify(inventory));
  const skillsRoot = join(directory, `${name}-skills`);
  cpSync(root, skillsRoot, { recursive: true });
  mutate?.(skillsRoot);
  const result = spawnSync(process.execPath, ["scripts/check-tool-surface.mjs"], {
    cwd: skillsRoot,
    env: inventory ? { ...process.env, AETHIS_MCP_TOOLS_LIST: schema, AETHIS_SKILLS_ROOT: skillsRoot } : { ...process.env, AETHIS_MCP_TOOLS_LIST: "", AETHIS_SKILLS_ROOT: skillsRoot },
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
      ? { ...tool, inputSchema: { type: "object", properties: { project_id: {}, replacement_cases: {} } } }
      : tool),
  }, 1);
  check("missing-secure-provider-reference", {
    tools: completeInventory.tools.map((tool) => tool.name === "aethis_discover_fields"
      ? { ...tool, inputSchema: { type: "object", properties: { project_id: {}, anthropic_key_env: {} } } }
      : tool),
  }, 1);
  check("visible-set-tests-parameter", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "policy-to-ruleset", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("complete `test_cases`", "complete `replacement_cases`"));
  });
  check("visible-multiline-create-parameter", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "policy-to-ruleset", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("- `test_cases` (at least", "- `replacement_cases` (at least"));
  });
  check("visible-run-parameter", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "train-validate-publish", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("exact `project_id`. It usually", "exact `replacement_project_id`. It usually"));
  });
  check("visible-colon-parameter", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "decide-with-trace", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("`include_trace: true`", "`replacement_trace: true`"));
  });
  check("visible-explicit-call-parameter", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "policy-to-ruleset", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("exact `project_id` and complete `test_cases`", "exact `replacement_project_id` and complete `test_cases`"));
  });
  check("visible-parenthesized-call-parameter", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "policy-to-ruleset", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("`aethis_set_tests` once", "`aethis_set_tests(project_id, replacement_cases)` once"));
  });
  check("visible-next-generation-parameter", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "policy-to-ruleset", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("with this exact `project_id`", "with this exact `replacement_project_id`"));
  });
  check("visible-policy-cancel-confirmation", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "policy-to-ruleset", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("`confirm_job_id`;", "`replacement_confirm_job_id`;"));
  });
  check("visible-train-cancel-confirmation", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "train-validate-publish", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("`confirm_job_id`;", "`replacement_confirm_job_id`;"));
  });
  check("visible-provider-key-reference", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "skills", "policy-to-ruleset", "SKILL.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("anthropic_key_env", "replacement_key_env"));
  });
  check("undeclared-skill-tool", completeInventory, 1, (skillsRoot) => {
    const path = join(skillsRoot, "tools.json");
    const copy = JSON.parse(readFileSync(path, "utf8"));
    delete copy.tools.author.aethis_set_tests;
    writeFileSync(path, JSON.stringify(copy));
  });
  check("schema-unavailable", null, 1);
  console.log("OK: emitted tools/list negative compatibility cases passed");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
