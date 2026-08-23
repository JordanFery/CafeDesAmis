import { PrismaClient } from "@prisma/client";

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

  const boissonsChaudes = await prisma.category.upsert({
    where: { name: "Boissons chaudes" },
    update: {},
    create: { name: "Boissons chaudes" },
  });

  const boissonsFroides = await prisma.category.upsert({
    where: { name: "Boissons froides" },
    update: {},
    create: { name: "Boissons froides" },
  });

  await prisma.category.upsert({
    where: { name: "Dessert" },
    update: {},
    create: { name: "Dessert" },
  });

  await prisma.category.upsert({
    where: { name: "Fournitures" },
    update: {},
    create: { name: "Fournitures" },
  });

  await prisma.category.upsert({
    where: { name: "Produits d'hygiène" },
    update: {},
    create: { name: "Produits d'hygiène" },
  });

  const gordon = await prisma.supplier.create({
    data: { name: "Gordon Food Service" },
  });

  await prisma.product.createMany({
    data: [
      {
        name: "Café en grains",
        categoryId: boissonsChaudes.id,
        unit: "KG",
        stockMinimum: 5,
      },
      {
        name: "Jus d'orange",
        categoryId: boissonsFroides.id,
        unit: "LITER",
        stockMinimum: 10,
      },
    ],
  });

  console.log(`Seed terminé. Fournisseur de démo : ${gordon.name}`);
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
