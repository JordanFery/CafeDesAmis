import { z } from "zod";

export const menuCategorySchema = z.enum(["DRINK", "FOOD", "DESSERT"]);

export const createMenuItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  category: menuCategorySchema.default("FOOD"),
  imageUrl: z.string().url().optional(),
  available: z.boolean().default(true),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();
