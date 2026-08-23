import { z } from "zod";

export const locationTypeSchema = z.enum(["CHALET", "PAVILION", "KITCHEN"]);
export const unitTypeSchema = z.enum(["KG", "LITER", "UNIT", "LB", "ROLL"]);

export const createLocationSchema = z.object({
  type: locationTypeSchema,
  name: z.string().min(1).max(120),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  photoUrl: z.string().url().optional(),
  categoryId: z.string().uuid(),
  unit: unitTypeSchema,
  stockMinimum: z.number().nonnegative(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : AAAA-MM-JJ");

export const createDailyInventorySchema = z.object({
  locationId: z.string().uuid(),
  inventoryDate: dateOnlySchema.optional(),
});

export const inventoryItemStatusSchema = z.enum(["CONTROLLED", "NOT_CONTROLLED"]);

export const updateDailyInventoryItemSchema = z.object({
  quantity: z.number().nonnegative().nullable().optional(),
  status: inventoryItemStatusSchema.optional(),
});

const monthOnlySchema = z.string().regex(/^\d{4}-\d{2}$/, "Format attendu : AAAA-MM");

export const createMonthlyInventorySchema = z.object({
  locationId: z.string().uuid(),
  inventoryMonth: monthOnlySchema.optional(),
});

export const updateMonthlyInventoryItemSchema = z.object({
  quantity: z.number().nonnegative(),
});
