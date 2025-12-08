/**
 * ReminderHandler.gs
 *
 * HTTP request handlers for Reminder operations.
 * Enforces role-based access control.
 * All authenticated users can view reminders, Fleet Managers can create/delete.
 */

const ReminderHandler = {
  /**
   * Creates a new reminder
   * Route: reminder.create
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  createReminder: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, [
        'vehicleId',
        'type',
        'title',
        'dueDate',
      ])

      RoleValidator.requireFleetManager(context.user)

      const reminder = ReminderService.createReminder(context.data, context.user.email)

      return {
        status: 201,
        msgKey: 'reminder.created',
        message: 'Reminder created successfully',
        data: reminder,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.createReminder:', error.message)
      throw error
    }
  },

  /**
   * Lists all reminders with optional filters
   * Route: reminder.list
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  listReminders: function (context) {
    try {
      const filters = {
        vehicleId: context.data.vehicleId,
        type: context.data.type,
        status: context.data.status,
      }

      const reminders = ReminderService.getAllReminders(filters)

      return {
        status: 200,
        msgKey: 'reminder.list',
        message: 'Reminders retrieved successfully',
        data: reminders,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.listReminders:', error.message)
      throw error
    }
  },

  /**
   * Gets a single reminder by ID
   * Route: reminder.get
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getReminder: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['reminderId'])

      const reminder = ReminderService.getReminderById(context.data.reminderId)

      if (!reminder) {
        throw new Error('Reminder not found')
      }

      return {
        status: 200,
        msgKey: 'reminder.get',
        message: 'Reminder retrieved successfully',
        data: reminder,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.getReminder:', error.message)
      throw error
    }
  },

  /**
   * Updates a reminder
   * Route: reminder.update
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  updateReminder: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['reminderId'])

      RoleValidator.requireFleetManager(context.user)

      const updatedReminder = ReminderService.updateReminder(
        context.data.reminderId,
        context.data,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'reminder.updated',
        message: 'Reminder updated successfully',
        data: updatedReminder,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.updateReminder:', error.message)
      throw error
    }
  },

  /**
   * Acknowledges a reminder
   * Route: reminder.acknowledge
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  acknowledgeReminder: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['reminderId'])

      const reminder = ReminderService.acknowledgeReminder(
        context.data.reminderId,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'reminder.acknowledged',
        message: 'Reminder acknowledged',
        data: reminder,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.acknowledgeReminder:', error.message)
      throw error
    }
  },

  /**
   * Dismisses a reminder
   * Route: reminder.dismiss
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  dismissReminder: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['reminderId'])

      const reminder = ReminderService.dismissReminder(
        context.data.reminderId,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'reminder.dismissed',
        message: 'Reminder dismissed',
        data: reminder,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.dismissReminder:', error.message)
      throw error
    }
  },

  /**
   * Marks a reminder as completed
   * Route: reminder.complete
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  completeReminder: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['reminderId'])

      const reminder = ReminderService.completeReminder(
        context.data.reminderId,
        context.user.email
      )

      return {
        status: 200,
        msgKey: 'reminder.completed',
        message: 'Reminder marked as completed',
        data: reminder,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.completeReminder:', error.message)
      throw error
    }
  },

  /**
   * Deletes a reminder
   * Route: reminder.delete
   * Role: Fleet Manager only
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  deleteReminder: function (context) {
    try {
      SecurityInterceptor.validateRequiredFields(context.data, ['reminderId'])

      RoleValidator.requireFleetManager(context.user)

      ReminderService.deleteReminder(context.data.reminderId, context.user.email)

      return {
        status: 200,
        msgKey: 'reminder.deleted',
        message: 'Reminder deleted successfully',
        data: null,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.deleteReminder:', error.message)
      throw error
    }
  },

  /**
   * Gets active reminders (within trigger threshold)
   * Route: reminder.active
   * Role: All authenticated users
   * Implements FR-013 and FR-014
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getActiveReminders: function (context) {
    try {
      const reminders = ReminderService.getActiveReminders()

      return {
        status: 200,
        msgKey: 'reminder.active',
        message: 'Active reminders retrieved successfully',
        data: reminders,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.getActiveReminders:', error.message)
      throw error
    }
  },

  /**
   * Gets overdue reminders
   * Route: reminder.overdue
   * Role: All authenticated users
   * @param {Object} context - Request context
   * @returns {Object} Response object
   */
  getOverdueReminders: function (context) {
    try {
      const reminders = ReminderService.getOverdueReminders()

      return {
        status: 200,
        msgKey: 'reminder.overdue',
        message: 'Overdue reminders retrieved successfully',
        data: reminders,
      }
    } catch (error) {
      console.error('Error in ReminderHandler.getOverdueReminders:', error.message)
      throw error
    }
  },
}
