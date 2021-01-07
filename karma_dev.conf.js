// Reference: http://karma-runner.github.io/0.12/config/configuration-file.html
module.exports = function karmaConfig (config) {
  config.set({
    basePath: './',

    frameworks: [
      // Reference: https://github.com/bessdsv/karma-jasmine-jquery
      // jQuery matchers and fixture loader for Jasmine framework
      'jasmine-jquery',

      // Reference: https://github.com/karma-runner/karma-jasmine
      // Set framework to jasmine
      'jasmine'
    ],

    reporters: [
      // Reference: https://github.com/mlex/karma-spec-reporter
      // Set reporter to print detailed results to console
      'spec'
    ],

    files: [
      'test/tests.webpack.js',
      'app/views/*.html'
    ],

    preprocessors: {
      'app/views/*.html': ['ng-html2js'],
      // Reference: http://webpack.github.io/docs/testing.html
      // Reference: https://github.com/webpack/karma-webpack
      // Convert files with webpack and load sourcemaps
      'test/tests.webpack.js': ['webpack', 'sourcemap']
    },

    browsers: [
      // Run tests using Chromium browser
      'Chromium'
    ],

    webpack: require('./webpack.config'),

    // Print webpack build information to console
    webpackMiddleware: {
      noInfo: false
    },

    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-jasmine-jquery',
      'karma-webpack',
      'karma-spec-reporter',
      'karma-ng-html2js-preprocessor',
      'karma-sourcemap-loader'
    ],

    // Reference: https://github.com/karma-runner/karma-ng-html2js-preprocessor
    ngHtml2JsPreprocessor: {
      stripPrefix: "app/",
      moduleName: "htmlTemplates"
    },
    
    singleRun: false,
    autoWatch: true,
    logLevel: config.LOG_DEBUG,
    concurrency: Infinity,
    port: 9876,
    colors: true,
  });
};
