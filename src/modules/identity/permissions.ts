export type PlatformRole = "customer" | "contractor" | "dealer" | "dealer_staff" | "design_professional" | "support" | "finance" | "admin" | "super_admin";
export type Permission =
  | "catalog:read" | "quote:create" | "quote:read_own" | "quote:respond"
  | "inventory:manage_own" | "pricing:manage_own" | "orders:manage_own"
  | "support:read" | "finance:read" | "platform:manage";

const grants: Record<PlatformRole, readonly Permission[]> = {
  customer: ["catalog:read", "quote:create", "quote:read_own"],
  contractor: ["catalog:read", "quote:create", "quote:read_own"],
  dealer: ["catalog:read", "quote:respond", "inventory:manage_own", "pricing:manage_own", "orders:manage_own"],
  dealer_staff: ["catalog:read", "quote:respond", "inventory:manage_own", "orders:manage_own"],
  design_professional: ["catalog:read"],
  support: ["catalog:read", "support:read"],
  finance: ["catalog:read", "finance:read"],
  admin: ["catalog:read", "support:read", "finance:read", "platform:manage"],
  super_admin: ["catalog:read", "support:read", "finance:read", "platform:manage"],
};

export function hasPermission(role: PlatformRole, permission: Permission): boolean {
  return grants[role].includes(permission);
}
