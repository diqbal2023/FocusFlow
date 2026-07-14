# FocusFlow Implementation Plan

## Project Overview

FocusFlow is an offline productivity and time-management desktop application for Windows 10 and Windows 11.

| Item | Detail |
|---|---|
| Platform | React Native for Windows |
| Language | TypeScript |
| Testing | Jest + React Native Testing Library |
| Storage (planned) | Local SQLite |
| Auth | No login, signup, OAuth, or cloud authentication |
| Profile | Single local profile per installation |
| Network | Offline-first desktop application |

### Layered architecture

| Layer | Responsibility |
|---|---|
| Presentation Layer | Screens, shared UI components, navigation, form interactions |
| Application / Business Logic Layer | Managers and services (TaskManager, SessionManager, GoalManager, StatisticsEngine, etc.) |
| Data Access Layer | Repositories (TaskRepository, SettingsRepository, etc.) |
| Data Storage Layer | Local SQLite database and AppData files |

---

## Development Workflow

For every stage, follow this workflow:

1. Inspect current implementation.
2. Run existing Windows Jest tests.
3. Implement only the current stage.
4. Add or update tests where required.
5. Run:
   ```
   npm run test:windows -- --verbose > test-results.txt 2>&1
   ```
6. Inspect `test-results.txt`.
7. Fix failures and rerun tests.
8. Update `documentation/testing-notes.md`.
9. Run the Windows application.
10. Commit and push the completed stage.

### Workflow rules

- Do not begin the next stage until the current stage works and tests pass.
- Do not remove or weaken existing tests.
- Commit after every completed stage.
- Keep test case IDs consistent (`TC_NAV_*`, `TC_UI_*`, `TC_TASK_*`, and later stage IDs).

---

## Progress Tracker

- [x] 1. App shell
- [x] 2. Navigation Jest tests
- [x] 3. Shared UI components
- [x] 4. Component tests
- [x] 5. Task UI
- [ ] 6. Task validation tests — In Progress
- [ ] 7. TaskManager
- [ ] 8. TaskManager tests
- [ ] 9. SQLite repository
- [ ] 10. Repository tests
- [ ] 11. Timer UI
- [ ] 12. TimerService and SessionManager
- [ ] 13. Timer tests with fake timers
- [ ] 14. Goals
- [ ] 15. GoalManager tests
- [ ] 16. Statistics
- [ ] 17. StatisticsEngine tests
- [ ] 18. Settings
- [ ] 19. Settings tests
- [ ] 20. Windows features
- [ ] 21. Final integration tests

**Current status notes**

- Stages 1–5 are complete.
- Stage 6 is in progress.
- Stages 7–21 have not started.
- Completed tests currently include navigation, shared UI components, and temporary Task UI interactions.
- Task data currently uses temporary React state.
- SQLite, TaskManager, timer logic, goals, statistics, settings persistence, and Windows-specific integrations are not implemented yet.

---

## Stage Details

### Stage 1 — App shell

- **Status:** Complete
- **Objective:** Create the base React Native for Windows desktop application.
- **Main implementation work:**
  - Main `App` component
  - Desktop layout with left sidebar and main content area
  - Five screens: Tasks, Focus Session, Statistics, Goals, Settings
  - React state controls the active screen
- **Expected files created or modified:**
  - `App.tsx`
  - `src/components/Sidebar.tsx`
  - `src/screens/TasksScreen.tsx`
  - `src/screens/FocusScreen.tsx`
  - `src/screens/StatisticsScreen.tsx`
  - `src/screens/GoalsScreen.tsx`
  - `src/screens/SettingsScreen.tsx`
- **Features included:** Desktop shell, sidebar navigation, five placeholders/screens
- **Features intentionally excluded:** Persistence, validation business layer, timer, goals logic, statistics engine, settings storage, Windows-native features
- **Testing required:** Manual application launch and navigation check
- **Completion criteria:**
  - App launches on Windows
  - Sidebar appears
  - All five screens can be selected
- **Recommended Git commit message:** `Add FocusFlow desktop navigation shell`
- **Dependencies on earlier stages:** None

### Stage 2 — Navigation Jest tests

- **Status:** Complete
- **Objective:** Verify navigation behavior with automated tests.
- **Main implementation work:**
  - Jest + React Native Testing Library coverage for the shell
  - Sidebar active-state assertions
