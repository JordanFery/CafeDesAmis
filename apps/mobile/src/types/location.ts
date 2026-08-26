export type LocationType = "CHALET" | "PAVILION" | "KITCHEN";

export type Location = {
  id: string;
  type: LocationType;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
