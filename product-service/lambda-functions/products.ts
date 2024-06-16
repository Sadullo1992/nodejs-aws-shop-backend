interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
}

export const products: IProduct[] = [
  {
    id: "1",
    title: "Mac Pro 14",
    description: "Very good laptop",
    price: 800,
  },
  {
    id: "2",
    title: "Asus VivoBook",
    description: "Very good laptop",
    price: 900,
  },
  {
    id: "3",
    title: "HP EliteBook",
    description: "Very good laptop",
    price: 799,
  },
  {
    id: "4",
    title: "Lenevo Thinkpad",
    description: "Very good laptop",
    price: 650,
  },
];
