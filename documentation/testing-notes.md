# FocusFlow Testing Notes

Working notes for the IEEE Software Test Document.
**Update this file whenever new automated tests are added or results change.**

| Field | Value |
|---|---|
| Last updated | 2026-07-14 (Stage 10 TaskRepository tests) |
| Current stage covered | Stages 1–10 (through TaskRepository tests) |
| Source test files | `__tests__/App.test.tsx`, `__tests__/SharedComponents.test.tsx`, `__tests__/TasksScreen.test.tsx`, `__tests__/TaskValidation.test.ts`, `__tests__/TaskManager.test.ts`, `__tests__/TaskManager.trash.test.ts`, `__tests__/TaskRepository.test.ts` |
| Primary command | `npm run test:windows -- --verbose > test-results.txt 2>&1` |
| Alternate command | `npm test` |
| Latest result | 7 suites / 55 tests passed / 0 failed / 0 snapshots |
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
| 5 | Task UI (repository-backed; Jest uses in-memory repo) + interaction tests | Complete / passing |
| 6 | Task validation module + validation / form tests | Complete / passing |
| 7 | TaskManager refactor (business logic layer) | Complete / regression green |
| 8 | TaskManager unit tests (TC_TASK_MGR + trash suite) | Complete / passing |
| 9 | SQLite repository + task persistence | Complete / regression green |
| 10 | TaskRepository unit tests | Complete / passing |
| 11+ | Timer UI, goals, statistics, etc. | Not started |

---

## 1. TEST PLAN INFORMATION

- **Test Scope**
  - Automated Jest UI and unit tests for FocusFlow React Native for Windows (TypeScript)
  - Covers: navigation shell, shared UI components, TasksScreen interactions, task validation, TaskManager business logic (including Recently Deleted), SqliteTaskRepository persistence behavior (via injected fake `DatabaseService`), and repository-related regressions for Stage 9 defects
  - Does not cover as automated Jest: native turbo-sqlite engine I/O, Windows packaging/deploy, Timer/Goals/Statistics/Settings, notifications, export, authentication, cloud services

- **Test Objectives**
  - Verify default screen and sidebar navigation between 5 sections
  - Verify shared component interaction behavior (button press/disabled, input label/error, page header text)
  - Verify TasksScreen create/edit/status/trash/restore/permanent-delete flows against TaskManager + repository
  - Confirm invalid task input is rejected by `validateTaskInput` and through the TasksScreen save path
  - Confirm TaskManager validation, label limits, status advancement, soft-delete, and immutability behavior
  - Confirm SqliteTaskRepository initialize/CRUD/trash mapping uses parameterized SQL and typed Task rows
  - Confirm prior application suites remain green after Stages 7–10 refactors

- **Test Items**
  - `App.tsx` + `Sidebar`
  - `AppButton`, `AppInput`, `PageHeader`
  - `TasksScreen` (async TaskManager + repository-backed state)
  - `src/utils/taskValidation.ts` (`validateTaskInput`, `sanitizeLabels`)
  - `src/types/task.ts`
  - `src/managers/TaskManager.ts`
  - `src/repositories/SqliteTaskRepository.ts`, `ITaskRepository.ts`, `InMemoryTaskRepository.ts`
  - `src/services/DatabaseService.ts`
  - `src/testing/FakeDatabaseService.ts` (Stage 10 test double)

- **Features Tested**
  - Sidebar navigation / active item state
  - Shared component press, disabled, label, error display, header text
  - Tasks list seed (empty-DB only) + Start/Complete, Edit, Save, Delete → Recently Deleted, Restore, Delete Permanently
  - Task title / description / priority / duration / labels / due-date validation
  - TaskManager create/update/complete/trash/restore and label persistence rules
  - SqliteTaskRepository initialize, create, read, update, soft-delete, empty results, error paths, parameterized SQL
  - Stage 9 path-fallback and re-init regression checks (automatable subset)

- **Features Not Yet Tested**
  - Native turbo-sqlite engine behavior inside Jest (suite uses fake/in-memory doubles)
  - Full manual UI click-path persistence checklist on every release
  - Schema migrations / corrupt-database recovery / large-dataset performance
  - Parent/subtask completion business rules (not implemented)
  - Timer UI / TimerService / SessionManager
  - Goals / Statistics / Settings persistence
  - Notifications, system tray, export, authentication, cloud services
  - Visual style details (colors, spacing, fonts) as automated assertions
  - Windows packaging/deploy as an automated test
  - Final integration behavior

- **Test Environment**
  - OS: Windows 10/11 development machine
  - App stack: React Native for Windows only; React `19.2.3`; React Native `0.86.0`; `react-native-windows` `^0.84.0`
  - SQLite package: `react-native-turbo-sqlite` `0.6.2`
  - TypeScript `^5.8.3`
  - Node (project engine): `>= 22.11.0`
  - Jest config: `jest.config.js` → `jest.config.windows.js` (`@rnx-kit/jest-preset` windows) + `jest.setup.js`

- **Testing Tools**
  - Jest (`^29.6.3`)
  - `@testing-library/react-native` (`^13.3.3`) for UI/navigation/TasksScreen suites
  - Direct unit tests for validation, TaskManager, and SqliteTaskRepository
  - `InMemoryTaskRepository` for TaskManager / UI Jest isolation
  - `FakeDatabaseService` for repository SQL/parameter and mapping tests
  - `fireEvent` / `waitFor` / `findBy*` for async TasksScreen tests

