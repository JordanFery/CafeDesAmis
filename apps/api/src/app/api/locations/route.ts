import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createLocationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    const canSeeAll = user.role === "ADMIN" || user.role === "MANAGEMENT";
    const accessibleIds = user.locations.map((l) => l.locationId);

    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        ...(canSeeAll ? {} : { id: { in: accessibleIds } }),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN"]);

    const body = await request.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({ data: parsed.data });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
