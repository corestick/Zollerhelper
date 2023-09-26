import startRead from "./modules/zollerexcel";

const start = () => {
  console.log(`\x1b[34m%s`, "앱 시작...");
  startRead("./");
};

export default start;