- **Risks and Contingencies**
  - Jest does not exercise the native turbo-sqlite binary; Windows restart persistence still needs occasional manual spot-checks
  - `run-windows` redeploy can wipe package LocalState and wipe saved tasks
  - Future schema changes need migration tests and repository suite updates
  - Native deploy can fail if FocusFlow locks DLLs (see DEF-004)
  - PlatformToolset patch for turbo-sqlite (`postinstall`) must remain after reinstalls (DEF-006)
  - If `npm test` preset breaks, use `npm run test:windows`

- **Pass/Fail Criteria**
  - **Pass:** actual behavior matches expected behavior and the Jest assertion succeeds; suite exits 0
  - **Fail:** behavior differs from expected result, an assertion fails, or the test suite cannot execute
  - **Stage gate (current):** Stages 1–10 green (`Failed Tests: 0`); Stage 11 (Timer UI) is next

---

## 2. TEST CASE INFORMATION

Primary case catalog for Stages 1–6 is below. Stages 7–10 case detail lives in the dedicated Stage 8 / Stage 9 / Stage 10 sections (TC_TASK_MGR_*, TC_TASK_TRASH_*, TC_TASK_REPO_*, TC_TASK_REPO_REG_*), and all current IDs are Pass in the latest `test-results.txt` run (55/55).

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
| TC_TASK_UI_01 | Sample tasks render | Render `<TasksScreen />` | Math Homework, Clean Room, Study React Native + priority/status texts | 1. Await load 2. Assert sample titles/status/priority | Samples present | Pass |
| TC_TASK_UI_02 | Status advances Pending → In Progress → Completed | Press complete control twice on sample-1 | Status reaches Completed | 1. Assert Pending 2. Press Start/Complete 3. Assert | Status Completed | Pass |
| TC_TASK_UI_03 | Delete moves task to Recently Deleted | Press `task-delete-sample-2` then Recently Deleted | Active card gone; trash shows Clean Room | 1. Delete 2. Open trash 3. Assert | Soft-deleted | Pass |
| TC_TASK_UI_04 | Edit loads form | Press `task-edit-sample-1` | Title/description fields filled; “Edit Task” shown | 1. Press Edit 2. Assert input values + heading | Form populated | Pass |
| TC_TASK_UI_05 | Save adds new task | Enter title/description; press Save | New task appears in list; form closes | 1. Add Task 2. Save 3. Assert texts | New task listed | Pass |
| TC_TASK_UI_06 | Restore from Recently Deleted | Delete sample-2; Restore | Task returns to active list | 1. Delete 2. Restore 3. Assert | Restored | Pass |
| TC_TASK_UI_07 | Permanently delete from trash | Delete sample-2; Delete Permanently | Task gone from trash and active list | 1. Delete 2. Permanent delete 3. Assert | Permanently removed | Pass |
| TC_TASK_FORM_01 | Invalid save shows error and does not add task | Whitespace title + description; press Save | “Title is required.” shown; description not in list; form retains values | 1. Enter invalid title 2. Press Save 3. Assert error + no new list item | Error shown; not added | Pass |
| TC_TASK_VAL_01 | Reject empty/whitespace title | `validateTaskInput` with `""` / `"   "` | `isValid=false`; title error set | 1. Call with empty 2. Call with whitespace 3. Assert | Rejected | Pass |
| TC_TASK_VAL_02 | Accept valid task | Valid title/priority/duration/labels/dueDate | `isValid=true`; sanitized fields populated | 1. Call with valid input 2. Assert result | Accepted | Pass |
| TC_TASK_VAL_03 | Trim title, description, labels | Padded strings / padded label array | Trimmed values in `sanitizedData` | 1. Call with padded values 2. Assert trimmed output | Trimmed | Pass |
| TC_TASK_VAL_04 | Reject overlong title/description | Title 101 chars; description 501 chars | Title/description errors | 1. Call each case 2. Assert errors | Rejected | Pass |
| TC_TASK_VAL_05 | Reject invalid priority | priority=`Urgent` | Priority error | 1. Call 2. Assert | Rejected | Pass |
| TC_TASK_VAL_06 | Reject bad estimated duration | `abc`, `0`, `1441` | estimatedDuration errors | 1. Call each case 2. Assert | Rejected | Pass |
| TC_TASK_VAL_07 | Reject >10 labels after sanitize | 11 distinct labels | Labels error; sanitized length 11 | 1. Call 2. Assert | Rejected | Pass |
| TC_TASK_VAL_08 | Sanitize blank/duplicate labels | `["School"," school ","","Homework"]` | `["School","Homework"]` | 1. `sanitizeLabels` / validate 2. Assert | Sanitized | Pass |
| TC_TASK_MGR_01–10 | TaskManager business rules | See Stage 8 section | See Stage 8 section | Run Jest suite | All Pass | Pass |
| TC_TASK_TRASH_01–05 | TaskManager trash retention API | See Stage 8 / trash suite | See trash suite expectations | Run Jest suite | All Pass | Pass |
| TC_TASK_REPO_01–10 | SqliteTaskRepository persistence API | See Stage 10 section | See Stage 10 section | Run Jest suite | All Pass | Pass |
| TC_TASK_REPO_REG_01–03 | Stage 9 / repository regressions | See Stage 10 section | See Stage 10 section | Run Jest suite | All Pass | Pass |

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

