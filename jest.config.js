module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/source/features/**/*.test.ts', '**/tests/**/*.test.ts'],
  // Integration tests hit a live server + PostgreSQL over real HTTP; give each
  // case headroom above Jest's 5s default.
  testTimeout: 60000,
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
