import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError, notFound } from "@/lib/errors";

type Params = { params: { id: string } };

// Archivage (soft delete) : réservé à ADMIN/MANAGEMENT, comme les autres modules.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    try {
      const loss = await prisma.loss.update({
        where: { id: params.id },
        data: { archivedAt: new Date() },
      });
      return NextResponse.json(loss);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
