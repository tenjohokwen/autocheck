/**
 * Router.gs
 *
 * Routes incoming requests to appropriate handler methods.
 * Discovers and invokes handler methods dynamically based on action string.
 *
 * Per constitution: Route requests to appropriate methods, handle method discovery.
 *
 * Action Format: 'handler.method'
 * Example: 'auth.login' -> AuthHandler.login()
 */

const Router = {
  /**
   * Routes a validated request to the appropriate handler
   * @param {Object} context - Validated request context from SecurityInterceptor
   * @returns {Object} Handler response
   */
  route: function (context) {
    const action = context.action
    const parts = action.split('.')

    if (parts.length !== 2) {
      throw ResponseHandler.validationError(
        'Invalid action format. Expected: handler.method',
        'error.router.invalidAction',
      )
    }

    const handlerName = parts[0]
    const methodName = parts[1]

    // Get the handler object
    const handler = this.getHandler(handlerName)

    if (!handler) {
      throw ResponseHandler.notFoundError(
        'Handler not found: ' + handlerName,
        'error.router.handlerNotFound',
      )
    }

    // Get the method from the handler
    const method = handler[methodName]

    if (!method || typeof method !== 'function') {
      throw ResponseHandler.notFoundError(
        'Method not found: ' + handlerName + '.' + methodName,
        'error.router.methodNotFound',
      )
    }

    // Log the route
    console.log('Routing to:', action, {
      user: context.user ? context.user.email : 'public',
      timestamp: DateUtil.getCurrentTimestamp(),
    })

    // Invoke the method with context
    return method.call(handler, context)
  },

  /**
   * Gets a handler object by name
   * @param {string} handlerName - Name of the handler (e.g., 'auth', 'metadata')
   * @returns {Object} Handler object
   */
  getHandler: function (handlerName) {
    // Map handler names to handler objects
    const handlers = {
      auth: AuthHandler,
      fleet: FleetHandler,
      vehicle: VehicleHandler,
      maintenance: MaintenanceHandler,
      fuel: FuelHandler,
      reminder: ReminderHandler,
      expense: ExpenseHandler,
      repair: RepairHandler,
      parts: PartsHandler,
      document: DocumentHandler,
    }

    return handlers[handlerName] || null
  },

  /**
   * Lists all available routes (for documentation/debugging)
   * @returns {Object} Map of handler.method -> description
   */
  listRoutes: function () {
    return {
      // Auth routes
      'auth.signup': 'Create a new user account',
      'auth.verifyEmail': 'Verify user email with token',
      'auth.resendVerification': 'Resend verification email',
      'auth.login': 'Authenticate user and get token',
      'auth.ping': 'Extend session by refreshing token',
      'auth.requestPasswordReset': 'Request password reset OTP',
      'auth.verifyOTP': 'Verify OTP for password reset',
      'auth.resetPassword': 'Reset password with verified OTP',

      // Fleet routes
      'fleet.create': 'Create a new fleet (Fleet Manager only)',
      'fleet.list': 'List all fleets',
      'fleet.get': 'Get a single fleet by ID',
      'fleet.update': 'Update a fleet (Fleet Manager only)',
      'fleet.delete': 'Delete a fleet (Fleet Manager only)',
      'fleet.getVehicles': 'Get all vehicles in a fleet',

      // Vehicle routes
      'vehicle.create': 'Create a new vehicle (Fleet Manager only)',
      'vehicle.list': 'List all vehicles',
      'vehicle.get': 'Get a single vehicle by ID',
      'vehicle.update': 'Update a vehicle (Fleet Manager only)',
      'vehicle.archive': 'Archive a vehicle (Fleet Manager only)',
      'vehicle.assignToFleet': 'Assign a vehicle to a fleet (Fleet Manager only)',
      'vehicle.removeFromFleet': 'Remove a vehicle from its fleet (Fleet Manager only)',
      'vehicle.delete': 'Delete a vehicle permanently (Fleet Manager only)',

      // Maintenance routes
      'maintenance.create': 'Create a new maintenance task (Fleet Manager only)',
      'maintenance.list': 'List all maintenance tasks (with filters)',
      'maintenance.get': 'Get a single maintenance task by ID',
      'maintenance.update': 'Update a maintenance task (Fleet Manager or assigned Technician)',
      'maintenance.delete': 'Delete a maintenance task (Fleet Manager only)',
      'maintenance.assignTechnician': 'Assign a task to a technician (Fleet Manager only)',
      'maintenance.upcoming': 'Get upcoming maintenance tasks (due within specified days)',

      // Fuel routes
      'fuel.create': 'Create a new fuel record',
      'fuel.list': 'List all fuel records (with filters)',
      'fuel.get': 'Get a single fuel record by ID',
      'fuel.update': 'Update a fuel record',
      'fuel.delete': 'Delete a fuel record (Fleet Manager only)',
      'fuel.calculateEfficiency': 'Calculate fuel efficiency for a vehicle (FR-006)',
      'fuel.statistics': 'Get fuel statistics for a vehicle',

      // Reminder routes
      'reminder.create': 'Create a new reminder (Fleet Manager only)',
      'reminder.list': 'List all reminders (with filters)',
      'reminder.get': 'Get a single reminder by ID',
      'reminder.update': 'Update a reminder (Fleet Manager only)',
      'reminder.acknowledge': 'Acknowledge a reminder',
      'reminder.dismiss': 'Dismiss a reminder',
      'reminder.complete': 'Mark a reminder as completed',
      'reminder.delete': 'Delete a reminder (Fleet Manager only)',
      'reminder.active': 'Get active reminders (FR-013, FR-014)',
      'reminder.overdue': 'Get overdue reminders',

      // Expense routes
      'expense.create': 'Create a new expense (Fleet Manager only)',
      'expense.list': 'List all expenses with filters (Fleet Manager only)',
      'expense.get': 'Get a single expense by ID (Fleet Manager only)',
      'expense.update': 'Update an expense (Fleet Manager only)',
      'expense.delete': 'Delete an expense (Fleet Manager only)',
      'expense.dashboard': 'Get expense dashboard summary (FR-018)',
      'expense.runningCosts': 'Get running costs by vehicle (FR-021)',
      'expense.report': 'Generate expense report (FR-019)',

      // Repair routes
      'repair.create': 'Create a new repair record',
      'repair.getAll': 'List all repair records with filters',
      'repair.getById': 'Get a single repair record by ID',
      'repair.update': 'Update a repair record',
      'repair.delete': 'Delete a repair record (Fleet Manager only)',
      'repair.history': 'Get repair history for a vehicle (FR-020)',
      'repair.costAnalysis': 'Get repair cost analysis by vehicle',
      'repair.warranty': 'Get repairs under warranty',

      // Parts routes
      'parts.create': 'Create a new part (Fleet Manager only)',
      'parts.getAll': 'List all parts with filters',
      'parts.getById': 'Get a single part by ID',
      'parts.update': 'Update a part (Fleet Manager only)',
      'parts.delete': 'Delete a part (Fleet Manager only)',
      'parts.adjustQuantity': 'Adjust part quantity (add/remove stock)',
      'parts.lowStock': 'Get parts with low stock',
      'parts.summary': 'Get inventory summary with total value',
      'parts.search': 'Search parts by name or part number',

      // Document routes
      'document.create': 'Create a new document',
      'document.getAll': 'List all documents with filters',
      'document.getById': 'Get a single document by ID',
      'document.update': 'Update a document',
      'document.delete': 'Delete a document',
      'document.byVehicle': 'Get documents by vehicle',
      'document.expiring': 'Get documents expiring soon',
      'document.expired': 'Get expired documents',
      'document.search': 'Search documents by title or tags',
    }
  },
}
