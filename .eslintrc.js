module.exports = {
  extends: ["airbnb", "prettier", "prettier/react"],
  env: {
    browser: true,
  },
  overrides: [
    {
      files: ["**/*.test.js"],
      env: {
        jest: true,
      },
    },
  ],
  parser: "babel-eslint",
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    "react/jsx-filename-extension": ["error", { extensions: [".js"] }],
  },
  parserOptions: {
    ecmaVersion: "2018",
  },
};
