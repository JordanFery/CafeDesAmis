import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError, notFound } from "@/lib/errors";

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN"]);

    const inventory = await prisma.monthlyInventory.findUnique({
      where: { id: params.id },
    });

    if (!inventory || inventory.archivedAt) {
      throw notFound();
    }

    const updated = await prisma.monthlyInventory.update({
      where: { id: params.id },
      data: { validatedAt: new Date(), validatedById: user.id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
