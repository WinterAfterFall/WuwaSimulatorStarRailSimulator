/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/Test/automated/**/*.test.ts'],
};

module.exports = config;
