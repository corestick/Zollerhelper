import util from "./util.js";
import logger from "./logger.js";
import { EOL } from "os";
import Errors from "./errors.js";
import Config from "../config/environment/index.js";

const init = () => {
  globalThis._LOG = logger;
  globalThis._EOL = EOL;
  globalThis._COM = util;
  globalThis._ERR = Errors;
  globalThis._CONFIG = Config;

  globalThis._dirname = util.getDirName;
  globalThis._toString = util.toString;
  globalThis._execFunc = util.execFunc;
};

export default init;
