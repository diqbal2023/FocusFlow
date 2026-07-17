# FocusFlow Testing Notes

Working notes for the IEEE Software Test Document.
**Update this file whenever new automated tests are added or results change.**

| Field | Value |
|---|---|
| Last updated | 2026-07-16 (Stages 1–15 integrated; Goals + GoalManager) |
| Current stage covered | Stages 1–15 (Goals UI, GoalManager, direct goal tests) |
| Source test files | `__tests__/App.test.tsx`, `__tests__/SharedComponents.test.tsx`, `__tests__/TasksScreen.test.tsx`, `__tests__/TaskValidation.test.ts`, `__tests__/TaskManager.test.ts`, `__tests__/TaskManager.trash.test.ts`, `__tests__/TaskRepository.test.ts`, `__tests__/TimerService.test.ts`, `__tests__/SessionManager.test.ts`, `__tests__/GoalManager.test.ts` |
| Primary command | `npm run test:windows -- --verbose > test-results.txt 2>&1` |
| Alternate command | `npm test` |
| Latest result | 10 suites / 82 tests passed / 0 failed / 0 snapshots |
| Results log | `test-results.txt` (project root) |

## How to update this file

1. Add or change tests under `__tests__/`.
2. Run `npm run test:windows -- --verbose > test-results.txt 2>&1`.
3. Update sections **1–6** below to match reality only (integrated format — do not add separate per-stage appendix sections; do not invent tests).
4. Update the header table (**Last updated**, **Latest result**, source files, stage covered).
5. Add new rows to the test case / results tables and procedure groups as needed.

### Stage & sprint coverage

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
| 11 | Focus Session / Timer UI | Complete / passing |
| 12 | TimerService + SessionManager | Complete / passing |
| 13 | Timer / SessionManager Jest tests + long-break counter fix | Complete / passing |
| 14 | Goals model, GoalManager integration, redesigned GoalsScreen | Complete / passing |
| 15 | GoalManager direct unit tests (TC_GOAL_01–10) | Complete / passing |
| 16+ | Statistics, settings, Windows features, final integration | Not started |

---

## 1. TEST PLAN INFORMATION

- **Test Scope**
  - Automated Jest UI and unit tests for FocusFlow React Native for Windows (TypeScript)
  - Covers: navigation shell, shared UI components, TasksScreen interactions, task validation, TaskManager business logic (including Recently Deleted), SqliteTaskRepository persistence behavior (via injected fake `DatabaseService`), Focus Session / TimerService / SessionManager, and GoalManager daily/weekly target/progress calculations
  - Does not cover as automated Jest: native turbo-sqlite engine I/O, Windows packaging/deploy, GoalsScreen visual layout, Statistics/Settings, notifications, export, authentication, cloud services

- **Test Objectives**
  - Verify default screen and sidebar navigation between 5 sections
  - Verify shared component interaction behavior (button press/disabled, input label/error, page header text)
  - Verify TasksScreen create/edit/status/trash/restore/permanent-delete flows against TaskManager + repository
  - Confirm invalid task input is rejected by `validateTaskInput` and through the TasksScreen save path
  - Confirm TaskManager validation, label limits, status advancement, soft-delete, and immutability behavior
  - Confirm SqliteTaskRepository initialize/CRUD/trash mapping uses parameterized SQL and typed Task rows
  - Confirm TimerService timestamp countdown (start/pause/resume/reset/skip/accuracy)
  - Confirm SessionManager Pomodoro transitions, counters, long-break cycle, and skip/interrupt rules
  - Confirm GoalManager defaults, task/session/minute percentages, daily/weekly completion, remaining amounts, formatted progress, and reset behavior
  - Confirm prior application suites remain green after Stages 14–15 work

