export type LossReason = "EXPIRED" | "DAMAGED" | "DROPPED" | "OTHER";

export type Loss = {
  id: string;
  locationId: string;
  productId: string;
  quantity: string;
  reason: LossReason;
  lossDate: string;
  product: {
    id: string;
    name: string;
    unit: "KG" | "LITER" | "UNIT" | "LB" | "ROLL";
    category: { id: string; name: string };
  };
  reportedBy: { id: string; firstName: string; lastName: string };
};

export type CreateLossInput = {
  locationId: string;
  productId: string;
  quantity: number;
  reason: LossReason;
  lossDate?: string;
};
