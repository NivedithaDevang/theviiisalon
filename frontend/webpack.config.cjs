const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/main.tsx",
  output: { path: path.resolve(__dirname, "dist"), filename: "assets/[name].[contenthash].js", clean: true },
  resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"] },
  module: {
    rules: [
      { test: /\.tsx?$/, exclude: /node_modules/, use: { loader: "ts-loader", options: { compilerOptions: { noEmit: false } } } },
      { test: /\.mp4$/, type: "asset/resource", generator: { filename: "assets/[name][ext]" } },
      { test: /\.mp4$/, type: "asset/resource", generator: { filename: "assets/[name][ext]" } },
      { test: /\.css$/, use: ["style-loader", "css-loader"] }
    ]
  },
  plugins: [new HtmlWebpackPlugin({ template: "./index.html" })],
  devServer: { static: "./dist", port: 5173, historyApiFallback: true, hot: true },
  devtool: "source-map"
};