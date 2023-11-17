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
    "react/forbid-prop-types": "off",
    "react/jsx-filename-extension": ["error", { extensions: [".js"] }],
    "react/jsx-fragments": "off",
    "react/jsx-props-no-spreading": "off",
    "react/state-in-constructor": "off",
    "react/static-property-placement": "off",
  },
  parserOptions: {
    ecmaVersion: "2018",
  },
};
