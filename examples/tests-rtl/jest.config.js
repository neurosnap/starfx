export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(t|j)sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
  },
};