- **Expected files created or modified:**
  - `__tests__/App.test.tsx`
  - Minimal `testID` / accessibility hooks in `Sidebar` if needed
- **Features included:** Navigation verification only
- **Features intentionally excluded:** Feature-business logic, storage, timers
- **Testing required:**
  - Tasks screen shown by default
  - Focus Session, Statistics, Goals, Settings navigation
  - Active sidebar item state
  - Test IDs: `TC_NAV_01` through `TC_NAV_06`
- **Completion criteria:** All navigation tests pass
- **Recommended Git commit message:** `Add Jest navigation tests`
- **Dependencies on earlier stages:** Stage 1

### Stage 3 — Shared UI components

- **Status:** Complete
- **Objective:** Create reusable visual components and shared design constants.
- **Main implementation work:**
  - `AppButton`, `AppCard`, `AppInput`, `PageHeader`
  - Color, spacing, and typography constants
  - Apply shared styling across screens
- **Expected files created or modified:**
  - `src/components/AppButton.tsx`
  - `src/components/AppCard.tsx`
  - `src/components/AppInput.tsx`
  - `src/components/PageHeader.tsx`
  - `src/constants/colors.ts`
  - `src/constants/spacing.ts`
  - `src/constants/typography.ts`
  - Screen updates to use shared components
- **Features included:** Consistent desktop visual foundation
- **Features intentionally excluded:** Feature-specific business logic, SQLite, timers
- **Testing required:** Manual visual consistency check; automated component tests in Stage 4
- **Completion criteria:** All screens use shared visual components consistently
- **Recommended Git commit message:** `Add shared FocusFlow UI components`
- **Dependencies on earlier stages:** Stage 1

### Stage 4 — Component tests

- **Status:** Complete
- **Objective:** Verify reusable component behavior.
- **Main implementation work:**
  - Jest interaction/display tests for shared components
- **Expected files created or modified:**
  - `__tests__/SharedComponents.test.tsx`
- **Features included:** Component behavior assertions
- **Features intentionally excluded:** Styling snapshot reliance, feature-domain tests
- **Testing required:**
  - AppButton `onPress`
  - Disabled AppButton
  - AppInput label
  - AppInput error message
  - PageHeader title and subtitle
  - Test IDs: `TC_UI_01` through `TC_UI_05`
- **Completion criteria:** All shared UI component tests pass; prior suites remain green
- **Recommended Git commit message:** `Add shared UI component tests`
- **Dependencies on earlier stages:** Stage 3

### Stage 5 — Task UI

- **Status:** Complete
- **Objective:** Build the temporary Task Management interface using React state.
- **Main implementation work:**
  - Task form and task list
  - Sample tasks on startup
  - Add, edit, complete, and delete actions
  - Priority, status, labels, duration, and due-date fields
  - No persistence yet
- **Expected files created or modified:**
  - `src/screens/TasksScreen.tsx`
  - `src/types/task.ts`
  - `src/components/PrioritySelect.tsx` (or equivalent)
  - `__tests__/TasksScreen.test.tsx`
- **Features included:** Temporary in-memory task CRUD-style UI interactions
- **Features intentionally excluded:** SQLite, TaskManager, lasting storage, advanced validation module (Stage 6)
- **Testing required:**
  - Sample tasks render
  - Complete updates status
  - Delete removes task
  - Edit fills form
  - Save adds task
  - Test IDs: `TC_TASK_UI_01` through `TC_TASK_UI_05`
- **Completion criteria:** Task UI works with temporary state; interaction tests pass
- **Recommended Git commit message:** `Implement task management UI and interaction tests`
- **Dependencies on earlier stages:** Stages 1–4

### Stage 6 — Task validation tests

- **Status:** In Progress
- **Objective:** Add reusable task validation and confirm invalid input is rejected.
- **Main implementation work:**
  - `taskValidation` utility
  - Title, description, priority, duration, label, and due-date rules
  - Field-specific errors and sanitized task input
  - Wire Save action in `TasksScreen` to validation
- **Expected files created or modified:**
  - `src/utils/taskValidation.ts`
  - `src/screens/TasksScreen.tsx`
  - `__tests__/TaskValidation.test.ts`
  - `__tests__/TasksScreen.test.tsx` (`TC_TASK_FORM_01`)
  - `documentation/testing-notes.md`
  - `test-results.txt`
