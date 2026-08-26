import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasLocationAccess, requireRole, INCIDENT_ROLES } from "@/lib/auth";
import { handleApiError, forbidden } from "@/lib/errors";

// Liste des employés, utilisée pour désigner un employé concerné par un
// rapport d'incident (et filtrer les rapports par employé). Même
// restriction d'accès que les incidents : les employés (serveurs) n'y
// ont pas accès.
//
// Avec locationId : employés de ce lieu (l'appelant doit y avoir accès).
// Sans locationId : ADMIN/MANAGEMENT voient tous les employés actifs ;
// un TEAM_LEADER voit les employés de son ou ses lieux assignés.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    requireRole(user, INCIDENT_ROLES);

    const locationId = request.nextUrl.searchParams.get("locationId");
    const canSeeAll = user.role === "ADMIN" || user.role === "MANAGEMENT";

    if (locationId && !hasLocationAccess(user, locationId)) {
      throw forbidden();
    }

    const accessibleIds = user.locations.map((l) => l.locationId);

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(locationId
          ? { locations: { some: { locationId, archivedAt: null } } }
          : canSeeAll
            ? {}
            : { locations: { some: { locationId: { in: accessibleIds }, archivedAt: null } } }),
      },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}
