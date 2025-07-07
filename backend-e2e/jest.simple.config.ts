export default {
  displayName: 'backend-e2e-simple',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  maxWorkers: 1,
  testTimeout: 30000,
  testMatch: [
    '<rootDir>/src/modules/role/role.e2e-spec.ts',
    '<rootDir>/src/modules/user/user.e2e-spec.ts',
  ],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/backend-e2e',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  moduleNameMapper: {
    '^../support/(.*)$': '<rootDir>/src/support/$1',
  },
};
