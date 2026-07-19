# FocusFlow Testing Notes

Working notes for the IEEE Software Test Document.
**Update this file whenever new automated tests are added or results change.**

| Field | Value |
|---|---|
| Last updated | 2026-07-18 (Stages 1–21 complete; final integration and release preparation) |
| Current stage covered | Stages 1–21 (Stage 21 complete: onboarding wizard, E2E integration, requirements checklist, release readiness) |
| Source test files | Existing Stage 1–20 suites plus `__tests__/Onboarding.test.tsx` and `__tests__/Integration.stage21.test.ts` |
| Primary command | `npm run test:windows -- --verbose > test-results.txt 2>&1` |
| Alternate command | `npm test` |
| Latest result | 15 suites / 116 tests passed / 0 failed / 0 snapshots |
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
| 16 | Statistics dashboard + runtime completion histories | Complete / passing |
| 17 | StatisticsEngine direct unit tests (TC_STATS_01–12) | Complete / passing |
| 18 | Settings model, SQLite repository, manager, theme, timer/goals integration, full form | Complete / passing |
| 19 | Settings manager/repository/UI automation (TC_SETTINGS_*) | Complete / passing |
| 20 | Windows release preparation, x64 Release/MSIX/signing/docs/signed install | Complete / passing |
| 21 | Final integration, onboarding wizard, requirements checklist, release readiness | Complete / passing |

---

## 1. TEST PLAN INFORMATION

- **Test Scope**
  - Automated Jest UI and unit tests for FocusFlow React Native for Windows (TypeScript)
  - Covers prior scope plus settings defaults, strict validation, persistence abstraction, manager publication/application, reset safety, configurable timer transitions, zero goals, and SettingsScreen save behavior
  - Stage 20 covers the Win32/full-trust RNW Composition C++ Release build, Desktop Bridge `.wapproj`, x64 MSIX generation/signing, embedded Hermes/SQLite inspection, data-preserving Release-layout launch/reopen, and release documentation
  - Does not cover as automated Jest: native turbo-sqlite engine I/O, visual layout, native notifications, export, authentication, cloud services

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
  - Confirm dated runtime task/session completion records are cloned, exact, and not emitted by skip/reset
  - Confirm StatisticsEngine filtering, totals, 40/40/20 score, category boundaries/messages, Monday weeks, 90-day history, no-data behavior, and Fair-or-better streaks
  - Confirm prior application suites remain green after Stages 16–17 work
  - Confirm settings persist before publication, merge partial stored JSON, reject corruption, apply to timer/goals/theme, and reset preferences without resetting productivity data
  - Confirm the Stage 20 release process is reproducible, produces a signed x64 non-bundle MSIX, embeds the production bundle and native SQLite, preserves the existing Jest baseline, and records installation limitations without claiming unobserved behavior
  - Confirm Stage 21 first-launch onboarding shows only when incomplete, saves preferences through SettingsManager, initializes GoalManager targets, sets `onboardingCompleted`, and that the manager-level end-to-end workflow covers tasks/focus/long-break/goals/statistics/settings persistence

- **Test Items**
  - `App.tsx` + `Sidebar`
  - `src/screens/OnboardingScreen.tsx`
  - `AppButton`, `AppInput`, `PageHeader`
  - `TasksScreen` (async TaskManager + repository-backed state)
  - `FocusScreen` (presentation wired to SessionManager)
  - `src/utils/taskValidation.ts` (`validateTaskInput`, `sanitizeLabels`)
  - `src/types/task.ts`
  - `src/managers/TaskManager.ts`
  - `src/managers/SessionManager.ts`
  - `src/managers/GoalManager.ts`
  - `src/managers/StatisticsEngine.ts`
  - `src/models/Goal.ts`
  - `src/models/DailyProductivity.ts`
  - `src/screens/GoalsScreen.tsx`
  - `src/screens/StatisticsScreen.tsx`
  - `src/services/TimerService.ts`
  - `src/repositories/SqliteTaskRepository.ts`, `ITaskRepository.ts`, `InMemoryTaskRepository.ts`
  - `src/services/DatabaseService.ts`
  - `src/testing/FakeDatabaseService.ts` (Stage 10 test double)
  - `src/models/AppSettings.ts`, `src/repositories/SettingsRepository.ts`, `src/managers/SettingsManager.ts`
  - `src/context/ThemeContext.tsx`, `src/screens/SettingsScreen.tsx`
  - `windows/FocusFlow.Package/Package.appxmanifest`, `windows/FocusFlow/FocusFlow.rc`
  - `scripts/package-windows.ps1`, `.gitignore`, `package.json`, `package-lock.json`
  - `installation-instructions.md`, `release-notes.md`, `release-checklist.md`, `requirements-checklist.md`

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
  - Runtime-only, typed task and natural session completion histories with real timestamps and configured durations
  - Daily/weekly statistics dashboard, selected-date navigation, score/result, streak, recent history, and custom 90-day activity grid
  - Score formula: 40% task-goal fulfillment + 40% focus-minute fulfillment + 20% focus-session fulfillment; each component capped at 100%, total rounded/clamped to 0–100
  - Categories: Excellent 85–100, Good 70–84, Fair 50–69, Needs Improvement 0–49; messages centralized in StatisticsEngine
  - Monday–Sunday week summaries, zero-filled history, and Fair-or-better (`score >= 50`) streaks
  - Settings defaults and bounds; explicit Save; singleton JSON SQLite row; partial-field merge; corrupt-JSON error; reset; subscriptions
  - Configurable timer durations/long-break interval/auto-start while preserving running or paused segments
  - Goal targets including zero (immediately fulfilled), with actual completed work-event minutes
  - Persisted System/Light/Dark preference applied to app shell and shared components
  - x64 Release compilation, RNW production bundle/Hermes compilation, MSIX packaging/signing, manifest identity/version/platform/capability metadata, release asset preparation, and Release-layout launch/reopen with LocalState preservation
  - First-launch Welcome / Productivity Setup wizard (timer, daily goals, theme, notifications) persisted via SettingsManager with `onboardingCompleted`
  - Stage 21 end-to-end manager workflow: setup → tasks → focus controls → long break → goals/statistics → settings reload

