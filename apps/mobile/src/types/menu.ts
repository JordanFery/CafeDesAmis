export type MenuCategory = "DRINK" | "FOOD" | "DESSERT";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: MenuCategory;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
};
