module.exports = {
  presets: [
    "@babel/preset-react",
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: [">0.25%", "not op_mini all"],
        },
        useBuiltIns: "entry",
        corejs: 3,
      },
    ],
  ],
  plugins: ["@babel/plugin-proposal-class-properties"],
};
