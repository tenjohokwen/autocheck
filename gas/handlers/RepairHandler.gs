/**
 * RepairHandler.gs
 *
 * HTTP handler for repair-related endpoints.
 * Routes requests to RepairService and formats responses.
 */

const RepairHandler = {
  /**
   * Creates a new repair record
   * POST repair.create
   */
  createRepair: function (context) {
    const data = context.data
    const repair = RepairService.createRepair(data, context.user.email)

    return {
      status: 200,
      msgKey: 'repair.created',
      message: 'Repair record created successfully',
      data: repair,
    }
  },

  /**
   * Gets all repair records with optional filters
   * POST repair.getAll
   */
  getAllRepairs: function (context) {
    const filters = context.data || {}
    const repairs = RepairService.getAllRepairs(filters)

    return {
      status: 200,
      msgKey: 'repair.list',
      message: 'Repair records retrieved successfully',
      data: repairs,
    }
  },

  /**
   * Gets a single repair record by ID
   * POST repair.getById
   */
  getRepairById: function (context) {
    const repairId = context.data.repairId

    if (!repairId) {
      throw new Error('repairId is required')
    }

    const repair = RepairService.getRepairById(repairId)

    if (!repair) {
      return {
        status: 404,
        msgKey: 'repair.notFound',
        message: 'Repair record not found',
        data: null,
      }
    }

    return {
      status: 200,
      msgKey: 'repair.details',
      message: 'Repair record retrieved successfully',
      data: repair,
    }
  },

  /**
   * Updates a repair record
   * POST repair.update
   */
  updateRepair: function (context) {
    const repairId = context.data.repairId
    const updates = context.data

    if (!repairId) {
      throw new Error('repairId is required')
    }

    const repair = RepairService.updateRepair(repairId, updates, context.user.email)

    return {
      status: 200,
      msgKey: 'repair.updated',
      message: 'Repair record updated successfully',
      data: repair,
    }
  },

  /**
   * Deletes a repair record
   * POST repair.delete
   */
  deleteRepair: function (context) {
    const repairId = context.data.repairId

    if (!repairId) {
      throw new Error('repairId is required')
    }

    RepairService.deleteRepair(repairId, context.user.email)

    return {
      status: 200,
      msgKey: 'repair.deleted',
      message: 'Repair record deleted successfully',
      data: null,
    }
  },

  /**
   * Gets repair history for a vehicle
   * POST repair.history
   */
  getRepairHistory: function (context) {
    const vehicleId = context.data.vehicleId

    if (!vehicleId) {
      throw new Error('vehicleId is required')
    }

    const repairs = RepairService.getRepairHistory(vehicleId)

    return {
      status: 200,
      msgKey: 'repair.history',
      message: 'Repair history retrieved successfully',
      data: repairs,
    }
  },

  /**
   * Gets repair cost analysis by vehicle
   * POST repair.costAnalysis
   */
  getRepairCostAnalysis: function (context) {
    const filters = context.data || {}
    const analysis = RepairService.getRepairCostAnalysis(filters)

    return {
      status: 200,
      msgKey: 'repair.costAnalysis',
      message: 'Repair cost analysis retrieved successfully',
      data: analysis,
    }
  },

  /**
   * Gets repairs under warranty
   * POST repair.warranty
   */
  getWarrantyRepairs: function (context) {
    const vehicleId = context.data.vehicleId || null
    const repairs = RepairService.getWarrantyRepairs(vehicleId)

    return {
      status: 200,
      msgKey: 'repair.warranty',
      message: 'Warranty repairs retrieved successfully',
      data: repairs,
    }
  },
}

// Method aliases for Router compatibility
RepairHandler.create = RepairHandler.createRepair
RepairHandler.getAll = RepairHandler.getAllRepairs
RepairHandler.getById = RepairHandler.getRepairById
RepairHandler.update = RepairHandler.updateRepair
RepairHandler.delete = RepairHandler.deleteRepair
RepairHandler.history = RepairHandler.getRepairHistory
RepairHandler.costAnalysis = RepairHandler.getRepairCostAnalysis
RepairHandler.warranty = RepairHandler.getWarrantyRepairs
