module.exports = {
  ignorePatterns: ["tests/unit/**"],
  root: true,
  extends: ["../../../.eslintrc.react.json"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.eslint.json"],
  },
};
