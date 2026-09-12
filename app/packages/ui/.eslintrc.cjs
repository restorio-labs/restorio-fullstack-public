module.exports = {
  extends: ["../../../.eslintrc.react.json"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.eslint.json"],
  },
};
