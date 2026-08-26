import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess } from "@/lib/auth";
import { handleApiError, forbidden, notFound } from "@/lib/errors";
import { updateDailyInventoryItemSchema } from "@/lib/validation";

type Params = { params: { id: string; productId: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);

    const inventory = await prisma.dailyInventory.findUnique({
      where: { id: params.id },
    });

    if (!inventory || inventory.archivedAt) {
      throw notFound();
    }

    if (!hasLocationAccess(user, inventory.locationId)) {
      throw forbidden();
    }

    const body = await request.json();
    const parsed = updateDailyInventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingItem = await prisma.dailyInventoryItem.findUnique({
      where: {
        inventoryId_productId: {
          inventoryId: params.id,
          productId: params.productId,
        },
      },
    });

    if (!existingItem) {
      throw notFound();
    }

    const { quantity, status } = parsed.data;
    const suggestedOrder =
      quantity !== undefined && quantity !== null
        ? Math.max(Number(existingItem.stockMinimum) - quantity, 0)
        : undefined;

    const item = await prisma.dailyInventoryItem.update({
      where: {
        inventoryId_productId: {
          inventoryId: params.id,
          productId: params.productId,
        },
      },
      data: {
        ...(quantity !== undefined ? { quantity } : {}),
        status: status ?? (quantity !== undefined && quantity !== null ? "CONTROLLED" : undefined),
        ...(suggestedOrder !== undefined ? { suggestedOrder } : {}),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}
