import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess } from "@/lib/auth";
import { handleApiError, forbidden, notFound } from "@/lib/errors";

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);

    const inventory = await prisma.dailyInventory.findUnique({
      where: { id: params.id },
      include: { location: true },
    });

    if (!inventory || inventory.archivedAt) {
      throw notFound();
    }

    if (!hasLocationAccess(user, inventory.locationId)) {
      throw forbidden();
    }

    const recipients = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGEMENT"] }, isActive: true },
      select: { id: true },
    });

    const dateLabel = inventory.inventoryDate.toISOString().slice(0, 10);

    const [submission] = await prisma.$transaction([
      prisma.dailyInventorySubmission.create({
        data: { inventoryId: inventory.id, submittedById: user.id },
      }),
      prisma.dailyInventory.update({
        where: { id: inventory.id },
        data: { status: "SUBMITTED" },
      }),
      prisma.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          type: "INVENTORY_UPDATE" as const,
          channel: "IN_APP" as const,
          title: "Inventaire quotidien envoyé",
          message: `Inventaire du ${dateLabel} envoyé pour ${inventory.location.name} par ${user.firstName} ${user.lastName}.`,
          relatedType: "DailyInventory",
          relatedId: inventory.id,
        })),
      }),
    ]);

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
