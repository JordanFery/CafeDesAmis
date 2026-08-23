import { NextRequest } from "next/server";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabaseAnon } from "@/lib/supabase";
import { unauthorized, forbidden } from "@/lib/errors";

export type AuthenticatedUser = User & {
  locations: { locationId: string }[];
};

/**
 * Vérifie le token Supabase envoyé dans `Authorization: Bearer <token>`
 * et retourne l'utilisateur applicatif correspondant (table User).
 * Lève une ApiError 401 si le token est absent/invalide ou si le compte
 * local n'existe pas / est désactivé.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw unauthorized();
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    throw unauthorized("Session invalide ou expirée");
  }

  const user = await prisma.user.findUnique({
    where: { authUserId: data.user.id },
    include: {
      locations: {
        where: { archivedAt: null },
        select: { locationId: true },
      },
    },
  });

  if (!user || !user.isActive) {
    throw unauthorized("Compte introuvable ou désactivé");
  }

  return user;
}

/** Lève une ApiError 403 si le rôle de l'utilisateur n'est pas autorisé. */
export function requireRole(user: AuthenticatedUser, roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    throw forbidden();
  }
}

// Rapports d'incident : réservés aux chefs d'équipe et à l'administration.
// Les employés (serveurs) n'y ont aucun accès.
export const INCIDENT_ROLES: UserRole[] = ["TEAM_LEADER", "MANAGEMENT", "ADMIN"];

/** ADMIN et MANAGEMENT voient tous les lieux ; les autres, seulement les leurs. */
export function hasLocationAccess(
  user: AuthenticatedUser,
  locationId: string
): boolean {
  if (user.role === "ADMIN" || user.role === "MANAGEMENT") {
    return true;
  }
  return user.locations.some((l) => l.locationId === locationId);
}