### TP-TASK-UI — Tasks Screen Interactions

- **Procedure ID:** TP-TASK-UI
- **Description:** Verify Tasks screen list/form interactions, Recently Deleted flows, and invalid-save UI behavior (TaskManager + in-memory repository under Jest)
- **Test Environment:** Jest + RNTL; render `<TasksScreen />`; async loading via `findBy` / `waitFor`
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suite `Tasks screen temporary UI state` executes TC_TASK_UI_01–07 and TC_TASK_FORM_01
- **Post-Execution Actions:** Record pass/fail; UI suite uses InMemoryTaskRepository (native SQLite not required)

### TP-TASK-VAL — Task Validation (Stage 6)

- **Procedure ID:** TP-TASK-VAL
- **Description:** Verify pure `validateTaskInput` / `sanitizeLabels` behavior without UI
- **Test Environment:** Jest; direct function calls; no React Native render required for these cases
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suite `Task validation` executes TC_TASK_VAL_01–TC_TASK_VAL_08
- **Post-Execution Actions:** Confirm PASS lines in `test-results.txt`; update this document if cases change

### TP-TASK-MGR — TaskManager (Stages 7–8)

- **Procedure ID:** TP-TASK-MGR
- **Description:** Verify TaskManager business rules including create/update/complete/trash/labels
- **Test Environment:** Jest unit tests with `InMemoryTaskRepository`
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suites `TaskManager unit tests` (TC_TASK_MGR_01–10) and `TaskManager Recently Deleted` (TC_TASK_TRASH_01–05)
- **Post-Execution Actions:** Record pass/fail; detailed cases also listed under Stage 8 section

### TP-TASK-REPO — SqliteTaskRepository (Stage 10)

- **Procedure ID:** TP-TASK-REPO
- **Description:** Verify repository initialize/CRUD/trash mapping and parameterized SQL via fake DatabaseService
- **Test Environment:** Jest; `SqliteTaskRepository` + `FakeDatabaseService`
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suite `SqliteTaskRepository` executes TC_TASK_REPO_01–10 and TC_TASK_REPO_REG_01–03
- **Post-Execution Actions:** Record pass/fail; detailed cases listed under Stage 10 section

---

## 4. TEST RESULTS INFORMATION

Latest full automated run (`test-results.txt`): **7 suites / 55 tests passed / 0 failed / 0 snapshots**.

Detail for Stages 1–6 UI/validation cases appears below. Manager / repository case results are summarized as Pass ranges and fully documented in Stage 8 and Stage 10 sections.

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
| TC_TASK_UI_02 | Status advances to Completed | Pass | sample-1 Pending → In Progress → Completed | N/A |
| TC_TASK_UI_03 | Delete moves to Recently Deleted | Pass | sample-2 removed from active; shown in trash | N/A |
| TC_TASK_UI_04 | Edit loads form | Pass | Form values match Math Homework | N/A |
| TC_TASK_UI_05 | Save adds task | Pass | “Write Unit Tests” visible in list | N/A |
| TC_TASK_UI_06 | Restore from trash | Pass | sample-2 restored to active list | N/A |
| TC_TASK_UI_07 | Permanent delete from trash | Pass | sample-2 removed permanently | N/A |
| TC_TASK_FORM_01 | Invalid save blocked | Pass | “Title is required.”; task not listed | N/A |
| TC_TASK_VAL_01 | Empty/whitespace title rejected | Pass | Title error; `isValid=false` | N/A |
| TC_TASK_VAL_02 | Valid task accepted | Pass | Sanitized fields populated | N/A |
| TC_TASK_VAL_03 | Trim title/description/labels | Pass | Trimmed `sanitizedData` | N/A |
| TC_TASK_VAL_04 | Length limits enforced | Pass | Title/description errors | N/A |
| TC_TASK_VAL_05 | Invalid priority rejected | Pass | Priority error for `Urgent` | N/A |
| TC_TASK_VAL_06 | Duration rules enforced | Pass | Errors for abc / 0 / 1441 | N/A |
| TC_TASK_VAL_07 | >10 labels rejected | Pass | Labels error after sanitize | N/A |
| TC_TASK_VAL_08 | Label sanitize/dedupe | Pass | `["School","Homework"]` | N/A |
| TC_TASK_MGR_01–10 | TaskManager unit tests | Pass | See Stage 8 | N/A |
| TC_TASK_TRASH_01–05 | TaskManager trash tests | Pass | See trash suite / Stage 8 | N/A |
| TC_TASK_REPO_01–10 | SqliteTaskRepository tests | Pass | See Stage 10 | N/A |
| TC_TASK_REPO_REG_01–03 | Repository regressions | Pass | See Stage 10 | N/A |

---

## 5. DEFECT TRACKING INFORMATION

Latest automated product test run: **0 failed** (**7 suites / 55 tests passed**).  
Stages 1–10: product defects found during Stages 9–10 are fixed (DEF-005–008). DEF-004 remains an open deploy workaround when the app locks DLLs.

Historical defects found during setup / earlier automated testing (and fixed) are logged below.

