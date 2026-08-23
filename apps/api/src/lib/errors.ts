import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const unauthorized = (message = "Authentification requise") =>
  new ApiError(401, message);

export const forbidden = (message = "Accès refusé") =>
  new ApiError(403, message);

export const notFound = (message = "Ressource introuvable") =>
  new ApiError(404, message);

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
}
