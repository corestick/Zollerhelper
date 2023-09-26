import xlsx from "xlsx";
import fs from "node:fs";
import path from "node:path";

const readExcel = (excelPath: string): ExcelInfo => {
  const excelFile = xlsx.readFile(excelPath);
  const sheets = excelFile.SheetNames;
  const firstSheet = excelFile.Sheets[sheets[0]];

  return {
    filePath: excelPath,
    jsonDatas: xlsx.utils.sheet_to_json(firstSheet, { defval: "" }),
  };
};

export const readFile = async (
  basePath: string,
  exts?: string[]
): Promise<string[]> => {
  const result: string[] = new Array<string>();

  try {
    const files = await fs.promises.readdir(basePath, {
      withFileTypes: true,
    });

    for (const file of files) {
      const childPath = path.join(basePath, file.name);

      if (file.isDirectory()) {
        result.push(...(await readFile(childPath, exts)));
      } else {
        if (!exts || exts.includes(path.extname(file.name))) {
          result.push(childPath);
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
    }
  }

  return result;
};

export default readExcel;
