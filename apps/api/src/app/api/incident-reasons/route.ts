import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, requireRole, INCIDENT_ROLES } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createIncidentReasonSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, INCIDENT_ROLES);

    const reasons = await prisma.incidentReason.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(reasons);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN"]);

    const body = await request.json();
    const parsed = createIncidentReasonSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const reason = await prisma.incidentReason.create({ data: parsed.data });
    return NextResponse.json(reason, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