- **Features included:** Client-side validation and sanitized save data
- **Features intentionally excluded:** TaskManager, SQLite, timer, goals, statistics, settings persistence
- **Testing required:**
  - Empty or whitespace title rejected
  - Valid task accepted
  - Text and labels trimmed
  - Length limits
  - Priority validation
  - Duration validation
  - Label limit
  - Duplicate and blank label removal
  - Invalid form submission blocked
  - Test IDs: `TC_TASK_VAL_01` through `TC_TASK_VAL_08`, `TC_TASK_FORM_01`
- **Completion criteria:**
  - Invalid tasks are not saved
  - Validation messages appear
  - All previous tests still pass
  - `testing-notes.md` is updated
- **Recommended Git commit message:** `Add task validation tests and update testing notes`
- **Dependencies on earlier stages:** Stage 5

### Stage 7 — TaskManager

- **Status:** Not Started
- **Objective:** Move task business logic out of `TasksScreen` into the Application / Business Logic Layer.
- **Main implementation work:**
  - `TaskManager` class or service
  - Create, update, complete, delete, restore
  - Business-rule validation
  - Parent/subtask completion rules
  - Trash-state behavior
  - Temporary repository or in-memory data source until Stage 9
- **Expected files created or modified:**
  - `src/managers/TaskManager.ts`
  - Potential updates to models and `TasksScreen`
- **Features included:** Centralized task business operations
- **Features intentionally excluded:** SQLite implementation, permanent storage
- **Testing required:** Light smoke / refactor safety via existing UI tests; dedicated manager tests in Stage 8
- **Completion criteria:**
  - `TasksScreen` delegates task operations to `TaskManager`
  - UI does not directly contain core business rules
- **Recommended Git commit message:** `Add TaskManager business logic`
- **Dependencies on earlier stages:** Stages 5–6

### Stage 8 — TaskManager tests

- **Status:** Not Started
- **Objective:** Test task business rules independently of the UI.
- **Main implementation work:**
  - Unit tests with mock or in-memory repository
- **Expected files created or modified:**
  - `__tests__/TaskManager.test.ts` (or equivalent)
  - Possible test doubles for repository interfaces
- **Features included:** Business-rule coverage for create/update/trash/restore/subtasks
- **Features intentionally excluded:** Real SQLite I/O
- **Testing required:**
  - Create valid task
  - Reject invalid task
  - Update task
  - Move task to trash
  - Restore task
  - Prevent parent completion while subtasks remain incomplete
  - Allow parent completion when subtasks are complete
- **Completion criteria:** All TaskManager unit tests pass; prior suites remain green
- **Recommended Git commit message:** `Add TaskManager unit tests`
- **Dependencies on earlier stages:** Stage 7

### Stage 9 — SQLite repository

- **Status:** Not Started
- **Objective:** Add permanent local task storage.
- **Main implementation work:**
  - Database initialization
  - SQLite tables
  - `TaskRepository`
  - Create, read, update, trash, restore, and delete operations
  - Parameterized SQL
  - Database error handling
  - App-data database location
- **Expected files created or modified:**
  - `src/services/DatabaseService.ts`
  - `src/repositories/TaskRepository.ts`
  - Wiring updates so `TaskManager` uses `TaskRepository`
- **Features included:** Durable local task persistence
- **Features intentionally excluded:** Cloud sync, multi-user accounts
- **Testing required:** Repository automation in Stage 10; manual restart check as part of completion
- **Completion criteria:**
  - Tasks survive application restart
  - `TaskManager` uses `TaskRepository`
  - UI does not issue SQL directly
- **Recommended Git commit message:** `Add SQLite task repository`
- **Dependencies on earlier stages:** Stages 7–8

### Stage 10 — Repository tests

- **Status:** Not Started
- **Objective:** Verify SQLite persistence and repository operations.
- **Main implementation work:**
  - Automated repository tests and test DB cleanup
- **Expected files created or modified:**
  - `__tests__/TaskRepository.test.ts` (or equivalent)
  - Test helpers for temporary database paths
- **Features included:** Persistence and repository correctness checks
- **Features intentionally excluded:** Full product UI end-to-end except as already covered elsewhere
- **Testing required:**
  - Database initialization
  - Save / retrieve / update
  - Move to trash / restore / permanent deletion
  - Parameterized values
  - Test database cleanup
