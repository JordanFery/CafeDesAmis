import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError, notFound } from "@/lib/errors";
import { updateSupplierSchema } from "@/lib/validation";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await getAuthenticatedUser(request);

    const supplier = await prisma.supplier.findUnique({ where: { id: params.id } });

    if (!supplier) {
      throw notFound();
    }

    return NextResponse.json(supplier);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    const body = await request.json();
    const parsed = updateSupplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const supplier = await prisma.supplier.update({
        where: { id: params.id },
        data: parsed.data,
      });
      return NextResponse.json(supplier);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// Archivage (soft delete) : les fournisseurs restent référencés par
// l'historique des commandes, on ne les supprime jamais réellement.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    try {
      const supplier = await prisma.supplier.update({
        where: { id: params.id },
        data: { isActive: false, archivedAt: new Date() },
      });
      return NextResponse.json(supplier);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
