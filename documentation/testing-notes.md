# FocusFlow Testing Notes

Working notes for the IEEE Software Test Document.
**Update this file whenever new automated tests are added or results change.**

| Field | Value |
|---|---|
| Last updated | 2026-07-13 (defect log added) |
| Source test files | `__tests__/App.test.tsx`, `__tests__/SharedComponents.test.tsx`, `__tests__/TasksScreen.test.tsx` |
| Command | `npm test` |
| Latest result | 3 suites / 16 tests passed / 0 failed / 0 snapshots |

## How to update this file

1. Add or change tests under `__tests__/`.
2. Run `npm test` (optional verbose log: `npm test -- --verbose > test-results.txt 2>&1`).
3. Update sections **1–6** below to match reality only (do not invent tests).
4. Update **Last updated** and **Latest result** in the table above.
5. Add new rows to the test case / results tables and procedure groups as needed.

---

## 1. TEST PLAN INFORMATION

- **Test Scope**
  - Automated Jest UI/unit tests for FocusFlow React Native for Windows (TypeScript)
  - Covers: navigation shell, shared UI components, temporary Tasks screen state UI
  - Does not cover: native Windows build/deploy, manual UI/UX, persistence

- **Test Objectives**
  - Verify default screen and sidebar navigation between 5 sections
  - Verify shared component interaction behavior (button press/disabled, input label/error, page header text)
  - Verify temporary Tasks UI state actions (render samples, complete, delete, edit populate, save new)

- **Test Items**
  - `App.tsx` + `Sidebar`
  - `AppButton`, `AppInput`, `PageHeader`
  - `TasksScreen` (temporary React `useState` only)

- **Features Tested**
  - Sidebar navigation / active item state
  - Shared component press, disabled, label, error display, header text
  - Tasks list seed data + Complete / Delete / Edit / Save interactions in memory

- **Features Not Yet Tested**
  - SQLite / persistence / TaskManager / repositories
  - Validation logic
  - Notifications, timers, goals logic, statistics calculations, settings logic
  - Export, authentication, cloud services
  - Parent-task selection behavior
  - Visual style details (colors, spacing, fonts)
  - Native Windows packaging/deploy as an automated test

- **Test Environment**
  - OS: Windows 10/11 development machine
  - App stack: React Native for Windows, React 19.2.3, RN 0.86.0, TypeScript
  - Node (project engine): `>= 22.11.0`
  - Jest config: `jest.config.js` → `jest.config.windows.js` (`@rnx-kit/jest-preset` windows)

- **Testing Tools**
  - Jest
  - `@testing-library/react-native`
  - `react-test-renderer`
  - `fireEvent` for press / changeText

- **Risks and Contingencies**
  - Tasks data is in-memory only; test success does not mean persistence works
  - `npm test` previously broke if wrong Jest preset; contingency: use `npm run test:windows` or keep `jest.config.js` pointing at Windows preset
  - Native deploy can fail if FocusFlow process locks DLLs (environment issue, not covered by these Jest tests)

- **Pass/Fail Criteria**
  - **Pass:** all assertions in a test case succeed; suite exits 0
  - **Fail:** any assertion fails or test errors
  - **Stage gate:** all current tests must pass (`Failed Tests: 0`)

---

## 2. TEST CASE INFORMATION

