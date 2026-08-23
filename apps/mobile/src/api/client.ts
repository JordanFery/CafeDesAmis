import { supabase } from "@/lib/supabase";
import type { CurrentUser, TeamMember } from "@/types/user";
import type { Location } from "@/types/location";
import type {
  CatalogProduct,
  DailyInventory,
  DailyInventoryItem,
  InventoryItemStatus,
  MonthlyInventory,
  MonthlyInventoryItem,
} from "@/types/inventory";
import type {
  CreateIncidentInput,
  Incident,
  IncidentReason,
  IncidentStatus,
} from "@/types/incident";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<CurrentUser>("/api/users/me"),
  getLocations: () => request<Location[]>("/api/locations"),
  getProducts: () => request<CatalogProduct[]>("/api/products"),

  ensureDailyInventory: (locationId: string) =>
    request<DailyInventory>("/api/daily-inventories", {
      method: "POST",
      body: JSON.stringify({ locationId }),
    }),

  updateInventoryItem: (
    inventoryId: string,
    productId: string,
    data: { quantity?: number | null; status?: InventoryItemStatus }
  ) =>
    request<DailyInventoryItem>(
      `/api/daily-inventories/${inventoryId}/items/${productId}`,
      { method: "PATCH", body: JSON.stringify(data) }
    ),

  submitDailyInventory: (inventoryId: string) =>
    request(`/api/daily-inventories/${inventoryId}/submit`, { method: "POST" }),

  ensureMonthlyInventory: (locationId: string) =>
    request<MonthlyInventory>("/api/monthly-inventories", {
      method: "POST",
      body: JSON.stringify({ locationId }),
    }),

  updateMonthlyInventoryItem: (inventoryId: string, productId: string, quantity: number) =>
    request<MonthlyInventoryItem>(
      `/api/monthly-inventories/${inventoryId}/items/${productId}`,
      { method: "PATCH", body: JSON.stringify({ quantity }) }
    ),

  submitMonthlyInventory: (inventoryId: string) =>
    request<MonthlyInventory>(`/api/monthly-inventories/${inventoryId}/submit`, {
      method: "POST",
    }),

  validateMonthlyInventory: (inventoryId: string) =>
    request<MonthlyInventory>(`/api/monthly-inventories/${inventoryId}/validate`, {
      method: "POST",
    }),

  getTeamMembers: (locationId?: string) =>
    request<TeamMember[]>(
      `/api/users${locationId ? `?locationId=${locationId}` : ""}`
    ),

  getIncidentReasons: () => request<IncidentReason[]>("/api/incident-reasons"),

  getIncidents: (filters: {
    locationId?: string;
    employeeId?: string;
    status?: IncidentStatus;
  }) => {
    const params = new URLSearchParams();
    if (filters.locationId) params.set("locationId", filters.locationId);
    if (filters.employeeId) params.set("employeeId", filters.employeeId);
    if (filters.status) params.set("status", filters.status);
    const query = params.toString();
    return request<Incident[]>(`/api/incidents${query ? `?${query}` : ""}`);
  },

  createIncident: (data: CreateIncidentInput) =>
    request<Incident>("/api/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
