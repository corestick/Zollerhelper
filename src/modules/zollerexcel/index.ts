import path from "node:path";
import _ from "lodash";
import readExcel, { readFile } from "../../common/excel";
import sqls from "../../sqls";

export const test = async (dirPath: string) => {
  const datas = await readFile(dirPath);

  console.log(datas);
};

const startRead = async (dirPath: string) => {
  console.log(__dirname);

  console.log(path.parse(dirPath));

  try {
    const zollerExcel = new Array<ZollerExcel>();
    const queryString = sqls.zollerInsert();
    const querys = new Array<QueryString<ZollerExcel>>();
    const datas = await readFile(dirPath, [".xls"]);

    for (const row of datas) {
      const jsonData = getZollerExcel(readExcel(row));
      zollerExcel.push(jsonData[jsonData.length - 1]);

      jsonData.map((row) => {
        querys.push({ queryString, params: row });
      });
    }

    await _execQuery(querys);
    printResult(zollerExcel);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
      _LOG.error(err.message);
    }
  } finally {
    setTimeout((dirPath: string) => startRead(dirPath), 15000);
  }
};

const getZollerExcel = ({
  filePath,
  jsonData,
}: {
  filePath: string;
  jsonData: any[];
}) => {
  const result: ZollerExcel[] = [];

  const jobOrderNo = _toString(
    path.dirname(filePath).toString().split(path.sep).pop()
  );
  const xNo = _toString(path.parse(filePath).name);

  jsonData.map((el) => {
    const step: string = el[Object.keys(el)[0]];
    if (step !== "") {
      if (Number(step) > 0) {
        result.push({
          jobOrderNo: jobOrderNo,
          xNo: xNo,
          seqNo: result.length + 1,
          stepNo: Number(step),
          result: _toString(el.__EMPTY),
          nomValue: _toString(el.__EMPTY_2),
          uTol: _toString(el.__EMPTY_5),
          lTol: _toString(el.__EMPTY_7),
          actValue: _toString(el.__EMPTY_9),
          diffValue: _toString(el.__EMPTY_14),
        });
      }
    }
  });

  return result;
};

interface JobOrderTable {
  jobOrderNo: string;
  xCount: number;
  xMin: number;
  xMax: number;
  step: number;
}

const printResult = (zollerExcel: ZollerExcel[]): void => {
  const jobOrderTable = new Array<JobOrderTable>();

  zollerExcel.map((el) => {
    const idx = _.findIndex(jobOrderTable, (row) => {
      return row.jobOrderNo === el.jobOrderNo;
    });

    if (idx === -1)
      jobOrderTable.push({
        jobOrderNo: el.jobOrderNo,
        xCount: 1,
        xMin: el.xNo,
        xMax: el.xNo,
        step: el.stepNo,
      });
    else {
      const jobOrderNo = jobOrderTable[idx];
      jobOrderNo.xCount++;
      jobOrderNo.xMin = jobOrderNo.xMin > el.xNo ? el.xNo : jobOrderNo.xMin;
      jobOrderNo.xMax = jobOrderNo.xMax < el.xNo ? el.xNo : jobOrderNo.xMax;
    }
  });

  console.table(jobOrderTable);
};

export default startRead;