| Test Case ID | Objective | Input | Expected Output | Execution Steps | Actual Output | Pass/Fail |
|---|---|---|---|---|---|---|
| TC_UI_01 | AppButton invokes `onPress` when pressed | Render AppButton “Save”; press | `onPress` called 1 time | 1. Render button 2. `fireEvent.press` 3. Assert call count | Called once | Pass |
| TC_UI_02 | Disabled AppButton ignores press | Render disabled AppButton; press | `onPress` not called | 1. Render disabled button 2. Press 3. Assert not called | Not called | Pass |
| TC_UI_03 | AppInput shows label | Render AppInput label “Task name” | Text “Task name” visible | 1. Render 2. Assert label text | Label visible | Pass |
| TC_UI_04 | AppInput shows error when provided | Render AppInput with `error="Task name is required."` | Error text visible | 1. Render with error 2. Assert error text | Error visible | Pass |
| TC_UI_05 | PageHeader shows title and subtitle | title=`Tasks`, subtitle=`Organize and track your work.` | Both texts visible | 1. Render 2. Assert both texts | Both visible | Pass |
| TC_NAV_01 | App opens on Tasks | Render `<App />` | Tasks subtitle visible; `nav-tasks` selected | 1. Render App 2. Assert subtitle + selected state | Tasks default + selected | Pass |
| TC_NAV_02 | Navigate to Focus Session | Press `nav-focus` | Focus subtitle shown; Tasks subtitle gone | 1. Render 2. Press focus 3. Assert texts | Focus shown | Pass |
| TC_NAV_03 | Navigate to Statistics | Press `nav-statistics` | Statistics subtitle shown; Tasks subtitle gone | 1. Render 2. Press statistics 3. Assert texts | Statistics shown | Pass |
| TC_NAV_04 | Navigate to Goals | Press `nav-goals` | Goals subtitle shown; Tasks subtitle gone | 1. Render 2. Press goals 3. Assert texts | Goals shown | Pass |
| TC_NAV_05 | Navigate to Settings | Press `nav-settings` | Settings subtitle shown; Tasks subtitle gone | 1. Render 2. Press settings 3. Assert texts | Settings shown | Pass |
| TC_NAV_06 | Active sidebar item updates | Press Focus then Settings | Selected moves: tasks→focus→settings | 1. Assert default 2. Press focus 3. Assert 4. Press settings 5. Assert | Active state updates | Pass |
| TC_TASK_UI_01 | Sample tasks render | Render `<TasksScreen />` | Math Homework, Clean Room, Study React Native + priority/status texts | 1. Render 2. Assert sample titles/status/priority | Samples present | Pass |
| TC_TASK_UI_02 | Complete updates status | Press `task-complete-sample-1` | Status for sample-1 becomes Completed | 1. Assert Pending 2. Press Complete 3. Assert Completed | Status Completed | Pass |
| TC_TASK_UI_03 | Delete removes task | Press `task-delete-sample-2` | “Clean Room” and card removed | 1. Assert present 2. Press Delete 3. Assert absent | Removed | Pass |
| TC_TASK_UI_04 | Edit loads form | Press `task-edit-sample-1` | Title/description fields filled; “Edit Task” shown | 1. Press Edit 2. Assert input values + heading | Form populated | Pass |
| TC_TASK_UI_05 | Save adds new task | Enter title/description; press Save | New task appears in list | 1. changeText title/desc 2. Press Save 3. Assert texts | New task listed | Pass |

---

## 3. TEST PROCEDURE INFORMATION

### TP-NAV — Navigation

- **Procedure ID:** TP-NAV
- **Description:** Verify sidebar navigation and active selection across app screens
- **Test Environment:** Jest + RNTL; render full `<App />`
- **Steps to Execute:**
  1. From project root run `npm test` (or `npm run test:windows`)
  2. Confirm suite `FocusFlow navigation shell` executes TC_NAV_01–TC_NAV_06
- **Post-Execution Actions:** Record pass/fail; keep log if needed (`npm test -- --verbose > test-results.txt 2>&1`)

### TP-UI — Shared Components

- **Procedure ID:** TP-UI
- **Description:** Verify AppButton, AppInput, PageHeader interaction/display behavior
- **Test Environment:** Jest + RNTL; component-level render
- **Steps to Execute:**
  1. Run `npm test`
  2. Confirm suite `FocusFlow shared UI components` executes TC_UI_01–TC_UI_05
- **Post-Execution Actions:** Record pass/fail; note no styling assertions by design

### TP-TASK-UI — Task UI (Temporary State)

- **Procedure ID:** TP-TASK-UI
- **Description:** Verify Tasks screen temporary list/form interactions
- **Test Environment:** Jest + RNTL; render `<TasksScreen />` only
- **Steps to Execute:**
  1. Run `npm test`
  2. Confirm suite `Tasks screen temporary UI state` executes TC_TASK_UI_01–TC_TASK_UI_05
- **Post-Execution Actions:** Record pass/fail; note results apply to in-memory UI only (not SQLite)

---

## 4. TEST RESULTS INFORMATION

| Test Case ID | Description | Result | Test Log (brief) | Defect ID |
|---|---|---|---|---|
| TC_UI_01 | Button press calls handler | Pass | Assertion: `onPress` ×1 | N/A |
| TC_UI_02 | Disabled button ignores press | Pass | Assertion: not called | N/A |
| TC_UI_03 | Input label shown | Pass | Found “Task name” | N/A |
| TC_UI_04 | Input error shown | Pass | Found “Task name is required.” | N/A |
| TC_UI_05 | PageHeader title/subtitle | Pass | Found “Tasks” + subtitle | N/A |
| TC_NAV_01 | Default Tasks screen | Pass | Subtitle + `nav-tasks` selected | N/A |
| TC_NAV_02 | Focus Session nav | Pass | Focus subtitle present | N/A |
| TC_NAV_03 | Statistics nav | Pass | Statistics subtitle present | N/A |
| TC_NAV_04 | Goals nav | Pass | Goals subtitle present | N/A |
| TC_NAV_05 | Settings nav | Pass | Settings subtitle present | N/A |
| TC_NAV_06 | Active sidebar updates | Pass | Selected state transitions verified | N/A |
| TC_TASK_UI_01 | Sample tasks render | Pass | 3 sample titles + statuses found | N/A |
| TC_TASK_UI_02 | Complete changes status | Pass | sample-1 Pending → Completed | N/A |
| TC_TASK_UI_03 | Delete removes task | Pass | sample-2 / Clean Room removed | N/A |
| TC_TASK_UI_04 | Edit loads form | Pass | Form values match Math Homework | N/A |
| TC_TASK_UI_05 | Save adds task | Pass | “Write Unit Tests” visible in list | N/A |

