import fs from "node:fs";
import path from "node:path";
import _ from "lodash";
import nodeFetch from "node-fetch";
import readExcel from "../../common/excel/index.js";

let arrPath: string[] = [];
let baseDate = Date.now();

const watchingDir = async (dirPath: string) => {
  fs.watch(
    dirPath,
    {
      recursive: true,
    },
    (eventType, fullPath) => {
      if (fullPath && eventType === "change") {
        const fileName = path.parse(fullPath).name;
        const ext = path.parse(fullPath).ext;

        if (fileName === _.toNumber(fileName).toString()) {
          if (ext === ".xls") {
            if (!arrPath.includes(fullPath)) {
              arrPath.push(path.join(dirPath, fullPath));
              arrPath = _.uniq(arrPath);
              baseDate = Date.now() + 5000;
            }
          }
        }
      }
    }
  );
};

const startRead = async (dirPath: string): Promise<void> => {
  watchingDir(dirPath);
  sendExcel();
};

const sendExcel = async () => {
  //console.log("sendExcel : ", arrPath.length.toString());

  const excelFilePaths: string[] = [];

  try {
    while (arrPath.length > 0 && excelFilePaths.length < 10) {
      const strPath = arrPath.shift();
      if (strPath !== undefined) excelFilePaths.push(strPath);
      else break;
    }

    const zollerExcelFiles: Array<ZollerExcelFile | undefined> =
      await Promise.all(
        excelFilePaths.map((excelPath) => {
          if (!fs.existsSync(excelPath)) return;

          const excelData: ExcelInfo = readExcel(excelPath);
          return convertZollerExcel(excelData);
        })
      );

    const readableFiles: ZollerExcelFile[] = [];
    zollerExcelFiles.map((el) => {
      if (el !== undefined) {
        readableFiles.push(el);
      }
    });

    if (readableFiles.length > 0) {
      console.log(
        `\x1b[32m%s\x1b[33m%s\x1b[37m`,
        `대상파일 : `,
        `${readableFiles.length} 개`
      );

      const sendData = _.flatten(
        readableFiles.map((datas) => {
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

      if (sendData.length > 0) {
        console.table([
          {
            대상: sendData.length,
            성공: succ.length,
            실패: fail.length,
          },
        ]);
      }

      if (fail.length > 0) {
        while (excelFilePaths.length > 0) {
          const strPath = excelFilePaths.shift();
          if (strPath !== undefined) arrPath.push(strPath);
        }
      } else printResult(succDatas);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
      _LOG.error(err.message);
    }

    while (excelFilePaths.length > 0) {
      const strPath = excelFilePaths.shift();
      if (strPath !== undefined) arrPath.push(strPath);
    }

    baseDate = Date.now() + 30000;
  } finally {
    const delay = baseDate - Date.now();

    setTimeout(sendExcel, delay > 5000 ? delay : 5000);
  }
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
          nomValue: _toString(el.__EMPTY_2).replace(/\\/g, ""),
          uTol: _toString(el.__EMPTY_5).replace(/\\/g, ""),
          lTol: _toString(el.__EMPTY_7).replace(/\\/g, ""),
          actValue: _toString(el.__EMPTY_9).replace(/\\/g, ""),
          diffValue: _toString(el.__EMPTY_14).replace(/\\/g, ""),
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
