import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createSupplierEmployeeSchema } from "@/lib/validation";

const supplierEmployeeInclude = {
  supplier: true,
  user: { select: { id: true, firstName: true, lastName: true, role: true } },
} as const;

// Attribution d'un fournisseur à un chef d'équipe (+ jour d'inventaire).
// Gérée exclusivement par l'administration/direction.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    const supplierId = request.nextUrl.searchParams.get("supplierId");
    const userId = request.nextUrl.searchParams.get("userId");

    const assignments = await prisma.supplierEmployee.findMany({
      where: {
        archivedAt: null,
        ...(supplierId ? { supplierId } : {}),
        ...(userId ? { userId } : {}),
      },
      include: supplierEmployeeInclude,
      orderBy: [{ supplier: { name: "asc" } }, { user: { firstName: "asc" } }],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN"]);

    const body = await request.json();
    const parsed = createSupplierEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });

    if (!targetUser || targetUser.role !== "TEAM_LEADER") {
      return NextResponse.json(
        { error: "L'utilisateur assigné doit être un chef d'équipe (TEAM_LEADER)" },
        { status: 400 }
      );
    }

    const assignment = await prisma.supplierEmployee.upsert({
      where: {
        supplierId_userId: {
          supplierId: parsed.data.supplierId,
          userId: parsed.data.userId,
        },
      },
      update: {
        inventoryWeekday: parsed.data.inventoryWeekday ?? null,
        archivedAt: null,
      },
      create: {
        supplierId: parsed.data.supplierId,
        userId: parsed.data.userId,
        inventoryWeekday: parsed.data.inventoryWeekday ?? null,
      },
      include: supplierEmployeeInclude,
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
