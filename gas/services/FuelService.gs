/**
 * FuelService.gs
 *
 * Business logic for fuel record operations.
 * Handles fuel purchase tracking and efficiency calculations.
 * Implements FR-004, FR-005, FR-006.
 */

const FuelService = {
  /**
   * Creates a new fuel record
   * Implements FR-004, FR-005
   * @param {Object} data - Fuel record data
   * @param {string} createdBy - Email of creator
   * @returns {Object} Created fuel record
   */
  createFuelRecord: function (data, createdBy) {
    // Validate required fields
    SecurityInterceptor.validateRequiredFields(data, [
      'vehicleId',
      'date',
      'odometer',
      'liters',
      'cost',
    ])

    // Validate vehicle exists
    const vehicle = VehicleService.getVehicleById(data.vehicleId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    // Validate odometer is not less than vehicle's current odometer
    if (data.odometer < vehicle.currentOdometer) {
      throw new Error(
        'Fuel record odometer cannot be less than vehicle current odometer (' +
          vehicle.currentOdometer +
          ')'
      )
    }

    // Validate positive values
    if (data.liters <= 0) {
      throw new Error('Liters must be greater than 0')
    }
    if (data.cost < 0) {
      throw new Error('Cost must be greater than or equal to 0')
    }

    // Generate UUID and timestamps
    const recordId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    // Build fuel record object
    const record = {
      recordId: recordId,
      vehicleId: data.vehicleId,
      date: data.date,
      odometer: data.odometer,
      liters: data.liters,
      cost: data.cost,
      location: data.location || '',
      fuelType: data.fuelType || 'REGULAR',
      fullTank: data.fullTank !== undefined ? data.fullTank : true,
      notes: data.notes ? SecurityInterceptor.sanitizeInput(data.notes) : '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    // Save to database
    DatabaseUtil.appendRow('fuelRecords', DatabaseUtil.objectToRow('fuelRecords', record))

    // Update vehicle's current odometer if this is newer
    if (data.odometer > vehicle.currentOdometer) {
      VehicleService.updateVehicle(
        data.vehicleId,
        { currentOdometer: data.odometer },
        'SYSTEM'
      )
    }

    console.log('Fuel record created:', {
      recordId: recordId,
      vehicleId: data.vehicleId,
      liters: data.liters,
    })

    return record
  },

  /**
   * Gets all fuel records
   * @param {Object} filters - Optional filters (vehicleId, startDate, endDate)
   * @returns {Array} Array of fuel records
   */
  getAllFuelRecords: function (filters) {
    filters = filters || {}
    let records = DatabaseUtil.getAllRecords('fuelRecords')

    // Apply filters
    if (filters.vehicleId) {
      records = records.filter(function (record) {
        return record.vehicleId === filters.vehicleId
      })
    }

    if (filters.startDate) {
      const startTime = new Date(filters.startDate).getTime()
      records = records.filter(function (record) {
        return new Date(record.date).getTime() >= startTime
      })
    }

    if (filters.endDate) {
      const endTime = new Date(filters.endDate).getTime()
      records = records.filter(function (record) {
        return new Date(record.date).getTime() <= endTime
      })
    }

    // Sort by date descending (newest first)
    records.sort(function (a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return records
  },

  /**
   * Gets a single fuel record by ID
   * @param {string} recordId - Record ID
   * @returns {Object|null} Fuel record or null
   */
  getFuelRecordById: function (recordId) {
    const columnIndex = DatabaseUtil.getColumnIndex('fuelRecords', 'recordId')
    const result = DatabaseUtil.findRowByColumn('fuelRecords', columnIndex, recordId)

    return result ? result.data : null
  },

  /**
   * Updates a fuel record
   * @param {string} recordId - Record ID
   * @param {Object} updates - Fields to update
   * @param {string} changedBy - Email of user making changes
   * @returns {Object} Updated record
   */
  updateFuelRecord: function (recordId, updates, changedBy) {
    const record = this.getFuelRecordById(recordId)

    if (!record) {
      throw new Error('Fuel record not found')
    }

    // Update allowed fields
    if (updates.date !== undefined) {
      record.date = updates.date
    }
    if (updates.odometer !== undefined) {
      record.odometer = updates.odometer
    }
    if (updates.liters !== undefined) {
      if (updates.liters <= 0) {
        throw new Error('Liters must be greater than 0')
      }
      record.liters = updates.liters
    }
    if (updates.cost !== undefined) {
      if (updates.cost < 0) {
        throw new Error('Cost must be greater than or equal to 0')
      }
      record.cost = updates.cost
    }
    if (updates.location !== undefined) {
      record.location = updates.location
    }
    if (updates.fuelType !== undefined) {
      record.fuelType = updates.fuelType
    }
    if (updates.fullTank !== undefined) {
      record.fullTank = updates.fullTank
    }
    if (updates.notes !== undefined) {
      record.notes = SecurityInterceptor.sanitizeInput(updates.notes)
    }

    record.updatedAt = DatabaseUtil.getCurrentTimestamp()
    record.changedBy = changedBy

    // Save to database
    DatabaseUtil.upsertRecord('fuelRecords', 'recordId', record)

    console.log('Fuel record updated:', {
      recordId: recordId,
    })

    return record
  },

  /**
   * Deletes a fuel record
   * @param {string} recordId - Record ID
   * @param {string} changedBy - Email of user deleting
   */
  deleteFuelRecord: function (recordId, changedBy) {
    const record = this.getFuelRecordById(recordId)

    if (!record) {
      throw new Error('Fuel record not found')
    }

    const columnIndex = DatabaseUtil.getColumnIndex('fuelRecords', 'recordId')
    const result = DatabaseUtil.findRowByColumn('fuelRecords', columnIndex, recordId)

    if (result) {
      DatabaseUtil.deleteRow('fuelRecords', result.rowIndex)
    }

    console.log('Fuel record deleted:', {
      recordId: recordId,
      deletedBy: changedBy,
    })
  },

  /**
   * Calculates fuel efficiency for a vehicle
   * Implements FR-006
   * @param {string} vehicleId - Vehicle ID
   * @param {number} recordCount - Number of recent records to include (default 10)
   * @returns {Object} Efficiency metrics
   */
  calculateFuelEfficiency: function (vehicleId, recordCount) {
    recordCount = recordCount || 10

    const records = this.getAllFuelRecords({ vehicleId: vehicleId })

    if (records.length < 2) {
      return {
        averageLPer100km: null,
        averageMPG: null,
        totalDistance: 0,
        totalLiters: 0,
        recordsAnalyzed: records.length,
        message: 'Need at least 2 fuel records to calculate efficiency',
      }
    }

    // Take only the most recent records (already sorted by date desc)
    const recentRecords = records.slice(0, Math.min(recordCount, records.length))

    // Calculate total distance and fuel
    let totalDistance = 0
    let totalLiters = 0

    for (let i = 0; i < recentRecords.length - 1; i++) {
      const current = recentRecords[i]
      const previous = recentRecords[i + 1]

      const distance = current.odometer - previous.odometer
      if (distance > 0 && current.fullTank) {
        totalDistance += distance
        totalLiters += current.liters
      }
    }

    if (totalDistance === 0 || totalLiters === 0) {
      return {
        averageLPer100km: null,
        averageMPG: null,
        totalDistance: 0,
        totalLiters: 0,
        recordsAnalyzed: recentRecords.length,
        message: 'No valid full-tank records found for calculation',
      }
    }

    // Calculate L/100km
    const lPer100km = (totalLiters / totalDistance) * 100

    // Calculate MPG (US gallons)
    const milesPerGallon = (totalDistance * 0.621371) / (totalLiters * 0.264172)

    return {
      averageLPer100km: Math.round(lPer100km * 100) / 100,
      averageMPG: Math.round(milesPerGallon * 100) / 100,
      totalDistance: totalDistance,
      totalLiters: Math.round(totalLiters * 100) / 100,
      recordsAnalyzed: recentRecords.length,
      message: 'Efficiency calculated successfully',
    }
  },

  /**
   * Gets fuel statistics for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Object} Fuel statistics
   */
  getFuelStatistics: function (vehicleId) {
    const records = this.getAllFuelRecords({ vehicleId: vehicleId })

    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalLiters: 0,
        totalCost: 0,
        averageCostPerLiter: 0,
      }
    }

    let totalLiters = 0
    let totalCost = 0

    records.forEach(function (record) {
      totalLiters += record.liters
      totalCost += record.cost
    })

    return {
      totalRecords: records.length,
      totalLiters: Math.round(totalLiters * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      averageCostPerLiter: Math.round((totalCost / totalLiters) * 100) / 100,
    }
  },
}
