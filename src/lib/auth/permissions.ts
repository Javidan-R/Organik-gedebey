// lib/auth/permissions.ts
export const PERMISSIONS = {
  CUSTOMER: [
    "order:create",
    "order:view:own",
    "review:create",
    "profile:update:own"
  ],
  COURIER: [
    "delivery:view",
    "delivery:update",
    "order:view",
    "delivery:tracking"
  ],
  WAREHOUSE_STAFF: [
    "inventory:view",
    "inventory:update",
    "product:view",
    "stock:adjust"
  ],
  MANAGER: [
    "*:view",
    "*:update",
    "order:*",
    "product:*",
    "inventory:*",
    "user:view",
    "analytics:view"
  ],
  ADMIN: ["*"]
}

export function hasPermission(userRole: string, permission: string): boolean {
  const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS] || []
  
  // Admin has all permissions
  if (rolePermissions.includes("*")) return true
  
  // Check exact permission
  if (rolePermissions.includes(permission)) return true
  
  // Check wildcard permissions
  const [resource, action] = permission.split(":")
  if (rolePermissions.includes(`${resource}:*`)) return true
  if (rolePermissions.includes(`*:${action}`)) return true
  
  return false
}

export function requirePermission(userRole: string, permission: string) {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}