- **Features Not Yet Tested**
  - Native turbo-sqlite engine behavior inside Jest (suite uses fake/in-memory doubles)
  - Full manual UI click-path of the new onboarding wizard on every release host (covered by TC_ONBOARD_* and TC_E2E_01)
  - Schema migrations / corrupt-database recovery / large-dataset performance
  - Parent/subtask completion business rules (not implemented)
  - Session persistence / SessionRepository
  - Completion history across app restarts (runtime events are intentionally in memory)
  - Durable statistics/session history
  - Native notification delivery, system tray, launch on startup, export, authentication, cloud services
  - Visual style details (colors, spacing, fonts) as automated assertions
  - Windows packaging/deploy as an automated Jest test
  - Complete dark-theme migration of screen-local static StyleSheets
  - Clean second physical machine MSIX installation (development-host signed install was verified in Stage 20; package rebuild for Stage 21 onboarding is tracked separately)

- **Test Environment**
  - OS: Windows 10/11 development machine
  - App stack: React Native for Windows only; React `19.2.3`; React Native `0.86.0`; `react-native-windows` `^0.84.0`
  - SQLite package: `react-native-turbo-sqlite` `0.6.2`
  - TypeScript `^5.8.3`
  - Node (project engine): `>= 22.11.0`
  - Jest config: `jest.config.js` → `jest.config.windows.js` (`@rnx-kit/jest-preset` windows) + `jest.setup.js`
  - Stage 20 build host: Windows build 26200; Visual Studio 18 Community MSBuild 18.7.8; packaged MaxVersionTested/target SDK 22621 with NuGet build tools 26100; x64
  - Project type: packaged full-trust Win32 RNW Composition C++ app, Windows App SDK 1.8, Desktop Bridge `.wapproj` (not UWP)

- **Testing Tools**
  - Jest (`^29.6.3`) including fake timers / system time for timer suites
  - `@testing-library/react-native` (`^13.3.3`) for UI/navigation/TasksScreen suites
  - Direct unit tests for validation, TaskManager, SqliteTaskRepository, TimerService, SessionManager
  - `InMemoryTaskRepository` for TaskManager / UI Jest isolation
  - `FakeDatabaseService` for repository SQL/parameter and mapping tests
  - `fireEvent` / `waitFor` / `findBy*` for async TasksScreen tests
  - `vswhere`, MSBuild, NuGet restore, RNW bundler/Hermes compiler, Windows `signtool`, PowerShell AppX cmdlets, Authenticode/ZIP inspection, and Windows UI Automation

- **Risks and Contingencies**
  - Jest does not exercise the native turbo-sqlite binary; Windows restart persistence still needs occasional manual spot-checks
  - `run-windows` redeploy can wipe package LocalState and wipe saved tasks
  - Future schema changes need migration tests and repository suite updates
  - Native deploy can fail if FocusFlow locks DLLs (see DEF-004)
  - PlatformToolset patch for turbo-sqlite (`postinstall`) must remain after reinstalls (DEF-006)
  - Focus Session state is not persisted across app restart
  - Goal targets persist; reset baselines remain runtime-only
  - New task/session completions have in-memory timestamps, but existing persisted Completed tasks have no historical date and are reported only as an undated snapshot
  - Statistics history resets on app restart; it must not be presented as durable historical reporting
  - Calendar normalization uses local calendar dates consistently; DST-safe date stepping uses calendar operations rather than fixed 24-hour offsets
  - Full 25-minute UI wait for natural work completion is not part of routine manual checks; Jest covers natural completion / long-break paths with timestamps
  - Settings JSON is version-tolerant for missing fields; syntactically corrupt JSON fails explicitly instead of being silently overwritten
  - Theme coverage is coherent for the app shell/shared controls, but older screen-local static colors remain for later visual cleanup
  - If `npm test` preset breaks, use `npm run test:windows`
  - React Native `0.86.0` and RNW `0.84.0` have an existing peer mismatch; Stage 20 intentionally retained the validated dependency set
  - Final FocusFlow branding (stopwatch/checkmark tile) was generated from `assets/branding/focusflow-icon.png` via `scripts/generate-icons.ps1` into all package images and the multi-size `FocusFlow.ico`; template placeholders are replaced
  - Self-signed MSIX deployment requires the public certificate in Local Machine Trusted People. CurrentUser Root/TrustedPeople was insufficient (`0x800B0109`); an elevated import of `FocusFlow.cer` into Local Machine Trusted People resolved deployment
  - A previously registered unpackaged (loose-layout) registration of the same identity blocks `Add-AppxPackage` with `0x80073CFB`; remove it with `Remove-AppxPackage -PreserveApplicationData` before installing the signed MSIX. LocalState survived this transition on the test host

- **Pass/Fail Criteria**
  - **Pass:** actual behavior matches expected behavior and the Jest assertion succeeds; suite exits 0
  - **Fail:** behavior differs from expected result, an assertion fails, or the test suite cannot execute
  - **Stage gate (current):** 15 suites / 116 tests green; Stage 21 onboarding + E2E integration pass; Stage 20 Release/MSIX signed install remains valid; GitHub Release publish requires manual `gh`/UI steps (CLI unavailable here)

---

## 2. TEST CASE INFORMATION