| Defect ID | Description | Severity | Steps to Reproduce | Status | Fix Version |
|---|---|---|---|---|---|
| DEF-001 | `npm test` failed immediately with Jest validation error: preset `@react-native/jest-preset` not found. Default Jest config could not run any suites. Log: `● Validation Error: Preset @react-native/jest-preset not found.` | Major | 1. Open project root 2. Run `npm test` (with original `jest.config.js` using `@react-native/jest-preset`) | Fixed | Fixed in project config (`jest.config.js` now re-exports `jest.config.windows.js` / `@rnx-kit/jest-preset` for Windows). Confirmed by successful `npm test` runs. |
| DEF-002 | Navigation tests TC_NAV_01 and TC_NAV_06 failed with `TypeError: expect(...).toHaveAccessibilityState is not a function`. Matcher was unavailable in the current Jest + RNTL setup. | Minor | 1. Add NAV tests using `toHaveAccessibilityState({ selected: true })` 2. Run `npm run test:windows` or `npm test` 3. Observe failures on TC_NAV_01 and TC_NAV_06 | Fixed | Fixed in `__tests__/App.test.tsx` by asserting `props.accessibilityState` via helper `expectNavSelected` (same intent, no matcher dependency). Re-run: all nav tests passed. |
| DEF-003 | `run-windows` / MSBuild failed with **No .NET SDKs were found** / `dotnet.exe` not recognized in the build environment even though .NET SDK was installed on disk. Blocked packaging/run of FocusFlow for Windows. | Major | 1. Ensure VS C++ tools are installed 2. From a terminal where PATH may not expose `dotnet`, run `npm run windows` / `npx react-native run-windows` 3. Observe SDK-not-found / `dotnet.exe` errors during restore/build | Fixed | Fixed by setting `DOTNET_ROOT` and prepending `C:\Program Files\dotnet` to PATH in the `windows` script in `package.json`. Subsequent builds progressed past the SDK detection failure. |
| DEF-004 | Windows deploy failed after a successful build with `IOException` / file lock on `Microsoft.ReactNative.dll` (`Err_LayoutUpdate_CopyFile`, exit code 5). Usually means FocusFlow (or another process) still has the installed package files open. | Minor | 1. Leave a previous FocusFlow Windows app instance running 2. Run `npx react-native run-windows` (or `npm run windows`) 3. Build may succeed; deploy fails copying DLL into AppX layout | Workaround / Open | Not a FocusFlow source-code defect. Workaround: close the running FocusFlow app (and related processes), then re-run `npm run windows`. No app code change required. |
| DEF-005 | `@dr.pogodin/react-native-fs` failed Windows MSBuild with `unknown command 'codegen-windows'` during Stage 9 SQLite path setup. | Major | 1. Install `@dr.pogodin/react-native-fs` 2. Run `npx react-native run-windows` | Fixed | Removed the package. Added minimal native module `LocalAppPaths` (`windows/FocusFlow/LocalAppPaths.h`) returning ApplicationData LocalFolder (or `%LOCALAPPDATA%\FocusFlow` fallback). Regenerated/cleaned autolink after uninstall. |
| DEF-006 | `react-native-turbo-sqlite` Windows project uses Platform Toolset `v143` (VS 2022); FocusFlow builds with `v145`, causing MSB8020. | Major | 1. Install `react-native-turbo-sqlite` 2. Build FocusFlow Windows solution on VS with v145 only | Fixed | Retarget `ReactNativeTurboSqlite.vcxproj` to `v145` via `scripts/patch-turbo-sqlite-windows.js` and `postinstall`. |
| DEF-007 | `LocalAppPaths.h` failed to compile: `u8string()` returns `std::u8string` which cannot convert to `std::string`. | Minor | 1. Build FocusFlow after adding LocalAppPaths helper | Fixed | Return `winrt::to_string(dir.wstring())` instead of `u8string()`. |
| DEF-008 | `react-native.config.js` used `project.ios: null` / `project.android: null`, rejected by RN CLI (`must be of type object`), blocking Windows runs after Windows-only cleanup. | Major | 1. Set ios/android to null in react-native.config.js 2. Run `npx react-native run-windows` | Fixed | Use empty objects `{}` for ios/android. Found during Stage 10 launch verification (D_STAGE10_01). |

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
| Total Test Suites | 7 |
| Total Test Cases | 55 |
| Passed | 55 |
| Failed | 0 |
| Pass Percentage | 100% |
| Snapshots | 0 |
| Overall System Status (tested scope) | Stages 1–10 green; TaskRepository tests added; Stage 11 (Timer UI) not started |

### Suite map

| Suite name | File | Cases |
|---|---|---|
| FocusFlow shared UI components | `__tests__/SharedComponents.test.tsx` | TC_UI_01–05 |
| FocusFlow navigation shell | `__tests__/App.test.tsx` | TC_NAV_01–06 |
| Tasks screen temporary UI state | `__tests__/TasksScreen.test.tsx` | TC_TASK_UI_01–07, TC_TASK_FORM_01 |
| Task validation | `__tests__/TaskValidation.test.ts` | TC_TASK_VAL_01–08 |
| TaskManager unit tests | `__tests__/TaskManager.test.ts` | TC_TASK_MGR_01–10 |
| TaskManager Recently Deleted | `__tests__/TaskManager.trash.test.ts` | TC_TASK_TRASH_01–05 |
| SqliteTaskRepository | `__tests__/TaskRepository.test.ts` | TC_TASK_REPO_01–10, TC_TASK_REPO_REG_01–03 |

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

---

## Stage 8 - TaskManager Unit Tests

