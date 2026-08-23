import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess } from "@/lib/auth";
import { handleApiError, forbidden } from "@/lib/errors";
import { createMonthlyInventorySchema } from "@/lib/validation";
import { parseMonthOnly, currentMonthOnly } from "@/lib/dates";

const itemInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
          suppliers: {
            where: { isPrimary: true, isActive: true },
            include: { supplier: true },
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

    const inventories = await prisma.monthlyInventory.findMany({
      where: {
        locationId,
        archivedAt: null,
        ...(from || to
          ? {
              inventoryDate: {
                ...(from ? { gte: parseMonthOnly(from) } : {}),
                ...(to ? { lte: parseMonthOnly(to) } : {}),
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

// Crée le mois courant pour un lieu s'il n'existe pas encore (idempotent).
// Contrairement à l'inventaire quotidien, les lignes ne sont pas pré-remplies :
// elles sont ajoutées au fur et à mesure que les quantités sont saisies.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const body = await request.json();
    const parsed = createMonthlyInventorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { locationId } = parsed.data;
    const inventoryDate = parseMonthOnly(
      parsed.data.inventoryMonth ?? currentMonthOnly()
    );

    if (!hasLocationAccess(user, locationId)) {
      throw forbidden();
    }

    const existing = await prisma.monthlyInventory.findUnique({
      where: { locationId_inventoryDate: { locationId, inventoryDate } },
      include: itemInclude,
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const inventory = await prisma.monthlyInventory.create({
      data: { locationId, createdById: user.id, inventoryDate },
      include: itemInclude,
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
