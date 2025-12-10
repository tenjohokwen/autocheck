/**
 * vehicleStore.js
 *
 * Pinia store for vehicle management.
 * Handles vehicle CRUD operations, archiving, and fleet assignments.
 * Uses VehicleService for session-lived caching.
 *
 * Per constitution: Use Pinia for state management, Vue 3 Composition API style.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { vehicleService } from 'src/services/vehicleService'

export const useVehicleStore = defineStore('vehicle', () => {
  // State
  const vehicles = ref([])
  const currentVehicle = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const includeArchived = ref(false)

  // Computed
  const vehiclesCount = computed(() => {
    return vehicles.value.length
  })

  const activeVehicles = computed(() => {
    return vehicles.value.filter((v) => !v.archived)
  })

  const archivedVehicles = computed(() => {
    return vehicles.value.filter((v) => v.archived)
  })

  const activeVehiclesCount = computed(() => {
    return activeVehicles.value.length
  })

  const archivedVehiclesCount = computed(() => {
    return archivedVehicles.value.length
  })

  const vehicleOptions = computed(() => {
    return activeVehicles.value.map((vehicle) => ({
      label: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      value: vehicle.vehicleId,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate
    }))
  })

  // Actions

  /**
   * Fetch all vehicles using VehicleService
   * @param {boolean} withArchived - Include archived vehicles
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<Array>} Array of vehicles
   */
  async function fetchVehicles(withArchived = false, forceRefresh = false) {
    isLoading.value = true
    error.value = null
    includeArchived.value = withArchived

    try {
      const data = await vehicleService.fetchVehicles({
        includeArchived: withArchived,
        forceRefresh
      })
      vehicles.value = data
      return vehicles.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single vehicle by ID using VehicleService
   * @param {string} vehicleId - Vehicle ID
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<Object>} Vehicle object
   */
  async function fetchVehicleById(vehicleId, forceRefresh = false) {
    isLoading.value = true
    error.value = null

    try {
      const data = await vehicleService.fetchVehicleById(vehicleId, forceRefresh)
      currentVehicle.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new vehicle using VehicleService
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  async function createVehicle(vehicleData) {
    isLoading.value = true
    error.value = null

    try {
      const newVehicle = await vehicleService.createVehicle(vehicleData)

      // Add to local state
      vehicles.value.push(newVehicle)

      return newVehicle
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing vehicle using VehicleService
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<Object>} Updated vehicle
   */
  async function updateVehicle(vehicleId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const updatedVehicle = await vehicleService.updateVehicle(vehicleId, updates)

      // Update local state
      const index = vehicles.value.findIndex((v) => v.vehicleId === vehicleId)
      if (index !== -1) {
        vehicles.value[index] = updatedVehicle
      }

      if (currentVehicle.value?.vehicleId === vehicleId) {
        currentVehicle.value = updatedVehicle
      }

      return updatedVehicle
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Archive a vehicle (soft delete) using VehicleService
   * Implements FR-034, FR-038, FR-039
   * @param {string} vehicleId - Vehicle ID
   * @param {string} reason - Reason for archiving
   * @returns {Promise<Object>} Archived vehicle
   */
  async function archiveVehicle(vehicleId, reason) {
    isLoading.value = true
    error.value = null

    try {
      const archivedVehicle = await vehicleService.archiveVehicle(vehicleId, reason)

      // Update local state
      const index = vehicles.value.findIndex((v) => v.vehicleId === vehicleId)
      if (index !== -1) {
        vehicles.value[index] = archivedVehicle
      }

      if (currentVehicle.value?.vehicleId === vehicleId) {
        currentVehicle.value = archivedVehicle
      }

      return archivedVehicle
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Assign a vehicle to a fleet using VehicleService
   * @param {string} vehicleId - Vehicle ID
   * @param {string} fleetId - Fleet ID
   * @returns {Promise<Object>} Updated vehicle
   */
  async function assignToFleet(vehicleId, fleetId) {
    isLoading.value = true
    error.value = null

    try {
      const updatedVehicle = await vehicleService.assignToFleet(vehicleId, fleetId)

      // Update local state
      const index = vehicles.value.findIndex((v) => v.vehicleId === vehicleId)
      if (index !== -1) {
        vehicles.value[index] = updatedVehicle
      }

      if (currentVehicle.value?.vehicleId === vehicleId) {
        currentVehicle.value = updatedVehicle
      }

      return updatedVehicle
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove a vehicle from its fleet using VehicleService
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Updated vehicle
   */
  async function removeFromFleet(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      const updatedVehicle = await vehicleService.removeFromFleet(vehicleId)

      // Update local state
      const index = vehicles.value.findIndex((v) => v.vehicleId === vehicleId)
      if (index !== -1) {
        vehicles.value[index] = updatedVehicle
      }

      if (currentVehicle.value?.vehicleId === vehicleId) {
        currentVehicle.value = updatedVehicle
      }

      return updatedVehicle
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a vehicle permanently (hard delete) using VehicleService
   * Note: Archive is preferred per FR-034
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<void>}
   */
  async function deleteVehicle(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      await vehicleService.deleteVehicle(vehicleId)

      // Remove from local state
      vehicles.value = vehicles.value.filter((v) => v.vehicleId !== vehicleId)

      if (currentVehicle.value?.vehicleId === vehicleId) {
        currentVehicle.value = null
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh vehicles from API (bypassing cache)
   * @returns {Promise<Array>} Fresh vehicle data
   */
  async function refreshVehicles() {
    return fetchVehicles(includeArchived.value, true)
  }

  /**
   * Clear current vehicle
   */
  function clearCurrentVehicle() {
    currentVehicle.value = null
  }

  /**
   * Clear all vehicle data and cache
   */
  function clearVehicles() {
    vehicles.value = []
    currentVehicle.value = null
    error.value = null
    includeArchived.value = false
    vehicleService.clearCache()
  }

  return {
    // State
    vehicles,
    currentVehicle,
    isLoading,
    error,
    includeArchived,

    // Computed
    vehiclesCount,
    activeVehicles,
    archivedVehicles,
    activeVehiclesCount,
    archivedVehiclesCount,
    vehicleOptions,

    // Actions
    fetchVehicles,
    fetchVehicleById,
    createVehicle,
    updateVehicle,
    archiveVehicle,
    assignToFleet,
    removeFromFleet,
    deleteVehicle,
    refreshVehicles,
    clearCurrentVehicle,
    clearVehicles
  }
})