- **Completion criteria:** Repository tests pass; test DBs cleaned up; prior suites remain green
- **Recommended Git commit message:** `Add SQLite repository tests`
- **Dependencies on earlier stages:** Stage 9

### Stage 11 — Timer UI

- **Status:** Not Started
- **Objective:** Build the Focus Session interface.
- **Main implementation work:**
  - Large countdown
  - Work, short-break, and long-break states
  - Start, pause, resume, skip, reset
  - Task selection and session progress
  - Temporary test durations as needed for development
- **Expected files created or modified:**
  - `src/screens/FocusScreen.tsx` and related UI components
- **Features included:** Focus Session presentation and controls
- **Features intentionally excluded:** Final timer service, persistence, native notifications
- **Testing required:** Manual UI checks; deeper automated timer tests in Stage 13
- **Completion criteria:** Focus Session UI is usable for work/break flow mock states
- **Recommended Git commit message:** `Implement Focus Session timer UI`
- **Dependencies on earlier stages:** Stages 1–4 (UI foundation); Task list integration optional from Stages 5–9

### Stage 12 — TimerService and SessionManager

- **Status:** Not Started
- **Objective:** Implement reliable timer and session business logic.
- **Main implementation work:**
  - `TimerService` using system timestamps
  - `SessionManager` state transitions
  - Work interval, short break, long break after four work intervals
  - Pause/resume, skip/reset
  - Session completion records
  - Minimized-window accuracy strategy
- **Expected files created or modified:**
  - `src/services/TimerService.ts`
  - `src/managers/SessionManager.ts`
  - `src/models/FocusSession.ts`
- **Features included:** Reliable session timing and transitions
- **Features intentionally excluded:** Native notifications (Stage 20), full statistics dashboard (Stage 16)
- **Testing required:** Automated coverage in Stage 13
- **Completion criteria:** Timer/session logic exists and can drive the Focus UI
- **Recommended Git commit message:** `Add timer and session management services`
- **Dependencies on earlier stages:** Stage 11

### Stage 13 — Timer tests with fake timers

- **Status:** Not Started
- **Objective:** Test timer behavior without waiting for real Pomodoro durations.
- **Main implementation work:**
  - Jest fake-timer tests and timestamp recalculation coverage
- **Expected files created or modified:**
  - `__tests__/TimerService.test.ts` and/or `__tests__/SessionManager.test.ts`
- **Features included:** Deterministic timer/session automation
- **Features intentionally excluded:** Real-time long-duration waits
- **Testing required:**
  - Start, pause, resume, reset, skip
  - One-second updates
  - Work-to-break transition
  - Long break after four work sessions
  - Jest fake timers
  - Timestamp recalculation
- **Completion criteria:** Timer/session suites pass; prior suites remain green
- **Recommended Git commit message:** `Add timer and session tests`
- **Dependencies on earlier stages:** Stage 12

### Stage 14 — Goals

- **Status:** Not Started
- **Objective:** Build daily and weekly goal functionality.
- **Main implementation work:**
  - Daily and weekly targets
  - Completed-task, focus-minute, and focus-session targets
  - Progress displays and completion message
- **Expected files created or modified:**
  - `src/models/Goal.ts`
  - Goal screen updates
  - Potential repository placeholder
- **Features included:** Goal tracking UI and model
- **Features intentionally excluded:** Full GoalManager test suite (Stage 15), advanced notifications
- **Testing required:** Manual goals screen checks; automated manager tests in Stage 15
- **Completion criteria:** Users can view/set basic daily/weekly goals and see progress placeholders
- **Recommended Git commit message:** `Implement daily and weekly goals`
- **Dependencies on earlier stages:** Stages 5–13 for meaningful progress inputs where available

### Stage 15 — GoalManager tests

- **Status:** Not Started
- **Objective:** Test goal calculations and completion rules.
- **Main implementation work:**
  - `GoalManager`
  - Progress calculations, daily/weekly totals, completion determination
  - Notification trigger interface (no mandatory native delivery yet)
- **Expected files created or modified:**
  - `src/managers/GoalManager.ts`
  - `__tests__/GoalManager.test.ts`
- **Features included:** Goal business logic and automation
- **Features intentionally excluded:** Full Windows notification integration (Stage 20)
- **Testing required:**
  - Partial progress
  - Full completion
  - One missing target
  - Daily totals
  - Weekly totals
