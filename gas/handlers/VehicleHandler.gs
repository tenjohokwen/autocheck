/**
 * VehicleHandler.gs
 *
 * HTTP request handlers for Vehicle operations
 * Enforces role-based access control per FR-031, FR-032
 */

const VehicleHandler = {
  /**
   * Creates a new vehicle
   * Route: vehicle.create
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  createVehicle: function (context) {
    try {
      // Validate required fields
      SecurityInterceptor.validateRequiredFields(context.data, [
        'make',
        'model',
        'year',
        'seats',
        'licensePlate',
        'vehicleType',
      ])

      RoleValidator.requireFleetManager(context.user)

      // Create vehicle
      const vehicle = VehicleService.createVehicle(context.data, context.user.email)

      return {
        status: 201,
        msgKey: 'vehicle.created',
        message: 'Vehicle created successfully',
        data: vehicle,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.createVehicle:', error.message)
      throw error
    }
  },

  /**
   * Lists all vehicles
   * Route: vehicle.list
   * Role: All authenticated users (FR-031)
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  listVehicles: function (context) {
    try {
      const includeArchived = context.data.includeArchived === true
      const vehicles = VehicleService.getAllVehicles(includeArchived)

      return {
        status: 200,
        msgKey: 'vehicle.list',
        message: 'Vehicles retrieved successfully',
        data: vehicles,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.listVehicles:', error.message)
      throw error
    }
  },

  /**
   * Gets a single vehicle by ID
   * Route: vehicle.get
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getVehicle: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId'])

      const vehicle = VehicleService.getVehicleById(context.data.vehicleId)

      if (!vehicle) {
        throw new Error('Vehicle not found')
      }

      return {
        status: 200,
        msgKey: 'vehicle.get',
        message: 'Vehicle retrieved successfully',
        data: vehicle,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.getVehicle:', error.message)
      throw error
    }
  },

  /**
   * Updates a vehicle
   * Route: vehicle.update
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  updateVehicle: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId'])
      RoleValidator.requireFleetManager(context.user)

      const vehicle = VehicleService.updateVehicle(
        context.data.vehicleId,
        context.data,
        context.user.email,
      )

      return {
        status: 200,
        msgKey: 'vehicle.updated',
        message: 'Vehicle updated successfully',
        data: vehicle,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.updateVehicle:', error.message)
      throw error
    }
  },

  /**
   * Archives a vehicle (soft delete)
   * Route: vehicle.archive
   * Role: Fleet Manager only
   * Implements FR-034, FR-038, FR-039
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  archiveVehicle: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId'])
      RoleValidator.requireFleetManager(context.user)

      const vehicle = VehicleService.archiveVehicle(
        context.data.vehicleId,
        context.data.reason || 'No reason provided',
        context.user.email,
      )

      return {
        status: 200,
        msgKey: 'vehicle.archived',
        message: 'Vehicle archived successfully',
        data: vehicle,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.archiveVehicle:', error.message)
      throw error
    }
  },

  /**
   * Assigns a vehicle to a fleet
   * Route: vehicle.assignToFleet
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  assignToFleet: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId', 'fleetId'])
      RoleValidator.requireFleetManager(context.user)

      const vehicle = VehicleService.assignToFleet(
        context.data.vehicleId,
        context.data.fleetId,
        context.user.email,
      )

      return {
        status: 200,
        msgKey: 'vehicle.assignedToFleet',
        message: 'Vehicle assigned to fleet successfully',
        data: vehicle,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.assignToFleet:', error.message)
      throw error
    }
  },

  /**
   * Removes a vehicle from its fleet
   * Route: vehicle.removeFromFleet
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  removeFromFleet: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId'])
      RoleValidator.requireFleetManager(context.user)

      const vehicle = VehicleService.removeFromFleet(
        context.data.vehicleId,
        context.user.email,
      )

      return {
        status: 200,
        msgKey: 'vehicle.removedFromFleet',
        message: 'Vehicle removed from fleet successfully',
        data: vehicle,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.removeFromFleet:', error.message)
      throw error
    }
  },

  /**
   * Deletes a vehicle (hard delete - use with caution)
   * Route: vehicle.delete
   * Role: Fleet Manager only
   * Note: Archive is preferred over delete per FR-034
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  deleteVehicle: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId'])
      RoleValidator.requireFleetManager(context.user)

      // Note: This is a hard delete. Archive is preferred.
      const vehicleId = context.data.vehicleId
      const vehicle = VehicleService.getVehicleById(vehicleId)

      if (!vehicle) {
        throw new Error('Vehicle not found')
      }

      // Delete the vehicle row
      const columnIndex = DatabaseUtil.getColumnIndex('vehicles', 'vehicleId')
      const result = DatabaseUtil.findRowByColumn('vehicles', columnIndex, vehicleId)

      if (result) {
        DatabaseUtil.deleteRow('vehicles', result.rowIndex)
      }

      console.log('Vehicle permanently deleted:', {
        vehicleId: vehicleId,
        licensePlate: vehicle.licensePlate,
      })

      return {
        status: 200,
        msgKey: 'vehicle.deleted',
        message: 'Vehicle deleted successfully',
        data: null,
      }
    } catch (error) {
      console.error('Error in VehicleHandler.deleteVehicle:', error.message)
      throw error
    }
  },
}