Primary case catalog for **Stages 1–17** is below (single integrated table). All cases are **Pass** in the latest `test-results.txt` run (**97/97**).

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
| TC_TASK_MGR_11 | Record task completion once | In Progress task; complete twice with controlled dates | One cloned event with first completion date | Complete twice; inspect/mutate returned history | One immutable-source event | Pass |
| TC_SESSION_10 | Record natural work/break completions | Finish work then short break | Two events with exact mode/date/configured duration | Tick each segment to zero; inspect history | Exact events recorded | Pass |
| TC_SESSION_11 | Exclude skip/reset from completion history | Partially run then skip/reset | No completion event | Exercise skip and reset; inspect history | Empty history | Pass |
| TC_STATS_01 | Filter selected-date totals | Task/work/break events across two dates | Correct task/session/focus/break totals for selected date | Summarize controlled date | Totals matched | Pass |
| TC_STATS_02 | Apply productivity formula | 50% of all three daily targets | Score 50 from 40/40/20 weights | Calculate score directly | Score 50 | Pass |
| TC_STATS_03 | Cap and clamp score | Over-target, negative, >100 inputs | Result remains 0–100 | Calculate scores/results | Capped/clamped | Pass |
| TC_STATS_04 | Map result boundaries/messages | 85,84,70,69,50,49 | Exact four categories and centralized message | Request results | Boundaries matched | Pass |
| TC_STATS_05 | Handle empty data/division zero | No events; zero targets | Score 0; no activity; Needs Improvement | Summarize day | Safe zero result | Pass |
| TC_STATS_06 | Build weekly summary | Controlled events in week of Jul 16 | Monday Jul 13–Sunday Jul 19; totals/average/productive/best | Summarize week | Summary matched | Pass |
| TC_STATS_07 | Build 90-day history | One event; request 120 days | 90 ordered, zero-filled records | Build history | 90 records | Pass |
| TC_STATS_08 | Count Fair-or-better streak | Three consecutive score-50 days | Streak 3 | Calculate at third day | Streak 3 | Pass |
| TC_STATS_09 | Handle inactive today | Two productive prior days; no today data | Streak looks back from yesterday = 2 | Calculate today | Streak 2 | Pass |
| TC_STATS_10 | Exclude future/poor days | Below-Fair today plus future productive event | Current streak 0 | Calculate today | Streak 0 | Pass |
| TC_STATS_11 | Separate focus and break durations | Short + long break events only | 0 focus; 20 break minutes; score 0 | Summarize day | Durations separated | Pass |
| TC_STATS_12 | Refresh injected production sources | Runtime events + one undated persisted completed task | Runtime event counted on day; snapshot separate | Refresh injected engine | No fabricated snapshot date | Pass |
| TC_SETTINGS_01 | Verify complete defaults | New SettingsManager | 25/5/15, interval 4, existing goal defaults, System theme, general defaults | Read current settings | Defaults matched | Pass |
| TC_SETTINGS_02 | Reject malformed numeric fields | NaN, infinity, decimal, negative, out-of-range | Useful errors by field | Validate settings | All invalid fields rejected | Pass |
| TC_SETTINGS_03 | Persist before apply/publish | Valid timer/goal/theme edit | Repository save, then manager application and listener | Save settings | Ordered behavior matched | Pass |
| TC_SETTINGS_04 | Keep state unchanged on write failure | Repository throws | No apply or publish | Save settings | Existing state retained | Pass |
| TC_SETTINGS_05 | Block invalid save | Work minutes 0 | ValidationError; no repository call | Save settings | Blocked | Pass |
| TC_SETTINGS_06 | Reset preferences non-destructively | Existing goal progress | Defaults restored; progress retained | Reset settings | Progress unchanged | Pass |
| TC_SETTINGS_07 | Preserve active timer segment | Update while running/paused | Current 25m segment retained; idle reset uses 45m | Configure at each state | Rules matched | Pass |
| TC_SETTINGS_08 | Apply next duration/auto-start | 1m work, 2m break, auto-break | Exact 1m completion; running 2m break | Complete work | Transition matched | Pass |
| TC_SETTINGS_09 | Handle zero goal targets | All targets 0 | Complete, 100%, finite | Calculate goals | Safe and complete | Pass |
| TC_SETTINGS_REPO_01–03 | SettingsRepository | Pass | Partial merge, singleton upsert/reset, corrupt JSON, onboarding flag | N/A |
| TC_SETTINGS_REPO_02 | Reject corrupt JSON explicitly | `{bad` | Corruption error | Repository load | Error surfaced | Pass |
| TC_SETTINGS_UI_01 | Show field validation | Work minutes 0; Save | Error shown; save not called | RNTL interaction | Correct | Pass |
| TC_SETTINGS_UI_02 | Save only explicitly | Edit 45/theme Dark, then Save | No per-keystroke write; one save and success | RNTL interaction | Correct | Pass |
| TC_SETTINGS_UI_03 | Expose all sections/accessibility | Render SettingsScreen | Timer/Goals/Appearance/General and labeled controls | RNTL queries | Present | Pass |
| TC_ONBOARD_01 | First launch shows setup wizard | App with `onboardingCompleted: false` | Welcome wizard; Tasks hidden | Render App with injected manager | Wizard shown | Pass |
| TC_ONBOARD_02 | Completed onboarding skips wizard | App with `onboardingCompleted: true` | Tasks screen; no wizard | Render App with injected manager | Wizard skipped | Pass |
| TC_ONBOARD_03 | Finish saves settings and completes onboarding | Edit timer/goals/theme/notifications; Save | Persisted prefs; GoalManager/SessionManager applied; `onboardingCompleted=true`; main app shown | RNTL finish path | Saved and gated | Pass |
| TC_SETTINGS_REPO_03 | Explicit incomplete onboarding merges correctly | Stored JSON `{onboardingCompleted:false}` | Flag remains false | Repository load | Incomplete preserved | Pass |
| TC_E2E_01 | Manager-level end-to-end workflow | Setup → tasks → focus controls → long break → goals/stats → settings reload | All steps succeed with expected counters and persisted settings | Direct manager integration | Pass | Pass |

---

## 3. TEST PROCEDURE INFORMATION

Prior stage procedures TP-NAV through TP-WINDOWS remain in force. Stage 21 additions:

### TP-ONBOARD — First-launch setup (Stage 21)
- **Procedure ID:** TP-ONBOARD
- **Description:** Verify the lightweight Welcome / Productivity Setup wizard appears only on first launch (or after Restore Defaults), saves via SettingsManager, applies GoalManager targets, and sets `onboardingCompleted`
- **Steps:** 1. Run Jest including `Onboarding.test.tsx` 2. Confirm TC_ONBOARD_01–03 and TC_SETTINGS_REPO_03 3. Confirm TypeScript `npx tsc --noEmit`
- **Actual outcome:** Pass — wizard shows when incomplete, skips when complete, persists timer/goals/theme/notifications and marks onboarding complete.

### TP-E2E — Final integration workflow (Stage 21)
- **Procedure ID:** TP-E2E
- **Description:** Exercise the approved end-to-end productivity workflow at the manager layer and confirm prior Stage 20 install/persistence evidence still holds
- **Steps:** 1. Run `TC_E2E_01` 2. Reconfirm Stage 20 signed MSIX artifact hash and package presence under `artifacts/windows/FocusFlow-v1.0.0-x64/` 3. Record that `gh` CLI is unavailable for automated GitHub publish
- **Actual outcome:** Pass for automated E2E. Stage 20 signed installation evidence retained. GitHub Release not published from this environment.

