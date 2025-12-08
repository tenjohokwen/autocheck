/**
 * FleetService.gs
 *
 * Service layer for Fleet management
 * Handles all fleet-related database operations
 */

const FleetService = {
  /**
   * Creates a new fleet
   * @param {Object} data - Fleet data (name, description)
   * @param {string} createdBy - User email
   * @returns {Object} Created fleet object
   */
  createFleet: function (data, createdBy) {
    const fleetId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    const fleet = {
      fleetId: fleetId,
      name: SecurityInterceptor.sanitizeInput(data.name),
      description: data.description ? SecurityInterceptor.sanitizeInput(data.description) : '',
      vehicleCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    DatabaseUtil.appendRow('fleets', DatabaseUtil.objectToRow('fleets', fleet))

    console.log('Fleet created:', { fleetId: fleet.fleetId, name: fleet.name })
    return fleet
  },

  /**
   * Gets all fleets
   * @returns {Array<Object>} Array of fleet objects
   */
  getAllFleets: function () {
    const fleets = DatabaseUtil.getAllRecords('fleets')

    // Calculate actual vehicle count for each fleet
    fleets.forEach(
      function (fleet) {
        fleet.vehicleCount = this.getVehicleCountForFleet(fleet.fleetId)
      }.bind(this),
    )

    return fleets
  },

  /**
   * Gets fleet by ID
   * @param {string} fleetId - Fleet ID
   * @returns {Object|null} Fleet object or null
   */
  getFleetById: function (fleetId) {
    const columnIndex = DatabaseUtil.getColumnIndex('fleets', 'fleetId')
    const result = DatabaseUtil.findRowByColumn('fleets', columnIndex, fleetId)

    if (!result) {
      return null
    }

    const fleet = result.data
    fleet.vehicleCount = this.getVehicleCountForFleet(fleetId)
    return fleet
  },

  /**
   * Updates a fleet
   * @param {string} fleetId - Fleet ID
   * @param {Object} data - Updated data
   * @param {string} changedBy - User email
   * @returns {Object} Updated fleet
   */
  updateFleet: function (fleetId, data, changedBy) {
    const fleet = this.getFleetById(fleetId)

    if (!fleet) {
      throw new Error('Fleet not found: ' + fleetId)
    }

    // Update fields
    if (data.name !== undefined) {
      fleet.name = SecurityInterceptor.sanitizeInput(data.name)
    }
    if (data.description !== undefined) {
      fleet.description = SecurityInterceptor.sanitizeInput(data.description)
    }

    fleet.updatedAt = DatabaseUtil.getCurrentTimestamp()
    fleet.changedBy = changedBy

    DatabaseUtil.upsertRecord('fleets', 'fleetId', fleet)

    console.log('Fleet updated:', { fleetId: fleet.fleetId, name: fleet.name })
    return fleet
  },

  /**
   * Deletes a fleet
   * Sets all vehicles' fleetId to null/empty
   * @param {string} fleetId - Fleet ID
   * @param {string} changedBy - User email
   */
  deleteFleet: function (fleetId, changedBy) {
    const fleet = this.getFleetById(fleetId)

    if (!fleet) {
      throw new Error('Fleet not found: ' + fleetId)
    }

    // Remove fleet assignment from all vehicles in this fleet
    const vehicles = this.getVehiclesInFleet(fleetId)
    vehicles.forEach(
      function (vehicle) {
        VehicleService.removeFromFleet(vehicle.vehicleId, changedBy)
      }.bind(this),
    )

    // Delete the fleet row
    const columnIndex = DatabaseUtil.getColumnIndex('fleets', 'fleetId')
    const result = DatabaseUtil.findRowByColumn('fleets', columnIndex, fleetId)

    if (result) {
      DatabaseUtil.deleteRow('fleets', result.rowIndex)
      console.log('Fleet deleted:', { fleetId: fleetId, name: fleet.name })
    }
  },

  /**
   * Gets count of active (non-archived) vehicles in a fleet
   * @param {string} fleetId - Fleet ID
   * @returns {number} Count of active vehicles
   */
  getVehicleCountForFleet: function (fleetId) {
    if (!fleetId) {
      return 0
    }

    const vehicles = this.getVehiclesInFleet(fleetId)
    return vehicles.length
  },

  /**
   * Gets all active vehicles in a fleet
   * @param {string} fleetId - Fleet ID
   * @returns {Array<Object>} Array of vehicle objects (excluding archived)
   */
  getVehiclesInFleet: function (fleetId) {
    const allVehicles = DatabaseUtil.getAllRecords('vehicles')

    return allVehicles.filter(function (vehicle) {
      return vehicle.fleetId === fleetId && vehicle.archived !== true && vehicle.archived !== 'TRUE'
    })
  },

  /**
   * Validates fleet name is unique
   * @param {string} name - Fleet name
   * @param {string} excludeFleetId - Fleet ID to exclude from check (for updates)
   * @returns {boolean} True if unique
   */
  isFleetNameUnique: function (name, excludeFleetId) {
    const allFleets = DatabaseUtil.getAllRecords('fleets')

    for (let i = 0; i < allFleets.length; i++) {
      const fleet = allFleets[i]
      if (fleet.name.toLowerCase() === name.toLowerCase() && fleet.fleetId !== excludeFleetId) {
        return false
      }
    }

    return true
  },

  /**
   * Validates fleet data
   * @param {Object} data - Fleet data to validate
   * @throws {Error} If validation fails
   */
  validateFleetData: function (data) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Fleet name is required')
    }

    if (data.name.length > 100) {
      throw new Error('Fleet name must be 100 characters or less')
    }

    if (data.description && data.description.length > 500) {
      throw new Error('Fleet description must be 500 characters or less')
    }
  },
}