- **Completion criteria:** GoalManager tests pass; prior suites remain green
- **Recommended Git commit message:** `Add GoalManager and goal tests`
- **Dependencies on earlier stages:** Stage 14

### Stage 16 — Statistics

- **Status:** Not Started
- **Objective:** Build the productivity statistics dashboard.
- **Main implementation work:**
  - Completed tasks and sessions
  - Focus time and break time
  - Productivity score and result
  - Streaks
  - Daily and weekly summaries
  - 90-day history placeholder or heatmap
- **Expected files created or modified:**
  - `src/screens/StatisticsScreen.tsx` and supporting components/models
- **Features included:** Statistics dashboard presentation
- **Features intentionally excluded:** Full StatisticsEngine unit suite (Stage 17)
- **Testing required:** Manual dashboard checks; calculation tests in Stage 17
- **Completion criteria:** Statistics screen shows core productivity metrics from available data
- **Recommended Git commit message:** `Implement productivity statistics dashboard`
- **Dependencies on earlier stages:** Task/session data from Stages 7–13; goals optional

### Stage 17 — StatisticsEngine tests

- **Status:** Not Started
- **Objective:** Test productivity calculations independently.
- **Main implementation work:**
  - `StatisticsEngine`
  - Daily summary, score calculation, result mapping, streak calculation
  - 90-day history data preparation
  - Result categories: Excellent, Good, Fair, Needs Improvement
- **Expected files created or modified:**
  - `src/engines/StatisticsEngine.ts` (or equivalent path)
  - `__tests__/StatisticsEngine.test.ts`
- **Features included:** Pure statistics calculations
- **Features intentionally excluded:** Chart library styling / visual regression
- **Testing required:**
  - Totals
  - Score boundaries
  - Result categories
  - Empty data
  - Streak behavior
- **Completion criteria:** StatisticsEngine tests pass; prior suites remain green
- **Recommended Git commit message:** `Add StatisticsEngine tests`
- **Dependencies on earlier stages:** Stage 16

### Stage 18 — Settings

- **Status:** Not Started
- **Objective:** Implement application configuration.
- **Main implementation work:**
  - Work / short-break / long-break durations
  - Auto-start
  - Notification and sound preferences
  - Theme selection
  - Ambient audio choice
  - Goal defaults
  - Backup preferences
  - Startup behavior
  - Minimize-to-tray preference
  - Local persistence
- **Expected files created or modified:**
  - `src/models/AppSettings.ts`
  - `src/repositories/SettingsRepository.ts`
  - `src/context/SettingsContext.tsx`
  - Settings screen updates
- **Features included:** Configurable app settings with local storage
- **Features intentionally excluded:** Full native tray/startup wiring (Stage 20) beyond preference fields
- **Testing required:** Dedicated Stage 19 automation; manual settings screen checks
- **Completion criteria:** Settings can be viewed/updated and stored locally
- **Recommended Git commit message:** `Implement application settings`
- **Dependencies on earlier stages:** Stages 1–4; timer/goals fields align with later stages as available

### Stage 19 — Settings tests

- **Status:** Not Started
- **Objective:** Test settings defaults, validation, updates, and persistence.
- **Main implementation work:**
  - Settings unit/integration tests and repository checks
- **Expected files created or modified:**
  - `__tests__/Settings.test.ts` / `__tests__/SettingsRepository.test.ts`
- **Features included:** Settings correctness and persistence verification
- **Features intentionally excluded:** Native OS policy beyond repository scope
- **Testing required:**
  - Default settings
  - Valid updates
  - Invalid duration rejection
  - Notification preference
  - Theme preference
  - Reload after restart
  - Repository persistence
- **Completion criteria:** Settings tests pass; prior suites remain green
- **Recommended Git commit message:** `Add settings tests`
- **Dependencies on earlier stages:** Stage 18

### Stage 20 — Windows features

- **Status:** Not Started
- **Objective:** Add native Windows desktop behavior.
- **Main implementation work:**
  - Native notifications
  - Audio alerts
  - Minimize to system tray
  - Launch on Windows login
  - Timer continuation while minimized
  - Crash recovery and restore active session
  - Local AppData path usage
  - Optional backup and restore
  - CSV/PDF export if included in current project scope
- **Expected files created or modified:**
  - Windows integration modules/services as needed
  - Settings wiring for tray/startup preferences
  - Manual procedures documented in `testing-notes.md`
