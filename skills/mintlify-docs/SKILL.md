---
name: mintlify-docs
description: Debug and manage the Aethis Mintlify docs site (Aethis-ai/docs). Use when a deploy fails, to check build status, or to trigger a rebuild.
---

# Mintlify Docs

Manages the Aethis documentation site at `mintlify-docs/` (Aethis-ai/docs on GitHub, deployed via Mintlify).

## Prerequisites

- `MINTLIFY_API_KEY` secret — generate from [Mintlify dashboard](https://dashboard.mintlify.com) under Settings > API Keys, then add:
  ```bash
  echo "MINTLIFY_API_KEY=<value>" > /tmp/mintlify.env
  ./scripts/secrets --project okbackend1 --service mintlify-docs push --env-file /tmp/mintlify.env --create-missing --apply
  rm /tmp/mintlify.env
  ```

## Common tasks

### Debug a deploy failure

1. Check `mintlify-docs/mint.json` for broken references (missing files, bad paths)
2. Check all pages listed in `navigation` actually exist as `.mdx` files
3. Check `logo`, `favicon`, and `openapi` paths point to real files in the repo
4. Use the Mintlify API to get the latest deployment log (see API below)

### Check deployment status

```
GET https://api.mintlify.com/v1/deployments
Authorization: Bearer <MINTLIFY_API_KEY>
```

### Trigger a manual rebuild

```
POST https://api.mintlify.com/v1/deployments/trigger
Authorization: Bearer <MINTLIFY_API_KEY>
```

## Common mint.json issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing logo/favicon files | Deploy fails silently | Remove `logo`/`favicon` keys or add the files |
| Page in `navigation` has no `.mdx` file | 404 or build error | Add the file or remove from nav |
| `openapi` path wrong | API reference broken | Check the path resolves from repo root |
| `docs.json` and `mint.json` both present | Config conflict | Mintlify v2 uses `docs.json`, v1 uses `mint.json` — pick one |

## Resources

- [Mintlify API docs](https://mintlify.com/docs/api)
- [mint.json reference](https://mintlify.com/docs/settings/global)
- [Dashboard](https://dashboard.mintlify.com)