- **Test Items**
  - `App.tsx` + `Sidebar`
  - `AppButton`, `AppInput`, `PageHeader`
  - `TasksScreen` (async TaskManager + repository-backed state)
  - `FocusScreen` (presentation wired to SessionManager)
  - `src/utils/taskValidation.ts` (`validateTaskInput`, `sanitizeLabels`)
  - `src/types/task.ts`
  - `src/managers/TaskManager.ts`
  - `src/managers/SessionManager.ts`
  - `src/managers/GoalManager.ts`
  - `src/models/Goal.ts`
  - `src/screens/GoalsScreen.tsx`
  - `src/services/TimerService.ts`
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
  - Focus Session timer controls and Pomodoro mode transitions (work / short break / long break)
  - Completed-work and break counters; long-break after 4 completed work sessions; cycle reset after long break
  - Skip does not count as completed work (documented decision)
  - Daily/weekly goal defaults and editable targets
  - Strongly typed task/session/minute progress, capped percentages, overall completion, status, summaries, completion messages, and target-preserving reset
  - Goal progress adapter reads actual stored completed tasks and current-runtime completed focus sessions

- **Features Not Yet Tested**
  - Native turbo-sqlite engine behavior inside Jest (suite uses fake/in-memory doubles)
  - Full manual UI click-path persistence checklist on every release
  - Schema migrations / corrupt-database recovery / large-dataset performance
  - Parent/subtask completion business rules (not implemented)
  - Session persistence / SessionRepository
  - Goal target/reset persistence (deferred to Settings)
  - Calendar-accurate daily/weekly goal history (task completion timestamps and persisted session records do not yet exist)
  - Statistics / Settings persistence
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
  - Jest (`^29.6.3`) including fake timers / system time for timer suites
  - `@testing-library/react-native` (`^13.3.3`) for UI/navigation/TasksScreen suites
  - Direct unit tests for validation, TaskManager, SqliteTaskRepository, TimerService, SessionManager
  - `InMemoryTaskRepository` for TaskManager / UI Jest isolation
  - `FakeDatabaseService` for repository SQL/parameter and mapping tests
  - `fireEvent` / `waitFor` / `findBy*` for async TasksScreen tests

- **Risks and Contingencies**
  - Jest does not exercise the native turbo-sqlite binary; Windows restart persistence still needs occasional manual spot-checks
  - `run-windows` redeploy can wipe package LocalState and wipe saved tasks
  - Future schema changes need migration tests and repository suite updates
  - Native deploy can fail if FocusFlow locks DLLs (see DEF-004)
  - PlatformToolset patch for turbo-sqlite (`postinstall`) must remain after reinstalls (DEF-006)
  - Focus Session state is not persisted across app restart
  - Goal targets and reset baselines are in memory and return to defaults after app restart
  - Existing Task/Session APIs provide no completion timestamps; daily and weekly cards currently use the same available real totals, with independent targets/reset baselines
  - Full 25-minute UI wait for natural work completion is not part of routine manual checks; Jest covers natural completion / long-break paths with timestamps
  - If `npm test` preset breaks, use `npm run test:windows`

- **Pass/Fail Criteria**
  - **Pass:** actual behavior matches expected behavior and the Jest assertion succeeds; suite exits 0
  - **Fail:** behavior differs from expected result, an assertion fails, or the test suite cannot execute
  - **Stage gate (current):** Stages 1–15 green (`Failed Tests: 0`); Stage 16 (Statistics) is next

---

## 2. TEST CASE INFORMATION

