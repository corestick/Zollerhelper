import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const execFunc =
  (func: Function) =>
  async (...v: any) => {
    try {
      const t0 = performance.now();

      const res = await func(...v);

      const t1 = performance.now();

      console.log(func.name, `: ${Math.round((t1 - t0) * 100) / 100} ms`);

      return res;
    } catch (error) {
      if (error instanceof Error)
        console.log(`<${func.name}> ${error.name} : ${error.message}`);
      else console.log(String(error));

      throw error;
    }
  };

const getMax = (arrObj: Array<any>, comProp: string, retProp: string) => {
  if (!(arrObj instanceof Array)) return;
  if (arrObj.length === 0) return;

  const result = arrObj.reduce((acc: any, cur: any) => {
    return acc[comProp] < cur[comProp] ? cur : acc;
  });

  if (!hasObject(result, retProp)) return;

  return result[retProp];
};

const getMin = (arrObj: Array<any>, comProp: string, retProp: string) => {
  if (!(arrObj instanceof Array)) return;
  if (arrObj.length === 0) return;

  const result = arrObj.reduce((acc: any, cur: any) => {
    return acc[comProp] < cur[comProp] ? acc : cur;
  });

  if (!hasObject(result, retProp)) return;

  return result[retProp];
};

const lookup = (
  arrObj: Array<any>,
  searchProp: string,
  searchValue: string | number,
  retProp: string
) => {
  if (!(arrObj instanceof Array)) return;

  const result = arrObj.find((element: any) => {
    if (toString(element[searchProp]) === toString(searchValue)) return true;
  });

  if (!hasObject(result, retProp)) return result;

  return result[retProp];
};

const hasObject = (arrObj: any, propName: string): boolean => {
  if (arrObj === undefined) return false;

  const map = new Map(Object.entries(arrObj));
  return map.has(propName);
};

const toString = (arg: unknown): string => {
  if (arg === undefined) return "";
  if (arg === null) return "";

  return String(arg) || "";
};

const getDirName = (path: string) => {
  try {
    const filename = fileURLToPath(path);
    return dirname(filename);
  } catch {
    return path;
  }
};

export default { execFunc, getMin, getMax, lookup, toString, getDirName };
