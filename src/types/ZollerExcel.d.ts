interface ZollerData {
  jobOrderNo: string;
  xNo: number;
  seqNo: number;
  stepNo: number;
  result: string;
  nomValue: number;
  uTol?: number;
  lTol?: number;
  actValue: number;
  diffValue: number;
}

interface SendStatus {
  jobOrderNo: string;
  xCount: number;
  xMin: number;
  xMax: number;
  step: number;
}

interface SendData {
  jobOrderNo: string;
  xNo: number;
}
