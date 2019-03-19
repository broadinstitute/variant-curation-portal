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
      },
    ],
  ],
  plugins: ["@babel/plugin-proposal-object-rest-spread", "@babel/plugin-proposal-class-properties"],
};
