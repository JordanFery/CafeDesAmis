import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess, requireRole } from "@/lib/auth";
import { handleApiError, forbidden, notFound } from "@/lib/errors";
import { updateLocationSchema } from "@/lib/validation";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!hasLocationAccess(user, params.id)) {
      throw forbidden();
    }

    const location = await prisma.location.findUnique({ where: { id: params.id } });

    if (!location) {
      throw notFound();
    }

    return NextResponse.json(location);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN"]);

    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const location = await prisma.location.update({
        where: { id: params.id },
        data: parsed.data,
      });
      return NextResponse.json(location);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
