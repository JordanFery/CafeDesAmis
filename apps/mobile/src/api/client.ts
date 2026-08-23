import type { MenuItem } from "@/types/menu";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getMenu: () => request<MenuItem[]>("/api/menu"),
  getMenuItem: (id: string) => request<MenuItem>(`/api/menu/${id}`),
  createMenuItem: (data: Partial<MenuItem>) =>
    request<MenuItem>("/api/menu", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
