/**
 * maintenanceStore.js
 *
 * Pinia store for maintenance task management.
 * Handles maintenance CRUD operations, task assignment, and filtering.
 *
 * Per constitution: Use Pinia for state management, Vue 3 Composition API style.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/services/api'

export const useMaintenanceStore = defineStore('maintenance', () => {
  // State
  const tasks = ref([])
  const currentTask = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const tasksCount = computed(() => {
    return tasks.value.length
  })

  const scheduledTasks = computed(() => {
    return tasks.value.filter((t) => t.status === 'SCHEDULED')
  })

  const inProgressTasks = computed(() => {
    return tasks.value.filter((t) => t.status === 'IN_PROGRESS')
  })

  const completedTasks = computed(() => {
    return tasks.value.filter((t) => t.status === 'COMPLETED')
  })

  const upcomingTasks = computed(() => {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return tasks.value.filter((t) => {
      if (t.status !== 'SCHEDULED') return false
      const scheduledDate = new Date(t.scheduledDate)
      return scheduledDate >= now && scheduledDate <= sevenDaysFromNow
    })
  })

  const tasksByStatus = computed(() => {
    return {
      scheduled: scheduledTasks.value.length,
      inProgress: inProgressTasks.value.length,
      completed: completedTasks.value.length,
      upcoming: upcomingTasks.value.length
    }
  })

  // Actions

  /**
   * Fetch all maintenance tasks with optional filters
   * @param {Object} filters - { vehicleId, status, assignedTechnician }
   * @returns {Promise<Array>} Array of maintenance tasks
   */
  async function fetchTasks(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('maintenance.list', filters)
      tasks.value = response.data || []
      return tasks.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single maintenance task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Maintenance task
   */
  async function fetchTaskById(taskId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('maintenance.get', { taskId })
      currentTask.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new maintenance task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  async function createTask(taskData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('maintenance.create', taskData)
      const newTask = response.data

      // Add to local state
      tasks.value.push(newTask)

      return newTask
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing maintenance task
   * @param {string} taskId - Task ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<Object>} Updated task
   */
  async function updateTask(taskId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('maintenance.update', {
        taskId,
        ...updates
      })
      const updatedTask = response.data

      // Update local state
      const index = tasks.value.findIndex((t) => t.taskId === taskId)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }

      if (currentTask.value?.taskId === taskId) {
        currentTask.value = updatedTask
      }

      return updatedTask
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a maintenance task
   * @param {string} taskId - Task ID
   * @returns {Promise<void>}
   */
  async function deleteTask(taskId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('maintenance.delete', { taskId })

      // Remove from local state
      tasks.value = tasks.value.filter((t) => t.taskId !== taskId)

      if (currentTask.value?.taskId === taskId) {
        currentTask.value = null
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Assign a task to a technician
   * @param {string} taskId - Task ID
   * @param {string} technicianEmail - Technician email
   * @returns {Promise<Object>} Updated task
   */
  async function assignTechnician(taskId, technicianEmail) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('maintenance.assignTechnician', {
        taskId,
        technicianEmail
      })
      const updatedTask = response.data

      // Update local state
      const index = tasks.value.findIndex((t) => t.taskId === taskId)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }

      if (currentTask.value?.taskId === taskId) {
        currentTask.value = updatedTask
      }

      return updatedTask
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get upcoming maintenance tasks (due within specified days)
   * @param {number} daysAhead - Number of days to look ahead (default 7)
   * @returns {Promise<Array>} Array of upcoming tasks
   */
  async function fetchUpcomingTasks(daysAhead = 7) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('maintenance.upcoming', { daysAhead })
      return response.data || []
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear current task
   */
  function clearCurrentTask() {
    currentTask.value = null
  }

  /**
   * Clear all tasks
   */
  function clearTasks() {
    tasks.value = []
    currentTask.value = null
    error.value = null
  }

  return {
    // State
    tasks,
    currentTask,
    isLoading,
    error,

    // Computed
    tasksCount,
    scheduledTasks,
    inProgressTasks,
    completedTasks,
    upcomingTasks,
    tasksByStatus,

    // Actions
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    assignTechnician,
    fetchUpcomingTasks,
    clearCurrentTask,
    clearTasks
  }
})
