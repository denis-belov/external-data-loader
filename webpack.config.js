/*
eslint-disable
linebreak-style,
id-length,
no-sync
*/

const path = require('path');
const fs = require('fs');

module.exports = (
  {
    entry,
    dirname,
  },

  {
    BannerPlugin,
  },
) => ({
  entry,

  output: {
    path: path.join(dirname, 'build'),
    filename: 'index.js',
    library: '@xgk/js-web-loader',
    libraryTarget: 'umd',
  },

  module: {
    rules: [
      {
        test: /\.js$/,

        exclude: /node_modules/,

        use: [
          { loader: 'babel-loader' },

          {
            loader: 'eslint-loader',
            options: {
              configFile: './.eslintrc.js',
            },
          },
        ],
      },
    ],
  },

  // optimization: {
  //   minimizer: [ new UglifyJsPlugin({
  //     uglifyOptions: {
  //       warnings: false,
  //       parse: {},
  //       compress: {
  //         toplevel: true,
  //         drop_console: true,
  //         inline: true,
  //       },
  //       mangle: true,
  //       output: null,
  //       toplevel: true,
  //       nameCache: null,
  //       ie8: false,
  //       keep_fnames: false,
  //     },
  //   }) ],
  // },

  plugins: [ new BannerPlugin({ banner: fs.readFileSync('./LICENSE', 'utf8') }) ],
});
