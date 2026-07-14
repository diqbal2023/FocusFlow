# FocusFlow Testing Notes

Working notes for the IEEE Software Test Document.
**Update this file whenever new automated tests are added or results change.**

| Field | Value |
|---|---|
| Last updated | 2026-07-14 |
| Current stage covered | Stages 1–7 (through TaskManager refactor) |
| Source test files | `__tests__/App.test.tsx`, `__tests__/SharedComponents.test.tsx`, `__tests__/TasksScreen.test.tsx`, `__tests__/TaskValidation.test.ts` |
| Primary command | `npm run test:windows -- --verbose > test-results.txt 2>&1` |
| Alternate command | `npm test` |
| Latest result | 4 suites / 25 tests passed / 0 failed / 0 snapshots |
| Results log | `test-results.txt` (project root) |

## How to update this file

1. Add or change tests under `__tests__/`.
2. Run `npm run test:windows -- --verbose > test-results.txt 2>&1`.
3. Update sections **1–6** below to match reality only (do not invent tests).
4. Update the header table (**Last updated**, **Latest result**, source files, stage covered).
5. Add new rows to the test case / results tables and procedure groups as needed.

### Stage coverage (integrated)

| Stage | Focus | Status |
|---|---|---|
| 1–2 | App shell + navigation Jest tests | Complete / passing |
| 3–4 | Shared UI components + component tests | Complete / passing |
| 5 | Task UI (temporary React state) + interaction tests | Complete / passing |
| 6 | Task validation module + validation / form tests | Complete / passing |
| 7 | TaskManager refactor (business logic layer) | Complete / regression green |
| 8+ | TaskManager unit tests, SQLite, etc. | Not started |

---

## 1. TEST PLAN INFORMATION

- **Test Scope**
  - Automated Jest UI and unit tests for FocusFlow React Native for Windows (TypeScript)
  - Covers: navigation shell, shared UI components, temporary Tasks screen state UI, reusable task validation, invalid-save form behavior
  - Does not cover: native Windows build/deploy as automated tests, manual UI/UX, SQLite persistence, TaskManager

- **Test Objectives**
  - Verify default screen and sidebar navigation between 5 sections
  - Verify shared component interaction behavior (button press/disabled, input label/error, page header text)
  - Verify temporary Tasks UI state actions (render samples, complete, delete, edit populate, save new)
  - Confirm invalid task input is rejected by `validateTaskInput`
  - Confirm valid task input is accepted and sanitized values are returned
  - Confirm invalid tasks are not added through the TasksScreen UI
  - Confirm previous application behavior remains stable after Stage 6

- **Test Items**
  - `App.tsx` + `Sidebar`
  - `AppButton`, `AppInput`, `PageHeader`
  - `TasksScreen` (temporary React `useState` only)
  - `src/utils/taskValidation.ts` (`validateTaskInput`, `sanitizeLabels`)
  - `src/types/task.ts` (priority / status types used by validation)

- **Features Tested**
  - Sidebar navigation / active item state
  - Shared component press, disabled, label, error display, header text
  - Tasks list seed data + Complete / Delete / Edit / Save interactions in memory
  - Task title validation (required, whitespace, max length)
  - Description validation (optional, trim, max length)
  - Priority validation (Low / Medium / High / Critical)
  - Estimated-duration validation (optional numeric, > 0, ≤ 1440)
  - Label sanitization (trim, blanks, case-insensitive duplicates) and max-10 limit
  - Due-date validation (optional valid date)
  - TasksScreen invalid-save behavior (error display, no list insert, form retention)

- **Features Not Yet Tested**
  - TaskManager
  - SQLite repositories / persistent task storage
  - Subtask completion business rules
  - Trash retention behavior
  - Notifications, timers, goals logic, statistics calculations, settings persistence
  - Export, authentication, cloud services
  - Parent-task selection behavior
  - Visual style details (colors, spacing, fonts)
  - Windows-specific packaging/deploy as an automated test
  - Final integration behavior

- **Test Environment**
  - OS: Windows 10/11 development machine
  - App stack: React Native for Windows; React `19.2.3`; React Native `0.86.0`; `react-native-windows` `^0.84.0`
  - TypeScript `^5.8.3`
  - Node (project engine): `>= 22.11.0`
  - Jest config: `jest.config.js` → `jest.config.windows.js` (`@rnx-kit/jest-preset` windows)

