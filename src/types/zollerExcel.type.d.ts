type ZollerExcel = {
  jobOrderNo: string;
  xNo: number;
};

type ZollerExcelFile = ZollerExcel & {
  sheetDatas: ZollerExcelData[];
};

type ZollerExcelData = {
  seqNo: number;
  stepNo: number;
  result: string;
  nomValue: number;
  uTol?: number;
  lTol?: number;
  actValue: number;
  diffValue: number;
};
