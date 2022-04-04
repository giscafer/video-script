module.exports = {
  globals: {
    'js-jest': {
      useESM: true,
      // isolatedModules: true,
    },
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // The test environment that will be used for testing
  testEnvironment: 'node',
};
