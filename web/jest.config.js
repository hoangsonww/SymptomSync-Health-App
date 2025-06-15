/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",

  // jsdom gives us a browser-like environment for @testing-library.
  testEnvironment: "jsdom",

  // Runs *after* Jest is ready but before every test file.
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Treat CSS/SCSS/SVG, etc. as empty mocks so the import won't blow up.
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    // Alias support that matches your `tsconfig.json` / NextJS config.
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
  },

  // ts-jest needs to know where tsconfig is.
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { tsconfig: "./tsconfig.json" }],
  },
};
