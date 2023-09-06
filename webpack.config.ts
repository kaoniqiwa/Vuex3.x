import Config from "webpack-chain";
import HtmlWebpackPlugin from "html-webpack-plugin";
import merge from "webpack-merge";
import path from "path";

const configEntry = require("./scripts/webpack/config");

module.exports = function (env: NodeJS.ProcessEnv) {
  const config = new Config();
  const configObj: any = configEntry({ target: "full-dev" });

  config.plugin("html").use(HtmlWebpackPlugin, [
    {
      title: "vuex3",
      template: path.resolve("public/index.html"),
    },
  ]);
  return merge(configObj, config.toConfig());
};
