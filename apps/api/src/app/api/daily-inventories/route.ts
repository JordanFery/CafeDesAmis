import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess } from "@/lib/auth";
import { handleApiError, forbidden } from "@/lib/errors";
import { createDailyInventorySchema } from "@/lib/validation";
import { parseDateOnly, todayDateOnly } from "@/lib/dates";

const itemInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
          suppliers: {
            where: { isPrimary: true, isActive: true },
            include: {
              supplier: {
                include: {
                  employees: {
                    where: { archivedAt: null },
                    select: { inventoryWeekday: true },
                  },
                },
              },
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { product: { name: "asc" as const } },
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const locationId = request.nextUrl.searchParams.get("locationId");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    if (!locationId) {
      return NextResponse.json(
        { error: "Le paramètre locationId est requis" },
        { status: 400 }
      );
    }

    if (!hasLocationAccess(user, locationId)) {
      throw forbidden();
    }

    const inventories = await prisma.dailyInventory.findMany({
      where: {
        locationId,
        archivedAt: null,
        ...(from || to
          ? {
              inventoryDate: {
                ...(from ? { gte: parseDateOnly(from) } : {}),
                ...(to ? { lte: parseDateOnly(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { inventoryDate: "desc" },
    });

    return NextResponse.json(inventories);
  } catch (error) {
    return handleApiError(error);
  }
}

// Crée l'inventaire du jour pour un lieu s'il n'existe pas encore (idempotent) :
// auto-peuplé avec tous les produits actifs et leur seuil (surchargé par lieu si défini).
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const body = await request.json();
    const parsed = createDailyInventorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { locationId } = parsed.data;
    const inventoryDate = parseDateOnly(
      parsed.data.inventoryDate ?? todayDateOnly()
    );

    if (!hasLocationAccess(user, locationId)) {
      throw forbidden();
    }

    const existing = await prisma.dailyInventory.findUnique({
      where: { locationId_inventoryDate: { locationId, inventoryDate } },
      include: itemInclude,
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { locations: { where: { locationId }, take: 1 } },
    });

    const inventory = await prisma.dailyInventory.create({
      data: {
        locationId,
        createdById: user.id,
        inventoryDate,
        items: {
          create: products.map((product) => ({
            productId: product.id,
            stockMinimum: product.locations[0]?.stockMinimum ?? product.stockMinimum,
          })),
        },
      },
      include: itemInclude,
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
