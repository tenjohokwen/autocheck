/**
 * vehicleStore.js
 *
 * Pinia store for vehicle management.
 * Handles vehicle CRUD operations, archiving, and fleet assignments.
 *
 * Per constitution: Use Pinia for state management, Vue 3 Composition API style.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/services/api'

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
   * Fetch all vehicles
   * @param {boolean} withArchived - Include archived vehicles
   * @returns {Promise<Array>} Array of vehicles
   */
  async function fetchVehicles(withArchived = false) {
    isLoading.value = true
    error.value = null
    includeArchived.value = withArchived

    try {
      const response = await api.post('vehicle.list', {
        includeArchived: withArchived
      })
      vehicles.value = response.data || []
      return vehicles.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Vehicle object
   */
  async function fetchVehicleById(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('vehicle.get', { vehicleId })
      currentVehicle.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  async function createVehicle(vehicleData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('vehicle.create', vehicleData)
      const newVehicle = response.data

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
   * Update an existing vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<Object>} Updated vehicle
   */
  async function updateVehicle(vehicleId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('vehicle.update', {
        vehicleId,
        ...updates
      })
      const updatedVehicle = response.data

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
   * Archive a vehicle (soft delete)
   * Implements FR-034, FR-038, FR-039
   * @param {string} vehicleId - Vehicle ID
   * @param {string} reason - Reason for archiving
   * @returns {Promise<Object>} Archived vehicle
   */
  async function archiveVehicle(vehicleId, reason) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('vehicle.archive', {
        vehicleId,
        reason
      })
      const archivedVehicle = response.data

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
   * Assign a vehicle to a fleet
   * @param {string} vehicleId - Vehicle ID
   * @param {string} fleetId - Fleet ID
   * @returns {Promise<Object>} Updated vehicle
   */
  async function assignToFleet(vehicleId, fleetId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('vehicle.assignToFleet', {
        vehicleId,
        fleetId
      })
      const updatedVehicle = response.data

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
   * Remove a vehicle from its fleet
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Updated vehicle
   */
  async function removeFromFleet(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('vehicle.removeFromFleet', {
        vehicleId
      })
      const updatedVehicle = response.data

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
   * Delete a vehicle permanently (hard delete)
   * Note: Archive is preferred per FR-034
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<void>}
   */
  async function deleteVehicle(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('vehicle.delete', { vehicleId })

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
   * Clear current vehicle
   */
  function clearCurrentVehicle() {
    currentVehicle.value = null
  }

  /**
   * Clear all vehicle data
   */
  function clearVehicles() {
    vehicles.value = []
    currentVehicle.value = null
    error.value = null
    includeArchived.value = false
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
    clearCurrentVehicle,
    clearVehicles
  }
})
