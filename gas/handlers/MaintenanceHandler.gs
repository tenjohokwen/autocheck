/**
 * MaintenanceHandler.gs
 *
 * HTTP request handlers for Maintenance operations.
 * Enforces role-based access control per FR-032.
 * Fleet Managers can create/delete, Technicians can update assigned tasks.
 */

const MaintenanceHandler = {
  /**
   * Creates a new maintenance task
   * Route: maintenance.create
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  createMaintenanceTask: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, [
        'vehicleId',
        'taskType',
        'description',
        'scheduledDate',
      ])

      RoleValidator.requireFleetManager(context.user)

      const task = MaintenanceService.createMaintenanceTask(context.data, context.user.email)

      return {
        status: 201,
        msgKey: 'maintenance.created',
        message: 'Maintenance task created successfully',
        data: task,
      }
    } catch (error) {
      console.error('Error in MaintenanceHandler.createMaintenanceTask:', error.message)
      throw error
    }
  },

  /**
   * Lists all maintenance tasks with optional filters
   * Route: maintenance.list
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  listMaintenanceTasks: function (context) {
    try {
      const filters = {
        vehicleId: context.data.vehicleId,
        status: context.data.status,
        assignedTechnician: context.data.assignedTechnician,
      }

      const tasks = MaintenanceService.getAllMaintenanceTasks(filters)

      return {
        status: 200,
        msgKey: 'maintenance.list',
        message: 'Maintenance tasks retrieved successfully',
        data: tasks,
      }
    } catch (error) {
      console.error('Error in MaintenanceHandler.listMaintenanceTasks:', error.message)
      throw error
    }
  },

  /**
   * Gets a single maintenance task by ID
   * Route: maintenance.get
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getMaintenanceTask: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['taskId'])

      const task = MaintenanceService.getMaintenanceTaskById(context.data.taskId)

      if (!task) {
        throw new Error('Maintenance task not found')
      }

      return {
        status: 200,
        msgKey: 'maintenance.get',
        message: 'Maintenance task retrieved successfully',
        data: task,
      }
    } catch (error) {
      console.error('Error in MaintenanceHandler.getMaintenanceTask:', error.message)
      throw error
    }
  },

  /**
   * Updates a maintenance task
   * Route: maintenance.update
   * Role: Fleet Manager or assigned Technician
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  updateMaintenanceTask: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['taskId'])

      const task = MaintenanceService.getMaintenanceTaskById(context.data.taskId)

      if (!task) {
        throw new Error('Maintenance task not found')
      }

      // Check authorization: Fleet Manager or assigned Technician
      const isFleetManager = RoleValidator.isFleetManager(context.user)
      const isTechnician = RoleValidator.isTechnician(context.user)
      const isAssigned = task.assignedTechnician === context.user.email

      if (!isFleetManager && !(isTechnician && isAssigned)) {
        throw ResponseHandler.forbiddenError(
          'Only Fleet Managers or assigned Technicians can update this task',
          'error.forbidden.taskUpdate'
        )
      }

      const updatedTask = MaintenanceService.updateMaintenanceTask(
        context.data.taskId,
        context.data,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'maintenance.updated',
        message: 'Maintenance task updated successfully',
        data: updatedTask,
      }
    } catch (error) {
      console.error('Error in MaintenanceHandler.updateMaintenanceTask:', error.message)
      throw error
    }
  },

  /**
   * Deletes a maintenance task
   * Route: maintenance.delete
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  deleteMaintenanceTask: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['taskId'])

      RoleValidator.requireFleetManager(context.user)

      MaintenanceService.deleteMaintenanceTask(context.data.taskId, context.user.email)

      return {
        status: 200,
        msgKey: 'maintenance.deleted',
        message: 'Maintenance task deleted successfully',
        data: null,
      }
    } catch (error) {
      console.error('Error in MaintenanceHandler.deleteMaintenanceTask:', error.message)
      throw error
    }
  },

  /**
   * Assigns a task to a technician
   * Route: maintenance.assignTechnician
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  assignTechnician: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['taskId', 'technicianEmail'])

      RoleValidator.requireFleetManager(context.user)

      const task = MaintenanceService.assignTaskToTechnician(
        context.data.taskId,
        context.data.technicianEmail,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'maintenance.technicianAssigned',
        message: 'Technician assigned to task successfully',
        data: task,
      }
    } catch (error) {
      console.error('Error in MaintenanceHandler.assignTechnician:', error.message)
      throw error
    }
  },

  /**
   * Gets upcoming maintenance tasks (due within 7 days)
   * Route: maintenance.upcoming
   * Role: All authenticated users
   * Implements FR-013
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getUpcomingTasks: function (context) {
    try {
      const daysAhead = context.data.daysAhead || 7

      const tasks = MaintenanceService.getUpcomingMaintenanceTasks(daysAhead)

      return {
        status: 200,
        msgKey: 'maintenance.upcoming',
        message: 'Upcoming maintenance tasks retrieved successfully',
        data: tasks,
      }
    } catch (error) {
      console.error('Error in MaintenanceHandler.getUpcomingTasks:', error.message)
      throw error
    }
  },
}
