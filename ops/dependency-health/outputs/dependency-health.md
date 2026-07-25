# Dependency Health

## Summary

First real run (no prior baseline in `PROGRESS.md`), so every advisory and
outdated package below is being seen for the first time by this loop. Attention
mode is triggered independently of that, since one advisory is **critical**
severity: `gh-pages@3.1.0` (a transitive dev dependency of `yarn deploy`) is
vulnerable to prototype pollution (GHSA-8mmm-9v2q-x3f9, CVE-2022-37611).
`yarn audit --json` reports 16 unique advisories in total (1 critical, 10
high, 4 moderate, 1 low), all rooted in three outdated dev-only dependency
chains: `gh-pages` (→ async, lodash, semver, glob→minimatch→brace-expansion),
`eslint` (→ minimatch/brace-expansion), and `typescript-eslint` (→
minimatch/brace-expansion). None of these packages are runtime/production
dependencies — all findings are in `devDependencies` transitive trees.

## New advisories since last run (ID, package, severity)

| GHSA ID | Package | Severity | Title |
|---|---|---|---|
| GHSA-8mmm-9v2q-x3f9 | gh-pages | critical | Prototype pollution in gh-pages (CVE-2022-37611) |
| GHSA-fwr7-v2mv-hh25 | async | high | Prototype pollution in async |
| GHSA-35jh-r3h4-6jhm | lodash | high | Command injection in lodash |
| GHSA-r5fr-rjxr-66jc | lodash | high | Code injection via `_.template` imports key names |
| GHSA-c2qf-rxjj-qqgw | semver | high | ReDoS in semver |
| GHSA-f8q6-p94x-37v3 | minimatch | high | ReDoS (braceExpand) — CVE-2022-3517 |
| GHSA-3ppc-4f35-3m26 | minimatch | high | ReDoS via repeated wildcards (CVE-2026-26996) |
| GHSA-7r86-cg39-jmmj | minimatch | high | ReDoS via non-adjacent GLOBSTAR backtracking (CVE-2026-27903) |
| GHSA-23c5-xmqv-rm74 | minimatch | high | ReDoS via nested `*()` extglobs (CVE-2026-27904) |
| GHSA-3jxr-9vmj-r5cp | brace-expansion | high | DoS via exponential-time expansion (CVE-2026-13149) |
| GHSA-mh99-v99m-4gvg | brace-expansion | high | DoS via unbounded expansion length / OOM (CVE-2026-14257) |
| GHSA-29mw-wpgm-hmr9 | lodash | moderate | ReDoS in lodash |
| GHSA-f23m-r3pf-42rh | lodash | moderate | Prototype pollution via array path bypass in `_.unset`/`_.omit` |
| GHSA-xxjr-mmjv-4gpg | lodash | moderate | Prototype pollution in `_.unset`/`_.omit` |
| GHSA-f886-m6hf-6m8v | brace-expansion | moderate | Zero-step sequence hang / memory exhaustion (CVE-2026-33750) |
| GHSA-v6h2-p8h4-qcjw | brace-expansion | low | ReDoS in brace-expansion (CVE-2025-5889) |

## Still-open advisories (ID, package, severity, first seen)

None — this is the first run with data to compare against, so there is no
prior "still-open" set. Every advisory above is recorded as first seen
2026-07-25; future runs will move unresolved ones into this section.

## Newly-outdated packages (package, current, wanted, latest)

| Package | Current | Wanted | Latest | Type |
|---|---|---|---|---|
| gh-pages | 3.1.0 | 3.2.3 | 6.3.0 | devDependencies |
| eslint | 9.39.5 | 9.39.5 | 10.8.0 | devDependencies |
| typescript | 6.0.3 | 6.0.3 | 7.0.2 | devDependencies |
| eslint-config-prettier | 9.1.2 | 9.1.2 | 10.1.8 | devDependencies |
| eslint-plugin-react-hooks | 5.2.0 | 5.2.0 | 7.1.1 | devDependencies |
| eslint-plugin-react-refresh | 0.4.26 | 0.4.26 | 0.5.3 | devDependencies |
| @testing-library/jest-dom | 6.9.1 | 6.10.0 | 7.0.0 | devDependencies |
| @types/testing-library__dom | 6.14.0 | 6.14.0 | 7.5.0 | resolutions |
| @vitejs/plugin-react | 6.0.3 | 6.0.4 | 6.0.4 | devDependencies |
| prettier | 3.9.5 | 3.9.6 | 3.9.6 | devDependencies |
| react | 19.2.7 | 19.2.8 | 19.2.8 | dependencies |
| react-dom | 19.2.7 | 19.2.8 | 19.2.8 | dependencies |
| typescript-eslint | 8.64.0 | 8.65.0 | 8.65.0 | devDependencies |
| vite | 8.1.4 | 8.1.5 | 8.1.5 | devDependencies / resolutions |

## Recommended action (draft only)

- **gh-pages (highest priority):** the critical advisory and most of the high
  advisories (async, lodash, semver, minimatch chain) all root in `gh-pages`
  3.x's own bundled dependency tree, not in a shared/hoisted package used
  elsewhere. The patched release line is `gh-pages@5.0.0+`; `package.json`
  currently pins `^3.1.0`, so a fix means a **major version bump** (3 → 6,
  since 6.3.0 is latest) with a real chance of CLI/behavior changes — worth
  double-checking against `cd.yml`, which invokes the `gh-pages` CLI directly
  (not the `yarn deploy` script). This is judgement-heavy, out of scope for
  this loop, and should go through a normal PR: bump the dependency, run
  `yarn typecheck`/`yarn lint`/`yarn test:coverage`, and do a real
  `yarn deploy` dry-run (or check `gh-pages` CLI flags haven't changed)
  before merging.
- **eslint / typescript-eslint minimatch chain:** the remaining
  brace-expansion/minimatch advisories are pulled in via `eslint` and
  `typescript-eslint`'s own transitive deps, not directly controllable by a
  `resolutions` override without risk of an ESLint version mismatch. `eslint`
  9→10 and `typescript` 6.0.3→7.0.2 are both major bumps with likely config
  or rule changes (ESLint 10 flat-config behavior, TS 7 diagnostics) — treat
  as a separate, deliberate upgrade task, not a quick patch.
- **Low-risk patch/minor bumps** (safe to batch in one small PR when
  someone picks this up): `react`/`react-dom` 19.2.7→19.2.8, `vite`
  8.1.4→8.1.5, `prettier` 3.9.5→3.9.6, `@vitejs/plugin-react` 6.0.3→6.0.4,
  `typescript-eslint` 8.64.0→8.65.0, `@testing-library/jest-dom`
  6.9.1→6.10.0. None of these are tied to the open advisories above.
- No upgrade was performed as part of this run, per the loop's read-only
  scope.
