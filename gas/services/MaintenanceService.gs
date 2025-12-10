/**
 * MaintenanceService.gs
 *
 * Business logic for maintenance task operations.
 * Handles CRUD operations, task assignment, and recurring maintenance.
 * Implements FR-007 through FR-013.
 */

const MaintenanceService = {
  /**
   * Creates a new maintenance task
   * Implements FR-007, FR-010, FR-011
   * @param {Object} data - Task data
   * @param {string} createdBy - Email of creator
   * @returns {Object} Created maintenance task
   */
  createMaintenanceTask: function (data, createdBy) {
    // Validate required fields
    SecurityInterceptor.validateRequiredFields(data, [
      'vehicleId',
      'taskType',
      'description',
      'scheduledDate',
    ])

    // Validate task type
    this.validateTaskType(data.taskType)

    // Validate vehicle exists
    const vehicle = VehicleService.getVehicleById(data.vehicleId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    // Generate UUID and timestamps
    const taskId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    // Build maintenance task object
    const task = {
      taskId: taskId,
      vehicleId: data.vehicleId,
      taskType: data.taskType,
      description: SecurityInterceptor.sanitizeInput(data.description),
      priority: data.priority || 'MEDIUM',
      scheduledDate: data.scheduledDate,
      dueOdometer: data.dueOdometer || null,
      status: 'SCHEDULED',
      assignedTechnician: data.assignedTechnician || '',
      isRecurring: data.isRecurring || false,
      recurrenceInterval: data.recurrenceInterval || null,
      recurrenceType: data.recurrenceType || null,
      completedDate: '',
      laborHours: null,
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    // Save to database
    DatabaseUtil.appendRow('maintenanceTasks', DatabaseUtil.objectToRow('maintenanceTasks', task))

    console.log('Maintenance task created:', {
      taskId: taskId,
      vehicleId: data.vehicleId,
      taskType: data.taskType,
    })

    return task
  },

  /**
   * Gets all maintenance tasks
   * @param {Object} filters - Optional filters (vehicleId, status, assignedTechnician)
   * @returns {Array} Array of maintenance tasks
   */
  getAllMaintenanceTasks: function (filters) {
    filters = filters || {}
    let tasks = DatabaseUtil.getAllRecords('maintenanceTasks')

    // Apply filters
    if (filters.vehicleId) {
      tasks = tasks.filter(function (task) {
        return task.vehicleId === filters.vehicleId
      })
    }

    if (filters.status) {
      tasks = tasks.filter(function (task) {
        return task.status === filters.status
      })
    }

    if (filters.assignedTechnician) {
      tasks = tasks.filter(function (task) {
        return task.assignedTechnician === filters.assignedTechnician
      })
    }

    return tasks
  },

  /**
   * Gets a single maintenance task by ID
   * @param {string} taskId - Task ID
   * @returns {Object|null} Maintenance task or null
   */
  getMaintenanceTaskById: function (taskId) {
    const columnIndex = DatabaseUtil.getColumnIndex('maintenanceTasks', 'taskId')
    const result = DatabaseUtil.findRowByColumn('maintenanceTasks', columnIndex, taskId)

    return result ? result.data : null
  },

  /**
   * Updates a maintenance task
   * Implements FR-008, FR-009
   * @param {string} taskId - Task ID
   * @param {Object} updates - Fields to update
   * @param {string} changedBy - Email of user making changes
   * @returns {Object} Updated task
   */
  updateMaintenanceTask: function (taskId, updates, changedBy) {
    const task = this.getMaintenanceTaskById(taskId)

    if (!task) {
      throw new Error('Maintenance task not found')
    }

    // Validate status if being updated
    if (updates.status) {
      this.validateTaskStatus(updates.status)
    }

    // Validate task type if being updated
    if (updates.taskType) {
      this.validateTaskType(updates.taskType)
    }

    // Update allowed fields
    if (updates.taskType !== undefined) {
      task.taskType = updates.taskType
    }
    if (updates.description !== undefined) {
      task.description = SecurityInterceptor.sanitizeInput(updates.description)
    }
    if (updates.priority !== undefined) {
      task.priority = updates.priority
    }
    if (updates.scheduledDate !== undefined) {
      task.scheduledDate = updates.scheduledDate
    }
    if (updates.dueOdometer !== undefined) {
      task.dueOdometer = updates.dueOdometer
    }
    if (updates.status !== undefined) {
      task.status = updates.status

      // Set completed date when status changes to COMPLETED
      if (updates.status === 'COMPLETED' && !task.completedDate) {
        task.completedDate = DatabaseUtil.getCurrentTimestamp()
      }
    }
    if (updates.assignedTechnician !== undefined) {
      task.assignedTechnician = updates.assignedTechnician
    }
    if (updates.laborHours !== undefined) {
      task.laborHours = updates.laborHours
    }
    if (updates.notes !== undefined) {
      task.notes = SecurityInterceptor.sanitizeInput(updates.notes)
    }

    task.updatedAt = DatabaseUtil.getCurrentTimestamp()
    task.changedBy = changedBy

    // Save to database
    DatabaseUtil.upsertRecord('maintenanceTasks', 'taskId', task)

    console.log('Maintenance task updated:', {
      taskId: taskId,
      taskType: task.taskType,
      status: task.status,
    })

    return task
  },

  /**
   * Deletes a maintenance task
   * @param {string} taskId - Task ID
   * @param {string} changedBy - Email of user deleting
   */
  deleteMaintenanceTask: function (taskId, changedBy) {
    const task = this.getMaintenanceTaskById(taskId)

    if (!task) {
      throw new Error('Maintenance task not found')
    }

    const columnIndex = DatabaseUtil.getColumnIndex('maintenanceTasks', 'taskId')
    const result = DatabaseUtil.findRowByColumn('maintenanceTasks', columnIndex, taskId)

    if (result) {
      DatabaseUtil.deleteRow('maintenanceTasks', result.rowIndex)
    }

    console.log('Maintenance task deleted:', {
      taskId: taskId,
      deletedBy: changedBy,
    })
  },

  /**
   * Assigns a maintenance task to a technician
   * Implements FR-010
   * @param {string} taskId - Task ID
   * @param {string} technicianEmail - Technician email
   * @param {string} changedBy - Email of user making assignment
   * @returns {Object} Updated task
   */
  assignTaskToTechnician: function (taskId, technicianEmail, changedBy) {
    const task = this.getMaintenanceTaskById(taskId)

    if (!task) {
      throw new Error('Maintenance task not found')
    }

    task.assignedTechnician = technicianEmail
    task.updatedAt = DatabaseUtil.getCurrentTimestamp()
    task.changedBy = changedBy

    DatabaseUtil.upsertRecord('maintenanceTasks', 'taskId', task)

    console.log('Task assigned to technician:', {
      taskId: taskId,
      technician: technicianEmail,
    })

    return task
  },

  /**
   * Cancels future maintenance tasks for a vehicle
   * Called when vehicle is archived (FR-039)
   * @param {string} vehicleId - Vehicle ID
   */
  cancelFutureMaintenanceTasks: function (vehicleId) {
    const tasks = this.getAllMaintenanceTasks({ vehicleId: vehicleId })
    const now = new Date().getTime()

    tasks.forEach(
      function (task) {
        // Cancel tasks that are scheduled and in the future
        if (task.status === 'SCHEDULED') {
          const scheduledDate = new Date(task.scheduledDate).getTime()
          if (scheduledDate > now) {
            this.updateMaintenanceTask(task.taskId, { status: 'CANCELLED' }, 'SYSTEM')
          }
        }
      }.bind(this)
    )

    console.log('Future maintenance tasks cancelled for vehicle:', vehicleId)
  },

  /**
   * Gets maintenance tasks due within specified days
   * Implements FR-013
   * @param {number} daysAhead - Number of days to look ahead (default 7)
   * @returns {Array} Array of upcoming tasks
   */
  getUpcomingMaintenanceTasks: function (daysAhead) {
    daysAhead = daysAhead || 7
    const tasks = this.getAllMaintenanceTasks({ status: 'SCHEDULED' })
    const now = new Date()
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    return tasks.filter(function (task) {
      const scheduledDate = new Date(task.scheduledDate)
      return scheduledDate >= now && scheduledDate <= futureDate
    })
  },

  /**
   * Validates task type
   * @param {string} taskType - Task type
   */
  validateTaskType: function (taskType) {
    const validTypes = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'INSPECTION']

    if (validTypes.indexOf(taskType) === -1) {
      throw new Error('Invalid task type. Must be: ' + validTypes.join(', '))
    }
  },

  /**
   * Validates task status
   * @param {string} status - Task status
   */
  validateTaskStatus: function (status) {
    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

    if (validStatuses.indexOf(status) === -1) {
      throw new Error('Invalid task status. Must be: ' + validStatuses.join(', '))
    }
  },
}