### 1. Stage
- Stage 8

### 2. Feature tested
- TaskManager business logic

### 3. Test scope
- Task creation
- Validation handling through `createTask` / `updateTask`
- Task editing and ID preservation
- Completion behavior via `completeTask` / `advanceTaskStatus`
- Soft-deletion via `moveToTrash` (no hard `deleteTask` method exists)
- Label preservation (comma-separated string storage after sanitization)
- Maximum 10-label rule enforced through TaskManager + validation
- Collection immutability for create/update/complete/trash mutations
- Lookup via `getTaskById`
- `prepareTaskForEditing` field mapping used during edit coverage

### 4. Test objectives
- Verify task business logic independently of the UI
- Verify Stage 7 refactoring did not change expected behavior
- Verify label handling is preserved through create/update
- Confirm existing application tests continue to pass

### 5. Actual TaskManager API
Public methods covered by Stage 8 TC_TASK_MGR tests:
- `createTask`
- `updateTask`
- `prepareTaskForEditing`
- `completeTask`
- `moveToTrash`
- `getTaskById`

Related methods already covered by `__tests__/TaskManager.trash.test.ts` (kept as-is):
- `restoreTask`
- `permanentlyDeleteTask`
- `purgeExpiredDeletedTasks`
- `getDaysRemainingInTrash`

Other public methods present but not expanded in TC_TASK_MGR_01–10 (still exercised elsewhere or unused by Stage 8 focus):
- `getInitialTasks`
- `clearFormData`
- `sortTasks`
- `filterTasks`
- `advanceTaskStatus` (aliased by `completeTask`)

### 6. Files tested
- `src/managers/TaskManager.ts`
- `src/types/task.ts`
- `src/utils/taskValidation.ts` (invoked by TaskManager; not re-tested in depth)
- `__tests__/TaskManager.test.ts` (new)
- Existing regression suites remain green

### 7. Testing tools
- Jest
- TypeScript
- React Native for Windows Jest configuration (`jest.config.windows.js`)

### 8. Exact command used
```
npm run test:windows -- --verbose > test-results.txt 2>&1
```

### 9. Test cases added

| ID | Name |
|---|---|
| TC_TASK_MGR_01 | Creates a valid task and adds it to the collection |
| TC_TASK_MGR_02 | Rejects invalid task input or returns the appropriate validation failure |
| TC_TASK_MGR_03 | Updates an existing task while preserving its task ID |
| TC_TASK_MGR_04 | Preserves task fields during editing, including status, priority, due date, estimated duration, description, and labels |
| TC_TASK_MGR_05 | Preserves up to 10 task labels during create and edit operations |
| TC_TASK_MGR_06 | Does not allow more than 10 labels after sanitization or validation |
| TC_TASK_MGR_07 | Marks a task as completed without modifying unrelated task fields |
| TC_TASK_MGR_08 | Deletes the selected task without altering unrelated tasks (soft-delete via moveToTrash) |
| TC_TASK_MGR_09 | Returns or identifies the correct task by ID |
| TC_TASK_MGR_10 | Returns new arrays or objects instead of mutating the original task collection |

### 10. Expected outcomes
- Valid create prepends a Pending task and returns `success: true`
- Invalid create returns `success: false`, unchanged collection reference, and validation errors
- Update keeps the same task `id` and applies form fields
- Edit preserves `status`; other editable fields follow prepared/updated form values
- Exactly 10 labels are stored as a comma-separated string after create/update
- More than 10 labels fails create/update with a labels error
- Completing an In Progress task sets status to Completed only
- Soft-delete moves only the selected task into trash with `deletedAt`
- `getTaskById` returns the matching task or `undefined`
- Mutations return new arrays/objects without mutating the original collection

### 11. Actual outcomes
- From `test-results.txt`: all TC_TASK_MGR_01–10 passed
- Prior suites (navigation, shared UI, TasksScreen, validation, trash) remained passed

### 12. Pass/fail status

| Test | Status |
|---|---|
| TC_TASK_MGR_01 | Pass |
| TC_TASK_MGR_02 | Pass |
| TC_TASK_MGR_03 | Pass |
| TC_TASK_MGR_04 | Pass |
| TC_TASK_MGR_05 | Pass |
| TC_TASK_MGR_06 | Pass |
| TC_TASK_MGR_07 | Pass |
| TC_TASK_MGR_08 | Pass |
| TC_TASK_MGR_09 | Pass |
| TC_TASK_MGR_10 | Pass |

### 13. Defects found
- None in TaskManager business logic during Stage 8
- One test TypeScript issue: `structuredClone` was not recognized by the project TypeScript config; replaced with a shallow map copy in the test only

### 14. Fixes made
- Corrective product-code fixes: none required
- Test fix: replaced `structuredClone` with `original.map(task => ({...task}))` in TC_TASK_MGR_10 so `tsc --noEmit` succeeds

### 15. Final totals
| Metric | Value |
|---|---|
| Test suites | 6 passed, 6 total |
| Total tests | 42 |
| Passed | 42 |
| Failed | 0 |
| Snapshots | 0 |

### 16. Risks and contingencies
> Historical Stage 8 snapshot. SQLite repository work and repository tests were completed in Stages 9–10; current risk posture is in Section 1 and Stage 10.