Primary case catalog for **Stages 1–15** is below (single integrated table). All cases are **Pass** in the latest `test-results.txt` run (**82/82**).

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
| TC_TASK_MGR_01 | Creates a valid task and adds it to the collection | Valid `TaskFormData` via `createTask` | `success: true`; task prepended Pending | Run `TaskManager.test.ts` | Task created | Pass |
| TC_TASK_MGR_02 | Rejects invalid task input | Empty title via `createTask` | `success: false`; validation errors | Run `TaskManager.test.ts` | Rejected | Pass |
| TC_TASK_MGR_03 | Updates task preserving ID | `updateTask` with new title | Same `id`; fields updated | Run `TaskManager.test.ts` | ID preserved | Pass |
| TC_TASK_MGR_04 | Preserves fields during edit | Edit with status/priority/due/labels | Non-status fields updated; status preserved | Run `TaskManager.test.ts` | Fields preserved | Pass |
| TC_TASK_MGR_05 | Preserves up to 10 labels | Create/update with 10 labels | Comma-separated string stored | Run `TaskManager.test.ts` | 10 labels stored | Pass |
| TC_TASK_MGR_06 | Rejects more than 10 labels | 11 labels after sanitize | Labels validation error | Run `TaskManager.test.ts` | Rejected | Pass |
| TC_TASK_MGR_07 | Completes task without side effects | `completeTask` on In Progress | Status Completed only | Run `TaskManager.test.ts` | Completed | Pass |
| TC_TASK_MGR_08 | Soft-deletes selected task only | `moveToTrash` on one task | Only selected task in trash | Run `TaskManager.test.ts` | Soft-deleted | Pass |
| TC_TASK_MGR_09 | Returns task by ID | `getTaskById` | Matching task or undefined | Run `TaskManager.test.ts` | Correct lookup | Pass |
| TC_TASK_MGR_10 | Does not mutate original collection | Create/update/trash | New array returned; original unchanged | Run `TaskManager.test.ts` | Immutability | Pass |
| TC_TASK_TRASH_01 | moveToTrash stamps deletedAt | Soft-delete active task | Removed from active; `deletedAt` set | Run `TaskManager.trash.test.ts` | In trash | Pass |
| TC_TASK_TRASH_02 | restoreTask returns task to active | Restore soft-deleted task | Task back in active list | Run `TaskManager.trash.test.ts` | Restored | Pass |
| TC_TASK_TRASH_03 | purgeExpiredDeletedTasks removes old items | Trash older than retention | Expired items removed | Run `TaskManager.trash.test.ts` | Purged | Pass |
| TC_TASK_TRASH_04 | getDaysRemainingInTrash reports days | Deleted task with known date | Whole days remaining | Run `TaskManager.trash.test.ts` | Days reported | Pass |
| TC_TASK_TRASH_05 | permanentlyDeleteTask removes trash item | Permanent delete before expiry | Gone from trash | Run `TaskManager.trash.test.ts` | Removed | Pass |
| TC_TASK_REPO_01 | Initializes DB and creates tables safely | `initialize` twice | `CREATE TABLE IF NOT EXISTS`; idempotent | Run `TaskRepository.test.ts` | Schema created | Pass |
| TC_TASK_REPO_02 | Creates task with parameterized SQL | `createTask` | `?` placeholders; row inserted | Run `TaskRepository.test.ts` | Created | Pass |
| TC_TASK_REPO_03 | getAllTasks maps rows to Task | Seed rows | Typed Task objects | Run `TaskRepository.test.ts` | Mapped | Pass |
| TC_TASK_REPO_04 | getTaskById returns correct task | Lookup by id | Matching task | Run `TaskRepository.test.ts` | Found | Pass |
| TC_TASK_REPO_05 | updateTask preserves id | Update fields | Same id; fields changed | Run `TaskRepository.test.ts` | Updated | Pass |
| TC_TASK_REPO_06 | Persists labels (≤10) | Task with label string | Comma-separated round-trip | Run `TaskRepository.test.ts` | Labels persisted | Pass |
| TC_TASK_REPO_07 | moveTaskToTrash soft-deletes only selected | Trash one of two tasks | One in trash; other active | Run `TaskRepository.test.ts` | Soft-deleted | Pass |
| TC_TASK_REPO_08 | Empty DB returns [] | No rows | Empty array | Run `TaskRepository.test.ts` | `[]` | Pass |
| TC_TASK_REPO_09 | Propagates database errors | Failing execute | Useful error thrown | Run `TaskRepository.test.ts` | Error surfaced | Pass |
| TC_TASK_REPO_10 | Parameterized SQL (no concatenation) | Hostile title in create | Bound as parameter | Run `TaskRepository.test.ts` | Safe SQL | Pass |
| TC_TASK_REPO_REG_01 | DB path fallback without LocalAppPaths | `getDatabasePath` without native module | Fallback path (DEF-005) | Run `TaskRepository.test.ts` | Fallback works | Pass |
| TC_TASK_REPO_REG_02 | Re-init does not wipe rows | `initialize` with existing data | Rows retained | Run `TaskRepository.test.ts` | Data kept | Pass |
| TC_TASK_REPO_REG_03 | Missing update fails cleanly | `updateTask` unknown id | Throws; other rows unchanged | Run `TaskRepository.test.ts` | Safe failure | Pass |
| TC_TIMER_01 | Timer starts correctly | `configure` + `start` | Running; full remaining time | Run `TimerService.test.ts` with fake timers | Started | Pass |
| TC_TIMER_02 | Pause freezes remaining time | Start; pause; advance clock | Remaining unchanged while paused | Run `TimerService.test.ts` | Frozen | Pass |
| TC_TIMER_03 | Resume continues countdown | Pause then resume | Countdown continues from paused value | Run `TimerService.test.ts` | Resumed | Pass |
| TC_TIMER_04 | Reset restores initial duration | Start; tick; reset | Idle; full duration restored | Run `TimerService.test.ts` | Reset | Pass |
| TC_TIMER_05 | Skip clears current segment | Start; skip | Idle; remaining 0 | Run `TimerService.test.ts` | Skipped | Pass |
| TC_TIMER_06 | Work finishes → short break | Complete work via tick at duration | Mode shortBreak; work count +1 | Run `SessionManager.test.ts` | Short break | Pass |
| TC_TIMER_07 | 4th work → long break | Complete 4 work sessions | Mode longBreak; 15m duration | Run `SessionManager.test.ts` | Long break | Pass |
| TC_TIMER_08 | Timestamp accuracy under delay | Single tick after 7.5s | Remaining = duration − elapsed | Run `TimerService.test.ts` | Accurate | Pass |
| TC_SESSION_01 | Tracks completed work sessions | Two natural work completions | `completedWorkSessions` = 2 | Run `SessionManager.test.ts` | Count correct | Pass |
| TC_SESSION_02 | Selected task stays associated | selectTask; start; skip | Task id/title unchanged | Run `SessionManager.test.ts` | Task kept | Pass |
| TC_SESSION_03 | Interrupted sessions recorded | Reset/skip mid-progress | `interruptedSessions` increments | Run `SessionManager.test.ts` | Interrupted | Pass |
| TC_SESSION_04 | Default Pomodoro durations | New SessionManager | 25/5/15 min; starts work | Run `SessionManager.test.ts` | Defaults OK | Pass |
| TC_SESSION_05 | Skipped work not completed | Start work; skip | Work count stays 0 | Run `SessionManager.test.ts` | Not counted | Pass |
| TC_SESSION_06 | Pause/reset not completed | Start; pause; reset | Work count stays 0 | Run `SessionManager.test.ts` | Not counted | Pass |
| TC_SESSION_07 | Long break finish resets cycle | Complete long break | Work mode; cycle 0; break +1 | Run `SessionManager.test.ts` | Cycle reset | Pass |
| TC_SESSION_08 | No duplicate complete at zero | Multiple ticks at end | Single completion | Run `SessionManager.test.ts` | Once only | Pass |
| TC_SESSION_09 | Long break pause/resume/reset/skip | Controls on long break | All controls work; skip → work | Run `SessionManager.test.ts` | Controls OK | Pass |
| TC_GOAL_01 | Verify daily defaults | New GoalManager | 5 tasks, 4 sessions, 120 minutes | Instantiate; read daily targets | Defaults matched | Pass |
| TC_GOAL_02 | Verify weekly defaults | New GoalManager | 30 tasks, 20 sessions, 600 minutes | Instantiate; read weekly targets | Defaults matched | Pass |
| TC_GOAL_03 | Calculate task progress | 2 completed tasks | 2/5, 3 remaining, 40%, In progress | Synchronize totals; inspect daily task metric | Values and formatting matched | Pass |
| TC_GOAL_04 | Calculate session/minute progress | 3 sessions, 75 minutes | 75% sessions; 63% minutes | Synchronize totals; inspect daily metrics | Values matched | Pass |
| TC_GOAL_05 | Calculate weekly progress | 15 tasks, 10 sessions, 300 minutes | 50% each and overall | Synchronize totals; inspect weekly result | 50% overall | Pass |
| TC_GOAL_06 | Complete all daily targets | 5 tasks, 4 sessions, 120 minutes | Complete, 100%, completion message | Synchronize exact defaults | Daily complete | Pass |
| TC_GOAL_07 | Keep period incomplete with one missing target | 5 tasks, 4 sessions, 119 minutes | In progress; no completion message | Synchronize totals; inspect daily result | Incomplete as expected | Pass |
| TC_GOAL_08 | Complete configured weekly targets | Targets/progress 2, 1, 25 | Weekly Complete + message | Set targets; synchronize totals | Weekly complete | Pass |
| TC_GOAL_09 | Reset periods while preserving targets | Custom targets + nonzero progress | Selected period zeroed; targets retained | Reset daily, then weekly; inspect both | Progress reset; targets retained | Pass |
| TC_GOAL_10 | Cap and average percentages | 50%, 50%, over-target minutes | Metrics 50/50/100; overall 67% | Set targets; synchronize totals | 67% overall | Pass |

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
- **Post-Execution Actions:** Record pass/fail in Section 4

