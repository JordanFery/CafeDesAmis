import { PrismaClient } from "@prisma/client";
import { CATALOG } from "./seed-data/catalog";

const prisma = new PrismaClient();

async function main() {
  await prisma.location.createMany({
    data: [
      { type: "CHALET", name: "Chalet" },
      { type: "PAVILION", name: "Pavillon" },
      { type: "KITCHEN", name: "Cuisine" },
    ],
    skipDuplicates: true,
  });

  const categoryNames = [...new Set(CATALOG.map((entry) => entry.category))];
  const categoriesByName = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoriesByName.set(name, category.id);
  }

  const supplierNames = [...new Set(CATALOG.map((entry) => entry.supplier))];
  const suppliersByName = new Map<string, string>();
  for (const name of supplierNames) {
    let supplier = await prisma.supplier.findFirst({ where: { name } });
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: { name } });
    }
    suppliersByName.set(name, supplier.id);
  }

  let created = 0;
  let updated = 0;

  for (const entry of CATALOG) {
    const categoryId = categoriesByName.get(entry.category)!;
    const supplierId = suppliersByName.get(entry.supplier)!;

    const existing = await prisma.product.findFirst({ where: { name: entry.name } });

    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: { categoryId, unit: entry.unit, stockMinimum: entry.stockMinimum },
        })
      : await prisma.product.create({
          data: {
            name: entry.name,
            categoryId,
            unit: entry.unit,
            stockMinimum: entry.stockMinimum,
          },
        });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }

    await prisma.productSupplier.upsert({
      where: { productId_supplierId: { productId: product.id, supplierId } },
      update: { unitsPerCase: entry.unitsPerCase, supplierUnit: entry.unit },
      create: {
        productId: product.id,
        supplierId,
        isPrimary: true,
        supplierUnit: entry.unit,
        unitsPerCase: entry.unitsPerCase,
      },
    });
  }

  console.log(
    `Seed terminé. ${categoriesByName.size} catégories, ${suppliersByName.size} fournisseurs, ${created} produits créés, ${updated} mis à jour.`
  );
  console.log(
    "Aucun utilisateur n'est créé par ce seed : les comptes doivent être créés dans Supabase Auth (voir README), puis liés via la table User (authUserId)."
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
