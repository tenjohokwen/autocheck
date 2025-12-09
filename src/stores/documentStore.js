/**
 * Document Store
 *
 * State management for document management operations
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/services/api'

export const useDocumentStore = defineStore('document', () => {
  // State
  const documents = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const expiringDocuments = computed(() => {
    return documents.value.filter((d) => d.isExpiringSoon && !d.isExpired)
  })

  const expiredDocuments = computed(() => {
    return documents.value.filter((d) => d.isExpired)
  })

  const expiringCount = computed(() => {
    return expiringDocuments.value.length
  })

  const expiredCount = computed(() => {
    return expiredDocuments.value.length
  })

  // Actions
  async function fetchDocuments(filters = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.getAll', filters)
      documents.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDocumentById(documentId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.getById', { documentId })
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDocumentsByVehicle(vehicleId) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.byVehicle', { vehicleId })
      documents.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createDocument(data) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.create', data)
      const newDocument = response.data

      // Add to local state
      documents.value.unshift(newDocument)

      return newDocument
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateDocument(documentId, data) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.update', {
        documentId,
        ...data,
      })

      const updatedDocument = response.data

      // Update local state
      const index = documents.value.findIndex((d) => d.documentId === documentId)
      if (index !== -1) {
        documents.value[index] = updatedDocument
      }

      return updatedDocument
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteDocument(documentId) {
    isLoading.value = true
    error.value = null

    try {
      await api.post('document.delete', { documentId })

      // Remove from local state
      const index = documents.value.findIndex((d) => d.documentId === documentId)
      if (index !== -1) {
        documents.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchExpiringDocuments(days = 30) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.expiring', { days })
      return response.data || []
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchExpiredDocuments() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.expired', {})
      return response.data || []
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function searchDocuments(query) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('document.search', { query })
      documents.value = response.data || []
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
    documents.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    documents,
    isLoading,
    error,

    // Computed
    expiringDocuments,
    expiredDocuments,
    expiringCount,
    expiredCount,

    // Actions
    fetchDocuments,
    fetchDocumentById,
    fetchDocumentsByVehicle,
    createDocument,
    updateDocument,
    deleteDocument,
    fetchExpiringDocuments,
    fetchExpiredDocuments,
    searchDocuments,
    clearError,
    $reset,
  }
})
