-- AlterTable
ALTER TABLE "MonthlyInventoryItem" ADD COLUMN     "backstoreQuantity" DECIMAL(10,3),
ADD COLUMN     "counterQuantity" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "SupplierEmployee" ADD COLUMN     "inventoryWeekday" INTEGER;
