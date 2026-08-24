import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess } from "@/lib/auth";
import { handleApiError, forbidden } from "@/lib/errors";
import { createLossSchema, lossReasonSchema } from "@/lib/validation";
import { parseDateOnly, parseMonthOnly, todayDateOnly } from "@/lib/dates";

const lossInclude = {
  product: { include: { category: true } },
  reportedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const locationId = request.nextUrl.searchParams.get("locationId");
    const supplierId = request.nextUrl.searchParams.get("supplierId");
    const categoryId = request.nextUrl.searchParams.get("categoryId");
    const reasonParam = request.nextUrl.searchParams.get("reason");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    if (locationId && !hasLocationAccess(user, locationId)) {
      throw forbidden();
    }

    const reasonResult = reasonParam ? lossReasonSchema.safeParse(reasonParam) : null;
    if (reasonResult && !reasonResult.success) {
      return NextResponse.json({ error: "Paramètre reason invalide" }, { status: 400 });
    }

    const canSeeAll = user.role === "ADMIN" || user.role === "MANAGEMENT";
    const accessibleIds = user.locations.map((l) => l.locationId);

    const losses = await prisma.loss.findMany({
      where: {
        archivedAt: null,
        ...(locationId
          ? { locationId }
          : canSeeAll
            ? {}
            : { locationId: { in: accessibleIds } }),
        ...(supplierId
          ? { product: { suppliers: { some: { supplierId, isActive: true } } } }
          : {}),
        ...(categoryId ? { product: { categoryId } } : {}),
        ...(reasonResult?.success ? { reason: reasonResult.data } : {}),
        ...(from || to
          ? {
              lossDate: {
                ...(from ? { gte: parseDateOnly(from) } : {}),
                ...(to ? { lte: parseDateOnly(to) } : {}),
              },
            }
          : {}),
      },
      include: lossInclude,
      orderBy: { lossDate: "desc" },
    });

    return NextResponse.json(losses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const body = await request.json();
    const parsed = createLossSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (!hasLocationAccess(user, parsed.data.locationId)) {
      throw forbidden();
    }

    const { lossDate, locationId, productId, quantity } = parsed.data;
    const resolvedLossDate = parseMonthOnly((lossDate ?? todayDateOnly()).slice(0, 7));

    // Deux pertes du même produit, au même lieu, dans le même mois s'additionnent
    // plutôt que de créer une nouvelle ligne.
    const existing = await prisma.loss.findFirst({
      where: { locationId, productId, lossDate: resolvedLossDate, archivedAt: null },
    });

    const loss = existing
      ? await prisma.loss.update({
          where: { id: existing.id },
          data: {
            quantity: Number(existing.quantity) + quantity,
            reportedById: user.id,
          },
          include: lossInclude,
        })
      : await prisma.loss.create({
          data: {
            locationId,
            productId,
            quantity,
            reason: parsed.data.reason,
            lossDate: resolvedLossDate,
            reportedById: user.id,
          },
          include: lossInclude,
        });

    return NextResponse.json(loss, { status: existing ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
