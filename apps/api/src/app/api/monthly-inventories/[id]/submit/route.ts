import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess } from "@/lib/auth";
import { handleApiError, forbidden, notFound } from "@/lib/errors";

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);

    const inventory = await prisma.monthlyInventory.findUnique({
      where: { id: params.id },
      include: { location: true },
    });

    if (!inventory || inventory.archivedAt) {
      throw notFound();
    }

    if (!hasLocationAccess(user, inventory.locationId)) {
      throw forbidden();
    }

    const updated = await prisma.monthlyInventory.update({
      where: { id: inventory.id },
      data: { status: "SUBMITTED" },
    });

    const recipients = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGEMENT"] }, isActive: true },
      select: { id: true },
    });

    const monthLabel = inventory.inventoryDate.toISOString().slice(0, 7);

    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.id,
        type: "INVENTORY_UPDATE" as const,
        channel: "IN_APP" as const,
        title: "Inventaire mensuel envoyé",
        message: `Inventaire de ${monthLabel} envoyé pour ${inventory.location.name} par ${user.firstName} ${user.lastName}. À valider.`,
        relatedType: "MonthlyInventory",
        relatedId: inventory.id,
      })),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
