import xlsx from "xlsx";
import fs from "node:fs";
import path from "node:path";

const readExcel = (excelPath: string) => {
  const excelFile = xlsx.readFile(excelPath);
  const sheets = excelFile.SheetNames;
  const firstSheet = excelFile.Sheets[sheets[0]];

  return {
    filePath: excelPath,
    jsonData: xlsx.utils.sheet_to_json(firstSheet, { defval: "" }),
  };
};

export const readFile = async (
  basePath: string,
  ext?: string[]
): Promise<string[]> => {
  const result: string[] = new Array<string>();

  console.log(`readFile [${basePath}]`);

  const files = await fs.promises.readdir(basePath, {
    withFileTypes: true,
  });

  console.log(result);

  for (const el of files) {
    const childPath = path.join(basePath, el.name);
    result.push(childPath);
  }

  console.log(result);

  return result;
};

export const readFile2 = async (
  basePath: string,
  ext?: string[]
): Promise<string[]> => {
  const result: string[] = new Array<string>();

  try {
    const files = await fs.promises.readdir(basePath, {
      withFileTypes: true,
    });

    for (const el of files) {
      const childPath = path.join(basePath, el.name);

      if (el.isDirectory()) {
        result.push(...(await readFile(childPath)));
      } else {
        if (ext?.includes(path.extname(el.name))) {
          result.push(childPath);
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
      _LOG.error(err.message);
    }
  }

  return result;
};

export default readExcel;
