/**
 * fuelStore.js
 *
 * Pinia store for fuel records management.
 * Implements FR-004 to FR-006: Fuel tracking and efficiency calculations.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from 'src/services/api'

export const useFuelStore = defineStore('fuel', () => {
  // State
  const records = ref([])
  const currentRecord = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed properties
  const totalRecords = computed(() => records.value.length)

  /**
   * Gets records for a specific vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Array} Filtered records
   */
  const recordsByVehicle = computed(() => {
    return (vehicleId) => {
      return records.value.filter((record) => record.vehicleId === vehicleId)
    }
  })

  /**
   * Gets records within a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Filtered records
   */
  const recordsByDateRange = computed(() => {
    return (startDate, endDate) => {
      if (!startDate || !endDate) return records.value

      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()

      return records.value.filter((record) => {
        const recordDate = new Date(record.date).getTime()
        return recordDate >= start && recordDate <= end
      })
    }
  })

  /**
   * Gets the most recent fuel record
   * @returns {Object|null} Most recent record
   */
  const mostRecentRecord = computed(() => {
    if (records.value.length === 0) return null

    return records.value.reduce((latest, record) => {
      const latestDate = new Date(latest.date).getTime()
      const recordDate = new Date(record.date).getTime()
      return recordDate > latestDate ? record : latest
    })
  })

  // Actions

  /**
   * Fetches all fuel records with optional filters
   * @param {Object} filters - Filter options (vehicleId, startDate, endDate)
   */
  async function fetchRecords(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fuel.list', filters)
      records.value = response.data || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch fuel records'
      console.error('Error fetching fuel records:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Gets a single fuel record by ID
   * @param {string} recordId - Record ID
   */
  async function fetchRecordById(recordId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fuel.get', { recordId })
      currentRecord.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch fuel record'
      console.error('Error fetching fuel record:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Creates a new fuel record
   * @param {Object} recordData - Fuel record data
   */
  async function createRecord(recordData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fuel.create', recordData)
      const newRecord = response.data

      // Add to local state
      records.value.unshift(newRecord)

      return newRecord
    } catch (err) {
      error.value = err.message || 'Failed to create fuel record'
      console.error('Error creating fuel record:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Updates an existing fuel record
   * @param {string} recordId - Record ID
   * @param {Object} updates - Fields to update
   */
  async function updateRecord(recordId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fuel.update', {
        recordId,
        ...updates,
      })

      const updatedRecord = response.data

      // Update local state
      const index = records.value.findIndex((r) => r.recordId === recordId)
      if (index !== -1) {
        records.value[index] = updatedRecord
      }

      if (currentRecord.value?.recordId === recordId) {
        currentRecord.value = updatedRecord
      }

      return updatedRecord
    } catch (err) {
      error.value = err.message || 'Failed to update fuel record'
      console.error('Error updating fuel record:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Deletes a fuel record (Fleet Manager only)
   * @param {string} recordId - Record ID
   */
  async function deleteRecord(recordId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('fuel.delete', { recordId })

      // Remove from local state
      records.value = records.value.filter((r) => r.recordId !== recordId)

      if (currentRecord.value?.recordId === recordId) {
        currentRecord.value = null
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete fuel record'
      console.error('Error deleting fuel record:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Calculates fuel efficiency for a vehicle
   * Implements FR-006
   * @param {string} vehicleId - Vehicle ID
   * @param {number} recordCount - Number of recent records to use (default 10)
   */
  async function calculateEfficiency(vehicleId, recordCount = 10) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fuel.efficiency', {
        vehicleId,
        recordCount,
      })

      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to calculate fuel efficiency'
      console.error('Error calculating fuel efficiency:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Gets fuel statistics for a vehicle
   * @param {string} vehicleId - Vehicle ID
   */
  async function getFuelStatistics(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fuel.statistics', { vehicleId })
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch fuel statistics'
      console.error('Error fetching fuel statistics:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clears all fuel records from state
   */
  function clearRecords() {
    records.value = []
    currentRecord.value = null
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
    records,
    currentRecord,
    isLoading,
    error,

    // Computed
    totalRecords,
    recordsByVehicle,
    recordsByDateRange,
    mostRecentRecord,

    // Actions
    fetchRecords,
    fetchRecordById,
    createRecord,
    updateRecord,
    deleteRecord,
    calculateEfficiency,
    getFuelStatistics,
    clearRecords,
    clearError,
  }
})