### TP-TASK-REPO — SqliteTaskRepository (Stages 9–10)

- **Procedure ID:** TP-TASK-REPO
- **Description:** Verify repository initialize/CRUD/trash mapping and parameterized SQL via fake DatabaseService
- **Test Environment:** Jest; `SqliteTaskRepository` + `FakeDatabaseService`
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suite `SqliteTaskRepository` executes TC_TASK_REPO_01–10 and TC_TASK_REPO_REG_01–03
- **Post-Execution Actions:** Record pass/fail in Section 4

### TP-FOCUS — Focus Session / Timer (Stages 11–13)

- **Procedure ID:** TP-FOCUS
- **Description:** Verify TimerService timestamp countdown and SessionManager Pomodoro flow (work / short break / long break, counters, skip rules)
- **Test Environment:** Jest with `jest.useFakeTimers()` / `jest.setSystemTime()`; optional manual `npx react-native run-windows` for UI spot-check
- **Steps to Execute:**
  1. Run preferred command
  2. Confirm suites `TimerService` (TC_TIMER_01–05, TC_TIMER_08) and `SessionManager` (TC_TIMER_06–07, TC_SESSION_01–09)
  3. For manual UI: open Focus Session; verify Start/Pause/Resume/Skip/Reset and countdown updates
- **Post-Execution Actions:** Record pass/fail; note that Skip does not increment completed-work counters (by design)

