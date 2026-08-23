import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createProductSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);

    const categoryId = request.nextUrl.searchParams.get("categoryId");
    const supplierId = request.nextUrl.searchParams.get("supplierId");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(supplierId ? { suppliers: { some: { supplierId, isActive: true } } } : {}),
      },
      include: {
        category: true,
        suppliers: {
          where: { isPrimary: true, isActive: true },
          include: { supplier: true },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
