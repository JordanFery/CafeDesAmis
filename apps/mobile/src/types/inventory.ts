export type InventoryStatus = "DRAFT" | "SUBMITTED" | "ARCHIVED";
export type InventoryItemStatus = "CONTROLLED" | "NOT_CONTROLLED";

export type InventoryProduct = {
  id: string;
  name: string;
  photoUrl: string | null;
  unit: "KG" | "LITER" | "UNIT" | "LB" | "ROLL";
  category: { id: string; name: string };
  suppliers: { supplier: { id: string; name: string } }[];
};

export type DailyInventoryItem = {
  id: string;
  productId: string;
  status: InventoryItemStatus;
  quantity: string | null;
  stockMinimum: string;
  suggestedOrder: string | null;
  product: InventoryProduct;
};

export type DailyInventory = {
  id: string;
  locationId: string;
  inventoryDate: string;
  status: InventoryStatus;
  items: DailyInventoryItem[];
};

export type MonthlyInventoryItem = {
  id: string;
  productId: string;
  quantity: string;
  product: InventoryProduct;
};

export type CatalogProduct = {
  id: string;
  name: string;
  photoUrl: string | null;
  unit: "KG" | "LITER" | "UNIT" | "LB" | "ROLL";
  category: { id: string; name: string };
};

export type MonthlyInventory = {
  id: string;
  locationId: string;
  inventoryDate: string;
  status: InventoryStatus;
  validatedAt: string | null;
  validatedById: string | null;
  items: MonthlyInventoryItem[];
};
