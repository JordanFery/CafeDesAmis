import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess } from "@/lib/auth";
import { handleApiError, forbidden, notFound } from "@/lib/errors";
import { updateMonthlyInventoryItemSchema } from "@/lib/validation";

type Params = { params: { id: string; productId: string } };

// Contrairement à l'inventaire quotidien, les lignes n'existent pas d'avance :
// cette route crée la ligne au premier enregistrement, puis la met à jour ensuite.
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);

    const inventory = await prisma.monthlyInventory.findUnique({
      where: { id: params.id },
    });

    if (!inventory || inventory.archivedAt) {
      throw notFound();
    }

    if (!hasLocationAccess(user, inventory.locationId)) {
      throw forbidden();
    }

    const body = await request.json();
    const parsed = updateMonthlyInventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) {
      throw notFound();
    }

    const item = await prisma.monthlyInventoryItem.upsert({
      where: {
        inventoryId_productId: {
          inventoryId: params.id,
          productId: params.productId,
        },
      },
      create: {
        inventoryId: params.id,
        productId: params.productId,
        quantity: parsed.data.quantity,
      },
      update: { quantity: parsed.data.quantity },
    });

    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}
