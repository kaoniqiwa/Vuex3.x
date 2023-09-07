module.exports = [
  {
    input: "src/index.js",
    output: {
      file: "dist/vuex.esm.browser.js",
      name: "Vuex",
      format: "es",
      env: "development",
    },
  },
  {
    input: "src/index.js",
    output: {
      file: "dist/vuex.js",
      name: "Vuex",
      format: "es",
      env: "production",
    },
  },
];