- At Stage 8 completion, TaskManager still used temporary in-memory data
- Repository and SQLite behavior were not yet tested at that time
- Future persistence integration could expose new issues
- Stage 8 tests did not verify app restart persistence
- Native Windows behavior remained outside Stage 8
- Trash retention / restore / permanent delete were covered in a separate suite (`TaskManager.trash.test.ts`) and UI tests, not fully duplicated in TC_TASK_MGR

### 17. Pass/fail criteria
- Pass: returned behavior matches the expected business rule and Jest assertion passes
- Fail: returned behavior differs, input is improperly handled, mutation occurs unexpectedly, or the test suite cannot execute

### 18. Overall stage status
- Stage 8 complete; later superseded as current gate by Stages 9–10 (SQLite + repository tests)
- At Stage 8 exit: TaskManager was ready for SQLite repository work

### 19. Features not yet tested
> Historical Stage 8 snapshot. Several items below were covered in Stages 9–10.

- SQLite repository (done in Stage 9)
- Persistent storage (done in Stage 9; repository tests in Stage 10)
- Parent/subtask completion business rules (not implemented)
- Timer
- Goals
- Statistics
- Settings persistence
- Notifications
- Windows-specific features
- Final integration
Notes on Stage 7 extras discovered while writing Stage 8:
- Labels are sanitized to a `string[]` in validation, then stored on `Task` as a comma-separated `string` (`labelsToStorage`)
- Delete is soft-delete (`moveToTrash`) with Recently Deleted restore / permanent delete / 30-day purge
- Status flow is Pending → In Progress → Completed (`advanceTaskStatus` / `completeTask`)
- Helper APIs exist: `sortTasks`, `filterTasks`, seed `getInitialTasks`, form helpers
- `parentTaskId` is preserved as a string field; no subtask completion gating exists yet
- Labels and parent/subtask relationships remain separate concepts

---

## Stage 9 - SQLite Repository and Task Persistence

### 1. Stage
- Stage 9

### 2. Feature implemented
- Local SQLite database (`react-native-turbo-sqlite`)
- `DatabaseService` for connection + schema
- `SqliteTaskRepository` / `ITaskRepository` / `InMemoryTaskRepository`
- Persistent task storage (active + Recently Deleted tables)
- TaskManager repository integration (async)
- TasksScreen load/save/error/loading integration

### 3. Test scope
- Existing automated regression tests (all Stage 1–8 suites)
- Database initialization (idempotent `CREATE TABLE IF NOT EXISTS`)
- Task loading on mount
- Task creation/edit/delete persistence (manual SQLite + app restart cycle)
- Label persistence as comma-separated text
- Error handling surfaces on TasksScreen
- Jest mocks for native SQLite

### 4. Test objectives
- Confirm task data is stored locally in SQLite
- Confirm tasks/seeds survive application process restart without wipe
- Confirm TaskManager uses the repository (no SQL in manager/UI)
- Confirm existing automated behavior remains stable

### 5. Files created and modified
Created:
- `src/services/DatabaseService.ts`
- `src/repositories/ITaskRepository.ts`
- `src/repositories/SqliteTaskRepository.ts`
- `src/repositories/InMemoryTaskRepository.ts`
- `windows/FocusFlow/LocalAppPaths.h`
- `jest.setup.js`
- `scripts/patch-turbo-sqlite-windows.js`
- `scripts/stage9-persistence-check.py` (manual verification helper)

Modified:
- `src/managers/TaskManager.ts`
- `src/screens/TasksScreen.tsx`
- `__tests__/TaskManager.test.ts`
- `__tests__/TaskManager.trash.test.ts`
- `__tests__/TasksScreen.test.tsx`
- `__tests__/App.test.tsx`
- `jest.config.windows.js`
- `package.json` (+ `postinstall`)
- `windows/FocusFlow/FocusFlow.cpp`
- `windows/FocusFlow/pch.h`
- `windows/FocusFlow/AutolinkedNativeModules.g.cpp`
- `windows/FocusFlow.sln` (removed stale ReactNativeFs)
- `documentation/testing-notes.md`
- `documentation/plan.md`
- `test-results.txt`

### 6. SQLite package
| Item | Detail |
|---|---|
| Name | `react-native-turbo-sqlite` |
| Installed version | `0.6.2` |
| Compatibility reason | Explicit Windows + New Architecture (C++ TurboModule). Project already has `RnwNewArch=true`. |
| Native configuration required | Autolinking; PlatformToolset patch to `v145`; minimal `LocalAppPaths` native helper for writable LocalFolder path |
| Not used | Expo SQLite, AsyncStorage, Firebase/Supabase/Realm, `@dr.pogodin/react-native-fs` (build failure DEF-005) |
| Limitation | Package README marks Windows support experimental |

### 7. Database schema
Tables:
- `tasks` — primary key `id` (TEXT)
- `deleted_tasks` — primary key `id` (TEXT) + `deleted_at` (TEXT ISO)

Fields on both task shapes: `title`, `description`, `priority`, `status`, `due_date`, `estimated_duration_minutes`, `labels`, `parent_task_id`

Label storage: Option A — single TEXT column storing the same comma-separated string as `Task.labels` (preserves ≤10 labels via validation; simple to migrate later)

SQL: all repository writes use parameterized `?` placeholders.

Path: `{LocalFolder}/focusflow.db` (Package LocalState observed: `%LOCALAPPDATA%\Packages\FocusFlow_wk8nzwejgnza6\LocalState\focusflow.db`)

