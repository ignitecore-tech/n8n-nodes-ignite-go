# Publishing the package

Steps to publish `n8n-nodes-ignite-go` on npm and request the n8n verification.

## One-time setup

1. **GitHub repository.** The public repository is `ignitecore-tech/n8n-nodes-ignite-go`:

   ```bash
   git remote add origin https://github.com/ignitecore-tech/n8n-nodes-ignite-go.git
   git push -u origin main
   ```

   If the name or the organization changes, update `repository`, `bugs` and `homepage` in `package.json`: n8n checks that the package repository is the same as the GitHub one.

2. **npm account.** Use an Ignite Core npm account (or organization) with two-factor authentication enabled. Create a token at npmjs.com, Access Tokens, of the Granular type, with read and write permission to publish packages.

3. **GitHub secret.** In the repository, Settings, Secrets and variables, Actions, create the `NPM_TOKEN` secret with that token.

## Publishing a version

1. Check that `npm run build`, `npm run lint` and `npm run lint:dist` pass with no errors and no warnings.
2. Bump the version and push it together with the tag:

   ```bash
   npm version patch        # 0.2.0 becomes 0.2.1 (use minor or major when it makes sense)
   git push --follow-tags
   ```

   If the version in `package.json` was already bumped by hand (for example `0.2.0`), just run `git tag v0.2.0` and `git push origin v0.2.0`.

3. The "Publish to npm" Action runs on its own for the tag, checks that the tag matches `package.json`, builds, lints and publishes with provenance. The npm package page then shows the provenance badge.

## After publishing

- **Check with the n8n scanner:** `npx @n8n/scan-community-package n8n-nodes-ignite-go`. The scanner only checks what is on npm. It lints the source commit recorded in the provenance and the published tarball, with the same rules as `npm run lint` and `npm run lint:dist`. On Windows, run it from PowerShell with `C:\Windows\System32` first in `PATH`; from Git Bash its tar extraction fails on `C:\` paths.
- **Request the verification** (required to show up on n8n Cloud) through the n8n Creator Portal, from the "Submit community nodes" page of the documentation.
- **Optional:** at npmjs.com, in the package settings, add the GitHub Actions workflow of this repository as a Trusted Publisher. The Action can then publish without `NPM_TOKEN`.
- **Ignite GO landing page:** the n8n nodes section can only go live after the package is published.

## Lint setup

`eslint.config.mjs` reproduces the configuration of the n8n scanner (`buildScanConfig` in `@n8n/scan-community-package` 0.39.0). The dev dependencies `eslint`, `@n8n/eslint-plugin-community-nodes` and `eslint-plugin-n8n-nodes-base` are pinned to the versions the scanner uses. When n8n releases a new scanner, compare its `package.json` and `scanner/scanner.mjs` and update both places.

## n8n rules this package follows

- No runtime dependencies (only `n8n-workflow` as a peer dependency).
- No environment variables or file reads in the node code.
- Node interface and documentation in English only.
- MIT license and README.
- A single service (Ignite GO).