- **Post-Execution Actions:** Record only observed persistence. Reset changes preferences only; it must not reset tasks, progress, histories, sessions, or statistics. Restore Defaults also clears `onboardingCompleted` so the setup wizard returns (by design).

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

### TP-STATS — Statistics / StatisticsEngine (Stages 16–17)

- **Procedure ID:** TP-STATS
- **Description:** Verify runtime event sources, daily/weekly summaries, score/category/message, streak, 90-day zero-filled history, and snapshot separation
- **Test Environment:** Jest direct unit tests with controlled local dates and injected manager sources; optional Windows dashboard spot-check
- **Steps to Execute:**
  1. Run `npm run test:windows -- --verbose > test-results.txt 2>&1`
  2. Confirm `StatisticsEngine.test.ts` executes TC_STATS_01–12 plus manager history regressions TC_TASK_MGR_11 and TC_SESSION_10–11
  3. Run `npx tsc --noEmit`
  4. Run `npx react-native run-windows`; inspect dashboard/date/period/history states where interactive access is available
- **Post-Execution Actions:** Record only actual checks. Existing persisted Completed count is snapshot metadata, never dated history.

### TP-SETTINGS — Settings (Stages 18–19)
- **Procedure ID:** TP-SETTINGS
- **Description:** Verify settings validation, persistence, manager integration, timer/goal rules, theme preference, and form interactions
- **Test Environment:** Jest direct/RNTL tests with injected repositories and FakeDatabaseService; Windows build plus accessibility-tree inspection
- **Steps to Execute:**
  1. Run the preferred full command and confirm TC_SETTINGS_01–09, TC_SETTINGS_REPO_01–02, and TC_SETTINGS_UI_01–03.
  2. Run `npx tsc --noEmit` and changed-file ESLint.
  3. Run `npx react-native run-windows`; navigate to Settings and inspect the native accessibility tree.
  4. For a full manual release check, save values, close the process, reopen without redeploying, and confirm values reload.
- **Post-Execution Actions:** Record only observed persistence. Reset changes preferences only; it must not reset tasks, progress, histories, sessions, or statistics.