### TP-GOALS — Goals / GoalManager (Stages 14–15)

- **Procedure ID:** TP-GOALS
- **Description:** Verify goal defaults, progress calculations, completion rules, formatted output, and resets
- **Test Environment:** Jest direct unit tests; no snapshots; optional Windows UI spot-check
- **Steps to Execute:**
  1. Run the preferred full command
  2. Confirm `GoalManager.test.ts` executes TC_GOAL_01–10
  3. Run `npx tsc --noEmit`
  4. For manual UI: open Goals, review daily/weekly cards and bars, edit targets, complete available task/session activity, and select Reset Goals
- **Post-Execution Actions:** Record actual automated/manual results and known data-history limitations

---

## 4. TEST RESULTS INFORMATION

Latest full automated run (`test-results.txt`): **10 suites / 82 tests passed / 0 failed / 0 snapshots**.

| Test Case ID | Description | Result | Test Log (brief) | Defect ID |
|---|---|---|---|---|
| TC_UI_01–05 | Shared UI components | Pass | All assertions green | N/A |
| TC_NAV_01–06 | Navigation shell | Pass | All assertions green | N/A |
| TC_TASK_UI_01–07 | Tasks screen interactions | Pass | Async load + trash flows | N/A |
| TC_TASK_FORM_01 | Invalid save blocked | Pass | Validation error shown | N/A |
| TC_TASK_VAL_01–08 | Task validation module | Pass | All rules enforced | N/A |
| TC_TASK_MGR_01–10 | TaskManager unit tests | Pass | Business rules verified | N/A |
| TC_TASK_TRASH_01–05 | TaskManager trash API | Pass | Soft-delete / restore / purge | N/A |
| TC_TASK_REPO_01–10 | SqliteTaskRepository CRUD | Pass | Parameterized SQL + mapping | N/A |
| TC_TASK_REPO_REG_01–03 | Repository regressions | Pass | Path fallback; re-init; missing update | N/A |
| TC_TIMER_01–05, TC_TIMER_08 | TimerService | Pass | Timestamp countdown | N/A |
| TC_TIMER_06–07, TC_SESSION_01–09 | SessionManager / Pomodoro | Pass | Modes, counters, long-break cycle | N/A |
| TC_GOAL_01–10 | GoalManager daily/weekly goals | Pass | Defaults, progress, completion, reset, percentages | N/A |

