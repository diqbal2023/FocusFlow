# FocusFlow v1.0 Release Checklist

## Stage 20 preparation

- [x] Package and npm versions aligned to 1.0
- [x] Display name, description, OS range, publisher, and offline capabilities reviewed
- [x] Final FocusFlow icon generated and rendered into all package images and the multi-size `FocusFlow.ico`
- [x] Reproducible x64 Release packaging script added
- [x] Non-exportable local development signing supported
- [x] x64 Release build completed with embedded Hermes bundle
- [x] Signed `FocusFlow.msix` generated; also mirrored under `Releases/FocusFlow v1.0/` for the repo
- [x] Native SQLite and bundle entries verified inside the MSIX
- [x] Manifest minimum OS raised to Windows 10 build 18362 (D_STAGE20_03) and package rebuilt/re-signed
- [x] Existing LocalState backed up before installation attempt
- [x] Administrator trust and signed MSIX installation pass
- [x] Installed Release launch and persistence pass (Metro-free launch from `WindowsApps`; tasks survived restart)
- [x] Clean-machine uninstall/reinstall pass - Stage 21 (development-host remove/replace exercised in Stage 20; second physical machine not available)
- [x] Installation instructions and prepared release notes added
- [x] Git ignore rules cover packages, certificates, private keys, credentials, and build output
- [x] Final Stage 20 Jest/TypeScript/diff/diagnostic checks recorded

## Stage 21 final integration

- [x] Final end-to-end integration workflow (`TC_E2E_01` + prior Stage suites)
- [x] First-launch onboarding wizard implemented and tested (`TC_ONBOARD_01�03`)
- [x] Requirement-by-requirement verification (`requirements-checklist.md`)
- [x] Final persisted-data and restart checks (automated settings reload + Stage 20 install evidence)
- [x] Final Jest regression: 15 suites / 116 tests; TypeScript exit 0
- [x] Final release asset review (`artifacts/windows/FocusFlow-v1.0.0-x64/`)
- [x] Publish GitHub Release — **published** at https://github.com/diqbal2023/FocusFlow/releases/tag/v1.0.0 (exactly three assets)

## In-repo release mirror

Tracked copy of the GitHub Release **FocusFlow v1.0** assets (MSIX + docs): `Releases/FocusFlow v1.0/`. Certificates and dependency zips stay out of that folder. Build outputs remain under `artifacts/` (gitignored).

## Published GitHub Release structure

Title: **FocusFlow v1.0**
URL: https://github.com/diqbal2023/FocusFlow/releases/tag/v1.0.0

Release attachments (exactly three; do not commit binaries to Git):

1. `FocusFlow.msix` (from `artifacts/windows/FocusFlow-v1.0.0-x64/`)
2. `installation-instructions.md` (repo root)
3. `release-notes.md` (repo root)

`FocusFlow.cer` and `FocusFlow-dependencies-x64.zip` remain in local packaging output only and are not GitHub Release assets. The in-repo `Releases/FocusFlow v1.0/` mirror matches the same three-file layout.

## Manual GitHub Release publish steps

### Option A - GitHub CLI

```powershell
# From the repo root after committing source/docs (not binaries):
winget install --id GitHub.cli
gh auth login

git tag -a v1.0.0 -m "FocusFlow v1.0"
git push origin v1.0.0

gh release create v1.0.0 `
  --title "FocusFlow v1.0" `
  --notes-file release-notes.md `
  "artifacts/windows/FocusFlow-v1.0.0-x64/FocusFlow.msix" `
  "installation-instructions.md" `
  "release-notes.md"
```

### Option B - GitHub website

1. Open https://github.com/diqbal2023/FocusFlow/releases/new
2. Choose tag `v1.0.0` (create the tag on `master` if needed)
3. Set release title to **FocusFlow v1.0**
4. Paste the body from `release-notes.md`
5. Attach only the three assets listed above
6. Publish the release