### 8. Testing tools
- Jest + React Native Testing Library
- TypeScript
- React Native for Windows
- `react-native-turbo-sqlite`
- Manual Windows restart checks + Python `sqlite3` helper

### 9. Exact automated test command
```
npm run test:windows -- --verbose > test-results.txt 2>&1
```

### 10. Automated results
| Metric | Value |
|---|---|
| Test suites | 6 passed, 6 total |
| Total tests | 42 |
| Passed | 42 |
| Failed | 0 |
| Snapshots | 0 |

### 11. Manual persistence procedure
Steps executed:
1. `npx react-native run-windows` — build/deploy/launch succeeded after DEF-005/006/007 fixes
2. Confirmed DB file created and seeded with sample tasks via app initialize
3. Closed FocusFlow process
4. Inserted `SQLite Persistence Test` into `tasks` using the same schema/SQL shape as `SqliteTaskRepository`
5. Relaunched FocusFlow.exe without redeploy
6. Closed app; confirmed row remained
7. Updated title/description/priority; relaunched; confirmed edited values remained
8. Deleted row; relaunched; confirmed task gone and samples still present (no reseeding wipe)

Expected: create/edit/delete survive restart; empty-table seed does not overwrite existing data.

Actual:
- Create survived restart — Pass
- Edit survived restart — Pass
- Delete survived restart — Pass
- Samples retained — Pass

Notes: Full click-through Add/Edit/Delete in the UI was not automated. End-to-end UI persistence should still be spot-checked manually in Stage 10 if desired. Seed write on first launch proved the live `TaskManager` → repository → SQLite create path.

### 12. Defects found
- DEF-005, DEF-006, DEF-007 (see defect table) — all fixed during Stage 9

### 13. Fixes made
- Removed incompatible `react-native-fs`
- Added `LocalAppPaths` for LocalFolder path
- Added postinstall PlatformToolset patch for turbo-sqlite
- Cleaned stale autolink/solution references
- Made TaskManager async + repository-backed; updated Jest suites/mocks accordingly

### 14. Risks and contingencies
- Native SQLite package Windows support is experimental
- Toolset patch required after every fresh install (`postinstall`)
- Database migration risk for future schema changes
- Corrupt local database recovery not implemented
- Async loading failures possible if native modules fail
- Jest uses InMemoryTaskRepository / mocks (no real native SQLite in CI)
- Full TC_REPO suite deferred to Stage 10
- `run-windows` redeploy can wipe package LocalState (known RNW behavior)

### 15. Pass/fail criteria
- Pass: tasks are saved, loaded, updated, and deleted correctly and survive process restart
- Fail: data lost, unexpected field changes, unresolved init errors, or app cannot initialize DB

### 16. Overall stage status
- Stage 9 complete; repository unit tests followed in Stage 10
- Automated regression green; Windows app builds and launches with SQLite

### 17. Features not yet tested
> Historical Stage 9 snapshot. Repository automated suite completed in Stage 10.

- Full repository unit/integration suite (done in Stage 10)
- Migration behavior
- Large datasets
- Corrupt database recovery
- Full UI click-path persistence checklist (partial/manual helper used)
- Timer / Goals / Statistics / Settings persistence / notifications / final integration

---

## Stage 10 - TaskRepository Tests

### 1. Stage
- Stage 10

### 2. Feature tested
- `SqliteTaskRepository`
- `DatabaseService` interaction via injected `IDatabaseService`
- SQLite row mapping into `Task` / `DeletedTask`
- Parameterized SQL
- Soft-delete trash persistence

### 3. Test scope
- Initialization / idempotent schema
- Create / read all / read by ID / update
- Soft delete (`moveTaskToTrash`) instead of hard delete
- Label persistence (comma-separated string storage)
- Empty results
- Error wrapping / missing-update failure
- Parameterized queries / SQL injection-as-text
- Regression checks for Stage 9 defects where automatable

### 4. Test objectives
- Verify repository correctness independently from UI
- Confirm SQL values are parameterized
- Confirm rows map correctly into typed Task objects
- Confirm Stage 9 defect fixes remain effective where testable
- Confirm prior suites continue to pass

### 5. Actual repository API tested
Public methods exercised:
- `initialize`
- `createTask`
- `getAllTasks`
- `getTaskById`
- `updateTask`
- `moveTaskToTrash` / `getDeletedTasks`
- `countTasks`

Also covered indirectly:
- `DatabaseService.getDatabasePath` fallback (REG_01)

### 6. Database schema tested
| Item | Detail |
|---|---|
| Tables | `tasks`, `deleted_tasks` |
| Primary key | `id` TEXT (application-generated, not SQLite AUTOINCREMENT) |
| Fields | title, description, priority, status, due_date, estimated_duration_minutes, labels, parent_task_id |
| Trash timestamp | `deleted_at` ISO text on `deleted_tasks` only |
| Labels | Option A comma-separated TEXT matching `Task.labels` (not arrays on the model) |
| createdAt / completedAt | Not present in current model |

### 7. Stage 9 defects

