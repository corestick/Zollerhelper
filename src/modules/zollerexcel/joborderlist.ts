import fs from "node:fs";
import _ from "lodash";

const readFile = (path: string): any => {
  const file = fs.readFileSync(path, "utf-8");

  return JSON.parse(file);
};

const pushFile = (path: string, newObj: any, key: string) => {
  const json = readFile(path);

  _.find(json, (o) => {
    return o[key] === newObj[key];
  });
};
