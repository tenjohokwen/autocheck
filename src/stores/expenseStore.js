/**
 * expenseStore.js
 *
 * Pinia store for expense management.
 * Implements FR-017 (expense tracking), FR-018 (dashboard), FR-019 (reports), FR-021 (running costs).
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/services/api'

export const useExpenseStore = defineStore('expense', () => {
  // State
  const expenses = ref([])
  const currentExpense = ref(null)
  const dashboard = ref(null)
  const runningCosts = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Computed properties
  const totalExpenses = computed(() => expenses.value.length)

  /**
   * Gets total expense amount
   * @returns {number} Total amount
   */
  const totalAmount = computed(() => {
    return expenses.value.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount || 0)
    }, 0)
  })

  /**
   * Gets expenses by category
   * @param {string} category - Expense category
   * @returns {Array} Filtered expenses
   */
  const expensesByCategory = computed(() => {
    return (category) => {
      return expenses.value.filter((expense) => expense.category === category)
    }
  })

  /**
   * Gets expenses for a specific vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Array} Filtered expenses
   */
  const expensesByVehicle = computed(() => {
    return (vehicleId) => {
      return expenses.value.filter((expense) => expense.vehicleId === vehicleId)
    }
  })

  /**
   * Gets expenses within date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Array} Filtered expenses
   */
  const expensesByDateRange = computed(() => {
    return (startDate, endDate) => {
      if (!startDate || !endDate) return expenses.value

      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()

      return expenses.value.filter((expense) => {
        const expenseDate = new Date(expense.expenseDate).getTime()
        return expenseDate >= start && expenseDate <= end
      })
    }
  })

  /**
   * Gets most expensive vehicle
   * @returns {Object|null} Vehicle with highest costs
   */
  const mostExpensiveVehicle = computed(() => {
    if (runningCosts.value.length === 0) return null
    return runningCosts.value[0] // Already sorted by total cost descending
  })

  // Actions

  /**
   * Fetches all expenses with optional filters
   * @param {Object} filters - Filter options (vehicleId, category, startDate, endDate)
   */
  async function fetchExpenses(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('expense.list', filters)
      expenses.value = response.data || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch expenses'
      console.error('Error fetching expenses:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Gets a single expense by ID
   * @param {string} expenseId - Expense ID
   */
  async function fetchExpenseById(expenseId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('expense.get', { expenseId })
      currentExpense.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch expense'
      console.error('Error fetching expense:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Creates a new expense
   * @param {Object} expenseData - Expense data
   */
  async function createExpense(expenseData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('expense.create', expenseData)
      const newExpense = response.data

      // Add to local state
      expenses.value.unshift(newExpense)

      return newExpense
    } catch (err) {
      error.value = err.message || 'Failed to create expense'
      console.error('Error creating expense:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Updates an existing expense
   * @param {string} expenseId - Expense ID
   * @param {Object} updates - Fields to update
   */
  async function updateExpense(expenseId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('expense.update', {
        expenseId,
        ...updates,
      })

      const updatedExpense = response.data

      // Update local state
      const index = expenses.value.findIndex((e) => e.expenseId === expenseId)
      if (index !== -1) {
        expenses.value[index] = updatedExpense
      }

      if (currentExpense.value?.expenseId === expenseId) {
        currentExpense.value = updatedExpense
      }

      return updatedExpense
    } catch (err) {
      error.value = err.message || 'Failed to update expense'
      console.error('Error updating expense:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Deletes an expense (Fleet Manager only)
   * @param {string} expenseId - Expense ID
   */
  async function deleteExpense(expenseId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('expense.delete', { expenseId })

      // Remove from local state
      expenses.value = expenses.value.filter((e) => e.expenseId !== expenseId)

      if (currentExpense.value?.expenseId === expenseId) {
        currentExpense.value = null
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete expense'
      console.error('Error deleting expense:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetches expense dashboard summary (FR-018)
   * @param {Object} filters - Filter options (vehicleId, startDate, endDate)
   */
  async function fetchDashboard(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('expense.dashboard', filters)
      dashboard.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch dashboard'
      console.error('Error fetching dashboard:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetches running costs by vehicle (FR-021)
   * @param {Object} filters - Filter options (startDate, endDate)
   */
  async function fetchRunningCosts(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('expense.runningCosts', filters)
      runningCosts.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch running costs'
      console.error('Error fetching running costs:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Generates expense report (FR-019)
   * @param {Object} filters - Filter options (vehicleId, category, startDate, endDate)
   */
  async function generateReport(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('expense.report', filters)
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to generate report'
      console.error('Error generating report:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clears all expenses from state
   */
  function clearExpenses() {
    expenses.value = []
    currentExpense.value = null
    dashboard.value = null
    runningCosts.value = []
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
    expenses,
    currentExpense,
    dashboard,
    runningCosts,
    isLoading,
    error,

    // Computed
    totalExpenses,
    totalAmount,
    expensesByCategory,
    expensesByVehicle,
    expensesByDateRange,
    mostExpensiveVehicle,

    // Actions
    fetchExpenses,
    fetchExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchDashboard,
    fetchRunningCosts,
    generateReport,
    clearExpenses,
    clearError,
  }
})
