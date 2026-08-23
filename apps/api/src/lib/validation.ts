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

export const dateOnlySchema = z
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

export const updateMonthlyInventoryItemSchema = z
  .object({
    counterQuantity: z.number().nonnegative().nullable().optional(),
    backstoreQuantity: z.number().nonnegative().nullable().optional(),
  })
  .refine(
    (data) => data.counterQuantity !== undefined || data.backstoreQuantity !== undefined,
    { message: "counterQuantity ou backstoreQuantity requis" }
  );

export const incidentReasonTypeSchema = z.enum([
  "BEHAVIOR",
  "LATE_ABSENCE",
  "CONFLICT",
  "PROCEDURE_NON_COMPLIANCE",
  "CUSTOMER_ISSUE",
  "OTHER",
]);

export const createIncidentReasonSchema = z.object({
  name: z.string().min(1).max(120),
  type: incidentReasonTypeSchema,
});

export const incidentStatusSchema = z.enum([
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

export const createIncidentSchema = z.object({
  locationId: z.string().uuid(),
  incidentDate: dateOnlySchema,
  reasonId: z.string().uuid(),
  description: z.string().min(1).max(4000),
  recurrence: z.string().max(500).optional(),
  correctiveAction: z.string().max(2000).optional(),
  preventiveAction: z.string().max(2000).optional(),
  employeeIds: z.array(z.string().uuid()).default([]),
});

export const updateIncidentSchema = z.object({
  reasonId: z.string().uuid().optional(),
  description: z.string().min(1).max(4000).optional(),
  recurrence: z.string().max(500).nullable().optional(),
  correctiveAction: z.string().max(2000).nullable().optional(),
  preventiveAction: z.string().max(2000).nullable().optional(),
  status: incidentStatusSchema.optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
});

// Jour de la semaine où le chef d'équipe doit effectuer l'inventaire
// pour ce fournisseur : 1 = lundi ... 7 = dimanche.
export const inventoryWeekdaySchema = z.number().int().min(1).max(7);

export const createSupplierEmployeeSchema = z.object({
  supplierId: z.string().uuid(),
  userId: z.string().uuid(),
  inventoryWeekday: inventoryWeekdaySchema.optional(),
});

export const updateSupplierEmployeeSchema = z.object({
  inventoryWeekday: inventoryWeekdaySchema.nullable().optional(),
});