---

## 5. DEFECT TRACKING INFORMATION

Latest automated product test run: **0 new defects** (16/16 tests passed).

Historical defects found during setup / early automated testing (and fixed) are logged below. These were not invented — they match real failures from this project’s development sessions.

| Defect ID | Description | Severity | Steps to Reproduce | Status | Fix Version |
|---|---|---|---|---|---|
| DEF-001 | `npm test` failed immediately with Jest validation error: preset `@react-native/jest-preset` not found. Default Jest config could not run any suites. Log: `● Validation Error: Preset @react-native/jest-preset not found.` | Major | 1. Open project root 2. Run `npm test` (with original `jest.config.js` using `@react-native/jest-preset`) | Fixed | Fixed in project config (`jest.config.js` now re-exports `jest.config.windows.js` / `@rnx-kit/jest-preset` for Windows). Confirmed by successful `npm test` runs. |
| DEF-002 | Navigation tests TC_NAV_01 and TC_NAV_06 failed with `TypeError: expect(...).toHaveAccessibilityState is not a function`. Matcher was unavailable in the current Jest + RNTL setup. | Minor | 1. Add NAV tests using `toHaveAccessibilityState({ selected: true })` 2. Run `npm run test:windows` or `npm test` 3. Observe failures on TC_NAV_01 and TC_NAV_06 | Fixed | Fixed in `__tests__/App.test.tsx` by asserting `props.accessibilityState` via helper `expectNavSelected` (same intent, no matcher dependency). Re-run: all nav tests passed. |
| DEF-003 | `run-windows` / MSBuild failed with **No .NET SDKs were found** / `dotnet.exe` not recognized in the build environment even though .NET SDK was installed on disk. Blocked packaging/run of FocusFlow for Windows. | Major | 1. Ensure VS C++ tools are installed 2. From a terminal where PATH may not expose `dotnet`, run `npm run windows` / `npx react-native run-windows` 3. Observe SDK-not-found / `dotnet.exe` errors during restore/build | Fixed | Fixed by setting `DOTNET_ROOT` and prepending `C:\Program Files\dotnet` to PATH in the `windows` script in `package.json`. Subsequent builds progressed past the SDK detection failure. |
| DEF-004 | Windows deploy failed after a successful build with `IOException` / file lock on `Microsoft.ReactNative.dll` (`Err_LayoutUpdate_CopyFile`, exit code 5). Usually means FocusFlow (or another process) still has the installed package files open. | Minor | 1. Leave a previous FocusFlow Windows app instance running 2. Run `npx react-native run-windows` (or `npm run windows`) 3. Build may succeed; deploy fails copying DLL into AppX layout | Workaround / Open | Not a FocusFlow source-code defect. Workaround: close the running FocusFlow app (and related processes), then re-run `npm run windows`. No app code change required. |

### Defect field notes (for STD authors)

- **Defect ID:** Unique ID as above (`DEF-xxx`).
- **Description:** Problem + relevant log/error text (screenshots N/A for these CLI failures).
- **Severity:** Critical / Major / Minor as assigned above.
- **Steps to Reproduce:** As listed.
- **Status:** Open, Assigned, Fixed, or Workaround / Open.
- **Fix Version:** Where/when fixed for this project (config/test/script), or workaround if not a code fix.

---

## 6. TEST SUMMARY INFORMATION

| Metric | Value |
|---|---|
| Total Test Suites | 3 |
| Total Test Cases | 16 |
| Passed | 16 |
| Failed | 0 |
| Pass Percentage | 100% |
| Snapshots | 0 |
| Overall System Status (tested scope) | All current automated Jest UI tests passing |

### Suite map

| Suite name | File | Cases |
|---|---|---|
| FocusFlow shared UI components | `__tests__/SharedComponents.test.tsx` | TC_UI_01–05 |
| FocusFlow navigation shell | `__tests__/App.test.tsx` | TC_NAV_01–06 |
| Tasks screen temporary UI state | `__tests__/TasksScreen.test.tsx` | TC_TASK_UI_01–05 |
