import path from "node:path";
import _ from "lodash";
import nf from "node-fetch";
import readExcel, { readFile } from "../../common/excel";

const startRead = async (dirPath: string): Promise<void> => {
  console.log(
    `\x1b[32m%s\x1b[33m%s`,
    `Current path : `,
    `${path.resolve(dirPath)}`
  );

  try {
    const zollerDatas = new Array<ZollerData>();
    const excelFiles = await readFile(dirPath, new Array(".xls"));

    for (const excelFile of excelFiles) {
      zollerDatas.push(...getZollerExcel(readExcel(excelFile)));
    }

    const res = await Promise.all(
      zollerDatas.map((data) => {
        return nf(_CONFIG.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify(data),
        });
      })
    );

    const succ = _.filter(res, (o) => {
      return o.status === 200;
    });

    const fail = _.filter(res, (o) => {
      return o.status !== 200;
    });

    console.log(`\x1b[37m%s`, `성공 : ${succ.length}`, `실패 : ${fail.length}`);

    printResult(zollerDatas);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
    }
  }

  setTimeout(() => {
    startRead(dirPath);
  }, 15000);
};

const getZollerExcel = ({
  filePath,
  jsonData,
}: {
  filePath: string;
  jsonData: any[];
}) => {
  const result: ZollerData[] = [];

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

const printResult = (zollerDatas: ZollerData[]): void => {
  if (zollerDatas.length === 0) return;

  const maxData = _.filter(zollerDatas, (o) => {
    const obj = _.filter(zollerDatas, (p) => {
      return o.jobOrderNo === p.jobOrderNo;
    });

    const maxSeqNo = _.maxBy(obj, (p) => {
      return p.seqNo;
    })?.seqNo;

    return o.seqNo === maxSeqNo;
  });

  const jobOrderTable = new Array<SendStatus>();

  maxData.map((el) => {
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
