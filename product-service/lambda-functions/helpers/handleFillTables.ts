import { products } from "../constants/products";
import { writeRecordToDB } from "./writeRecordToDB";

const handleFillTables = async () => {
  await Promise.all(products.map((product) => writeRecordToDB(product)));
  console.log("Filled tables");
};

handleFillTables();
