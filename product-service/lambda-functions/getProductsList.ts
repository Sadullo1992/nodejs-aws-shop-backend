import { products } from "./products";

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
    },
    body: JSON.stringify(products),
  };
};
