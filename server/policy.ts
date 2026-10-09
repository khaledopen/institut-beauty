import type { Role } from "@prisma/client";
export function canManageServices(role: Role) {
  return role === "OWNER" || role === "MANAGER";
}
export function tenantWhere(instituteId: string, id?: string) {
  return id ? { instituteId, id } : { instituteId };
}
