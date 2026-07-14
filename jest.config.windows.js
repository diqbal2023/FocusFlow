const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

module.exports = require('@rnx-kit/jest-preset')('windows', config);
