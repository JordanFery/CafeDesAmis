export type Supplier = {
  id: string;
  name: string;
  notes: string | null;
  isActive: boolean;
};

export type SupplierAssignment = {
  id: string;
  supplierId: string;
  inventoryWeekday: number | null;
  supplier: { id: string; name: string };
  user: { id: string; firstName: string; lastName: string; role: string };
};

export type CreateSupplierAssignmentInput = {
  supplierId: string;
  userId: string;
  inventoryWeekday?: number;
};

