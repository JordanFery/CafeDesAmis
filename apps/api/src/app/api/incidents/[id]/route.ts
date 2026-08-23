import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess, requireRole, INCIDENT_ROLES } from "@/lib/auth";
import { handleApiError, forbidden, notFound } from "@/lib/errors";
import { updateIncidentSchema } from "@/lib/validation";

type Params = { params: { id: string } };

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

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, INCIDENT_ROLES);

    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      include: incidentInclude,
    });

    if (!incident || incident.archivedAt) {
      throw notFound();
    }

    if (!hasLocationAccess(user, incident.locationId)) {
      throw forbidden();
    }

    return NextResponse.json(incident);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, INCIDENT_ROLES);

    const incident = await prisma.incident.findUnique({ where: { id: params.id } });

    if (!incident || incident.archivedAt) {
      throw notFound();
    }

    if (!hasLocationAccess(user, incident.locationId)) {
      throw forbidden();
    }

    const body = await request.json();
    const parsed = updateIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeIds, ...rest } = parsed.data;

    const updated = await prisma.incident.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(employeeIds
          ? {
              employees: {
                deleteMany: {},
                create: employeeIds.map((userId) => ({ userId })),
              },
            }
          : {}),
      },
      include: incidentInclude,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// Archivage (soft delete) : réservé à ADMIN/MANAGEMENT, comme les autres modules.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, ["ADMIN", "MANAGEMENT"]);

    try {
      const incident = await prisma.incident.update({
        where: { id: params.id },
        data: { archivedAt: new Date() },
      });
      return NextResponse.json(incident);
    } catch {
      throw notFound();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
