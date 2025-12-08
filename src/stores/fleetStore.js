/**
 * fleetStore.js
 *
 * Pinia store for fleet management.
 * Handles fleet CRUD operations and state management.
 *
 * Per constitution: Use Pinia for state management, Vue 3 Composition API style.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/services/api'

export const useFleetStore = defineStore('fleet', () => {
  // State
  const fleets = ref([])
  const currentFleet = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const fleetsCount = computed(() => {
    return fleets.value.length
  })

  const fleetOptions = computed(() => {
    return fleets.value.map((fleet) => ({
      label: fleet.name,
      value: fleet.fleetId,
      description: fleet.description,
      vehicleCount: fleet.vehicleCount
    }))
  })

  // Actions

  /**
   * Fetch all fleets
   * @returns {Promise<Array>} Array of fleets
   */
  async function fetchFleets() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fleet.list', {})
      fleets.value = response.data || []
      return fleets.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single fleet by ID
   * @param {string} fleetId - Fleet ID
   * @returns {Promise<Object>} Fleet object
   */
  async function fetchFleetById(fleetId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fleet.get', { fleetId })
      currentFleet.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new fleet
   * @param {Object} fleetData - { name, description }
   * @returns {Promise<Object>} Created fleet
   */
  async function createFleet(fleetData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fleet.create', fleetData)
      const newFleet = response.data

      // Add to local state
      fleets.value.push(newFleet)

      return newFleet
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing fleet
   * @param {string} fleetId - Fleet ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<Object>} Updated fleet
   */
  async function updateFleet(fleetId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fleet.update', {
        fleetId,
        ...updates
      })
      const updatedFleet = response.data

      // Update local state
      const index = fleets.value.findIndex((f) => f.fleetId === fleetId)
      if (index !== -1) {
        fleets.value[index] = updatedFleet
      }

      if (currentFleet.value?.fleetId === fleetId) {
        currentFleet.value = updatedFleet
      }

      return updatedFleet
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a fleet
   * @param {string} fleetId - Fleet ID
   * @returns {Promise<void>}
   */
  async function deleteFleet(fleetId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('fleet.delete', { fleetId })

      // Remove from local state
      fleets.value = fleets.value.filter((f) => f.fleetId !== fleetId)

      if (currentFleet.value?.fleetId === fleetId) {
        currentFleet.value = null
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get vehicles in a fleet
   * @param {string} fleetId - Fleet ID
   * @returns {Promise<Array>} Array of vehicles
   */
  async function fetchFleetVehicles(fleetId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('fleet.getVehicles', { fleetId })
      return response.data || []
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear current fleet
   */
  function clearCurrentFleet() {
    currentFleet.value = null
  }

  /**
   * Clear all fleet data
   */
  function clearFleets() {
    fleets.value = []
    currentFleet.value = null
    error.value = null
  }

  return {
    // State
    fleets,
    currentFleet,
    isLoading,
    error,

    // Computed
    fleetsCount,
    fleetOptions,

    // Actions
    fetchFleets,
    fetchFleetById,
    createFleet,
    updateFleet,
    deleteFleet,
    fetchFleetVehicles,
    clearCurrentFleet,
    clearFleets
  }
})
