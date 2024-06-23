import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { IProduct, products } from "./products";
import { randomUUID } from "crypto";

const db = DynamoDBDocument.from(new DynamoDB());

const handleFillTables = async () => {
  await Promise.all(products.map((product) => fillTable(product)));
  console.log("Filled tables");
};

const fillTable = async (product: Omit<IProduct, "id">) => {
  const id = randomUUID();

  const productsParams = {
    TableName: "products",
    Item: {
      id,
      title: product.title,
      description: product.description,
      price: product.price,
    },
  };

  const stockParams = {
    TableName: "stock",
    Item: {
      productId: id,
      count: product.count,
    },
  };

  const transactParams = {
    TransactItems: [{ Put: productsParams }, { Put: stockParams }],
  };

  return await db.transactWrite(transactParams);
};

handleFillTables();