---

## 5. DEFECT TRACKING INFORMATION

Latest automated product test run: **0 failed** (**10 suites / 82 tests passed**).  
Stages 1–15 complete. Product defects from Stages 9–10 are fixed (DEF-005–008). DEF-004 remains an open deploy workaround when the app locks DLLs.

No defects were discovered during Stages 14–15.

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
| DEF-008 | `react-native.config.js` used `project.ios: null` / `project.android: null`, rejected by RN CLI (`must be of type object`), blocking Windows runs after Windows-only cleanup. | Major | 1. Set ios/android to null in react-native.config.js 2. Run `npx react-native run-windows` | Fixed | Use empty objects `{}` for ios/android. |
| D_STAGE10_01 | `react-native.config.js` null ios/android blocked `run-windows` (same as DEF-008). | Major | Set ios/android to `null`; run `run-windows` | Fixed | Use `{}` instead of `null`. |
| D_STAGE10_02 | Jest collected `__tests__/helpers/FakeDatabaseService.ts` as a test suite. | Minor | Place helper under `__tests__/` without `.test` suffix | Fixed | Moved to `src/testing/FakeDatabaseService.ts`. |

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
| Total Test Suites | 10 |
| Total Test Cases | 82 |
| Passed | 82 |
| Failed | 0 |
| Pass Percentage | 100% |
| Snapshots | 0 |
| Overall System Status (tested scope) | Stages 1–15 green; Goals / GoalManager covered; Stage 16 (Statistics) next |

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
| TimerService | `__tests__/TimerService.test.ts` | TC_TIMER_01–05, TC_TIMER_08 |
| SessionManager | `__tests__/SessionManager.test.ts` | TC_TIMER_06–07, TC_SESSION_01–09 |
| GoalManager | `__tests__/GoalManager.test.ts` | TC_GOAL_01–10 |

### Implementation milestones (Stages 1–15)

| Sprint | Stages | Delivered | Key test IDs |
|---|---|---|---|
| Shell & UI foundation | 1–4 | App shell, sidebar nav, shared components | TC_NAV_*, TC_UI_* |
| Task presentation & validation | 5–6 | TasksScreen UI, `taskValidation` | TC_TASK_UI_*, TC_TASK_FORM_*, TC_TASK_VAL_* |
| Task business logic | 7–8 | `TaskManager`, unit + trash tests | TC_TASK_MGR_*, TC_TASK_TRASH_* |
| Task persistence | 9–10 | SQLite, `SqliteTaskRepository`, repo tests | TC_TASK_REPO_*, TC_TASK_REPO_REG_* |
| Focus Session & timer | 11–13 | FocusScreen, `TimerService`, `SessionManager`, long-break cycle fix | TC_TIMER_*, TC_SESSION_* |
| Goals | 14–15 | Goal model, GoalManager, redesigned GoalsScreen, direct tests | TC_GOAL_* |

