module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Muat env test sebelum modul apa pun (config/env baca process.env saat import)
    setupFiles: ['<rootDir>/tests/setup/loadEnv.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    // Phase 0: alias batas runtime generik (selaras tsconfig paths @core/*)
    moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/$1',
    },
    // E2E (Playwright) punya runner sendiri — jangan dijalankan Jest
    testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/migrations/**',
        '!src/index.ts',
    ],
    coverageDirectory: 'coverage',
    // ali-oss & native deps lambat di-transform; biarkan default
    maxWorkers: 1, // sqlite in-memory + DataSource tunggal → serial lebih stabil
    testTimeout: 20000,
}
