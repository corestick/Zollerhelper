import start from "./app.js";
import init from "./common/index.js";
import env from "dotenv";

env.config();
init();
start();
