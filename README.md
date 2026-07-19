# FocusFlow

Offline productivity desktop app for **Windows 10/11**, built with React Native for Windows and TypeScript.

FocusFlow combines local task management, Pomodoro-style focus sessions, goals, statistics, and settings in a single offline-first Windows application. Stages 1–21 are complete; **v1.0** is published.

- GitHub Release: [FocusFlow v1.0.0](https://github.com/diqbal2023/FocusFlow/releases/tag/v1.0.0)
- Package: Win32 / full-trust RNW Composition, Windows App SDK, x64 MSIX (self-signed `CN=catsr`)

## Features

- First-launch Welcome / Productivity Setup wizard (timer, daily goals, theme, notifications)
- Task creation, editing, status progression, Recently Deleted restore, and permanent deletion
- Configurable work, short-break, and long-break timers with long-break cycle
- Daily and weekly goals
- Productivity statistics, score, streak, and 90-day activity view
- System, Light, and Dark theme preference
- Local SQLite persistence for tasks and settings (offline; no internet capability)

## Requirements

| Item | Detail |
|---|---|
| OS | Windows 10 version 1903 (build **18362**) or newer; Windows 11 supported |
| Architecture | **x64** only |
| Runtime | Windows App Runtime 1.8 and Visual C++ package frameworks (see installation docs) |

## Install

Install from either source. Certificate trust steps are required for the self-signed package (`CN=catsr`).

1. **GitHub Release** - download assets from [v1.0.0](https://github.com/diqbal2023/FocusFlow/releases/tag/v1.0.0) (`FocusFlow.msix`, `installation-instructions.md`, `release-notes.md` only).
2. **In-repo mirror** - `Releases/FocusFlow v1.0/` (same three files). Signer `.cer` and dependency zip are not GitHub Release assets; use local packaging artifacts or export the cert from the MSIX (see installation instructions).

Full certificate trust, install, troubleshooting, and uninstall steps: [`installation-instructions.md`](installation-instructions.md) (mirror: [`Releases/FocusFlow v1.0/installation-instructions.md`](Releases/FocusFlow%20v1.0/installation-instructions.md)).

Release notes: [`release-notes.md`](release-notes.md) · [GitHub Release notes](https://github.com/diqbal2023/FocusFlow/releases/tag/v1.0.0)

## Development setup

### Prerequisites

- **Node.js** `>= 22.11.0` (see `engines` in `package.json`)
- **Visual Studio** with C++ desktop / UWP workloads
- .NET SDK on `PATH` (the `windows` script also sets `DOTNET_ROOT`)

### Install dependencies

```sh
npm install
```

If peer dependency conflicts appear (React Native `0.86` / RNW `0.84` mismatch):

```sh
npm install --legacy-peer-deps
```

### Run (Windows)

```sh
npm start
```

In another terminal:

```sh
npm run windows
```

Close a running FocusFlow instance first if deploy fails with a locked DLL (known DEF-004).

Target platform is Windows only (`android/` and `ios/` are not used).

### Test

```sh
npm run test:windows
```

Optional verbose capture:

```sh
npm run test:windows -- --verbose > test-results.txt 2>&1
```

Stage 21 baseline: **15 suites / 116 tests**.

### Package (MSIX)

```sh
npm run package:windows
```

Build outputs under `artifacts/` are gitignored. Tracked release assets live under `Releases/FocusFlow v1.0/`.

## Documentation

| Doc | Purpose |
|---|---|
| [`documentation/plan.md`](documentation/plan.md) | Implementation plan and completed stage tracker |
| [`documentation/testing-notes.md`](documentation/testing-notes.md) | Test notes and regression evidence |
| [`requirements-checklist.md`](requirements-checklist.md) | Final Stage 21 requirements verification |
| [`release-checklist.md`](release-checklist.md) | GitHub Release publication steps |

## Known limitations

- Notification and sound settings are stored preferences only; native Windows notification delivery is not implemented.
- No system tray or launch-on-startup.
- Focus-session state and statistics completion history are runtime-only across app restarts.
- React Native `0.86.0` and React Native Windows `0.84.0` have a known peer mismatch retained from the validated baseline.
