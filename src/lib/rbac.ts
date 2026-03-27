/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Provides centralized functions to check if the current user has the authority
 * to perform specific actions across the SaaS application.
 */

// Basic checking
export function hasRole(user: { role?: string } | null, role: string): boolean {
  if (!user || !user.role) return false;
  return user.role === role;
}

// Destructive actions (Excluir, etc)
export function canDelete(user: { role?: string } | null): boolean {
  if (!user || !user.role) return false;
  return user.role === "ADMIN_TENANT" || user.role === "SUPER_ADMIN";
}

// Write/Edit actions (Criar, Editar, Pagar, Cancelar)
export function canEdit(user: { role?: string } | null): boolean {
  if (!user || !user.role) return false;
  // All roles EXCEPT 'USUARIO' can edit (assuming USUARIO is read-only or limited).
  // Adjust if USUARIO needs some edit permissions.
  // For now, if USUARIO is purely a viewer:
  return user.role !== "USUARIO";
}
