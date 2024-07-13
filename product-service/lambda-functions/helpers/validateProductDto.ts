import { z } from "zod";

const ProductSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    price: z.number().min(0),
    count: z.number().min(0),
  })
  .strict();

export type ProductDto = z.infer<typeof ProductSchema>;

export const validateProductDto = (productDto: unknown) => {
  const validationResult = ProductSchema.safeParse(productDto);

  return validationResult.success;
};
