import { JsonDB, Config } from "node-json-db";

const DB_NAME = "ZollerHelper" as const,
  TABLE_NAME = "JobOrder" as const;

const createDB = async (dbName: string) => {
  return new JsonDB(new Config(dbName, true, true, "/"));
};

const pushJobOrder = async (datas: ZollerExcel[]): Promise<void> => {
  const db = await createDB(DB_NAME);

  Promise.all(
    datas.map(async (data) => {
      if (data.jobOrderNo === undefined || data.xNo === undefined) return;

      const path = `/${TABLE_NAME}/${data.jobOrderNo}/${data.xNo}`;
      const row = await db.getObjectDefault<string>(path, "");

      if (row === "") {
        await db.push(path, data.xNo);
      } else {
        console.log(path, row);
      }
    })
  );
};

const filterJobOrders = async (
  datas: ZollerExcelFile[]
): Promise<ZollerExcelFile[]> => {
  const db = await createDB(DB_NAME);
  const result = new Array<ZollerExcelFile>();

  await Promise.all(
    datas.map(async (data) => {
      const path = `/${TABLE_NAME}/${data.jobOrderNo}/${data.xNo}`;
      const row = await db.getObjectDefault<string>(path, "");

      if (_toString(row) === "") {
        result.push(data);
      }
    })
  );

  return result;
};

const truncateJobOrder = async (db: JsonDB) => {
  await db.delete("/");
};

export default {
  filterJobOrders,
  pushJobOrder,
  truncateJobOrder,
};