- **Testing Tools**
  - Jest (`^29.6.3`)
  - `@testing-library/react-native` (`^13.3.3`)
  - `react-test-renderer` (`19.2.3`)
  - Direct function calls for pure validation unit tests
  - `fireEvent` for press / changeText on screen tests

- **Risks and Contingencies**
  - Tasks data is still temporary React state; test success does not mean persistence works
  - Validation is enforced in TasksScreen / `taskValidation.ts`, not yet through TaskManager
  - SQLite persistence is not yet implemented
  - Future model changes may require regression updates to validation and UI tests
  - Native Windows UI differences may require additional manual testing
  - Native deploy can fail if FocusFlow process locks DLLs (see DEF-004)
  - If `npm test` preset breaks, use `npm run test:windows` or keep Jest config pointing at Windows preset

- **Pass/Fail Criteria**
  - **Pass:** actual behavior matches expected behavior and the Jest assertion succeeds; suite exits 0
  - **Fail:** behavior differs from expected result, an assertion fails, or the test suite cannot execute
  - **Stage gate:** all current tests must pass (`Failed Tests: 0`); Stage 6 marked stable when validation + prior suites are green

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
| TC_TASK_FORM_01 | Invalid save shows error and does not add task | Whitespace title + description; press Save | “Title is required.” shown; description not in list; form retains values | 1. Enter invalid title 2. Press Save 3. Assert error + no new list item | Error shown; not added | Pass |
| TC_TASK_VAL_01 | Reject empty/whitespace title | `validateTaskInput` with `""` / `"   "` | `isValid=false`; title error set | 1. Call with empty 2. Call with whitespace 3. Assert | Rejected | Pass |
| TC_TASK_VAL_02 | Accept valid task | Valid title/priority/duration/labels/dueDate | `isValid=true`; sanitized fields populated | 1. Call with valid input 2. Assert result | Accepted | Pass |
| TC_TASK_VAL_03 | Trim title, description, labels | Padded strings / padded label array | Trimmed values in `sanitizedData` | 1. Call with padded values 2. Assert trimmed output | Trimmed | Pass |
| TC_TASK_VAL_04 | Reject overlong title/description | Title 101 chars; description 501 chars | Title/description errors | 1. Call each case 2. Assert errors | Rejected | Pass |
| TC_TASK_VAL_05 | Reject invalid priority | priority=`Urgent` | Priority error | 1. Call 2. Assert | Rejected | Pass |
| TC_TASK_VAL_06 | Reject bad estimated duration | `abc`, `0`, `1441` | estimatedDuration errors | 1. Call each case 2. Assert | Rejected | Pass |
| TC_TASK_VAL_07 | Reject >10 labels after sanitize | 11 distinct labels | Labels error; sanitized length 11 | 1. Call 2. Assert | Rejected | Pass |
| TC_TASK_VAL_08 | Sanitize blank/duplicate labels | `["School"," school ","","Homework"]` | `["School","Homework"]` | 1. `sanitizeLabels` / validate 2. Assert | Sanitized | Pass |

---

## 3. TEST PROCEDURE INFORMATION

Exact preferred command for full run + log:

```
npm run test:windows -- --verbose > test-results.txt 2>&1
```

### TP-NAV — Navigation

- **Procedure ID:** TP-NAV
- **Description:** Verify sidebar navigation and active selection across app screens
- **Test Environment:** Jest + RNTL; render full `<App />`; Windows Jest preset
- **Steps to Execute:**
  1. From project root run the preferred command above (or `npm test`)
  2. Confirm suite `FocusFlow navigation shell` executes TC_NAV_01–TC_NAV_06
- **Post-Execution Actions:** Confirm PASS in console / `test-results.txt`; record any failures

### TP-UI — Shared Components

- **Procedure ID:** TP-UI
- **Description:** Verify AppButton, AppInput, PageHeader interaction/display behavior
- **Test Environment:** Jest + RNTL; component-level render
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suite `FocusFlow shared UI components` executes TC_UI_01–TC_UI_05
- **Post-Execution Actions:** Record pass/fail; no styling assertions by design

### TP-TASK-UI — Task UI (Temporary State) + Invalid Form Save

- **Procedure ID:** TP-TASK-UI
- **Description:** Verify Tasks screen temporary list/form interactions and Stage 6 invalid-save UI behavior
- **Test Environment:** Jest + RNTL; render `<TasksScreen />`
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suite `Tasks screen temporary UI state` executes TC_TASK_UI_01–05 and TC_TASK_FORM_01
- **Post-Execution Actions:** Record pass/fail; note results apply to in-memory UI + client validation only (not SQLite)

