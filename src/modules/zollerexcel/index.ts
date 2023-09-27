import path from "node:path";
import _ from "lodash";
import nodeFetch from "node-fetch";
import readExcel, { readFile } from "../../common/excel/index.js";
import jsonDB from "./jsondb.js";

const startRead = async (dirPath: string): Promise<void> => {
  try {
    const excelFilePaths: string[] = await readFile(dirPath, new Array(".xls"));
    const zollerExcelFiles: ZollerExcelFile[] = await Promise.all(
      excelFilePaths.map((excelPath) => {
        const excelData: ExcelInfo = readExcel(excelPath);
        return convertZollerExcel(excelData);
      })
    );

    const filteredZollerFiles = await jsonDB.filterJobOrder(zollerExcelFiles);

    if (filteredZollerFiles.length > 0)
      console.log(
        `\x1b[32m%s\x1b[33m%s\x1b[37m`,
        `현재경로 : `,
        `${path.resolve(dirPath)}`
      );

    const sendData = _.flatten(
      filteredZollerFiles.map((datas) => {
        return datas.sheetDatas.map((data) => {
          return _.assign(
            { jobOrderNo: datas.jobOrderNo, xNo: datas.xNo },
            data
          );
        });
      })
    );

    const res = await Promise.all(
      sendData.map((data) => {
        return nodeFetch(_CONFIG.apiUrl, {
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

    const succDatas = await Promise.all(
      succ.map(async (res) => {
        const data = JSON.parse(await res.text()).result[0];
        return { jobOrderNo: data.JobOrderNo, xNo: data.XNo };
      })
    );

    await jsonDB.pushJobOrder(succDatas);

    if (sendData.length > 0)
      console.table([
        {
          대상: sendData.length,
          성공: succ.length,
          실패: fail.length,
        },
      ]);

    printResult(succDatas);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
    }
  }

  setTimeout(() => {
    startRead(dirPath);
  }, 15000);
};

const convertZollerExcel = (excelInfo: ExcelInfo): ZollerExcelFile => {
  const jobOrderNo = _toString(
    path.dirname(excelInfo.filePath).toString().split(path.sep).pop()
  );
  const xNo = _toString(path.parse(excelInfo.filePath).name);
  const sheetDatas = new Array<ZollerExcelData>();

  excelInfo.jsonDatas.map((el) => {
    const step: string = el[Object.keys(el)[0]];
    if (step !== "") {
      if (Number(step) > 0) {
        sheetDatas.push({
          seqNo: sheetDatas.length + 1,
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

  return {
    jobOrderNo,
    xNo,
    sheetDatas,
  };
};

const printResult = (zollerDatas: ZollerExcel[]): void => {
  if (zollerDatas.length === 0) return;

  const jobOrderTable = _.uniqWith(
    zollerDatas.map((data) => {
      return {
        작지번호: data.jobOrderNo,
        파일명: data.xNo,
      };
    }),
    _.isEqual
  );

  console.table(jobOrderTable);
};

export default startRead;
