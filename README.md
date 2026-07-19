# FocusFlow

Offline productivity desktop app for **Windows 10/11**, built with React Native for Windows and TypeScript.

## Prerequisites

- Node.js (see `engines` in `package.json`)
- Visual Studio with C++ desktop / UWP workloads
- .NET SDK (PATH configured for the `windows` script)

## Start Metro

```sh
npm start
```

## Build and run (Windows)

In another terminal:

```sh
npm run windows
```

Or:

```sh
npx react-native run-windows
```

Close a running FocusFlow instance first if deploy fails with a locked DLL (known DEF-004).

## Tests

```sh
npm run test:windows -- --verbose > test-results.txt 2>&1
```

Latest Stage 21 baseline: **15 suites / 116 tests**.

## Project notes

- Target platform: Windows only (`android/` and `ios/` are not used)
- Local data: SQLite via `react-native-turbo-sqlite`
- First launch: Welcome / Productivity Setup wizard (timer, daily goals, theme, notifications)
- Docs: `documentation/plan.md`, `documentation/testing-notes.md`, `requirements-checklist.md`
- Release: `release-notes.md`, `installation-instructions.md`, `release-checklist.md`
- Packaged installer build outputs (gitignored): `artifacts/windows/FocusFlow-v1.0.0-x64/`
- v1.0 release assets (tracked): `Releases/FocusFlow v1.0/` (`FocusFlow.msix`, installation instructions, release notes)
