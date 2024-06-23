import { products } from "./products";

exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(products),
  };
};