### Key implementation notes (integrated)

**Tasks (Stages 5–10)**
- `Task.labels` is a **comma-separated string** on the model; validation sanitizes to `string[]` then TaskManager joins for storage.
- Delete is soft-delete (`moveToTrash`) with Recently Deleted restore, permanent delete, and 30-day purge.
- Status flow: Pending → In Progress → Completed.
- SQLite: `react-native-turbo-sqlite` 0.6.2; DB at `{LocalFolder}/focusflow.db`; parameterized `?` SQL only.
- Jest uses `InMemoryTaskRepository` / `FakeDatabaseService` — not the native turbo-sqlite binary.

**Focus Session (Stages 11–13)**
- Pomodoro cycle: Work1 → Short → Work2 → Short → Work3 → Short → Work4 → Long → Work (next cycle).
- Durations: work 25m, short break 5m, long break 15m.
- `TimerService` uses wall-clock timestamps (`endAtMs`); `SessionManager` owns Pomodoro flow and counters.
- **Skipped work is not completed** — Skip does not increment `completedWorkSessions` or cycle progress; only natural finish (timer → zero) counts.
- Cycle counter stays at `4/4` during long break; resets to `0` after long break completes.
- Session state is **not** persisted (no `SessionRepository` yet).
- `FocusScreen` is presentational only; business logic stays in managers/services.

**Goals (Stages 14–15)**
- Defaults: daily 5 tasks / 4 sessions / 120 minutes; weekly 30 / 20 / 600.
- `GoalManager` owns target validation, progress synchronization, metric/overall percentages, status/summary formatting, completion rules, and reset baselines.
- `GoalsScreen` uses `PageHeader`, shared cards/inputs/buttons/tokens, polls GoalManager for automatic updates, and contains display/form interaction only.
- Progress is not fabricated: task totals come from active stored tasks marked Completed; session totals come from the shared runtime `SessionManager`; focus minutes use the configured 25-minute completed-work duration.
- Task completion timestamps and persisted session records do not exist, so calendar-accurate daily-versus-weekly historical filtering is not possible in this stage. Daily/weekly targets and reset baselines remain independent.
- Goal persistence is deferred to Stage 18 Settings rather than adding a standalone repository.

### Manual verification summary

| Area | Method | Result |
|---|---|---|
| SQLite persistence (Stage 9) | Process restart + direct DB insert/update/delete | Create/edit/delete survived restart — Pass |
| Focus Session UI (Stages 11–13) | `npx react-native run-windows` + UI Automation | Start/Pause/Resume/Skip/Reset — Pass; countdown updates — Pass |
| Long break full UI cycle | Not run at real 25m×4 duration | Covered by Jest TC_TIMER_07, TC_SESSION_07 |
| Goals UI (Stages 14–15) | `npx react-native run-windows` | Build, deploy, and app start — Pass after closing the existing FocusFlow process that held `ReactNativeTurboSqlite.dll` (known DEF-004 pattern). Interactive visual/click verification was not available in this agent environment; daily/weekly calculations, completion messages, percentages, and reset semantics are covered by TC_GOAL_01–10. |

Deploy note: close running FocusFlow before redeploy if DLL file lock occurs (DEF-004).
Stage 14–15 launch note: the first overlapping native compile reported C1041 on `vc145.pdb`; a single retry built successfully. Deployment then encountered the known DLL lock, `tasklist /m ReactNativeTurboSqlite.dll` identified `FocusFlow.exe`, and closing only that process allowed the final build/deploy/start command to exit 0.

### Features not yet tested

- Statistics / StatisticsEngine
- Settings persistence
- Session persistence / SessionRepository
- Calendar-accurate goal history and goal target persistence
- Notifications / system tray
- Schema migrations / corrupt DB recovery / large datasets
- Final integration

