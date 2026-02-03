/**
 * Permissions Hook
 * 
 * Client-side hook for checking user permissions.
 * Works with the session data injected by NextAuth.
 * 
 * @module hooks/use-permissions
 */

'use client'

import { useSession } from 'next-auth/react'

/**
 * Permission type representing atomic permission strings
 */
export type Permission = string

/**
 * Hook return type
 */
interface UsePermissionsReturn {
  /** Array of user's permissions */
  permissions: Permission[]
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean
  /** Check if user has ALL of the specified permissions */
  hasAllPermissions: (permissions: Permission[]) => boolean
  /** Check if user has ANY of the specified permissions */
  hasAnyPermission: (permissions: Permission[]) => boolean
  /** Loading state */
  isLoading: boolean
}

/**
 * Hook for checking user permissions
 * 
 * @example
 * ```tsx
 * const { hasPermission, hasAnyPermission } = usePermissions()
 * 
 * if (hasPermission('user.create')) {
 *   // Show create user button
 * }
 * 
 * if (hasAnyPermission(['course.edit', 'course.delete'])) {
 *   // Show course management options
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession()
  
  const permissions = session?.user?.permissions ?? []
  const isSystemRole = session?.user?.isSystemRole ?? false
  const isLoading = status === 'loading'
  
  /**
   * Check if user has a specific permission
   * System admin bypasses all permission checks
   */
  const hasPermission = (permission: Permission): boolean => {
    if (isSystemRole) return true
    return permissions.includes(permission)
  }
  
  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (isSystemRole) return true
    return requiredPermissions.every(p => permissions.includes(p))
  }
  
  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (isSystemRole) return true
    return requiredPermissions.some(p => permissions.includes(p))
  }
  
  return {
    permissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isLoading,
  }
}
