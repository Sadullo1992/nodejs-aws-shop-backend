export interface IProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  count: number;
}

export const products = [
  {
    price: 200,
    title: "Product 2",
    count: 2,
  },
  {
    description: "Its very awesome",
    price: 200,
    title: "Product 8",
    count: 2,
  },
  {
    description: "Its very awesome",
    price: 700,
    title: "Product 7",
    count: 5,
  },
];