| Defect ID | Description | Severity | Steps | Root cause | Fix | Status | Regression |
|---|---|---|---|---|---|---|---|
| D_STAGE9_01 (DEF-005) | `@dr.pogodin/react-native-fs` failed with `unknown command 'codegen-windows'` | Major | Install package; `run-windows` | Incompatible native FS package for current RNW | Removed package; added `LocalAppPaths` + JS fallback path `.` | Fixed | TC_TASK_REPO_REG_01 (path fallback without LocalAppPaths) |
| D_STAGE9_02 (DEF-006) | turbo-sqlite Windows project PlatformToolset `v143` vs app `v145` (MSB8020) | Major | Install turbo-sqlite; build Windows | Upstream vcxproj toolset mismatch | `scripts/patch-turbo-sqlite-windows.js` + `postinstall` | Fixed | Manual / postinstall only (native MSBuild, not Jest) |
| D_STAGE9_03 (DEF-007) | `LocalAppPaths.h` `u8string` → `std::string` compile error | Minor | Build after LocalAppPaths added | C++20 `u8string` type mismatch | `winrt::to_string(dir.wstring())` | Fixed | Manual native compile (not Jest) |

### 8. Files tested / involved
- `src/repositories/SqliteTaskRepository.ts`
- `src/repositories/ITaskRepository.ts`
- `src/services/DatabaseService.ts`
- `src/types/task.ts`
- `src/testing/FakeDatabaseService.ts`
- `__tests__/TaskRepository.test.ts`

### 9. Testing tools
- Jest + TypeScript
- React Native for Windows Jest config (`jest.config.windows.js`)
- Option C: `FakeDatabaseService` injected into `SqliteTaskRepository` (records SQL/params + in-memory tables)

### 10. Exact command
```
npm run test:windows -- --verbose > test-results.txt 2>&1
```

### 11. Test cases added

| ID | Name |
|---|---|
| TC_TASK_REPO_01 | Initializes the database and creates the task table safely |
| TC_TASK_REPO_02 | Creates a task using parameterized values |
| TC_TASK_REPO_03 | Retrieves all tasks and maps database rows into typed Task objects |
| TC_TASK_REPO_04 | Retrieves the correct task by task ID |
| TC_TASK_REPO_05 | Updates an existing task while preserving its task ID |
| TC_TASK_REPO_06 | Persists task labels correctly, including up to 10 labels |
| TC_TASK_REPO_07 | Soft-deletes via moveTaskToTrash without removing unrelated tasks |
| TC_TASK_REPO_08 | Returns an empty collection when no task rows exist |
| TC_TASK_REPO_09 | Propagates/wraps database errors |
| TC_TASK_REPO_10 | Passes values as SQL parameters (hostile title not concatenated) |
| TC_TASK_REPO_REG_01 | Database path fallback without LocalAppPaths (DEF-005) |
| TC_TASK_REPO_REG_02 | Re-init does not wipe existing rows |
| TC_TASK_REPO_REG_03 | Missing-task update fails without altering other rows |

### 12. Expected outcomes
- Schema uses `CREATE TABLE IF NOT EXISTS`; re-init keeps data
- Creates/updates bind `?` parameters including SQL-like titles
- Rows map to typed Task fields; labels remain ordered comma-separated strings
- Soft-delete moves only selected task to trash with `deletedAt`
- Empty DB returns `[]`
- Execute failures surface useful errors; missing update throws

### 13. Actual outcomes
- All new TC_TASK_REPO / REG cases passed
- Prior suites remained passed

### 14. Pass/fail status
All TC_TASK_REPO_01–10 and TC_TASK_REPO_REG_01–03: **Pass**

### 15. Defects discovered during Stage 10
| Defect ID | Description | Severity | Steps | Status | Fix |
|---|---|---|---|---|---|
| D_STAGE10_01 | `react-native.config.js` set `project.ios` / `project.android` to `null`, causing CLI config validation error (`"project.ios" must be of type object`) and blocking `run-windows`. | Major | 1. Set ios/android to `null` 2. Run `npx react-native run-windows` | Fixed | Use empty objects `{}` instead of `null`. |
| D_STAGE10_02 | Jest treated `__tests__/helpers/FakeDatabaseService.ts` as a test suite and failed suite discovery. | Minor | Place helper under `__tests__/` without `.test` suffix; RN Jest still collects it | Fixed | Moved helper to `src/testing/FakeDatabaseService.ts`. |

No new unresolved product/repository defects remain.

### 16. Final totals
| Metric | Value |
|---|---|
| Test suites | 7 passed, 7 total |
| Total tests | 55 |
| Passed | 55 |
| Failed | 0 |
| Snapshots | 0 |

### 17. Risks and contingencies
- Jest uses a fake DatabaseService, not the native turbo-sqlite engine
- Native Windows persistence still relies on Stage 9 manual/file checks and occasional UI spot-checks
- Future schema migrations need dedicated tests
- Corrupt DB recovery untested
- Large dataset performance untested
- DEF-006 / DEF-007 remain manual native regressions only

### 18. Pass/fail criteria
- Pass: repository returns correct typed data, uses parameterized SQL, and surfaces errors
- Fail: lost/wrong data, unsafe SQL concatenation, or silent error swallow

### 19. Overall stage status
- Stage 10 complete and stable; ready for Stage 11 Timer UI

### 20. Features not yet tested
- Timer UI / TimerService / SessionManager
- Goals / Statistics / Settings persistence
- Native notifications / system tray
- Final integration

### Label note (actual code)
`Task.labels` is a **string** (comma-separated). Validation produces `string[]` then TaskManager joins for storage. Repository tests verify string round-trip and order, not array-on-model behavior.
