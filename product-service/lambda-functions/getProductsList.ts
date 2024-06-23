import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "";

const db = DynamoDBDocument.from(new DynamoDB());

exports.handler = async () => {
  const productsParams = {
    TableName: PRODUCTS_TABLE_NAME,
  };

  const stockParams = {
    TableName: STOCK_TABLE_NAME,
  };

  try {
    const productsRes = await db.scan(productsParams);
    const stocksRes = await db.scan(stockParams);
    const products = productsRes.Items;
    const stocks = stocksRes.Items;

    const productsWithCount = products?.map((product) => {
      const stock = stocks?.find((item) => item.productId === product.id);

      const count = !stock ? 0 : stock.count;

      return {
        ...product,
        count,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(productsWithCount),
    };
  } catch (dbError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `DynamoDB Error: ${dbError}` }),
    };
  }
};
