import env from "dotenv";
import init from "./common/index.js";
import startRead from "./modules/zollerexcel/index.js";

env.config();
init();

export const start = async () => {
  _CONFIG.apiUrl = process.env.API_URL;
  const basePath = process.env.BASE_PATH || "./";
  console.log(`\x1b[34m%s`, `앱 시작 [${basePath}] : ${new Date()}`);

  startRead(basePath);
};

export default start;
