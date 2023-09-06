module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: "umd",
        useBuiltIns: "entry",
        corejs: {
          version: "3.30",
          proposals: true,
        },
      },
    ],
  ],
  plugins: ["@babel/plugin-transform-runtime"],
};
