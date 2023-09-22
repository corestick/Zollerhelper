const zollerInsert = (): string => {
  return `
IF(Exists(
  Select 1
  From IFDB.dbo.MES_Zoller_Excel_Data (Nolock)
  Where JobOrderNo = @JobOrderNo
  And XNo = @xNo
  And SeqNo = @seqNo
))
  RETURN;

insert IFDB.dbo.MES_Zoller_Excel_Data
(
  JobOrderNo,
  XNo,
  SeqNo,
  StepNo,
  Result,
  NomValue,
  Utol,
  Ltol,
  ActValue,
  DiffValue,
  UpTime
)
Values
(
  @jobOrderNo,
  @xNo,
  @seqNo,
  @stepNo,
  @result,
  @nomValue,
  @uTol,
  @lTol,
  @actValue,
  @diffValue,
  GETDATE()
)
`;
};

export default zollerInsert;
