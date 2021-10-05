/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/set-env.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/.aws-sam'],
}
