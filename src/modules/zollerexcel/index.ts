import fs from "node:fs";
import path from "node:path";
import _ from "lodash";
import nodeFetch from "node-fetch";
import readExcel from "../../common/excel/index.js";
import watch from "node-watch";

let arrPath: string[] = [];
let arrRemovePath: string[] = [];
let baseDate = Date.now();

// 졸러 export 감지 못함, 파일삭제 감지함
const watchingDir = async (dirPath: string) => {
  watch(
    dirPath,
    {
      recursive: true,
    },
    (eventType, fullPath) => {
      if (fullPath && (eventType === "update" || eventType === "remove")) {
        const fileName = path.parse(fullPath).name;
        const ext = path.parse(fullPath).ext;

        if (fileName === _.toNumber(fileName).toString()) {
          if (ext === ".xls") {
            if (eventType === "update") {
              if (!arrPath.includes(fullPath)) {
                baseDate = Date.now() + 5000;
                arrPath.push(fullPath);
                arrPath = _.uniq(arrPath);

                console.log(
                  `watch ::: ${new Date().toLocaleTimeString()}`,
                  arrPath
                );
              }
            }

            if (eventType === "remove") {
              if (
                !arrRemovePath.includes(fullPath) &&
                !arrPath.includes(fullPath)
              ) {
                baseDate = Date.now() + 5000;
                arrRemovePath.push(fullPath);
                arrRemovePath = _.uniq(arrRemovePath);

                console.log(
                  `remove ::: ${new Date().toLocaleTimeString()}`,
                  arrRemovePath
                );
              }
            }
          }
        }
      }
    }
  );
};

// 졸러 export 감지함, 파일삭제 감지 못함
const watchingDir2 = async (dirPath: string) => {
  fs.watch(
    dirPath,
    {
      persistent: false,
      recursive: true,
    },
    (eventType, fullPath) => {
      if (fullPath && eventType === "change") {
        const fileName = path.parse(fullPath).name;
        const ext = path.parse(fullPath).ext;

        if (fileName === _.toNumber(fileName).toString()) {
          if (ext === ".xls") {
            if (!arrPath.includes(fullPath)) {
              baseDate = Date.now() + 5000;
              arrPath.push(path.join(dirPath, fullPath));
              arrPath = _.uniq(arrPath);

              console.log(
                `watch2 ::: ${new Date().toLocaleTimeString()}`,
                arrPath
              );
            }
          }
        }
      }
    }
  );
};

const startRead = async (dirPath: string): Promise<void> => {
  watchingDir(dirPath);
  watchingDir2(dirPath);
  sendExcel();
  removeExcel();
};

const sendExcel = async () => {
  //console.log("sendExcel : ", arrPath.length.toString());

  if (baseDate - Date.now() > 0) {
    setTimeout(sendExcel, baseDate - Date.now());
    return;
  }

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

const removeExcel = async () => {
  if (baseDate - Date.now() > 0) {
    setTimeout(removeExcel, baseDate - Date.now());
    return;
  }

  const excelFilePaths: string[] = [];

  try {
    while (arrRemovePath.length > 0 && excelFilePaths.length < 10) {
      const strPath = arrRemovePath.shift();
      if (strPath !== undefined) excelFilePaths.push(strPath);
      else break;
    }

    const removableFiles: ZollerExcel[] = [];
    excelFilePaths.map((el) => {
      if (!fs.existsSync(el)) {
        removableFiles.push(getZollerExcel(el));
      }
    });

    if (removableFiles.length > 0) {
      console.log(
        `\x1b[32m%s\x1b[33m%s\x1b[37m`,
        `삭제 대상파일 : `,
        `${removableFiles.length} 개`
      );

      const sendData = removableFiles;

      const res = await Promise.all(
        sendData.map((data) => {
          return nodeFetch(_CONFIG.apiUrl, {
            method: "DELETE",
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
          if (strPath !== undefined) arrRemovePath.push(strPath);
        }
        fail.map((el) => {
          console.log(el);
        });
      } else printResult(succDatas);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
      _LOG.error(err.message);
    }

    while (excelFilePaths.length > 0) {
      const strPath = excelFilePaths.shift();
      if (strPath !== undefined) arrRemovePath.push(strPath);
    }

    baseDate = Date.now() + 30000;
  } finally {
    const delay = baseDate - Date.now();

    setTimeout(removeExcel, delay > 5000 ? delay : 5000);
  }
};

const convertZollerExcel = (excelInfo: ExcelInfo): ZollerExcelFile => {
  const { jobOrderNo, xNo } = getZollerExcel(excelInfo.filePath);
  const sheetDatas = getSheetDatas(excelInfo);

  return {
    jobOrderNo,
    xNo,
    sheetDatas,
  };
};

const getZollerExcel = (filePath: string): ZollerExcel => {
  const jobOrderNo = _toString(
    path.dirname(filePath).toString().split(path.sep).pop()
  );
  const xNo = _toString(path.parse(filePath).name);
  return {
    jobOrderNo,
    xNo,
  };
};

const getSheetDatas = (excelInfo: ExcelInfo) => {
  const sheetDatas = new Array<ZollerExcelData>();

  const arrCol = Array<string>();

  excelInfo.jsonDatas.map((el) => {
    const step: string = el[Object.keys(el)[0]]; //첫번째 컬럼

    if (step !== "") {
      //컬럼 = 'Step' => 헤드행 데이터가 있는 열을 저장
      if (step.toLowerCase() === "step") {
        Object.entries(el).map((el2) => {
          if (_toString(el2[1]) !== "") {
            arrCol.push(el2[0]);
          }
        });
      }

      if (Number(step) > 0) {
        // (-) 규격 보정
        if (Number(el[arrCol[2]]) < 0) {
          el[arrCol[2]] *= -1;
          el[arrCol[5]] *= -1;
          el[arrCol[6]] *= -1;
        }

        sheetDatas.push({
          seqNo: sheetDatas.length + 1,
          stepNo: Number(step),
          result: _toString(el[arrCol[1]]),
          nomValue: _toString(el[arrCol[2]]).replace(/\\/g, ""),
          uTol: _toString(el[arrCol[3]]).replace(/\\/g, ""),
          lTol: _toString(el[arrCol[4]]).replace(/\\/g, ""),
          actValue: _toString(el[arrCol[5]]).replace(/\\/g, ""),
          diffValue: _toString(el[arrCol[6]]).replace(/\\/g, ""),
        });
      }
    }
  });

  return sheetDatas;
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
