/**
 * Server-side Permission Utilities
 * 
 * Functions for checking permissions in Server Components and Server Actions.
 * These work with the session data from NextAuth.
 * 
 * @module lib/auth/permissions
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Permission type representing atomic permission strings
 */
export type Permission = string

/**
 * Get current user's permissions from session
 * 
 * @returns Array of permission strings or empty array if not authenticated
 */
export async function getPermissions(): Promise<Permission[]> {
  const session = await auth()
  return session?.user?.permissions ?? []
}

/**
 * Check if current user has a specific permission
 * 
 * @param permission - The permission to check
 * @returns True if user has the permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const permissions = await getPermissions()
  return permissions.includes(permission)
}

/**
 * Check if current user has ALL of the specified permissions
 * 
 * @param requiredPermissions - Array of permissions to check
 * @returns True if user has all permissions
 */
export async function hasAllPermissions(requiredPermissions: Permission[]): Promise<boolean> {
  const permissions = await getPermissions()
  return requiredPermissions.every(p => permissions.includes(p))
}

/**
 * Check if current user has ANY of the specified permissions
 * 
 * @param requiredPermissions - Array of permissions to check
 * @returns True if user has at least one permission
 */
export async function hasAnyPermission(requiredPermissions: Permission[]): Promise<boolean> {
  const permissions = await getPermissions()
  return requiredPermissions.some(p => permissions.includes(p))
}

/**
 * Require a specific permission or redirect to unauthorized page
 * 
 * @param permission - The required permission
 * @param redirectTo - URL to redirect to if unauthorized (default: /unauthorized)
 */
export async function requirePermission(
  permission: Permission,
  redirectTo: string = '/unauthorized'
): Promise<void> {
  const session = await auth()
  
  // System admin bypasses all permission checks
  if (session?.user?.isSystemRole) {
    return
  }
  
  const has = await hasPermission(permission)
  if (!has) {
    redirect(redirectTo)
  }
}

/**
 * Require ALL of the specified permissions or redirect
 * 
 * @param permissions - Array of required permissions
 * @param redirectTo - URL to redirect to if unauthorized
 */
export async function requireAllPermissions(
  permissions: Permission[],
  redirectTo: string = '/unauthorized'
): Promise<void> {
  const hasAll = await hasAllPermissions(permissions)
  if (!hasAll) {
    redirect(redirectTo)
  }
}

/**
 * Require ANY of the specified permissions or redirect
 * 
 * @param permissions - Array of permissions (user needs at least one)
 * @param redirectTo - URL to redirect to if unauthorized
 */
export async function requireAnyPermission(
  permissions: Permission[],
  redirectTo: string = '/unauthorized'
): Promise<void> {
  const hasAny = await hasAnyPermission(permissions)
  if (!hasAny) {
    redirect(redirectTo)
  }
}

/**
 * Get current authenticated user or redirect to login
 * 
 * @returns The authenticated session
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}
