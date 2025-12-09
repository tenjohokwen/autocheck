/**
 * ExpenseHandler.gs
 *
 * HTTP request handlers for Expense operations.
 * Enforces role-based access control.
 * Fleet Managers only - Technicians have no access to financial data (FR-033).
 */

const ExpenseHandler = {
  /**
   * Creates a new expense
   * Route: expense.create
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  createExpense: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, [
        'vehicleId',
        'category',
        'expenseDate',
        'amount',
        'description',
      ])

      RoleValidator.requireFleetManager(context.user)

      const expense = ExpenseService.createExpense(context.data, context.user.email)

      return {
        status: 201,
        msgKey: 'expense.created',
        message: 'Expense created successfully',
        data: expense,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.createExpense:', error.message)
      throw error
    }
  },

  /**
   * Lists all expenses with optional filters
   * Route: expense.list
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  listExpenses: function (context) {
    try {
      RoleValidator.requireFleetManager(context.user)

      const filters = {
        vehicleId: context.data.vehicleId,
        category: context.data.category,
        startDate: context.data.startDate,
        endDate: context.data.endDate,
      }

      const expenses = ExpenseService.getAllExpenses(filters)

      return {
        status: 200,
        msgKey: 'expense.list',
        message: 'Expenses retrieved successfully',
        data: expenses,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.listExpenses:', error.message)
      throw error
    }
  },

  /**
   * Gets a single expense by ID
   * Route: expense.get
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getExpense: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['expenseId'])

      RoleValidator.requireFleetManager(context.user)

      const expense = ExpenseService.getExpenseById(context.data.expenseId)

      if (!expense) {
        throw new Error('Expense not found')
      }

      return {
        status: 200,
        msgKey: 'expense.get',
        message: 'Expense retrieved successfully',
        data: expense,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.getExpense:', error.message)
      throw error
    }
  },

  /**
   * Updates an expense
   * Route: expense.update
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  updateExpense: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['expenseId'])

      RoleValidator.requireFleetManager(context.user)

      const updatedExpense = ExpenseService.updateExpense(
        context.data.expenseId,
        context.data,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'expense.updated',
        message: 'Expense updated successfully',
        data: updatedExpense,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.updateExpense:', error.message)
      throw error
    }
  },

  /**
   * Deletes an expense
   * Route: expense.delete
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  deleteExpense: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['expenseId'])

      RoleValidator.requireFleetManager(context.user)

      ExpenseService.deleteExpense(context.data.expenseId, context.user.email)

      return {
        status: 200,
        msgKey: 'expense.deleted',
        message: 'Expense deleted successfully',
        data: null,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.deleteExpense:', error.message)
      throw error
    }
  },

  /**
   * Gets expense dashboard summary
   * Route: expense.dashboard
   * Role: Fleet Manager only
   * Implements FR-018
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getExpenseDashboard: function (context) {
    try {
      RoleValidator.requireFleetManager(context.user)

      const filters = {
        vehicleId: context.data.vehicleId,
        startDate: context.data.startDate,
        endDate: context.data.endDate,
      }

      const dashboard = ExpenseService.getExpenseDashboard(filters)

      return {
        status: 200,
        msgKey: 'expense.dashboard',
        message: 'Expense dashboard retrieved successfully',
        data: dashboard,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.getExpenseDashboard:', error.message)
      throw error
    }
  },

  /**
   * Gets running costs by vehicle
   * Route: expense.runningCosts
   * Role: Fleet Manager only
   * Implements FR-021
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getRunningCosts: function (context) {
    try {
      RoleValidator.requireFleetManager(context.user)

      const filters = {
        startDate: context.data.startDate,
        endDate: context.data.endDate,
      }

      const costs = ExpenseService.getRunningCostsByVehicle(filters)

      return {
        status: 200,
        msgKey: 'expense.runningCosts',
        message: 'Running costs retrieved successfully',
        data: costs,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.getRunningCosts:', error.message)
      throw error
    }
  },

  /**
   * Generates expense report
   * Route: expense.report
   * Role: Fleet Manager only
   * Implements FR-019
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  generateExpenseReport: function (context) {
    try {
      RoleValidator.requireFleetManager(context.user)

      const filters = {
        vehicleId: context.data.vehicleId,
        category: context.data.category,
        startDate: context.data.startDate,
        endDate: context.data.endDate,
      }

      const report = ExpenseService.generateExpenseReport(filters)

      return {
        status: 200,
        msgKey: 'expense.reportGenerated',
        message: 'Expense report generated successfully',
        data: report,
      }
    } catch (error) {
      console.error('Error in ExpenseHandler.generateExpenseReport:', error.message)
      throw error
    }
  },
}

// Method aliases for Router compatibility
ExpenseHandler.create = ExpenseHandler.createExpense
ExpenseHandler.list = ExpenseHandler.listExpenses
ExpenseHandler.get = ExpenseHandler.getExpense
ExpenseHandler.update = ExpenseHandler.updateExpense
ExpenseHandler.delete = ExpenseHandler.deleteExpense
ExpenseHandler.dashboard = ExpenseHandler.getExpenseDashboard
ExpenseHandler.runningCosts = ExpenseHandler.getRunningCosts
ExpenseHandler.report = ExpenseHandler.generateExpenseReport
