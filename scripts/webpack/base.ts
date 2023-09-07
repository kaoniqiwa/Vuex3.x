import Config from "webpack-chain";
import path from "path";
import { DefinePlugin } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

function resolve(dir: string) {
  return path.resolve(__dirname, "../", dir);
}
const config = new Config();

config.resolve.alias
  .set("@", resolve("src"))
  .end()
  .extensions.add(".js")
  .add(".ts")
  .end();

config.module
  .rule("typescript")
  .test(/\.tsx?/)
  .exclude.add(resolve("node_modules"))
  .end()
  .use("tsLoader")
  .loader("ts-loader")
  .end()
  .use("babel")
  .before("tsLoader")
  .loader("babel-loader");

config.module
  .rule("compile")
  .test(/\.js/)
  .exclude.add(resolve("node_modules"))
  .end()
  .include.add(resolve("src"))
  .end()
  .use("babel")
  .loader("babel-loader");

config.plugin("definePlugin").use(DefinePlugin, [
  {
    VERSION: JSON.stringify("HELLO"),
    __WEEX__: JSON.stringify(false),
  },
]);

export default config;
