/**
 * VehicleService.gs
 *
 * Service layer for Vehicle management
 * Handles CRUD operations and soft delete (archive) functionality
 */

const VehicleService = {
  /**
   * Creates a new vehicle
   * @param {Object} data - Vehicle data
   * @param {string} createdBy - User email
   * @returns {Object} Created vehicle object
   */
  createVehicle: function (data, createdBy) {
    // Validate data
    this.validateVehicleData(data)

    // Check for duplicate license plate (FR-028)
    if (this.isLicensePlateDuplicate(data.licensePlate, null)) {
      throw new Error('Vehicle with this license plate already exists')
    }

    const vehicleId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    const vehicle = {
      vehicleId: vehicleId,
      make: SecurityInterceptor.sanitizeInput(data.make),
      model: SecurityInterceptor.sanitizeInput(data.model),
      year: parseInt(data.year),
      seats: parseInt(data.seats),
      licensePlate: SecurityInterceptor.sanitizeInput(data.licensePlate).toUpperCase(),
      vehicleType: SecurityInterceptor.sanitizeInput(data.vehicleType),
      currentOdometer: parseFloat(data.currentOdometer || 0),
      fleetId: data.fleetId || '',
      insuranceExpiry: data.insuranceExpiry || '',
      archived: false,
      archivedDate: '',
      archivedReason: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    DatabaseUtil.appendRow('vehicles', DatabaseUtil.objectToRow('vehicles', vehicle))

    console.log('Vehicle created:', {
      vehicleId: vehicle.vehicleId,
      licensePlate: vehicle.licensePlate,
    })
    return vehicle
  },

  /**
   * Gets all vehicles (optionally including archived)
   * @param {boolean} includeArchived - Whether to include archived vehicles
   * @returns {Array<Object>} Array of vehicle objects
   */
  getAllVehicles: function (includeArchived) {
    const allVehicles = DatabaseUtil.getAllRecords('vehicles')

    if (includeArchived) {
      return allVehicles
    }

    // Filter out archived vehicles (FR-035)
    return allVehicles.filter(function (vehicle) {
      return vehicle.archived !== true && vehicle.archived !== 'TRUE'
    })
  },

  /**
   * Gets vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Object|null} Vehicle object or null
   */
  getVehicleById: function (vehicleId) {
    const columnIndex = DatabaseUtil.getColumnIndex('vehicles', 'vehicleId')
    const result = DatabaseUtil.findRowByColumn('vehicles', columnIndex, vehicleId)
    return result ? result.data : null
  },

  /**
   * Updates a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} data - Updated data
   * @param {string} changedBy - User email
   * @returns {Object} Updated vehicle
   */
  updateVehicle: function (vehicleId, data, changedBy) {
    const vehicle = this.getVehicleById(vehicleId)

    if (!vehicle) {
      throw new Error('Vehicle not found: ' + vehicleId)
    }

    // Check if license plate is being changed and if it's a duplicate
    if (data.licensePlate && data.licensePlate !== vehicle.licensePlate) {
      if (this.isLicensePlateDuplicate(data.licensePlate, vehicleId)) {
        throw new Error('Vehicle with this license plate already exists')
      }
      vehicle.licensePlate = SecurityInterceptor.sanitizeInput(data.licensePlate).toUpperCase()
    }

    // Update fields
    if (data.make) vehicle.make = SecurityInterceptor.sanitizeInput(data.make)
    if (data.model) vehicle.model = SecurityInterceptor.sanitizeInput(data.model)
    if (data.year) vehicle.year = parseInt(data.year)
    if (data.seats) vehicle.seats = parseInt(data.seats)
    if (data.vehicleType) vehicle.vehicleType = SecurityInterceptor.sanitizeInput(data.vehicleType)

    // Validate odometer reading (FR-029)
    if (data.currentOdometer !== undefined) {
      const newOdometer = parseFloat(data.currentOdometer)
      if (newOdometer < vehicle.currentOdometer) {
        throw new Error('Odometer reading cannot be lower than previous reading')
      }
      vehicle.currentOdometer = newOdometer
    }

    if (data.insuranceExpiry !== undefined) {
      vehicle.insuranceExpiry = data.insuranceExpiry
    }

    if (data.fleetId !== undefined) {
      vehicle.fleetId = data.fleetId
    }

    vehicle.updatedAt = DatabaseUtil.getCurrentTimestamp()
    vehicle.changedBy = changedBy

    DatabaseUtil.upsertRecord('vehicles', 'vehicleId', vehicle)

    console.log('Vehicle updated:', {
      vehicleId: vehicle.vehicleId,
      licensePlate: vehicle.licensePlate,
    })
    return vehicle
  },

  /**
   * Archives a vehicle (soft delete - FR-034)
   * @param {string} vehicleId - Vehicle ID
   * @param {string} reason - Reason for archiving
   * @param {string} changedBy - User email
   * @returns {Object} Archived vehicle
   */
  archiveVehicle: function (vehicleId, reason, changedBy) {
    const vehicle = this.getVehicleById(vehicleId)

    if (!vehicle) {
      throw new Error('Vehicle not found: ' + vehicleId)
    }

    if (vehicle.archived === true || vehicle.archived === 'TRUE') {
      throw new Error('Vehicle is already archived')
    }

    vehicle.archived = true
    vehicle.archivedDate = DatabaseUtil.getCurrentTimestamp()
    vehicle.archivedReason = reason || 'No reason provided'
    vehicle.updatedAt = DatabaseUtil.getCurrentTimestamp()
    vehicle.changedBy = changedBy

    DatabaseUtil.upsertRecord('vehicles', 'vehicleId', vehicle)

    // Cancel future recurring maintenance tasks (FR-039)
    this.cancelFutureMaintenanceTasks(vehicleId)

    console.log('Vehicle archived:', {
      vehicleId: vehicle.vehicleId,
      licensePlate: vehicle.licensePlate,
      reason: vehicle.archivedReason,
    })
    return vehicle
  },

  /**
   * Assigns a vehicle to a fleet
   * @param {string} vehicleId - Vehicle ID
   * @param {string} fleetId - Fleet ID
   * @param {string} changedBy - User email
   * @returns {Object} Updated vehicle
   */
  assignToFleet: function (vehicleId, fleetId, changedBy) {
    // Verify fleet exists
    const fleet = FleetService.getFleetById(fleetId)
    if (!fleet) {
      throw new Error('Fleet not found: ' + fleetId)
    }

    return this.updateVehicle(vehicleId, { fleetId: fleetId }, changedBy)
  },

  /**
   * Removes a vehicle from its fleet
   * @param {string} vehicleId - Vehicle ID
   * @param {string} changedBy - User email
   * @returns {Object} Updated vehicle
   */
  removeFromFleet: function (vehicleId, changedBy) {
    return this.updateVehicle(vehicleId, { fleetId: '' }, changedBy)
  },

  /**
   * Checks if a license plate is already in use
   * @param {string} licensePlate - License plate to check
   * @param {string} excludeVehicleId - Vehicle ID to exclude (for updates)
   * @returns {boolean} True if duplicate
   */
  isLicensePlateDuplicate: function (licensePlate, excludeVehicleId) {
    // Validate input is a string
    if (!licensePlate || typeof licensePlate !== 'string') {
      return false
    }

    const allVehicles = DatabaseUtil.getAllRecords('vehicles')
    const normalizedPlate = licensePlate.toUpperCase().trim()

    for (let i = 0; i < allVehicles.length; i++) {
      const vehicle = allVehicles[i]
      // Skip if vehicle doesn't have a valid license plate
      if (!vehicle.licensePlate || typeof vehicle.licensePlate !== 'string') {
        continue
      }

      if (
        vehicle.licensePlate.toUpperCase() === normalizedPlate &&
        vehicle.vehicleId !== excludeVehicleId
      ) {
        return true
      }
    }

    return false
  },

  /**
   * Cancels future maintenance tasks for an archived vehicle
   * Implements FR-039: Cancel future scheduled recurring tasks
   * @param {string} vehicleId - Vehicle ID
   */
  cancelFutureMaintenanceTasks: function (vehicleId) {
    try {
      // This will be implemented when MaintenanceService is created
      // For now, we'll just log the action
      console.log('Cancelling future maintenance tasks for vehicle:', vehicleId)

      // Future implementation:
      // MaintenanceService.cancelFutureTasksForVehicle(vehicleId)
    } catch (error) {
      console.warn('Failed to cancel future maintenance tasks:', error.message)
    }
  },

  /**
   * Validates vehicle data
   * @param {Object} data - Vehicle data to validate
   * @throws {Error} If validation fails
   */
  validateVehicleData: function (data) {
    if (!data.make || typeof data.make !== 'string' || data.make.trim().length === 0) {
      throw new Error('Vehicle make is required')
    }

    if (!data.model || typeof data.model !== 'string' || data.model.trim().length === 0) {
      throw new Error('Vehicle model is required')
    }

    if (!data.year) {
      throw new Error('Vehicle year is required')
    }

    const year = parseInt(data.year)
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      throw new Error('Vehicle year must be between 1900 and ' + (new Date().getFullYear() + 1))
    }

    if (!data.seats) {
      throw new Error('Number of seats is required')
    }

    const seats = parseInt(data.seats)
    if (isNaN(seats) || seats < 1 || seats > 99) {
      throw new Error('Number of seats must be between 1 and 99')
    }

    if (!data.licensePlate || typeof data.licensePlate !== 'string' || data.licensePlate.trim().length === 0) {
      throw new Error('License plate is required')
    }

    if (data.licensePlate.length > 20) {
      throw new Error('License plate must be 20 characters or less')
    }

    if (!data.vehicleType || typeof data.vehicleType !== 'string' || data.vehicleType.trim().length === 0) {
      throw new Error('Vehicle type is required')
    }

    if (data.currentOdometer !== undefined) {
      const odometer = parseFloat(data.currentOdometer)
      if (isNaN(odometer) || odometer < 0) {
        throw new Error('Odometer reading must be a positive number')
      }
    }
  },

  /**
   * Gets vehicles by fleet ID
   * @param {string} fleetId - Fleet ID
   * @param {boolean} includeArchived - Whether to include archived vehicles
   * @returns {Array<Object>} Array of vehicles in the fleet
   */
  getVehiclesByFleetId: function (fleetId, includeArchived) {
    const allVehicles = this.getAllVehicles(includeArchived)
    return allVehicles.filter(function (vehicle) {
      return vehicle.fleetId === fleetId
    })
  },
}
