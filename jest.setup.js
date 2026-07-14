/**
 * Jest setup for FocusFlow Windows tests.
 * Native SQLite is not required for unit/UI suites; TaskManager uses
 * InMemoryTaskRepository under JEST_WORKER_ID, and native modules are stubbed.
 */

jest.mock('react-native-turbo-sqlite', () => ({
  __esModule: true,
  default: {
    openDatabaseAsync: jest.fn(async () => {
      throw new Error(
        'Native SQLite is mocked in Jest. Use InMemoryTaskRepository.',
      );
    }),
    openDatabase: jest.fn(() => {
      throw new Error(
        'Native SQLite is mocked in Jest. Use InMemoryTaskRepository.',
      );
    }),
    getVersionString: jest.fn(() => 'mock'),
  },
}));

beforeEach(() => {
  const {taskManager} = require('./src/managers/TaskManager');
  const {
    InMemoryTaskRepository,
  } = require('./src/repositories/InMemoryTaskRepository');
  taskManager.replaceRepositoryForTests(new InMemoryTaskRepository());
});
