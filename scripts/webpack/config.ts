import { merge } from "webpack-merge";
import { Configuration } from "webpack";
import path from "path";

function resolve(dir: string) {
  return path.resolve(process.cwd(), dir);
}
import config from "./base";

const builds: { [key: string]: Configuration } = {
  "full-dev": {
    mode: "development",
    entry: "./src/index.ts",
    output: {
      globalObject: "this",
      filename: "vuex.js",
      path: resolve("dist/webpack"),
      libraryTarget: "umd",
      libraryExport: "default",
      library: "Vuex",
    },
    devtool: "eval-cheap-module-source-map",
  },
};
function getConfig(target: string) {
  const opts = builds[target];

  return merge(opts, config.toConfig());
}

module.exports = function (
  env: NodeJS.ProcessEnv,
  args: { [key: string]: any }
) {
  let res: Configuration = {};
  if (env.target) {
    return getConfig(env.target);
  }

  return res;
};
