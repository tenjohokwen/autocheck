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
  ROLE_FLEET_MANAGER: 'FLEET_MANAGER',
  ROLE_TECHNICIAN: 'TECHNICIAN',

  /**
   * Checks if user is a Fleet Manager
   * @param {Object} user - User object with role property
   * @returns {boolean} True if Fleet Manager
   */
  isFleetManager: function (user) {
    if (!user || !user.role) {
      return false
    }
    return user.role === this.ROLE_FLEET_MANAGER
  },

  /**
   * Checks if user is a Technician
   * @param {Object} user - User object with role property
   * @returns {boolean} True if Technician
   */
  isTechnician: function (user) {
    if (!user || !user.role) {
      return false
    }
    return user.role === this.ROLE_TECHNICIAN
  },

  /**
   * Validates that user has Fleet Manager role
   * Throws error if not authorized
   * @param {Object} user - User object
   * @throws {Error} If user is not a Fleet Manager
   */
  requireFleetManager: function (user) {
    if (!this.isFleetManager(user)) {
      throw ResponseHandler.forbiddenError(
        'Fleet Manager role required',
        'error.forbidden.fleetManagerOnly',
      )
    }
  },

  /**
   * Checks if user can create/delete vehicles
   * Per FR-032: Only Fleet Managers can create/delete vehicles
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canManageVehicles: function (user) {
    return this.isFleetManager(user)
  },

  /**
   * Checks if user can create/delete fleets
   * Per FR-032: Only Fleet Managers can manage fleets
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canManageFleets: function (user) {
    return this.isFleetManager(user)
  },

  /**
   * Checks if user can schedule new maintenance tasks
   * Per FR-032: Only Fleet Managers can schedule maintenance
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canScheduleMaintenance: function (user) {
    return this.isFleetManager(user)
  },

  /**
   * Checks if user can update maintenance tasks
   * Technicians can only update tasks assigned to them
   * @param {Object} user - User object
   * @param {Object} maintenanceTask - Maintenance task object
   * @returns {boolean} True if allowed
   */
  canUpdateMaintenanceTask: function (user, maintenanceTask) {
    // Fleet Managers can update any task
    if (this.isFleetManager(user)) {
      return true
    }

    // Technicians can only update tasks assigned to them
    if (this.isTechnician(user)) {
      return maintenanceTask.assignedTechnician === user.email
    }

    return false
  },

  /**
   * Checks if user can access expense dashboards and reports
   * Per FR-033: Only Fleet Managers can access financial data
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canAccessFinancialData: function (user) {
    return this.isFleetManager(user)
  },

  /**
   * Checks if user can view vehicle data
   * Per FR-031: Both roles can view vehicle/maintenance data
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canViewVehicles: function (user) {
    return this.isFleetManager(user) || this.isTechnician(user)
  },

  /**
   * Checks if user can add replaced parts
   * Per FR-031: Both Fleet Managers and Technicians can add parts
   * @param {Object} user - User object
   * @returns {boolean} True if allowed
   */
  canAddParts: function (user) {
    return this.isFleetManager(user) || this.isTechnician(user)
  },

  /**
   * Validates user role is one of the allowed roles
   * @param {string} role - Role to validate
   * @returns {boolean} True if valid role
   */
  isValidRole: function (role) {
    return role === this.ROLE_FLEET_MANAGER || role === this.ROLE_TECHNICIAN
  },

  /**
   * Gets display name for role
   * @param {string} role - Role constant
   * @returns {string} Display name
   */
  getRoleDisplayName: function (role) {
    switch (role) {
      case this.ROLE_FLEET_MANAGER:
        return 'Fleet Manager'
      case this.ROLE_TECHNICIAN:
        return 'Technician'
      default:
        return 'Unknown Role'
    }
  },
}
