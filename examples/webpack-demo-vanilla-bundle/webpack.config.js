const { ProvidePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

// primary config:
const title = 'Slickgrid-Universal';
const baseUrl = '';
const outDirLocal = path.resolve(__dirname, 'dist');
const outDirProd = path.resolve(__dirname, '../../docs');
const srcDir = path.resolve(__dirname, 'src');

module.exports = ({ production } = {}, { hmr, port, host } = {}) => ({
  mode: production ? 'production' : 'development',
  entry: `${srcDir}/main.ts`,
  stats: {
    warnings: false
  },
  output: {
    path: production ? outDirProd : outDirLocal,
    publicPath: baseUrl,
    filename: '[name].[contenthash].bundle.js',
    sourceMapFilename: '[name].[contenthash].bundle.js.map',
    chunkFilename: '[name].[contenthash].chunk.js',

    // https://github.com/webpack/webpack/issues/11660
    chunkLoading: false,
    wasmLoading: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [srcDir, 'node_modules'],
    mainFields: ['browser', 'module', 'main'],
    alias: {
      moment: 'moment/moment.js'
    },
    fallback: {
      http: false,
      https: false,
      stream: false,
      util: false,
      zlib: false,
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [{ loader: MiniCssExtractPlugin.loader }, 'css-loader']
      },
      { test: /\.(sass|scss)$/, use: ['style-loader', 'css-loader', 'sass-loader'], issuer: /\.[tj]s$/i },
      { test: /\.(sass|scss)$/, use: ['css-loader', 'sass-loader'], issuer: /\.html?$/i },
      { test: /\.(png|gif|jpg|cur)$/i, loader: 'url-loader', options: { limit: 8192 } },
      { test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/, loader: 'file-loader' },
      { test: /\.html$/i, loader: 'html-loader' },
      { test: /\.ts?$/, use: [{ loader: 'ts-loader', options: { transpileOnly: true } }] }
    ],
  },
  devServer: {
    static: production ? outDirProd : outDirLocal,
    port: 8888,
    hot: false,
    host: 'localhost',
    open: true,
    historyApiFallback: true,
  },
  devtool: production ? false : 'eval-cheap-module-source-map',
  plugins: [
    new ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
    new HtmlWebpackPlugin({
      template: 'index.ejs',
      favicon: `${srcDir}/favicon.ico`,
      metadata: {
        // available in index.ejs //
        title, baseUrl
      }
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: `${srcDir}/favicon.ico`, to: 'favicon.ico' },
        { from: 'assets', to: 'assets' }
      ]
    }),
    new MiniCssExtractPlugin({ // updated to match the naming conventions for the js files
      filename: '[name].[contenthash].bundle.css',
      chunkFilename: '[name].[contenthash].chunk.css'
    }),
    // Note that the usage of following plugin cleans the webpack output directory before build.
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin()
  ]
});