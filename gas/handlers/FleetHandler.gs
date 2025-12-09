/**
 * FleetHandler.gs
 *
 * HTTP request handlers for Fleet operations
 * All methods require Fleet Manager role per FR-032
 */

const FleetHandler = {
  /**
   * Creates a new fleet
   * Route: fleet.create
   * Role: Fleet Manager only
   * @param {Object} context - Request context from SecurityInterceptor
   * @returns {Object} Response object
   */
  createFleet: function (context) {
    try {
      // Validate required fields
      SecurityInterceptor.validateRequiredFields(context.data, ['name'])

      // Validate user role (already checked in SecurityInterceptor, but double-check)
      RoleValidator.requireFleetManager(context.user)

      // Validate fleet data
      FleetService.validateFleetData(context.data)

      // Check for duplicate name (optional business rule)
      if (
        context.data.name &&
        !FleetService.isFleetNameUnique(context.data.name, null)
      ) {
        throw new Error('Fleet with this name already exists')
      }

      // Create fleet
      const fleet = FleetService.createFleet(context.data, context.user.email)

      return {
        status: 201,
        msgKey: 'fleet.created',
        message: 'Fleet created successfully',
        data: fleet,
      }
    } catch (error) {
      console.error('Error in FleetHandler.createFleet:', error.message)
      throw error
    }
  },

  /**
   * Lists all fleets
   * Route: fleet.list
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  listFleets: function (context) {
    try {
      const fleets = FleetService.getAllFleets()

      return {
        status: 200,
        msgKey: 'fleet.list',
        message: 'Fleets retrieved successfully',
        data: fleets,
      }
    } catch (error) {
      console.error('Error in FleetHandler.listFleets:', error.message)
      throw error
    }
  },

  /**
   * Gets a single fleet by ID
   * Route: fleet.get
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getFleet: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['fleetId'])

      const fleet = FleetService.getFleetById(context.data.fleetId)

      if (!fleet) {
        throw new Error('Fleet not found')
      }

      return {
        status: 200,
        msgKey: 'fleet.get',
        message: 'Fleet retrieved successfully',
        data: fleet,
      }
    } catch (error) {
      console.error('Error in FleetHandler.getFleet:', error.message)
      throw error
    }
  },

  /**
   * Updates a fleet
   * Route: fleet.update
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  updateFleet: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['fleetId'])
      RoleValidator.requireFleetManager(context.user)

      // Validate update data if name is being changed
      if (context.data.name) {
        FleetService.validateFleetData(context.data)

        // Check for duplicate name
        if (!FleetService.isFleetNameUnique(context.data.name, context.data.fleetId)) {
          throw new Error('Fleet with this name already exists')
        }
      }

      const fleet = FleetService.updateFleet(
        context.data.fleetId,
        context.data,
        context.user.email,
      )

      return {
        status: 200,
        msgKey: 'fleet.updated',
        message: 'Fleet updated successfully',
        data: fleet,
      }
    } catch (error) {
      console.error('Error in FleetHandler.updateFleet:', error.message)
      throw error
    }
  },

  /**
   * Deletes a fleet
   * Route: fleet.delete
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  deleteFleet: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['fleetId'])
      RoleValidator.requireFleetManager(context.user)

      FleetService.deleteFleet(context.data.fleetId, context.user.email)

      return {
        status: 200,
        msgKey: 'fleet.deleted',
        message: 'Fleet deleted successfully',
        data: null,
      }
    } catch (error) {
      console.error('Error in FleetHandler.deleteFleet:', error.message)
      throw error
    }
  },

  /**
   * Gets vehicles in a fleet
   * Route: fleet.getVehicles
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getVehicles: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['fleetId'])

      const includeArchived = context.data.includeArchived === true
      const vehicles = VehicleService.getVehiclesByFleetId(
        context.data.fleetId,
        includeArchived,
      )

      return {
        status: 200,
        msgKey: 'fleet.vehicles',
        message: 'Fleet vehicles retrieved successfully',
        data: vehicles,
      }
    } catch (error) {
      console.error('Error in FleetHandler.getVehicles:', error.message)
      throw error
    }
  },
}

// Method aliases for router compatibility
FleetHandler.create = FleetHandler.createFleet
FleetHandler.list = FleetHandler.listFleets
FleetHandler.get = FleetHandler.getFleet
FleetHandler.update = FleetHandler.updateFleet
FleetHandler.delete = FleetHandler.deleteFleet
FleetHandler.getVehicles = FleetHandler.getVehicles  // Already matches
