/**
 * ReminderService.gs
 *
 * Business logic for reminder operations.
 * Handles CRUD operations, auto-generation from maintenance/insurance, and status management.
 * Implements FR-013 (maintenance reminders) and FR-014 (insurance reminders).
 */

const ReminderService = {
  /**
   * Creates a new reminder
   * @param {Object} data - Reminder data
   * @param {string} createdBy - Email of creator
   * @returns {Object} Created reminder
   */
  createReminder: function (data, createdBy) {
    SecurityInterceptor.validateRequiredFields(data, [
      'vehicleId',
      'type',
      'title',
      'dueDate',
    ])

    // Validate reminder type
    this.validateReminderType(data.type)

    // Validate vehicle exists
    const vehicle = VehicleService.getVehicleById(data.vehicleId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    const reminderId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    const reminder = {
      reminderId: reminderId,
      vehicleId: data.vehicleId,
      type: data.type,
      title: SecurityInterceptor.sanitizeInput(data.title),
      description: data.description
        ? SecurityInterceptor.sanitizeInput(data.description)
        : '',
      dueDate: data.dueDate,
      triggerThresholdDays: data.triggerThresholdDays || 7,
      triggerThresholdKm: data.triggerThresholdKm || null,
      priority: data.priority || 'MEDIUM',
      status: 'ACTIVE',
      maintenanceTaskId: data.maintenanceTaskId || '',
      documentId: data.documentId || '',
      acknowledgedBy: '',
      acknowledgedAt: '',
      completedAt: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    DatabaseUtil.appendRow('reminders', DatabaseUtil.objectToRow('reminders', reminder))

    console.log('Reminder created:', {
      reminderId: reminderId,
      vehicleId: data.vehicleId,
      type: data.type,
    })

    return this.enrichReminder(reminder)
  },

  /**
   * Gets all reminders with optional filters
   * @param {Object} filters - Filter options (vehicleId, type, status)
   * @returns {Array} Array of enriched reminders
   */
  getAllReminders: function (filters) {
    filters = filters || {}
    let reminders = DatabaseUtil.getAllRecords('reminders')

    // Apply filters
    if (filters.vehicleId) {
      reminders = reminders.filter(function (reminder) {
        return reminder.vehicleId === filters.vehicleId
      })
    }

    if (filters.type) {
      reminders = reminders.filter(function (reminder) {
        return reminder.type === filters.type
      })
    }

    if (filters.status) {
      reminders = reminders.filter(function (reminder) {
        return reminder.status === filters.status
      })
    }

    // Enrich reminders with computed fields
    return reminders.map(
      function (reminder) {
        return this.enrichReminder(reminder)
      }.bind(this)
    )
  },

  /**
   * Gets a single reminder by ID
   * @param {string} reminderId - Reminder ID
   * @returns {Object|null} Enriched reminder or null
   */
  getReminderById: function (reminderId) {
    const columnIndex = DatabaseUtil.getColumnIndex('reminders', 'reminderId')
    const result = DatabaseUtil.findRowByColumn('reminders', columnIndex, reminderId)

    return result ? this.enrichReminder(result.data) : null
  },

  /**
   * Updates a reminder
   * @param {string} reminderId - Reminder ID
   * @param {Object} updates - Fields to update
   * @param {string} changedBy - Email of user making changes
   * @returns {Object} Updated reminder
   */
  updateReminder: function (reminderId, updates, changedBy) {
    const reminder = this.getReminderById(reminderId)

    if (!reminder) {
      throw new Error('Reminder not found')
    }

    // Update allowed fields
    if (updates.title !== undefined) {
      reminder.title = SecurityInterceptor.sanitizeInput(updates.title)
    }
    if (updates.description !== undefined) {
      reminder.description = SecurityInterceptor.sanitizeInput(updates.description)
    }
    if (updates.dueDate !== undefined) {
      reminder.dueDate = updates.dueDate
    }
    if (updates.triggerThresholdDays !== undefined) {
      reminder.triggerThresholdDays = updates.triggerThresholdDays
    }
    if (updates.triggerThresholdKm !== undefined) {
      reminder.triggerThresholdKm = updates.triggerThresholdKm
    }
    if (updates.priority !== undefined) {
      reminder.priority = updates.priority
    }
    if (updates.status !== undefined) {
      this.validateReminderStatus(updates.status)
      reminder.status = updates.status
    }

    reminder.updatedAt = DatabaseUtil.getCurrentTimestamp()
    reminder.changedBy = changedBy

    DatabaseUtil.upsertRecord('reminders', 'reminderId', reminder)

    console.log('Reminder updated:', {
      reminderId: reminderId,
      status: reminder.status,
    })

    return this.enrichReminder(reminder)
  },

  /**
   * Acknowledges a reminder
   * @param {string} reminderId - Reminder ID
   * @param {string} acknowledgedBy - Email of user acknowledging
   * @returns {Object} Updated reminder
   */
  acknowledgeReminder: function (reminderId, acknowledgedBy) {
    const reminder = this.getReminderById(reminderId)

    if (!reminder) {
      throw new Error('Reminder not found')
    }

    reminder.status = 'ACKNOWLEDGED'
    reminder.acknowledgedBy = acknowledgedBy
    reminder.acknowledgedAt = DatabaseUtil.getCurrentTimestamp()
    reminder.updatedAt = DatabaseUtil.getCurrentTimestamp()
    reminder.changedBy = acknowledgedBy

    DatabaseUtil.upsertRecord('reminders', 'reminderId', reminder)

    console.log('Reminder acknowledged:', {
      reminderId: reminderId,
      acknowledgedBy: acknowledgedBy,
    })

    return this.enrichReminder(reminder)
  },

  /**
   * Dismisses a reminder
   * @param {string} reminderId - Reminder ID
   * @param {string} dismissedBy - Email of user dismissing
   * @returns {Object} Updated reminder
   */
  dismissReminder: function (reminderId, dismissedBy) {
    const reminder = this.getReminderById(reminderId)

    if (!reminder) {
      throw new Error('Reminder not found')
    }

    reminder.status = 'DISMISSED'
    reminder.updatedAt = DatabaseUtil.getCurrentTimestamp()
    reminder.changedBy = dismissedBy

    DatabaseUtil.upsertRecord('reminders', 'reminderId', reminder)

    console.log('Reminder dismissed:', {
      reminderId: reminderId,
      dismissedBy: dismissedBy,
    })

    return this.enrichReminder(reminder)
  },

  /**
   * Marks a reminder as completed
   * @param {string} reminderId - Reminder ID
   * @param {string} completedBy - Email of user completing
   * @returns {Object} Updated reminder
   */
  completeReminder: function (reminderId, completedBy) {
    const reminder = this.getReminderById(reminderId)

    if (!reminder) {
      throw new Error('Reminder not found')
    }

    reminder.status = 'COMPLETED'
    reminder.completedAt = DatabaseUtil.getCurrentTimestamp()
    reminder.updatedAt = DatabaseUtil.getCurrentTimestamp()
    reminder.changedBy = completedBy

    DatabaseUtil.upsertRecord('reminders', 'reminderId', reminder)

    console.log('Reminder completed:', {
      reminderId: reminderId,
      completedBy: completedBy,
    })

    return this.enrichReminder(reminder)
  },

  /**
   * Deletes a reminder
   * @param {string} reminderId - Reminder ID
   * @param {string} changedBy - Email of user deleting
   */
  deleteReminder: function (reminderId, changedBy) {
    const reminder = this.getReminderById(reminderId)

    if (!reminder) {
      throw new Error('Reminder not found')
    }

    const columnIndex = DatabaseUtil.getColumnIndex('reminders', 'reminderId')
    const result = DatabaseUtil.findRowByColumn('reminders', columnIndex, reminderId)

    if (result) {
      DatabaseUtil.deleteRow('reminders', result.rowIndex)
    }

    console.log('Reminder deleted:', {
      reminderId: reminderId,
      deletedBy: changedBy,
    })
  },

  /**
   * Gets active reminders (status = ACTIVE, within trigger threshold)
   * Implements FR-013 and FR-014
   * @returns {Array} Array of active reminders
   */
  getActiveReminders: function () {
    const reminders = this.getAllReminders({ status: 'ACTIVE' })
    const now = new Date()

    return reminders.filter(function (reminder) {
      const dueDate = new Date(reminder.dueDate)
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))

      // Show if within trigger threshold or overdue
      return daysUntilDue <= reminder.triggerThresholdDays
    })
  },

  /**
   * Gets overdue reminders
   * @returns {Array} Array of overdue reminders
   */
  getOverdueReminders: function () {
    const reminders = this.getActiveReminders()
    const now = new Date()

    return reminders.filter(function (reminder) {
      const dueDate = new Date(reminder.dueDate)
      return dueDate < now
    })
  },

  /**
   * Auto-generates maintenance reminders for upcoming tasks
   * Called when maintenance task is created/updated
   * Implements FR-013
   * @param {Object} maintenanceTask - Maintenance task object
   * @param {string} createdBy - User creating reminder
   */
  autoGenerateMaintenanceReminder: function (maintenanceTask, createdBy) {
    if (maintenanceTask.status !== 'SCHEDULED') {
      return null
    }

    // Check if reminder already exists for this task
    const existing = this.getAllReminders({
      vehicleId: maintenanceTask.vehicleId,
    }).filter(function (r) {
      return r.maintenanceTaskId === maintenanceTask.taskId && r.status === 'ACTIVE'
    })

    if (existing.length > 0) {
      console.log('Maintenance reminder already exists for task:', maintenanceTask.taskId)
      return existing[0]
    }

    // Create reminder
    const reminderData = {
      vehicleId: maintenanceTask.vehicleId,
      type: 'MAINTENANCE',
      title: 'Maintenance Due: ' + maintenanceTask.description,
      description: maintenanceTask.taskType + ' maintenance task scheduled',
      dueDate: maintenanceTask.scheduledDate,
      triggerThresholdDays: 7,
      priority: maintenanceTask.priority,
      maintenanceTaskId: maintenanceTask.taskId,
    }

    return this.createReminder(reminderData, createdBy)
  },

  /**
   * Auto-generates insurance reminders for expiring insurance
   * Called when vehicle insurance date is updated
   * Implements FR-014
   * @param {Object} vehicle - Vehicle object
   * @param {string} createdBy - User creating reminder
   */
  autoGenerateInsuranceReminder: function (vehicle, createdBy) {
    if (!vehicle.insuranceExpiry) {
      return null
    }

    const now = new Date()
    const expiryDate = new Date(vehicle.insuranceExpiry)
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))

    // Only create if expiring within 30 days
    if (daysUntilExpiry > 30 || daysUntilExpiry < 0) {
      return null
    }

    // Check if reminder already exists
    const existing = this.getAllReminders({
      vehicleId: vehicle.vehicleId,
      type: 'INSURANCE',
    }).filter(function (r) {
      return r.status === 'ACTIVE' && r.dueDate === vehicle.insuranceExpiry
    })

    if (existing.length > 0) {
      console.log('Insurance reminder already exists for vehicle:', vehicle.vehicleId)
      return existing[0]
    }

    // Create reminder
    const reminderData = {
      vehicleId: vehicle.vehicleId,
      type: 'INSURANCE',
      title: 'Insurance Renewal: ' + vehicle.make + ' ' + vehicle.model,
      description: 'Vehicle insurance expires soon',
      dueDate: vehicle.insuranceExpiry,
      triggerThresholdDays: 30,
      priority: 'HIGH',
    }

    return this.createReminder(reminderData, createdBy)
  },

  /**
   * Enriches reminder with computed fields
   * @param {Object} reminder - Reminder object
   * @returns {Object} Enriched reminder
   */
  enrichReminder: function (reminder) {
    const now = new Date()
    const dueDate = new Date(reminder.dueDate)

    // Calculate days until due
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))

    // Determine if overdue
    const isOverdue = daysUntilDue < 0 && reminder.status === 'ACTIVE'

    return Object.assign({}, reminder, {
      daysUntilDue: daysUntilDue,
      isOverdue: isOverdue,
    })
  },

  /**
   * Validates reminder type
   * @param {string} type - Reminder type
   */
  validateReminderType: function (type) {
    const validTypes = ['MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'INSPECTION', 'CUSTOM']

    if (validTypes.indexOf(type) === -1) {
      throw new Error('Invalid reminder type. Must be: ' + validTypes.join(', '))
    }
  },

  /**
   * Validates reminder status
   * @param {string} status - Reminder status
   */
  validateReminderStatus: function (status) {
    const validStatuses = ['ACTIVE', 'ACKNOWLEDGED', 'DISMISSED', 'COMPLETED']

    if (validStatuses.indexOf(status) === -1) {
      throw new Error('Invalid reminder status. Must be: ' + validStatuses.join(', '))
    }
  },
}
