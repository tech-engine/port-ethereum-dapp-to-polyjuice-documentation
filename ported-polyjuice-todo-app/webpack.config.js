const path = require('path')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const Dotenv = require('dotenv-webpack')
module.exports = {
  entry: './src/app.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
      new NodePolyfillPlugin(),
      new Dotenv()
  ]
};