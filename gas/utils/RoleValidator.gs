/**
 * RoleValidator.gs
 *
 * Utility for validating user roles and permissions
 * Supports Fleet Manager and Technician roles per FR-031, FR-032, FR-033
 */

const RoleValidator = {
  /**
   * Role constants
   */
  ROLE_ADMIN: 'ROLE_ADMIN',
  ROLE_USER: 'ROLE_USER',

  /**
   * Checks if user is an Admin
   * @param {Object} user - User object with role property
   * @returns {boolean} True if Admin
   */
  isAdmin: function (user) {
    if (!user || !user.role) {
      return false
    }
    return user.role === this.ROLE_ADMIN
  },

  /**
   * @deprecated Use isAdmin instead
   * Kept for backward compatibility
   */
  isFleetManager: function (user) {
    return this.isAdmin(user)
  },

  /**
   * Checks if user is a regular user
   * @param {Object} user - User object with role property
   * @returns {boolean} True if regular user
   */
  isUser: function (user) {
    if (!user || !user.role) {
      return false
    }
    return user.role === this.ROLE_USER
  },

  /**
   * @deprecated Use isUser instead
   * Kept for backward compatibility
   */
  isTechnician: function (user) {
    return this.isUser(user)
  },

  /**
   * Validates that user has Admin role
   * Throws error if not authorized
   * @param {Object} user - User object
   * @throws {Error} If user is not an Admin
   */
  requireAdmin: function (user) {
    if (!this.isAdmin(user)) {
      throw ResponseHandler.forbiddenError(
        'Admin role required',
        'error.forbidden.adminOnly',
      )
    }
  },

  /**
   * @deprecated Use requireAdmin instead
   * Kept for backward compatibility
   */
  requireFleetManager: function (user) {
    return this.requireAdmin(user)
  },

  /**
   * Checks if user can create/delete vehicles
   * Only Admins can create/delete vehicles
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canManageVehicles: function (user) {
    return this.isAdmin(user)
  },

  /**
   * Checks if user can create/delete fleets
   * Only Admins can manage fleets
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canManageFleets: function (user) {
    return this.isAdmin(user)
  },

  /**
   * Checks if user can schedule new maintenance tasks
   * Only Admins can schedule maintenance
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canScheduleMaintenance: function (user) {
    return this.isAdmin(user)
  },

  /**
   * Checks if user can update maintenance tasks
   * Admins can update any task, Users can update tasks assigned to them
   * @param {Object} user - User object
   * @param {Object} maintenanceTask - Maintenance task object
   * @returns {boolean} True if allowed
   */
  canUpdateMaintenanceTask: function (user, maintenanceTask) {
    // Admins can update any task
    if (this.isAdmin(user)) {
      return true
    }

    // Users can only update tasks assigned to them
    if (this.isUser(user)) {
      return maintenanceTask.assignedTechnician === user.email
    }

    return false
  },

  /**
   * Checks if user can access expense dashboards and reports
   * Only Admins can access financial data
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canAccessFinancialData: function (user) {
    return this.isAdmin(user)
  },

  /**
   * Checks if user has any authenticated role
   * Admins automatically have all user permissions
   * @param {Object} user - User object
   * @returns {boolean} True if user has valid role
   */
  hasAuthenticatedRole: function (user) {
    return this.isAdmin(user) || this.isUser(user)
  },

  /**
   * Checks if user can view vehicle data
   * All authenticated users can view vehicle/maintenance data
   * Admins automatically have this permission
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canViewVehicles: function (user) {
    return this.hasAuthenticatedRole(user)
  },

  /**
   * Checks if user can add replaced parts
   * All authenticated users can add parts
   * Admins automatically have this permission
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canAddParts: function (user) {
    return this.hasAuthenticatedRole(user)
  },

  /**
   * Checks if user can create/update fuel records
   * All authenticated users can manage fuel records
   * Admins automatically have this permission
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canManageFuelRecords: function (user) {
    return this.hasAuthenticatedRole(user)
  },

  /**
   * Checks if user can view maintenance tasks
   * All authenticated users can view maintenance
   * Admins automatically have this permission
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canViewMaintenance: function (user) {
    return this.hasAuthenticatedRole(user)
  },

  /**
   * Checks if user can view documents
   * All authenticated users can view documents
   * Admins automatically have this permission
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canViewDocuments: function (user) {
    return this.hasAuthenticatedRole(user)
  },

  /**
   * Checks if user can view reminders
   * All authenticated users can view reminders
   * Admins automatically have this permission
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canViewReminders: function (user) {
    return this.hasAuthenticatedRole(user)
  },

  /**
   * Validates user role is one of the allowed roles
   * @param {string} role - Role to validate
   * @returns {boolean} True if valid role
   */
  isValidRole: function (role) {
    return role === this.ROLE_ADMIN || role === this.ROLE_USER
  },

  /**
   * Gets display name for role
   * @param {string} role - Role constant
   * @returns {string} Display name
   */
  getRoleDisplayName: function (role) {
    switch (role) {
      case this.ROLE_ADMIN:
        return 'Admin'
      case this.ROLE_USER:
        return 'User'
      default:
        return 'Unknown Role'
    }
  },
}
