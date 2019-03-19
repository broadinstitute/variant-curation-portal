const path = require("path");

const BundleTracker = require("webpack-bundle-tracker");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const webpack = require("webpack");

const isDev = process.env.NODE_ENV === "development";

const config = {
  devServer: {
    historyApiFallback: true,
    port: 3000,
    proxy: {
      "/": "http://localhost:8000",
    },
    publicPath: "/static/bundles/",
    stats: "errors-only",
  },
  devtool: "source-map",
  entry: {
    bundle: "./assets/index.js",
  },
  mode: isDev ? "development" : "production",
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            rootMode: "upward",
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "static/bundles"),
    publicPath: "/static/bundles/",
    filename: "[name]-[hash].js",
  },
  plugins: [
    new webpack.EnvironmentPlugin({ NODE_ENV: "production" }),
    new BundleTracker({ filename: "./webpack-stats.json" }),
    new CleanWebpackPlugin(path.resolve(__dirname, "static/bundles")),
  ],
};

module.exports = config;
