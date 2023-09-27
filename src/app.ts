import startRead from "./modules/zollerexcel/index.js";

const start = () => {
  console.log(`\x1b[34m%s`, "앱 시작...");
  startRead(process.env.BASE_PATH || "./");
};

export default start;
