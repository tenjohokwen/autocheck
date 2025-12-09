/**
 * FuelHandler.gs
 *
 * HTTP request handlers for Fuel operations.
 * Enforces role-based access control.
 * Both Fleet Managers and Technicians can manage fuel records.
 */

const FuelHandler = {
  /**
   * Creates a new fuel record
   * Route: fuel.create
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  createFuelRecord: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, [
        'vehicleId',
        'date',
        'odometer',
        'liters',
        'cost',
      ])

      const record = FuelService.createFuelRecord(context.data, context.user.email)

      return {
        status: 201,
        msgKey: 'fuel.created',
        message: 'Fuel record created successfully',
        data: record,
      }
    } catch (error) {
      console.error('Error in FuelHandler.createFuelRecord:', error.message)
      throw error
    }
  },

  /**
   * Lists all fuel records with optional filters
   * Route: fuel.list
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  listFuelRecords: function (context) {
    try {
      const filters = {
        vehicleId: context.data.vehicleId,
        startDate: context.data.startDate,
        endDate: context.data.endDate,
      }

      const records = FuelService.getAllFuelRecords(filters)

      return {
        status: 200,
        msgKey: 'fuel.list',
        message: 'Fuel records retrieved successfully',
        data: records,
      }
    } catch (error) {
      console.error('Error in FuelHandler.listFuelRecords:', error.message)
      throw error
    }
  },

  /**
   * Gets a single fuel record by ID
   * Route: fuel.get
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getFuelRecord: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['recordId'])

      const record = FuelService.getFuelRecordById(context.data.recordId)

      if (!record) {
        throw new Error('Fuel record not found')
      }

      return {
        status: 200,
        msgKey: 'fuel.get',
        message: 'Fuel record retrieved successfully',
        data: record,
      }
    } catch (error) {
      console.error('Error in FuelHandler.getFuelRecord:', error.message)
      throw error
    }
  },

  /**
   * Updates a fuel record
   * Route: fuel.update
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  updateFuelRecord: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['recordId'])

      const updatedRecord = FuelService.updateFuelRecord(
        context.data.recordId,
        context.data,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'fuel.updated',
        message: 'Fuel record updated successfully',
        data: updatedRecord,
      }
    } catch (error) {
      console.error('Error in FuelHandler.updateFuelRecord:', error.message)
      throw error
    }
  },

  /**
   * Deletes a fuel record
   * Route: fuel.delete
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  deleteFuelRecord: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['recordId'])

      RoleValidator.requireFleetManager(context.user)

      FuelService.deleteFuelRecord(context.data.recordId, context.user.email)

      return {
        status: 200,
        msgKey: 'fuel.deleted',
        message: 'Fuel record deleted successfully',
        data: null,
      }
    } catch (error) {
      console.error('Error in FuelHandler.deleteFuelRecord:', error.message)
      throw error
    }
  },

  /**
   * Calculates fuel efficiency for a vehicle
   * Route: fuel.efficiency
   * Role: All authenticated users
   * Implements FR-006
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  calculateEfficiency: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId'])

      const recordCount = context.data.recordCount || 10

      const efficiency = FuelService.calculateFuelEfficiency(
        context.data.vehicleId,
        recordCount
      )

      return {
        status: 200,
        msgKey: 'fuel.efficiency',
        message: 'Fuel efficiency calculated successfully',
        data: efficiency,
      }
    } catch (error) {
      console.error('Error in FuelHandler.calculateEfficiency:', error.message)
      throw error
    }
  },

  /**
   * Gets fuel statistics for a vehicle
   * Route: fuel.statistics
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getFuelStatistics: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['vehicleId'])

      const statistics = FuelService.getFuelStatistics(context.data.vehicleId)

      return {
        status: 200,
        msgKey: 'fuel.statistics',
        message: 'Fuel statistics retrieved successfully',
        data: statistics,
      }
    } catch (error) {
      console.error('Error in FuelHandler.getFuelStatistics:', error.message)
      throw error
    }
  },
}

// Method aliases for router compatibility
FuelHandler.create = FuelHandler.createFuelRecord
FuelHandler.list = FuelHandler.listFuelRecords
FuelHandler.get = FuelHandler.getFuelRecord
FuelHandler.update = FuelHandler.updateFuelRecord
FuelHandler.delete = FuelHandler.deleteFuelRecord
FuelHandler.efficiency = FuelHandler.calculateFuelEfficiency
FuelHandler.statistics = FuelHandler.getFuelStatistics
