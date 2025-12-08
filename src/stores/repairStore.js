/**
 * Repair Store
 *
 * State management for repair history operations
 * Implements FR-020 (repair history tracking)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from 'src/services/api'

export const useRepairStore = defineStore('repair', () => {
  // State
  const repairs = ref([])
  const costAnalysis = ref([])
  const warrantyRepairs = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const activeRepairs = computed(() => {
    return repairs.value.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED')
  })

  const completedRepairs = computed(() => {
    return repairs.value.filter((r) => r.status === 'COMPLETED')
  })

  const repairsUnderWarranty = computed(() => {
    return repairs.value.filter((r) => r.hasWarranty)
  })

  const totalRepairCost = computed(() => {
    return repairs.value.reduce((sum, r) => sum + (r.cost || 0), 0)
  })

  // Actions
  async function fetchRepairs(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('repair.getAll', filters)
      repairs.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRepairHistory(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('repair.history', { vehicleId })
      repairs.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRepairById(repairId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('repair.getById', { repairId })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createRepair(data) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('repair.create', data)
      const newRepair = response.data

      // Add to local state
      repairs.value.unshift(newRepair)

      return newRepair
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateRepair(repairId, data) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('repair.update', {
        repairId,
        ...data,
      })

      const updatedRepair = response.data

      // Update local state
      const index = repairs.value.findIndex((r) => r.repairId === repairId)
      if (index !== -1) {
        repairs.value[index] = updatedRepair
      }

      return updatedRepair
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteRepair(repairId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('repair.delete', { repairId })

      // Remove from local state
      const index = repairs.value.findIndex((r) => r.repairId === repairId)
      if (index !== -1) {
        repairs.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCostAnalysis(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('repair.costAnalysis', filters)
      costAnalysis.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchWarrantyRepairs(vehicleId = null) {
    isLoading.value = true
    error.value = null

    try {
      const payload = vehicleId ? { vehicleId } : {}
      const response = await api.post('repair.warranty', payload)
      warrantyRepairs.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function $reset() {
    repairs.value = []
    costAnalysis.value = []
    warrantyRepairs.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    repairs,
    costAnalysis,
    warrantyRepairs,
    isLoading,
    error,

    // Computed
    activeRepairs,
    completedRepairs,
    repairsUnderWarranty,
    totalRepairCost,

    // Actions
    fetchRepairs,
    fetchRepairHistory,
    fetchRepairById,
    createRepair,
    updateRepair,
    deleteRepair,
    fetchCostAnalysis,
    fetchWarrantyRepairs,
    clearError,
    $reset,
  }
})
