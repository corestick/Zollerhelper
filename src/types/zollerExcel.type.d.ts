interface ZollerExcel {
  jobOrderNo: string;
  xNo: number;
}

interface ZollerExcelFile extends ZollerExcel {
  sheetDatas: ZollerExcelData[];
}

interface ZollerExcelData {
  seqNo: number;
  stepNo: number;
  result: string;
  nomValue: number;
  uTol?: number;
  lTol?: number;
  actValue: number;
  diffValue: number;
}