### TP-WINDOWS — Windows Release Preparation (Stage 20)
- **Procedure ID:** TP-WINDOWS
- **Description:** Build, package, sign, inspect, install where permitted, and launch the x64 Release without Metro
- **Environment:** Win32/full-trust RNW 0.84 Composition C++, Windows App SDK 1.8, Desktop Bridge `.wapproj`, Windows build 26200, VS/MSBuild 18.7.8, x64
- **Scope/files:** Manifest/RC branding metadata, npm version, lock restore, release script, ignore rules, installation/release/checklist documents; no Stage 20 application service code and therefore no `TC_WINDOWS_*` Jest cases
- **Commands and steps:**
  1. Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\package-windows.ps1 -CreateDevelopmentCertificate`.
  2. Script locates MSBuild with `vswhere`, restores `windows\FocusFlow.sln`, rebuilds `Release|x64` with `UseBundle=true`, `UseHermes=true`, `AppxBundle=Never`, `UapAppxPackageBuildMode=SideloadOnly`, and signs with a non-exportable CurrentUser certificate whose subject equals manifest publisher `CN=catsr`.
  3. Inspect `FocusFlow.msix` signature, manifest, `Bundle/index.windows.bundle`, Hermes DLLs, and `ReactNativeTurboSqlite.dll`.
  4. Back up package LocalState, close FocusFlow, and run `Add-AppxPackage -Path FocusFlow.msix -ForceApplicationShutdown -ForceUpdateFromAnyVersion`.
  5. If certificate trust blocks deployment, retain the failure as evidence; do not remove user data. Register the generated Release layout only for a non-MSIX runtime check, launch through AppsFolder, inspect the accessibility tree, close/reopen, and confirm existing task data remains.
  6. Run `npm run test:windows -- --verbose > test-results.txt 2>&1`, `npx tsc --noEmit`, `git diff --check`, and applicable diagnostics.
- **Actual outcome:** Release/MSIX generation passed. MSBuild reported 17 warnings / 0 errors; warnings were known NU1701/native compiler/Hermes static-analysis warnings. The final MSIX was `FocusFlow.msix`, version `1.0.0.0`, x64, signed by `CN=catsr`, and contained the 1,238,264-byte bundle plus Hermes and native SQLite. After the D_STAGE20_03 fix, the package was rebuilt and re-signed with the same `CN=catsr` certificate; the packaged AppxManifest declares MinVersion 10.0.18362.0 / MaxVersionTested 10.0.22621.0 for both device families, and the signature verifies as Valid. The initial signed installation failed before deployment with `0x800B0109` because Local Machine certificate trust required administrator access; CurrentUser Root and TrustedPeople did not satisfy AppX deployment on this host. After the user installed `FocusFlow.cer` into Local Machine Trusted People with administrator approval, the signed MSIX installed successfully (D_STAGE20_02 resolved).
- **Branding rebuild:** Final FocusFlow artwork (indigo stopwatch/checkmark tile) was produced as `assets/branding/focusflow-icon.png` and rendered by `scripts/generate-icons.ps1` into all seven package images (square tiles, 24px unplated taskbar asset, StoreLogo, wide tile, splash screen) plus a multi-size PNG-compressed `FocusFlow.ico`/`small.ico` (256/64/48/32/24/16). The package was rebuilt/re-signed with the same trusted `CN=catsr` certificate: 17 warnings / 0 errors; new `FocusFlow.msix` SHA-256 `37F8DC8F4D07B7FB4C552E18CB96E2E31CA9D9E587C733AD08E27D4AC412BC7E`.
- **Signed installation (final):** A previously registered unpackaged loose-layout registration of the same identity blocked reinstall with `0x80073CFB`; it was removed with `Remove-AppxPackage -PreserveApplicationData` and the signed MSIX then installed to `C:\Program Files\WindowsApps\FocusFlow_1.0.0.0_x64__wk8nzwejgnza6` with `SignatureKind: Developer`.
- **Post-execution:** LocalState was backed up before each install operation and preserved. The installed app launched from its package identity without Metro (port 8081 inactive), rendered the full accessibility tree (Tasks/Focus Session/Statistics/Goals/Settings), and retained all pre-existing tasks (`Homework`, `Study React Native`, `Clean Room`, `Math Homework`) after the identity transition and again after a full close/reopen cycle. Uninstall/reinstall of the trusted signed package was exercised implicitly by the remove/replace transition; a from-scratch clean-machine install remains a Stage 21 item.

---

## 4. TEST RESULTS INFORMATION

Latest full automated run (`test-results.txt`): **15 suites / 116 tests passed / 0 failed / 0 snapshots**.

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
| TC_TASK_MGR_11 | Task completion event history | Pass | One event per In Progress → Completed transition | N/A |
| TC_SESSION_10–11 | Session completion event history | Pass | Natural completions only; exact configured duration | N/A |
| TC_STATS_01–12 | StatisticsEngine | Pass | Daily/weekly/history/score/category/streak and injected refresh | N/A |
| TC_SETTINGS_01–09 | Settings model/manager/integration | Pass | Defaults, validation, ordering, reset, timer, goals | N/A |
| TC_SETTINGS_REPO_01–03 | SettingsRepository | Pass | Partial merge, singleton upsert/reset, corrupt JSON, onboarding flag | N/A |
| TC_SETTINGS_UI_01–03 | SettingsScreen | Pass | Invalid/valid save and accessible sections | N/A |
| TC_ONBOARD_01–03 | First-launch onboarding wizard | Pass | Show/skip/save + complete flag | N/A |
| TC_E2E_01 | Stage 21 manager E2E workflow | Pass | Setup→tasks→focus→long break→goals/stats→reload | N/A |
| TP-WINDOWS build/package | x64 Release + signed MSIX | Pass | 17 warnings / 0 errors; bundle/Hermes/SQLite present | D_STAGE20_01 fixed |
| TP-WINDOWS signed install | `Add-AppxPackage` | Pass | Installed to `WindowsApps` after admin Local Machine Trusted People trust and removal of the loose-layout registration | D_STAGE20_02 fixed |
| TP-WINDOWS Release runtime | Loose Release layout, launch/reopen | Pass (limited) | Responsive FocusFlow window; no Metro; LocalState task retained | N/A |
| TP-WINDOWS manifest minimum OS | Packaged AppxManifest MinVersion | Pass | Rebuilt signed MSIX declares MinVersion 10.0.18362.0 for both device families | D_STAGE20_03 fixed |
| TP-WINDOWS installed runtime | Installed signed package, launch/close/reopen | Pass | Metro-free launch from package identity; all pre-existing tasks persisted across identity transition and restart | N/A |
| TP-WINDOWS branding | Final icon/tile/splash assets in rebuilt MSIX | Pass | Generated stopwatch/checkmark artwork replaced all template placeholders; multi-size ICO wired to the executable | N/A |

---

## 5. DEFECT TRACKING INFORMATION

Latest automated product test run: **0 failed** (**15 suites / 116 tests passed**).
Stages 1–21 complete. Product defects from Stages 9–10 are fixed (DEF-005–008). DEF-004 remains an open deploy workaround when the app locks DLLs.

**No defects were discovered during Stage 21.**


One pre-existing regression was discovered before Statistics work and fixed as D_STAGE16_01. Settings implementation checks found and fixed D_STAGE18_01–02. Stage 20 found one packaging-script defect, one environment/deployment blocker, and one manifest metadata defect: all three are now resolved. D_STAGE20_02 was fixed by administrator installation of `FocusFlow.cer` into Local Machine Trusted People followed by removal of the conflicting loose-layout registration (`0x80073CFB`) with `-PreserveApplicationData`; the signed MSIX then installed and launched with all data intact.

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
| D_STAGE16_01 | TC_GOAL_10 could fail after midnight because `GoalManager.setTargets()` called `getProgress()` with the machine's real current date, rolling the controlled test manager's baseline before `synchronizeProgress(now)`. | Major | 1. Construct GoalManager with a controlled prior date 2. Call `setTargets()` after the real calendar date changes 3. Synchronize with the controlled date 4. Observe progress baseline incorrectly reset | Fixed | GoalManager now preserves its last controlled reference date for target changes and accepts an optional `now`; all existing TC_GOAL IDs remain unchanged and green. |
| D_STAGE18_01 | SettingsScreen’s optional injected manager prop made the component function incompatible with the app shell’s zero-argument screen component map during TypeScript verification. | Minor | 1. Add destructured SettingsScreen props 2. Run `npx tsc --noEmit` 3. Observe TS2322 in `App.tsx` | Fixed | Give the entire props argument a default value; TypeScript and all tests pass. |
| D_STAGE18_02 | Shared button pressed and disabled styles could override active dark-theme tokens with module-level light colors. | Minor | 1. Select Dark theme 2. Press or disable a shared button 3. Inspect the resolved style colors | Fixed | Pressed, disabled, border, and label colors now derive from the active `ThemeContext` tokens. |
| D_STAGE20_01 | Direct `.wapproj` packaging lost required solution context and blocked the native SQLite/RNW build. | Major | Run the initial package script against `FocusFlow.Package.wapproj`; observe fallback source work and then `SolutionPath is not defined`. | Fixed | Build/package `FocusFlow.sln` and pass the Windows `SolutionDir`. |
| D_STAGE20_02 | Signed MSIX deployment fails with `0x800B0109` because CurrentUser certificate trust is insufficient on this host. | Major / Blocker | Trust the public certificate under CurrentUser Root/TrustedPeople; run `Add-AppxPackage FocusFlow.msix`. | Fixed | Administrator imported `FocusFlow.cer` into Local Machine Trusted People; the conflicting unpackaged loose-layout registration (`0x80073CFB`) was removed with `Remove-AppxPackage -PreserveApplicationData`; the signed MSIX then installed to `WindowsApps` and launched with all LocalState data preserved. |
| D_STAGE20_03 | Package manifest advertised Windows 10 minimum build 17763, below the RNW New Architecture native minimum of build 18362, so the package could be offered to OS versions the app cannot support. | Major | 1. Inspect `Package.appxmanifest` `TargetDeviceFamily` MinVersion (10.0.17763.0) 2. Compare with RNW New Architecture native minimum (10.0.18362.0) | Fixed | Both Windows.Universal and Windows.Desktop MinVersion raised to `10.0.18362.0` in `Package.appxmanifest`, and `TargetPlatformMinVersion=10.0.18362.0` set in `FocusFlow.Package.wapproj` (the generated AppxManifest otherwise reverted to the 17763 SDK default); installation/release docs updated; signed x64 MSIX regenerated and re-verified. |

### Recent defect detail

| ID | Severity | Description | Steps to reproduce | Expected | Actual | Root cause | Fix | Status | Fix stage | Regression |
|---|---|---|---|---|---|---|---|---|---|---|
| D_STAGE16_01 | Major | Controlled GoalManager progress could reset after the machine crossed into a new calendar day. | Construct with a controlled date; call `setTargets()` after the real date changes; synchronize using the controlled date. | Target editing preserves the manager's controlled period and progress. | The implicit real date rolled the baseline, producing zero progress in TC_GOAL_10. | `setTargets()` called `getProgress()` without carrying the manager's reference date. | Preserve the last controlled reference date and accept an optional `now` in `setTargets()`. | Fixed | Stage 16 | Existing TC_GOAL_10 now passes deterministically. |
| D_STAGE18_01 | Minor | SettingsScreen component type did not fit the zero-argument navigation map. | Add destructured injected-manager props; run `npx tsc --noEmit`. | SettingsScreen remains injectable and assignable to `() => JSX.Element`. | TS2322 in `App.tsx`. | The props object itself was required even though its property was optional. | Default the entire props argument to `{}`. | Fixed | Stage 18 | TypeScript passes; all TC_NAV and TC_SETTINGS_UI cases pass. |
| D_STAGE18_02 | Minor | Shared button interaction states used light tokens while Dark theme was active. | Select Dark theme; inspect a pressed or disabled `AppButton`. | Every button state uses the resolved active theme. | Static pressed/disabled styles followed dynamic styles and overrode them. | Module-level light color styles had higher array precedence for interaction states. | Compute interaction colors from `useTheme()` and apply them dynamically. | Fixed | Stage 18 | Shared component and full Jest suites pass; live Dark selection remains coherent. |
| D_STAGE20_01 | Major | Packaging outside solution context failed before an MSIX could be produced. | Invoke the `.wapproj` directly from the release script with Release/x64 properties. | Restore/build uses RNW NuGet mode and includes SQLite. | RNW missed solution-level experimental props; retry failed because `SolutionPath` was undefined. | The direct project invocation did not retain context required by RNW/native module targets. | Build and package `FocusFlow.sln`; explicitly pass Windows `SolutionDir`; retain supported MSBuild properties. | Fixed | Stage 20 | Final x64 Release/MSIX build succeeded with 0 errors; supported restore removed stale `reactnativefs`. |
| D_STAGE20_02 | Major / Blocker | A cryptographically signed MSIX could not be installed in the non-administrative test environment. | Create a non-exportable `CN=catsr` cert; sign; trust its public cert in CurrentUser Root/TrustedPeople; run `Add-AppxPackage`. | Package upgrades the existing same-family app while preserving LocalState. | Deployment stopped before install with `0x800B0109`; after trust was fixed, reinstall was blocked by `0x80073CFB` because an unpackaged loose-layout registration of the same identity existed. | AppX requires local-machine trust for this self-signed package, and a development loose-layout registration cannot be replaced by a packaged install. | Administrator imported `FocusFlow.cer` into Local Machine Trusted People; LocalState was backed up; the loose-layout registration was removed with `Remove-AppxPackage -PreserveApplicationData`; the signed MSIX installed cleanly. | Fixed | Stage 20 | Installed package launched Metro-free from `WindowsApps`; all pre-existing tasks persisted across the identity transition and a close/reopen cycle. |
| D_STAGE20_03 | Major | Manifest advertised a lower Windows minimum (build 17763) than the native app requirement (RNW New Architecture requires build 18362). | Inspect `Package.appxmanifest` `TargetDeviceFamily` entries; compare `MinVersion` 10.0.17763.0 against the RNW New Architecture minimum 10.0.18362.0. | Manifest MinVersion is at least the actual native minimum so unsupported OS builds cannot install the package. | Both device families declared MinVersion 10.0.17763.0. | The RNW template default was retained during earlier manifest review; the New Architecture native minimum was not cross-checked, and the WAP build regenerates the packaged manifest from `TargetPlatformMinVersion`, which still defaulted to 17763. | Raise Windows.Universal and Windows.Desktop MinVersion to `10.0.18362.0`; set `TargetPlatformMinVersion=10.0.18362.0` in `FocusFlow.Package.wapproj`; align installation and release documentation; rebuild and re-sign the x64 MSIX with the existing `CN=catsr` certificate. | Fixed | Stage 20 | Rebuilt packaged AppxManifest verified at MinVersion 10.0.18362.0 for both device families; signature Valid (`CN=catsr`); Jest 13 suites / 111 tests and TypeScript remain green. |

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
| Total Test Suites | 15 |
| Total Test Cases | 116 |
| Passed | 116 |
| Failed | 0 |
| Pass Percentage | 100% |
| Snapshots | 0 |
| Overall System Status (tested scope) | 15/15 suites and 116/116 tests green; Stages 1–21 complete; onboarding + E2E integration verified; Stage 20 MSIX/install evidence retained; GitHub Release ready for manual publish |

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
| StatisticsEngine | `__tests__/StatisticsEngine.test.ts` | TC_STATS_01–12 |
| Settings stages 18–19 | `__tests__/Settings.test.ts` | TC_SETTINGS_01–09, TC_SETTINGS_REPO_01–03 |
| SettingsScreen | `__tests__/SettingsScreen.test.tsx` | TC_SETTINGS_UI_01–03 |
| First-launch onboarding | `__tests__/Onboarding.test.tsx` | TC_ONBOARD_01–03 |
| Stage 21 E2E integration | `__tests__/Integration.stage21.test.ts` | TC_E2E_01 |

### Implementation milestones (Stages 1–21)

| Sprint | Stages | Delivered | Key test IDs |
|---|---|---|---|
| Shell & UI foundation | 1–4 | App shell, sidebar nav, shared components | TC_NAV_*, TC_UI_* |
| Task presentation & validation | 5–6 | TasksScreen UI, `taskValidation` | TC_TASK_UI_*, TC_TASK_FORM_*, TC_TASK_VAL_* |
| Task business logic | 7–8 | `TaskManager`, unit + trash tests | TC_TASK_MGR_*, TC_TASK_TRASH_* |
| Task persistence | 9–10 | SQLite, `SqliteTaskRepository`, repo tests | TC_TASK_REPO_*, TC_TASK_REPO_REG_* |
| Focus Session & timer | 11–13 | FocusScreen, `TimerService`, `SessionManager`, long-break cycle fix | TC_TIMER_*, TC_SESSION_* |
| Goals | 14–15 | Goal model, GoalManager, redesigned GoalsScreen, direct tests | TC_GOAL_* |
| Statistics | 16–17 | Runtime completion events, StatisticsEngine, dashboard, custom 90-day grid | TC_TASK_MGR_11, TC_SESSION_10–11, TC_STATS_* |
| Settings | 18–19 | Typed settings, SQLite repository, manager, theme, full form, timer/goals integration | TC_SETTINGS_*, TC_SETTINGS_REPO_*, TC_SETTINGS_UI_* |
| Windows release preparation | 20 | Manifest/version/capability review, executable icon wiring, x64 Release/Hermes, signed MSIX, release docs, signed install | TP-WINDOWS (no new service/Jest cases) |
| Final integration & release | 21 | First-launch onboarding wizard, E2E manager workflow, requirements checklist, release readiness | TC_ONBOARD_*, TC_E2E_01, TC_SETTINGS_REPO_03 |

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

**Statistics (Stages 16–17)**
- `TaskManager` records only new In Progress → Completed transitions in a typed, cloned in-memory event list. Existing Completed rows remain undated snapshot metadata.
- `SessionManager` records only natural work/short-break/long-break finishes with `completedAt` and the configured duration. Skip, pause, and reset never create completion events.
- No SessionRepository or schema change was introduced; statistics history is runtime-only and resets on restart.
- Daily records use normalized local calendar dates. Weeks start Monday and contain seven zero-safe days. History is ordered, zero-filled, and capped at 90 days.
- Score = 40% task-goal fulfillment + 40% focus-minute fulfillment + 20% focus-session fulfillment. Each ratio is capped at 100%; result is rounded and clamped 0–100.
- Result boundaries/messages: Excellent 85–100, Good 70–84, Fair 50–69, Needs Improvement 0–49; messages are centralized.
- Messages: Excellent — “Outstanding day! You were highly productive.”; Good — “Great effort! You had a productive day.”; Fair — “Not bad! A little more focus tomorrow can make a big difference.”; Needs Improvement — “Today was tough — tomorrow is a fresh start!”
- Streak requires an active day scoring at least 50. Future/no-data days never count. If today has no activity, calculation starts at yesterday; if today has activity below 50, streak is 0.
- `StatisticsScreen` delegates calculations to StatisticsEngine, polls manager sources, provides daily/weekly and date controls, loading/error/empty states, metric cards, weekly summary, recent history, and a package-free 90-day grid.

**Settings (Stages 18–19)**
- `AppSettings` is strongly typed. Defaults preserve existing behavior: timer 25/5/15 minutes, long break every 4 work sessions, both auto-start options off; goals daily 5/4/120 and weekly 30/20/600; theme System; notifications/sound/delete confirmation/show-completed on.
- Validation requires finite whole numbers: work 1–180, short break 1–60, long break 1–120, interval 1–10; task/session goals 0–10,000; minute goals 0–100,000. Toggle values must be booleans. Zero goal targets are immediately fulfilled (100%) and are division-safe.
- SQLite table `settings` stores one stable-key, parameterized JSON payload. Missing JSON fields merge over current defaults; syntactically corrupt JSON produces an explicit error. Reset deletes only the settings row.
- Data flow is SettingsScreen → SettingsManager → SettingsRepository → DatabaseService/SQLite. SettingsManager persists successfully before applying/publishing, exposes load/save/reset/getCurrent/subscribe, and applies timer and goal configuration.
- Running or paused segments retain their configured duration. New values apply to an idle segment or the next configured segment. Completion events retain actual segment durations; configured auto-start and long-break interval drive transitions.
- Goal focus minutes sum actual completed work-event durations. Settings and Goals screen target edits persist without resetting progress/baselines/history.
- Theme System/Light/Dark is persisted and resolved through Appearance/useColorScheme. The app shell, sidebar, and shared cards/inputs/buttons/headers use theme tokens. Older screens still contain static module StyleSheets, so full screen-level dark-theme visual cleanup is explicitly deferred.
- Notification is a preference only. Stage 20 did not add native delivery because no safe, already-supported RNW packaged notification path was available without a major native rewrite. Tray/startup were not approved requirements. No export, backup, auth, or cloud behavior was added.

**Final integration (Stage 21)**
- Lightweight first-launch `OnboardingScreen` collects timer durations, daily goals, theme, and notification preference; saves through SettingsManager (which applies SessionManager + GoalManager); sets `onboardingCompleted: true`.
- Fresh installs (empty settings row → defaults with `onboardingCompleted: false`) see the wizard. Existing stored settings missing the flag merge as completed (`true`) so upgrades skip the wizard. Restore Defaults returns `onboardingCompleted: false`, so the wizard appears again by design.
- `TC_E2E_01` verifies the manager-level workflow: setup → create/edit/delete/complete tasks → start/pause/resume/reset/skip → long-break after 4 work sessions → goals/statistics reflection → settings persist/reload.
- Final requirements checklist lives at `requirements-checklist.md`.
- GitHub Release was **not** published from this environment (`gh` CLI not installed). Manual publish steps are in `release-checklist.md`.

**Windows release preparation (Stage 20)**
- Product version is `1.0.0` / package `1.0.0.0`; display name is FocusFlow; description identifies offline task/focus/goal/statistics behavior.
- Manifest remains full-trust Desktop Bridge with `runFullTrust`; unnecessary `internetClient` was removed. Windows 10 build 18362 is minimum (raised from 17763 per D_STAGE20_03 to match the RNW New Architecture native requirement) and 22621 is MaxVersionTested in the built manifest.
- Final branding is applied: `assets/branding/focusflow-icon.png` (indigo stopwatch/checkmark tile) is rendered by `scripts/generate-icons.ps1` into all seven package images (square tiles, taskbar/unplated, StoreLogo, wide tile, splash) and a multi-size `FocusFlow.ico`/`small.ico` wired to the executable resource. Template placeholders are fully replaced.
- `scripts/package-windows.ps1` discovers MSBuild via `vswhere`, restores/builds the solution as Release/x64, forces bundle/Hermes, creates a non-bundle sideload MSIX, accepts `FOCUSFLOW_CERT_THUMBPRINT`/parameter input, or creates a non-exportable local certificate. It exports only the public `FocusFlow.cer`.
- Supported restore removed stale `reactnativefs` from `windows/FocusFlow/packages.lock.json`; `react-native-turbo-sqlite` remains autolinked.
- Final Stage 20 build output was `FocusFlow.Package_1.0.0.0_x64.msix`, copied to ignored release asset `artifacts/windows/FocusFlow-v1.0.0-x64/FocusFlow.msix` (SHA-256 `37F8DC8F4D07B7FB4C552E18CB96E2E31CA9D9E587C733AD08E27D4AC412BC7E`). Prepared attachments are `FocusFlow.msix`, `FocusFlow.cer`, `FocusFlow-dependencies-x64.zip`, `installation-instructions.md`, and `release-notes.md`.
- Build warnings: two NuGet compatibility warnings, generated/native unused-parameter warnings, and Hermes undeclared-global static warnings; 0 errors. No Metro is required.
- Stage 21 may rebuild the MSIX so the embedded Hermes bundle includes onboarding; checksums must be refreshed after that rebuild.

### Manual verification summary

| Area | Method | Result |
|---|---|---|
| SQLite persistence (Stage 9) | Process restart + direct DB insert/update/delete | Create/edit/delete survived restart — Pass |
| Focus Session UI (Stages 11–13) | `npx react-native run-windows` + UI Automation | Start/Pause/Resume/Skip/Reset — Pass; countdown updates — Pass |
| Long break full UI cycle | Not run at real 25m×4 duration | Covered by Jest TC_TIMER_07, TC_SESSION_07 |
| Goals UI (Stages 14–15) | `npx react-native run-windows` | Build, deploy, and app start — Pass after closing the existing FocusFlow process that held `ReactNativeTurboSqlite.dll` (known DEF-004 pattern). Interactive visual/click verification was not available in this agent environment; daily/weekly calculations, completion messages, percentages, and reset semantics are covered by TC_GOAL_01–10. |
| Statistics UI (Stages 16–17) | `npx react-native run-windows` + Windows UI Automation | Pass — build/deploy/start exited 0; Statistics navigation opened the live dashboard; Daily/Weekly controls, score/category/message, streak, 90-day grid, recent-history empty state, and undated persisted-task note were present. Weekly toggle displayed its summary and no-data state without crashing. Creating a completion through UI Automation was not reliable, so event reflection remains verified by TC_TASK_MGR_11, TC_SESSION_10–11, and TC_STATS_12 rather than claimed as a manual pass. |
| Settings UI (Stages 18–19) | `npx react-native run-windows` + Windows UI Automation | Pass — build/deploy/start exited 0; the live accessibility tree exposed Timer, Goals, Appearance, General, all numeric inputs/toggles/theme options, Save, and Restore Defaults. UI Automation changed work duration 25→42 and theme System→Dark, then displayed “Settings saved.”; FocusFlow was terminated and relaunched through its installed package identity without redeploying, and Settings reloaded 42/Dark. The original 25/System values were saved afterward. |
| Stage 20 x64 Release/MSIX | `scripts/package-windows.ps1`, MSBuild, ZIP/AuthentiCode inspection | Pass — x64 Release and signed non-bundle MSIX generated; 17 warnings / 0 errors; 1,238,264-byte app bundle, Hermes, and native SQLite present. |
| Stage 20 signed installation | `Add-AppxPackage` after admin Local Machine Trusted People trust | Pass — the first attempt was blocked (`0x800B0109`) until the administrator trusted `FocusFlow.cer`; a second block (`0x80073CFB`, existing unpackaged registration) was cleared with `Remove-AppxPackage -PreserveApplicationData`; the signed MSIX then installed to `C:\Program Files\WindowsApps` with `SignatureKind: Developer`. LocalState was backed up first and preserved throughout. |
| Stage 20 Release runtime | Data-preserving remove/register of generated loose Release layout + AppsFolder launch + UI Automation | Limited pass — package location changed to `bin/x64/Release`; responsive FocusFlow window opened without Metro; Tasks and Settings trees rendered; task `Homework` survived close/reopen; settings 25/5/15/4 were readable. Scripted settings mutation was unreliable and is not claimed. |
| Stage 20 installed runtime | Installed signed package launch via AppsFolder + UI Automation + close/reopen | Pass — `FocusFlow.exe` ran from `WindowsApps` with no Metro (port 8081 inactive); full accessibility tree exposed all five sections; pre-existing tasks (`Homework`, `Study React Native`, `Clean Room`, `Math Homework`) persisted across the identity transition and a full close/reopen cycle. |
| Stage 20 final branding | Generated artwork rendered into package images/ICO; rebuilt MSIX inspected | Pass — stopwatch/checkmark tile replaced all template placeholders; rebuilt signed MSIX SHA-256 `37F8DC8F4D07B7FB4C552E18CB96E2E31CA9D9E587C733AD08E27D4AC412BC7E`. |
| Stage 21 onboarding/E2E | Jest TC_ONBOARD_01–03, TC_E2E_01, `npx tsc --noEmit` | Pass — 15 suites / 116 tests; TypeScript exit 0. |
| Stage 21 MSIX rebuild | `scripts/package-windows.ps1` with existing `CN=catsr` cert | Pass — 17 warnings / 0 errors; embedded bundle contains Welcome/onboarding; SHA-256 `77EEBDE831570F25836DA5565BB0F61DC3B6C91FFCA356DDF469BF17BA685032`. |
| Stage 21 release assets | Artifact folder + requirements checklist | Pass — `artifacts/windows/FocusFlow-v1.0.0-x64/FocusFlow.msix` present; `requirements-checklist.md` added; GitHub Release not published (`gh` unavailable). |

Deploy note: close running FocusFlow before redeploy if DLL file lock occurs (DEF-004).
Stage 14–15 launch note: the first overlapping native compile reported C1041 on `vc145.pdb`; a single retry built successfully. Deployment then encountered the known DLL lock, `tasklist /m ReactNativeTurboSqlite.dll` identified `FocusFlow.exe`, and closing only that process allowed the final build/deploy/start command to exit 0.

### Features not yet tested

- Session persistence / SessionRepository
- Durable cross-restart statistics history
- Notifications / system tray
- Schema migrations / corrupt DB recovery / large datasets
- Full screen-level dark-theme visual cleanup
- Clean second-machine MSIX installation

