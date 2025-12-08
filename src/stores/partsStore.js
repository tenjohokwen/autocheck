/**
 * Parts Store
 *
 * State management for parts inventory operations
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from 'src/services/api'

export const usePartsStore = defineStore('parts', () => {
  // State
  const parts = ref([])
  const summary = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const lowStockParts = computed(() => {
    return parts.value.filter((p) => p.isLowStock)
  })

  const totalInventoryValue = computed(() => {
    return parts.value.reduce((sum, p) => sum + (p.totalValue || 0), 0)
  })

  const lowStockCount = computed(() => {
    return lowStockParts.value.length
  })

  // Actions
  async function fetchParts(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.getAll', filters)
      parts.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPartById(partId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.getById', { partId })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createPart(data) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.create', data)
      const newPart = response.data

      // Add to local state
      parts.value.unshift(newPart)

      return newPart
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updatePart(partId, data) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.update', {
        partId,
        ...data,
      })

      const updatedPart = response.data

      // Update local state
      const index = parts.value.findIndex((p) => p.partId === partId)
      if (index !== -1) {
        parts.value[index] = updatedPart
      }

      return updatedPart
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deletePart(partId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('parts.delete', { partId })

      // Remove from local state
      const index = parts.value.findIndex((p) => p.partId === partId)
      if (index !== -1) {
        parts.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function adjustQuantity(partId, quantity, reason) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.adjustQuantity', {
        partId,
        quantity,
        reason,
      })

      const updatedPart = response.data

      // Update local state
      const index = parts.value.findIndex((p) => p.partId === partId)
      if (index !== -1) {
        parts.value[index] = updatedPart
      }

      return updatedPart
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchLowStockParts() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.lowStock', {})
      const lowStock = response.data || []

      // Update parts list with low stock parts
      parts.value = lowStock

      return lowStock
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSummary() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.summary', {})
      summary.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function searchParts(query) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('parts.search', { query })
      parts.value = response.data || []
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
    parts.value = []
    summary.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    parts,
    summary,
    isLoading,
    error,

    // Computed
    lowStockParts,
    totalInventoryValue,
    lowStockCount,

    // Actions
    fetchParts,
    fetchPartById,
    createPart,
    updatePart,
    deletePart,
    adjustQuantity,
    fetchLowStockParts,
    fetchSummary,
    searchParts,
    clearError,
    $reset,
  }
})
