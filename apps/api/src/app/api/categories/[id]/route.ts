import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError, notFound } from "@/lib/errors";
import { updateCategorySchema } from "@/lib/validation";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const category = await prisma.category.update({
        where: { id: params.id },
        data: parsed.data,
      });
      return NextResponse.json(category);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    try {
      const category = await prisma.category.update({
        where: { id: params.id },
        data: { isActive: false, archivedAt: new Date() },
      });
      return NextResponse.json(category);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
