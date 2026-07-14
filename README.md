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

## Tests

```sh
npm run test:windows -- --verbose > test-results.txt 2>&1
```

## Project notes

- Target platform: Windows only (`android/` and `ios/` are not used)
- Local data: SQLite via `react-native-turbo-sqlite`
- Docs: `documentation/plan.md`, `documentation/testing-notes.md`
