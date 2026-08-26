import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError, notFound } from "@/lib/errors";
import { updateSupplierEmployeeSchema } from "@/lib/validation";

type Params = { params: { id: string } };

const supplierEmployeeInclude = {
  supplier: true,
  user: { select: { id: true, firstName: true, lastName: true, role: true } },
} as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN"]);

    const body = await request.json();
    const parsed = updateSupplierEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const assignment = await prisma.supplierEmployee.update({
        where: { id: params.id },
        data: parsed.data,
        include: supplierEmployeeInclude,
      });
      return NextResponse.json(assignment);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// Archivage (soft delete) : retire l'attribution sans perdre l'historique.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN"]);

    try {
      const assignment = await prisma.supplierEmployee.update({
        where: { id: params.id },
        data: { archivedAt: new Date() },
      });
      return NextResponse.json(assignment);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