- **Features included:** Native Windows desktop integrations
- **Features intentionally excluded:** Cloud sync / online accounts
- **Testing required:**
  - Jest tests where practical
  - Manual Windows testing for native behavior
  - Record manual test procedures in `testing-notes.md`
- **Completion criteria:** Required Windows behaviors work; manual procedures documented; automated suites remain green
- **Recommended Git commit message:** `Add Windows desktop integrations`
- **Dependencies on earlier stages:** Stages 12–13 (timer), 18–19 (settings), prior storage stages

### Stage 21 — Final integration tests

- **Status:** Not Started
- **Objective:** Verify that all modules work together and satisfy the SRS and SDD.
- **Main implementation work:**
  - End-to-end automated and manual acceptance coverage
  - Regression across every previous suite
  - Performance spot-checks
- **Expected files created or modified:**
  - Integration test files as needed
  - Final updates to `testing-notes.md` and `test-results.txt`
- **Features included:** Full-product verification
- **Features intentionally excluded:** New feature development beyond residual fixes
- **Testing required:**
  - End-to-end task lifecycle
  - TaskManager plus repository
  - Timer plus session storage
  - Goal updates from completed tasks and sessions
  - Statistics updates from stored data
  - Settings persistence
  - Restart persistence
  - Trash and restore
  - Subtask rules
  - Offline operation
  - Windows notifications
  - Backup and restore
  - Regression test of every previous suite
  - Manual acceptance testing
  - Performance checks: app startup, report loading, one-second timer updates
- **Completion criteria:**
  - All automated suites pass
  - Required manual tests pass
  - No critical unresolved defects
  - `testing-notes.md` contains final totals
  - Software Test Document information is ready for the teammate writing the report
- **Recommended Git commit message:** `Complete final integration testing`
- **Dependencies on earlier stages:** Stages 1–20

---

## Test Documentation Strategy

| Artifact | Purpose |
|---|---|
| `test-results.txt` | Stores the latest full Jest output from the Windows test command |
| `documentation/testing-notes.md` | Stores structured test-plan, test-case, test-procedure, result, defect, and summary information |
| IEEE Software Test Document | Produced by a teammate using `testing-notes.md` as source material |

Rules:

- Actual results must come from test execution and must not be invented.
- After each stage with test work, refresh `test-results.txt` and update `testing-notes.md`.
- Keep test case IDs stable so the Software Test Document can reference them consistently.

Preferred command:

```
npm run test:windows -- --verbose > test-results.txt 2>&1
```

---

## Git Commit Reference

| Stage | Recommended commit message |
|---|---|
| 1. App shell | `Add FocusFlow desktop navigation shell` |
| 2. Navigation Jest tests | `Add Jest navigation tests` |
| 3. Shared UI components | `Add shared FocusFlow UI components` |
| 4. Component tests | `Add shared UI component tests` |
| 5. Task UI | `Implement task management UI and interaction tests` |
| 6. Task validation tests | `Add task validation tests and update testing notes` |
| 7. TaskManager | `Add TaskManager business logic` |
| 8. TaskManager tests | `Add TaskManager unit tests` |
| 9. SQLite repository | `Add SQLite task repository` |
| 10. Repository tests | `Add SQLite repository tests` |
| 11. Timer UI | `Implement Focus Session timer UI` |
| 12. TimerService and SessionManager | `Add timer and session management services` |
| 13. Timer tests with fake timers | `Add timer and session tests` |
| 14. Goals | `Implement daily and weekly goals` |
| 15. GoalManager tests | `Add GoalManager and goal tests` |
| 16. Statistics | `Implement productivity statistics dashboard` |
| 17. StatisticsEngine tests | `Add StatisticsEngine tests` |
| 18. Settings | `Implement application settings` |
| 19. Settings tests | `Add settings tests` |
| 20. Windows features | `Add Windows desktop integrations` |
| 21. Final integration tests | `Complete final integration testing` |

---

## Definition of Done

A stage is complete only when all of the following are true:

- Required implementation is finished
- Existing behavior still works
- Required tests are added
- All tests pass
- `test-results.txt` is refreshed
- `documentation/testing-notes.md` is updated
- The app launches successfully
- Changes are committed and pushed

Do not start the next stage until the current stage meets this definition of done.
