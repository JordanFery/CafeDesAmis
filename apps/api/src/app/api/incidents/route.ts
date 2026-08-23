import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess, requireRole, INCIDENT_ROLES } from "@/lib/auth";
import { handleApiError, forbidden } from "@/lib/errors";
import { createIncidentSchema } from "@/lib/validation";
import { parseDateOnly } from "@/lib/dates";

const incidentInclude = {
  location: true,
  reason: true,
  reportedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  employees: {
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, INCIDENT_ROLES);

    const locationId = request.nextUrl.searchParams.get("locationId");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    if (locationId && !hasLocationAccess(user, locationId)) {
      throw forbidden();
    }

    const canSeeAll = user.role === "ADMIN" || user.role === "MANAGEMENT";
    const accessibleIds = user.locations.map((l) => l.locationId);

    const incidents = await prisma.incident.findMany({
      where: {
        archivedAt: null,
        ...(locationId
          ? { locationId }
          : canSeeAll
            ? {}
            : { locationId: { in: accessibleIds } }),
        ...(from || to
          ? {
              incidentDate: {
                ...(from ? { gte: parseDateOnly(from) } : {}),
                ...(to ? { lte: parseDateOnly(to) } : {}),
              },
            }
          : {}),
      },
      include: incidentInclude,
      orderBy: { incidentDate: "desc" },
    });

    return NextResponse.json(incidents);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, INCIDENT_ROLES);

    const body = await request.json();
    const parsed = createIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!hasLocationAccess(user, parsed.data.locationId)) {
      throw forbidden();
    }

    const { employeeIds, incidentDate, ...rest } = parsed.data;

    const incident = await prisma.incident.create({
      data: {
        ...rest,
        incidentDate: parseDateOnly(incidentDate),
        reportedById: user.id,
        employees: {
          create: employeeIds.map((userId) => ({ userId })),
        },
      },
      include: incidentInclude,
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