### TP-TASK-VAL — Task Validation (Stage 6)

- **Procedure ID:** TP-TASK-VAL
- **Description:** Verify pure `validateTaskInput` / `sanitizeLabels` behavior without UI
- **Test Environment:** Jest; direct function calls; no React Native render required for these cases
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suite `Task validation` executes TC_TASK_VAL_01–TC_TASK_VAL_08
- **Post-Execution Actions:** Confirm PASS lines in `test-results.txt`; update this document if cases change

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
| TC_TASK_FORM_01 | Invalid save blocked | Pass | “Title is required.”; task not listed | N/A |
| TC_TASK_VAL_01 | Empty/whitespace title rejected | Pass | Title error; `isValid=false` | N/A |
| TC_TASK_VAL_02 | Valid task accepted | Pass | Sanitized fields populated | N/A |
| TC_TASK_VAL_03 | Trim title/description/labels | Pass | Trimmed `sanitizedData` | N/A |
| TC_TASK_VAL_04 | Length limits enforced | Pass | Title/description errors | N/A |
| TC_TASK_VAL_05 | Invalid priority rejected | Pass | Priority error for `Urgent` | N/A |
| TC_TASK_VAL_06 | Duration rules enforced | Pass | Errors for abc / 0 / 1441 | N/A |
| TC_TASK_VAL_07 | >10 labels rejected | Pass | Labels error after sanitize | N/A |
| TC_TASK_VAL_08 | Label sanitize/dedupe | Pass | `["School","Homework"]` | N/A |

---

## 5. DEFECT TRACKING INFORMATION

Latest automated product test run: **0 new defects** (25/25 tests passed).  
Stage 6 validation development: **no Stage 6 defects**; no corrective fixes required for validation code or tests.

Historical defects found during setup / earlier automated testing (and fixed) are logged below.

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
| Total Test Suites | 4 |
| Total Test Cases | 25 |
| Passed | 25 |
| Failed | 0 |
| Pass Percentage | 100% |
| Snapshots | 0 |
| Overall System Status (tested scope) | Stages 1–7 green; TaskManager refactor preserved all 25 existing automated tests; Stage 8 (TaskManager unit tests) not started |

### Suite map

| Suite name | File | Cases |
|---|---|---|
| FocusFlow shared UI components | `__tests__/SharedComponents.test.tsx` | TC_UI_01–05 |
| FocusFlow navigation shell | `__tests__/App.test.tsx` | TC_NAV_01–06 |
| Tasks screen temporary UI state | `__tests__/TasksScreen.test.tsx` | TC_TASK_UI_01–05, TC_TASK_FORM_01 |
| Task validation | `__tests__/TaskValidation.test.ts` | TC_TASK_VAL_01–08 |

### Stage 6 quick reference

| Item | Detail |
|---|---|
| Feature | Task input validation + TasksScreen invalid-save behavior |
| Module | `src/utils/taskValidation.ts` |
| New cases | TC_TASK_VAL_01–08, TC_TASK_FORM_01 |
| Command | `npm run test:windows -- --verbose > test-results.txt 2>&1` |
| Result | All 9 new cases Pass; prior 16 remained Pass |
| Fixes | None required for Stage 6 |

### Stage 7 — TaskManager Refactor

| Item | Detail |
|---|---|
| Feature implemented | `TaskManager` application-layer business logic; `TasksScreen` delegates create/update/delete/complete/form helpers |
| Purpose | Move task rules out of the presentation layer without adding SQLite or repository persistence |
| Files created | `src/managers/TaskManager.ts` |
| Files modified | `src/screens/TasksScreen.tsx`, `documentation/testing-notes.md`, `test-results.txt` |
| Existing tests rerun | All prior suites: navigation, shared UI, TasksScreen UI, task validation |
| Test command used | `npm run test:windows -- --verbose > test-results.txt 2>&1` |
| Test totals | 4 suites passed; 25 tests passed; 0 failed; 0 snapshots |
| Defects encountered during refactoring | None |
| Fixes applied | No corrective fixes required |
| Overall stage status | Stage 7 complete and stable; ready for Stage 8 (TaskManager unit tests). Still using temporary React state (no SQLite yet). |