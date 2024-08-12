import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import { randomUUID } from "crypto";
import { ProductDto } from "./validateProductDto";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "products";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "stock";

const IMAGE_API = "https://api.unsplash.com";
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

const db = DynamoDBDocument.from(new DynamoDB());

export const writeRecordToDB = async (productDto: ProductDto) => {
  const id = randomUUID();

  const { title, description, price, count } = productDto;

  const { data } = await axios.get(`${IMAGE_API}/photos/random`, {
    params: { client_id: UNSPLASH_ACCESS_KEY, query: "products" },
  })

  const productsParams = {
    TableName: PRODUCTS_TABLE_NAME,
    Item: {
      id,
      title,
      description,
      price,
      imageUrl: data?.urls?.small || '',
    },
  };

  const stockParams = {
    TableName: STOCK_TABLE_NAME,
    Item: {
      productId: id,
      count,
    },
  };

  const transactParams = {
    TransactItems: [{ Put: productsParams }, { Put: stockParams }],
  };

  await db.transactWrite(transactParams);

  return {
    ...productDto,
    id,
  };
};
