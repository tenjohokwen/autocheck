/**
 * RepairService.gs
 *
 * Business logic for repair history operations.
 * Handles CRUD operations, repair tracking, cost analysis, and warranty management.
 * Implements FR-020 (repair history tracking).
 */

const RepairService = {
  /**
   * Creates a new repair record
   * @param {Object} data - Repair data
   * @param {string} createdBy - Email of creator
   * @returns {Object} Created repair record
   */
  createRepair: function (data, createdBy) {
    SecurityInterceptor.validateRequiredFields(data, [
      'vehicleId',
      'repairDate',
      'description',
      'status',
    ])

    // Validate status
    this.validateRepairStatus(data.status)

    // Validate severity if provided
    if (data.severity) {
      this.validateRepairSeverity(data.severity)
    }

    // Validate cost if provided
    if (data.cost !== undefined && data.cost !== null && data.cost < 0) {
      throw new Error('Repair cost cannot be negative')
    }

    // Validate vehicle exists
    const vehicle = VehicleService.getVehicleById(data.vehicleId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    // Validate odometer if provided
    if (data.odometerReading !== undefined && data.odometerReading !== null) {
      if (data.odometerReading < 0) {
        throw new Error('Odometer reading cannot be negative')
      }
    }

    const repairId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    const repair = {
      repairId: repairId,
      vehicleId: data.vehicleId,
      repairDate: data.repairDate,
      description: SecurityInterceptor.sanitizeInput(data.description),
      status: data.status,
      severity: data.severity || 'MEDIUM',
      cost: data.cost !== undefined && data.cost !== null ? parseFloat(data.cost) : null,
      odometerReading:
        data.odometerReading !== undefined && data.odometerReading !== null
          ? parseInt(data.odometerReading)
          : null,
      laborHours:
        data.laborHours !== undefined && data.laborHours !== null
          ? parseFloat(data.laborHours)
          : null,
      partsUsed: data.partsUsed || '',
      technicianName: data.technicianName || '',
      repairShop: data.repairShop || '',
      warrantyExpiry: data.warrantyExpiry || '',
      isWarrantyClaim: data.isWarrantyClaim || false,
      maintenanceTaskId: data.maintenanceTaskId || '',
      invoiceNumber: data.invoiceNumber || '',
      notes: data.notes ? SecurityInterceptor.sanitizeInput(data.notes) : '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    DatabaseUtil.appendRow('repairs', DatabaseUtil.objectToRow('repairs', repair))

    console.log('Repair created:', {
      repairId: repairId,
      vehicleId: data.vehicleId,
      status: data.status,
      cost: data.cost,
    })

    return repair
  },

  /**
   * Gets all repair records with optional filters
   * @param {Object} filters - Filter options (vehicleId, status, severity, startDate, endDate)
   * @returns {Array} Array of repair records
   */
  getAllRepairs: function (filters) {
    filters = filters || {}
    let repairs = DatabaseUtil.getAllRecords('repairs')

    // Apply filters
    if (filters.vehicleId) {
      repairs = repairs.filter(function (repair) {
        return repair.vehicleId === filters.vehicleId
      })
    }

    if (filters.status) {
      repairs = repairs.filter(function (repair) {
        return repair.status === filters.status
      })
    }

    if (filters.severity) {
      repairs = repairs.filter(function (repair) {
        return repair.severity === filters.severity
      })
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate).getTime()
      repairs = repairs.filter(function (repair) {
        return new Date(repair.repairDate).getTime() >= startDate
      })
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate).getTime()
      repairs = repairs.filter(function (repair) {
        return new Date(repair.repairDate).getTime() <= endDate
      })
    }

    // Sort by date descending
    repairs.sort(function (a, b) {
      return new Date(b.repairDate).getTime() - new Date(a.repairDate).getTime()
    })

    return repairs
  },

  /**
   * Gets a single repair record by ID
   * @param {string} repairId - Repair ID
   * @returns {Object|null} Repair record or null
   */
  getRepairById: function (repairId) {
    const columnIndex = DatabaseUtil.getColumnIndex('repairs', 'repairId')
    const result = DatabaseUtil.findRowByColumn('repairs', columnIndex, repairId)

    return result ? result.data : null
  },

  /**
   * Updates a repair record
   * @param {string} repairId - Repair ID
   * @param {Object} updates - Fields to update
   * @param {string} changedBy - Email of user making changes
   * @returns {Object} Updated repair record
   */
  updateRepair: function (repairId, updates, changedBy) {
    const repair = this.getRepairById(repairId)

    if (!repair) {
      throw new Error('Repair record not found')
    }

    // Update allowed fields
    if (updates.repairDate !== undefined) {
      repair.repairDate = updates.repairDate
    }
    if (updates.description !== undefined) {
      repair.description = SecurityInterceptor.sanitizeInput(updates.description)
    }
    if (updates.status !== undefined) {
      this.validateRepairStatus(updates.status)
      repair.status = updates.status
    }
    if (updates.severity !== undefined) {
      this.validateRepairSeverity(updates.severity)
      repair.severity = updates.severity
    }
    if (updates.cost !== undefined) {
      if (updates.cost !== null && updates.cost < 0) {
        throw new Error('Repair cost cannot be negative')
      }
      repair.cost = updates.cost !== null ? parseFloat(updates.cost) : null
    }
    if (updates.odometerReading !== undefined) {
      if (updates.odometerReading !== null && updates.odometerReading < 0) {
        throw new Error('Odometer reading cannot be negative')
      }
      repair.odometerReading =
        updates.odometerReading !== null ? parseInt(updates.odometerReading) : null
    }
    if (updates.laborHours !== undefined) {
      repair.laborHours = updates.laborHours !== null ? parseFloat(updates.laborHours) : null
    }
    if (updates.partsUsed !== undefined) {
      repair.partsUsed = updates.partsUsed
    }
    if (updates.technicianName !== undefined) {
      repair.technicianName = updates.technicianName
    }
    if (updates.repairShop !== undefined) {
      repair.repairShop = updates.repairShop
    }
    if (updates.warrantyExpiry !== undefined) {
      repair.warrantyExpiry = updates.warrantyExpiry
    }
    if (updates.isWarrantyClaim !== undefined) {
      repair.isWarrantyClaim = updates.isWarrantyClaim
    }
    if (updates.invoiceNumber !== undefined) {
      repair.invoiceNumber = updates.invoiceNumber
    }
    if (updates.notes !== undefined) {
      repair.notes = SecurityInterceptor.sanitizeInput(updates.notes)
    }

    repair.updatedAt = DatabaseUtil.getCurrentTimestamp()
    repair.changedBy = changedBy

    DatabaseUtil.upsertRecord('repairs', 'repairId', repair)

    console.log('Repair updated:', {
      repairId: repairId,
      status: repair.status,
    })

    return repair
  },

  /**
   * Deletes a repair record
   * @param {string} repairId - Repair ID
   * @param {string} changedBy - Email of user deleting
   */
  deleteRepair: function (repairId, changedBy) {
    const repair = this.getRepairById(repairId)

    if (!repair) {
      throw new Error('Repair record not found')
    }

    const columnIndex = DatabaseUtil.getColumnIndex('repairs', 'repairId')
    const result = DatabaseUtil.findRowByColumn('repairs', columnIndex, repairId)

    if (result) {
      DatabaseUtil.deleteRow('repairs', result.rowIndex)
    }

    console.log('Repair deleted:', {
      repairId: repairId,
      deletedBy: changedBy,
    })
  },

  /**
   * Gets repair history for a specific vehicle
   * Implements FR-020
   * @param {string} vehicleId - Vehicle ID
   * @returns {Array} Array of repair records for the vehicle
   */
  getRepairHistory: function (vehicleId) {
    const repairs = this.getAllRepairs({ vehicleId: vehicleId })

    // Enrich with calculated fields
    const enrichedRepairs = repairs.map(function (repair) {
      return {
        ...repair,
        hasWarranty: repair.warrantyExpiry
          ? new Date(repair.warrantyExpiry).getTime() > new Date().getTime()
          : false,
      }
    })

    return enrichedRepairs
  },

  /**
   * Gets repair cost analysis by vehicle
   * @param {Object} filters - Filter options (startDate, endDate)
   * @returns {Array} Array of vehicles with total repair costs
   */
  getRepairCostAnalysis: function (filters) {
    const repairs = this.getAllRepairs(filters)
    const vehicles = VehicleService.getAllVehicles()

    const costsByVehicle = {}

    // Initialize with all vehicles
    vehicles.forEach(function (vehicle) {
      costsByVehicle[vehicle.vehicleId] = {
        vehicleId: vehicle.vehicleId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        totalCost: 0,
        totalLaborHours: 0,
        repairCount: 0,
        bySeverity: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },
      }
    })

    // Sum repair costs by vehicle
    repairs.forEach(function (repair) {
      if (costsByVehicle[repair.vehicleId]) {
        const cost = repair.cost !== null ? parseFloat(repair.cost) : 0
        const hours = repair.laborHours !== null ? parseFloat(repair.laborHours) : 0

        costsByVehicle[repair.vehicleId].totalCost += cost
        costsByVehicle[repair.vehicleId].totalLaborHours += hours
        costsByVehicle[repair.vehicleId].repairCount += 1
        costsByVehicle[repair.vehicleId].bySeverity[repair.severity] += 1
      }
    })

    // Convert to array and round
    const result = Object.values(costsByVehicle)
    result.forEach(function (vehicle) {
      vehicle.totalCost = Math.round(vehicle.totalCost * 100) / 100
      vehicle.totalLaborHours = Math.round(vehicle.totalLaborHours * 10) / 10
    })

    // Sort by total cost descending
    result.sort(function (a, b) {
      return b.totalCost - a.totalCost
    })

    return result
  },

  /**
   * Gets warranty information for repairs
   * @param {string} vehicleId - Optional vehicle ID filter
   * @returns {Array} Array of repairs under warranty
   */
  getWarrantyRepairs: function (vehicleId) {
    const filters = vehicleId ? { vehicleId: vehicleId } : {}
    const repairs = this.getAllRepairs(filters)
    const now = new Date().getTime()

    // Filter repairs with active warranty
    const warrantyRepairs = repairs.filter(function (repair) {
      if (!repair.warrantyExpiry) return false
      return new Date(repair.warrantyExpiry).getTime() > now
    })

    return warrantyRepairs
  },

  /**
   * Auto-creates repair record from completed maintenance task
   * Called when maintenance task is marked as completed
   * @param {Object} maintenanceTask - Maintenance task object
   * @param {string} createdBy - User creating repair
   * @returns {Object|null} Created repair record or null
   */
  autoCreateRepairFromMaintenance: function (maintenanceTask, createdBy) {
    // Only create repair if task is corrective and completed
    if (
      maintenanceTask.taskType !== 'CORRECTIVE' ||
      maintenanceTask.status !== 'COMPLETED'
    ) {
      return null
    }

    const repairData = {
      vehicleId: maintenanceTask.vehicleId,
      repairDate: maintenanceTask.completedDate || maintenanceTask.scheduledDate,
      description: maintenanceTask.description,
      status: 'COMPLETED',
      severity: this.mapPriorityToSeverity(maintenanceTask.priority),
      cost: maintenanceTask.estimatedCost || null,
      maintenanceTaskId: maintenanceTask.taskId,
      notes: maintenanceTask.notes || '',
    }

    return this.createRepair(repairData, createdBy)
  },

  /**
   * Maps maintenance priority to repair severity
   * @param {string} priority - Maintenance priority
   * @returns {string} Repair severity
   */
  mapPriorityToSeverity: function (priority) {
    const mapping = {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      URGENT: 'CRITICAL',
    }
    return mapping[priority] || 'MEDIUM'
  },

  /**
   * Validates repair status
   * @param {string} status - Repair status
   */
  validateRepairStatus: function (status) {
    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

    if (validStatuses.indexOf(status) === -1) {
      throw new Error('Invalid repair status. Must be: ' + validStatuses.join(', '))
    }
  },

  /**
   * Validates repair severity
   * @param {string} severity - Repair severity
   */
  validateRepairSeverity: function (severity) {
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

    if (validSeverities.indexOf(severity) === -1) {
      throw new Error('Invalid repair severity. Must be: ' + validSeverities.join(', '))
    }
  },
}
