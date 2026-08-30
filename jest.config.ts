import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    // Jest cannot execute CSS. A style import in a component is a no-op here.
    '\\.css$': '<rootDir>/tests/support/cssStub.ts',
    // `bundle-text:` is a Parcel pipeline, not a path Node can resolve.
    '^bundle-text:': '<rootDir>/tests/support/svgStub.ts',
  },
  transform: {
    // The base tsconfig targets a bundler (ESM); Jest needs CommonJS.
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Only the module format is overridden. moduleResolution stays
          // "bundler" from the base tsconfig — TS 6 accepts that pair and
          // already considers node10 obsolete.
          module: 'CommonJS',
        },
      },
    ],
  },
  clearMocks: true,
  collectCoverageFrom: ['src/lib/**/*.ts', 'src/data/**/*.ts'],
}

export default config
