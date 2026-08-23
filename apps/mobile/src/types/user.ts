export type UserRole = "EMPLOYEE" | "TEAM_LEADER" | "MANAGEMENT" | "ADMIN";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: UserRole;
  locationIds: string[];
};
