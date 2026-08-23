import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.menuItem.createMany({
    data: [
      {
        name: "Café allongé",
        description: "Café filtre classique",
        price: 3.5,
        category: "DRINK",
      },
      {
        name: "Croissant",
        description: "Croissant pur beurre",
        price: 2.2,
        category: "FOOD",
      },
      {
        name: "Tarte au citron",
        description: "Part de tarte au citron meringuée",
        price: 4.8,
        category: "DESSERT",
      },
    ],
  });
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
