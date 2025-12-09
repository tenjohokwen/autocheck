/**
 * reminderStore.js
 *
 * Pinia store for reminder management.
 * Implements FR-013 (maintenance reminders) and FR-014 (insurance reminders).
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/services/api'

export const useReminderStore = defineStore('reminder', () => {
  // State
  const reminders = ref([])
  const currentReminder = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed properties
  const totalReminders = computed(() => reminders.value.length)

  /**
   * Gets active reminders (within trigger threshold)
   * @returns {Array} Active reminders
   */
  const activeReminders = computed(() => {
    return reminders.value.filter((reminder) => reminder.status === 'ACTIVE')
  })

  /**
   * Gets overdue reminders
   * @returns {Array} Overdue reminders
   */
  const overdueReminders = computed(() => {
    return reminders.value.filter(
      (reminder) => reminder.isOverdue && reminder.status === 'ACTIVE'
    )
  })

  /**
   * Gets acknowledged reminders
   * @returns {Array} Acknowledged reminders
   */
  const acknowledgedReminders = computed(() => {
    return reminders.value.filter((reminder) => reminder.status === 'ACKNOWLEDGED')
  })

  /**
   * Gets completed reminders
   * @returns {Array} Completed reminders
   */
  const completedReminders = computed(() => {
    return reminders.value.filter((reminder) => reminder.status === 'COMPLETED')
  })

  /**
   * Gets reminders by type
   * @param {string} type - Reminder type
   * @returns {Array} Filtered reminders
   */
  const remindersByType = computed(() => {
    return (type) => {
      return reminders.value.filter((reminder) => reminder.type === type)
    }
  })

  /**
   * Gets reminders for a specific vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Array} Filtered reminders
   */
  const remindersByVehicle = computed(() => {
    return (vehicleId) => {
      return reminders.value.filter((reminder) => reminder.vehicleId === vehicleId)
    }
  })

  /**
   * Gets count of active reminders
   * @returns {number} Count
   */
  const activeCount = computed(() => activeReminders.value.length)

  /**
   * Gets count of overdue reminders
   * @returns {number} Count
   */
  const overdueCount = computed(() => overdueReminders.value.length)

  // Actions

  /**
   * Fetches all reminders with optional filters
   * @param {Object} filters - Filter options (vehicleId, type, status)
   */
  async function fetchReminders(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.list', filters)
      reminders.value = response.data || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch reminders'
      console.error('Error fetching reminders:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Gets a single reminder by ID
   * @param {string} reminderId - Reminder ID
   */
  async function fetchReminderById(reminderId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.get', { reminderId })
      currentReminder.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch reminder'
      console.error('Error fetching reminder:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Creates a new reminder
   * @param {Object} reminderData - Reminder data
   */
  async function createReminder(reminderData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.create', reminderData)
      const newReminder = response.data

      // Add to local state
      reminders.value.unshift(newReminder)

      return newReminder
    } catch (err) {
      error.value = err.message || 'Failed to create reminder'
      console.error('Error creating reminder:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Updates an existing reminder
   * @param {string} reminderId - Reminder ID
   * @param {Object} updates - Fields to update
   */
  async function updateReminder(reminderId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.update', {
        reminderId,
        ...updates,
      })

      const updatedReminder = response.data

      // Update local state
      const index = reminders.value.findIndex((r) => r.reminderId === reminderId)
      if (index !== -1) {
        reminders.value[index] = updatedReminder
      }

      if (currentReminder.value?.reminderId === reminderId) {
        currentReminder.value = updatedReminder
      }

      return updatedReminder
    } catch (err) {
      error.value = err.message || 'Failed to update reminder'
      console.error('Error updating reminder:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Acknowledges a reminder
   * @param {string} reminderId - Reminder ID
   */
  async function acknowledgeReminder(reminderId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.acknowledge', { reminderId })
      const updatedReminder = response.data

      // Update local state
      const index = reminders.value.findIndex((r) => r.reminderId === reminderId)
      if (index !== -1) {
        reminders.value[index] = updatedReminder
      }

      return updatedReminder
    } catch (err) {
      error.value = err.message || 'Failed to acknowledge reminder'
      console.error('Error acknowledging reminder:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Dismisses a reminder
   * @param {string} reminderId - Reminder ID
   */
  async function dismissReminder(reminderId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.dismiss', { reminderId })
      const updatedReminder = response.data

      // Update local state
      const index = reminders.value.findIndex((r) => r.reminderId === reminderId)
      if (index !== -1) {
        reminders.value[index] = updatedReminder
      }

      return updatedReminder
    } catch (err) {
      error.value = err.message || 'Failed to dismiss reminder'
      console.error('Error dismissing reminder:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Marks a reminder as completed
   * @param {string} reminderId - Reminder ID
   */
  async function completeReminder(reminderId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.complete', { reminderId })
      const updatedReminder = response.data

      // Update local state
      const index = reminders.value.findIndex((r) => r.reminderId === reminderId)
      if (index !== -1) {
        reminders.value[index] = updatedReminder
      }

      return updatedReminder
    } catch (err) {
      error.value = err.message || 'Failed to complete reminder'
      console.error('Error completing reminder:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Deletes a reminder (Fleet Manager only)
   * @param {string} reminderId - Reminder ID
   */
  async function deleteReminder(reminderId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('reminder.delete', { reminderId })

      // Remove from local state
      reminders.value = reminders.value.filter((r) => r.reminderId !== reminderId)

      if (currentReminder.value?.reminderId === reminderId) {
        currentReminder.value = null
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete reminder'
      console.error('Error deleting reminder:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetches active reminders (FR-013, FR-014)
   */
  async function fetchActiveReminders() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.active', {})
      reminders.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch active reminders'
      console.error('Error fetching active reminders:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetches overdue reminders
   */
  async function fetchOverdueReminders() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('reminder.overdue', {})
      return response.data || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch overdue reminders'
      console.error('Error fetching overdue reminders:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clears all reminders from state
   */
  function clearReminders() {
    reminders.value = []
    currentReminder.value = null
    error.value = null
  }

  /**
   * Resets error state
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    reminders,
    currentReminder,
    isLoading,
    error,

    // Computed
    totalReminders,
    activeReminders,
    overdueReminders,
    acknowledgedReminders,
    completedReminders,
    remindersByType,
    remindersByVehicle,
    activeCount,
    overdueCount,

    // Actions
    fetchReminders,
    fetchReminderById,
    createReminder,
    updateReminder,
    acknowledgeReminder,
    dismissReminder,
    completeReminder,
    deleteReminder,
    fetchActiveReminders,
    fetchOverdueReminders,
    clearReminders,
    clearError,
  }
})
