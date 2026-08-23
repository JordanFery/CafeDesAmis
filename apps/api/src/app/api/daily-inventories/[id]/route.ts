import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess, requireRole } from "@/lib/auth";
import { handleApiError, forbidden, notFound } from "@/lib/errors";

type Params = { params: { id: string } };

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

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);

    const inventory = await prisma.dailyInventory.findUnique({
      where: { id: params.id },
      include: itemInclude,
    });

    if (!inventory || inventory.archivedAt) {
      throw notFound();
    }

    if (!hasLocationAccess(user, inventory.locationId)) {
      throw forbidden();
    }

    return NextResponse.json(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}

// Archivage (soft delete) : conserve l'historique tout en le retirant du Dashboard.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    try {
      const inventory = await prisma.dailyInventory.update({
        where: { id: params.id },
        data: { archivedAt: new Date() },
      });
      return NextResponse.json(inventory);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
