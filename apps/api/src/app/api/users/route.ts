import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess, requireRole, INCIDENT_ROLES } from "@/lib/auth";
import { handleApiError, forbidden } from "@/lib/errors";

// Liste des employés d'un lieu, utilisée pour désigner un employé
// concerné par un rapport d'incident. Même restriction d'accès que les
// incidents : les employés (serveurs) n'y ont pas accès.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, INCIDENT_ROLES);

    const locationId = request.nextUrl.searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { error: "Le paramètre locationId est requis" },
        { status: 400 }
      );
    }

    if (!hasLocationAccess(user, locationId)) {
      throw forbidden();
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        locations: { some: { locationId, archivedAt: null } },
      },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}
