/**
 * ExpenseService.gs
 *
 * Business logic for expense operations.
 * Handles CRUD operations, expense categorization, and dashboard calculations.
 * Implements FR-017 (expense tracking), FR-018 (dashboard), FR-019 (reports), FR-021 (running costs).
 */

const ExpenseService = {
  /**
   * Creates a new expense
   * @param {Object} data - Expense data
   * @param {string} createdBy - Email of creator
   * @returns {Object} Created expense
   */
  createExpense: function (data, createdBy) {
    SecurityInterceptor.validateRequiredFields(data, [
      'vehicleId',
      'category',
      'expenseDate',
      'amount',
      'description',
    ])

    // Validate category
    this.validateExpenseCategory(data.category)

    // Validate amount
    if (data.amount <= 0) {
      throw new Error('Expense amount must be greater than 0')
    }

    // Validate vehicle exists
    const vehicle = VehicleService.getVehicleById(data.vehicleId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    const expenseId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    const expense = {
      expenseId: expenseId,
      vehicleId: data.vehicleId,
      category: data.category,
      expenseDate: data.expenseDate,
      amount: parseFloat(data.amount),
      description: SecurityInterceptor.sanitizeInput(data.description),
      receiptNumber: data.receiptNumber || '',
      vendor: data.vendor || '',
      maintenanceTaskId: data.maintenanceTaskId || '',
      fillUpId: data.fillUpId || '',
      documentId: data.documentId || '',
      isRecurring: data.isRecurring || false,
      recurrenceIntervalDays: data.recurrenceIntervalDays || null,
      notes: data.notes ? SecurityInterceptor.sanitizeInput(data.notes) : '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    DatabaseUtil.appendRow('expenses', DatabaseUtil.objectToRow('expenses', expense))

    console.log('Expense created:', {
      expenseId: expenseId,
      vehicleId: data.vehicleId,
      category: data.category,
      amount: data.amount,
    })

    return expense
  },

  /**
   * Gets all expenses with optional filters
   * @param {Object} filters - Filter options (vehicleId, category, startDate, endDate)
   * @returns {Array} Array of expenses
   */
  getAllExpenses: function (filters) {
    filters = filters || {}
    let expenses = DatabaseUtil.getAllRecords('expenses')

    // Apply filters
    if (filters.vehicleId) {
      expenses = expenses.filter(function (expense) {
        return expense.vehicleId === filters.vehicleId
      })
    }

    if (filters.category) {
      expenses = expenses.filter(function (expense) {
        return expense.category === filters.category
      })
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate).getTime()
      expenses = expenses.filter(function (expense) {
        return new Date(expense.expenseDate).getTime() >= startDate
      })
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate).getTime()
      expenses = expenses.filter(function (expense) {
        return new Date(expense.expenseDate).getTime() <= endDate
      })
    }

    // Sort by date descending
    expenses.sort(function (a, b) {
      return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    })

    return expenses
  },

  /**
   * Gets a single expense by ID
   * @param {string} expenseId - Expense ID
   * @returns {Object|null} Expense or null
   */
  getExpenseById: function (expenseId) {
    const columnIndex = DatabaseUtil.getColumnIndex('expenses', 'expenseId')
    const result = DatabaseUtil.findRowByColumn('expenses', columnIndex, expenseId)

    return result ? result.data : null
  },

  /**
   * Updates an expense
   * @param {string} expenseId - Expense ID
   * @param {Object} updates - Fields to update
   * @param {string} changedBy - Email of user making changes
   * @returns {Object} Updated expense
   */
  updateExpense: function (expenseId, updates, changedBy) {
    const expense = this.getExpenseById(expenseId)

    if (!expense) {
      throw new Error('Expense not found')
    }

    // Update allowed fields
    if (updates.category !== undefined) {
      this.validateExpenseCategory(updates.category)
      expense.category = updates.category
    }
    if (updates.expenseDate !== undefined) {
      expense.expenseDate = updates.expenseDate
    }
    if (updates.amount !== undefined) {
      if (updates.amount <= 0) {
        throw new Error('Expense amount must be greater than 0')
      }
      expense.amount = parseFloat(updates.amount)
    }
    if (updates.description !== undefined) {
      expense.description = SecurityInterceptor.sanitizeInput(updates.description)
    }
    if (updates.receiptNumber !== undefined) {
      expense.receiptNumber = updates.receiptNumber
    }
    if (updates.vendor !== undefined) {
      expense.vendor = updates.vendor
    }
    if (updates.notes !== undefined) {
      expense.notes = SecurityInterceptor.sanitizeInput(updates.notes)
    }

    expense.updatedAt = DatabaseUtil.getCurrentTimestamp()
    expense.changedBy = changedBy

    DatabaseUtil.upsertRecord('expenses', 'expenseId', expense)

    console.log('Expense updated:', {
      expenseId: expenseId,
      amount: expense.amount,
    })

    return expense
  },

  /**
   * Deletes an expense
   * @param {string} expenseId - Expense ID
   * @param {string} changedBy - Email of user deleting
   */
  deleteExpense: function (expenseId, changedBy) {
    const expense = this.getExpenseById(expenseId)

    if (!expense) {
      throw new Error('Expense not found')
    }

    const columnIndex = DatabaseUtil.getColumnIndex('expenses', 'expenseId')
    const result = DatabaseUtil.findRowByColumn('expenses', columnIndex, expenseId)

    if (result) {
      DatabaseUtil.deleteRow('expenses', result.rowIndex)
    }

    console.log('Expense deleted:', {
      expenseId: expenseId,
      deletedBy: changedBy,
    })
  },

  /**
   * Gets expense dashboard summary by category
   * Implements FR-018
   * @param {Object} filters - Filter options (vehicleId, startDate, endDate)
   * @returns {Object} Dashboard data with totals by category
   */
  getExpenseDashboard: function (filters) {
    const expenses = this.getAllExpenses(filters)

    const dashboard = {
      totalExpenses: 0,
      byCategory: {
        FUEL: 0,
        MAINTENANCE: 0,
        INSURANCE: 0,
        FINES: 0,
        TOLLS: 0,
        FEES: 0,
        FINANCING: 0,
        OTHER: 0,
      },
      count: expenses.length,
      dateRange: {
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
      },
    }

    expenses.forEach(function (expense) {
      const amount = parseFloat(expense.amount)
      dashboard.totalExpenses += amount
      dashboard.byCategory[expense.category] += amount
    })

    // Round to 2 decimal places
    dashboard.totalExpenses = Math.round(dashboard.totalExpenses * 100) / 100
    Object.keys(dashboard.byCategory).forEach(function (category) {
      dashboard.byCategory[category] =
        Math.round(dashboard.byCategory[category] * 100) / 100
    })

    return dashboard
  },

  /**
   * Gets running costs per vehicle
   * Implements FR-021
   * @param {Object} filters - Filter options (startDate, endDate)
   * @returns {Array} Array of vehicles with total costs
   */
  getRunningCostsByVehicle: function (filters) {
    const expenses = this.getAllExpenses(filters)
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
        byCategory: {
          FUEL: 0,
          MAINTENANCE: 0,
          INSURANCE: 0,
          FINES: 0,
          TOLLS: 0,
          FEES: 0,
          FINANCING: 0,
          OTHER: 0,
        },
      }
    })

    // Sum expenses by vehicle
    expenses.forEach(function (expense) {
      if (costsByVehicle[expense.vehicleId]) {
        const amount = parseFloat(expense.amount)
        costsByVehicle[expense.vehicleId].totalCost += amount
        costsByVehicle[expense.vehicleId].byCategory[expense.category] += amount
      }
    })

    // Convert to array and round
    const result = Object.values(costsByVehicle)
    result.forEach(function (vehicle) {
      vehicle.totalCost = Math.round(vehicle.totalCost * 100) / 100
      Object.keys(vehicle.byCategory).forEach(function (category) {
        vehicle.byCategory[category] =
          Math.round(vehicle.byCategory[category] * 100) / 100
      })
    })

    // Sort by total cost descending
    result.sort(function (a, b) {
      return b.totalCost - a.totalCost
    })

    return result
  },

  /**
   * Generates expense report data
   * Implements FR-019
   * @param {Object} filters - Filter options (vehicleId, startDate, endDate, category)
   * @returns {Object} Report data
   */
  generateExpenseReport: function (filters) {
    const expenses = this.getAllExpenses(filters)
    const dashboard = this.getExpenseDashboard(filters)

    return {
      reportDate: DatabaseUtil.getCurrentTimestamp(),
      filters: filters,
      summary: dashboard,
      expenses: expenses,
      vehicleCount: this.getUniqueVehicleCount(expenses),
    }
  },

  /**
   * Auto-creates expense from fuel record
   * Called when fuel record is created
   * @param {Object} fuelRecord - Fuel record object
   * @param {string} createdBy - User creating expense
   * @returns {Object} Created expense
   */
  autoCreateFuelExpense: function (fuelRecord, createdBy) {
    const expenseData = {
      vehicleId: fuelRecord.vehicleId,
      category: 'FUEL',
      expenseDate: fuelRecord.date,
      amount: fuelRecord.cost,
      description: 'Fuel: ' + fuelRecord.liters + 'L @ ' + fuelRecord.station,
      vendor: fuelRecord.station || 'Gas Station',
      fillUpId: fuelRecord.recordId,
      notes: fuelRecord.notes || '',
    }

    return this.createExpense(expenseData, createdBy)
  },

  /**
   * Auto-creates expense from completed maintenance task
   * Called when maintenance task is completed with cost
   * @param {Object} maintenanceTask - Maintenance task object
   * @param {number} cost - Maintenance cost
   * @param {string} createdBy - User creating expense
   * @returns {Object} Created expense
   */
  autoCreateMaintenanceExpense: function (maintenanceTask, cost, createdBy) {
    if (!cost || cost <= 0) {
      return null
    }

    const expenseData = {
      vehicleId: maintenanceTask.vehicleId,
      category: 'MAINTENANCE',
      expenseDate: maintenanceTask.completedDate || maintenanceTask.scheduledDate,
      amount: cost,
      description: maintenanceTask.taskType + ': ' + maintenanceTask.description,
      maintenanceTaskId: maintenanceTask.taskId,
      notes: maintenanceTask.notes || '',
    }

    return this.createExpense(expenseData, createdBy)
  },

  /**
   * Gets count of unique vehicles in expenses
   * @param {Array} expenses - Array of expenses
   * @returns {number} Count of unique vehicles
   */
  getUniqueVehicleCount: function (expenses) {
    const uniqueVehicles = {}
    expenses.forEach(function (expense) {
      uniqueVehicles[expense.vehicleId] = true
    })
    return Object.keys(uniqueVehicles).length
  },

  /**
   * Validates expense category
   * @param {string} category - Expense category
   */
  validateExpenseCategory: function (category) {
    const validCategories = [
      'FUEL',
      'MAINTENANCE',
      'INSURANCE',
      'FINES',
      'TOLLS',
      'FEES',
      'FINANCING',
      'OTHER',
    ]

    if (validCategories.indexOf(category) === -1) {
      throw new Error('Invalid expense category. Must be: ' + validCategories.join(', '))
    }
  },
}
