/**
 * vehicleService.js
 *
 * Client-side vehicle service with session-lived caching.
 * Serves as the single source of truth for all vehicle data operations.
 *
 * This service provides a caching layer between the Pinia store and the API,
 * ensuring efficient data management and reducing unnecessary API calls.
 *
 * Cache Strategy:
 * - Session-lived: Cache persists for the duration of the browser session
 * - Automatic invalidation on mutations (create, update, archive, delete)
 * - Manual cache refresh available
 *
 * Per constitution: Use sessionStorage for session-lived cache
 */

import { api } from './api'

const CACHE_KEY = 'autocheck_vehicles_cache'
const CACHE_TIMESTAMP_KEY = 'autocheck_vehicles_cache_timestamp'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

class VehicleService {
  constructor() {
    this.cache = null
    this.cacheTimestamp = null
    this.loadFromSession()
  }

  /**
   * Load cached data from sessionStorage
   * @private
   */
  loadFromSession() {
    try {
      const cachedData = sessionStorage.getItem(CACHE_KEY)
      const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY)

      if (cachedData && timestamp) {
        this.cache = JSON.parse(cachedData)
        this.cacheTimestamp = parseInt(timestamp, 10)
      }
    } catch (error) {
      console.warn('Failed to load vehicle cache from session:', error)
      this.clearCache()
    }
  }

  /**
   * Save cache to sessionStorage
   * @private
   */
  saveToSession() {
    try {
      if (this.cache) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(this.cache))
        sessionStorage.setItem(CACHE_TIMESTAMP_KEY, this.cacheTimestamp.toString())
      }
    } catch (error) {
      console.warn('Failed to save vehicle cache to session:', error)
    }
  }

  /**
   * Check if cache is valid
   * @private
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    if (!this.cache || !this.cacheTimestamp) {
      return false
    }

    const now = Date.now()
    const age = now - this.cacheTimestamp

    return age < CACHE_TTL
  }

  /**
   * Update cache with new data
   * @private
   * @param {Array} vehicles - Array of vehicles
   */
  updateCache(vehicles) {
    this.cache = vehicles
    this.cacheTimestamp = Date.now()
    this.saveToSession()
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache = null
    this.cacheTimestamp = null
    try {
      sessionStorage.removeItem(CACHE_KEY)
      sessionStorage.removeItem(CACHE_TIMESTAMP_KEY)
    } catch (error) {
      console.warn('Failed to clear vehicle cache from session:', error)
    }
  }

  /**
   * Invalidate a single vehicle in cache
   * @private
   * @param {string} vehicleId - Vehicle ID to invalidate
   */
  invalidateVehicle(vehicleId) {
    if (this.cache) {
      this.cache = this.cache.filter((v) => v.vehicleId !== vehicleId)
      this.saveToSession()
    }
  }

  /**
   * Update a single vehicle in cache
   * @private
   * @param {Object} vehicle - Updated vehicle object
   */
  updateVehicleInCache(vehicle) {
    if (this.cache) {
      const index = this.cache.findIndex((v) => v.vehicleId === vehicle.vehicleId)
      if (index !== -1) {
        this.cache[index] = vehicle
      } else {
        this.cache.push(vehicle)
      }
      this.saveToSession()
    }
  }

  /**
   * Fetch all vehicles with caching
   * @param {Object} options - Fetch options
   * @param {boolean} options.includeArchived - Include archived vehicles
   * @param {boolean} options.forceRefresh - Force refresh from API
   * @returns {Promise<Array>} Array of vehicles
   */
  async fetchVehicles({ includeArchived = false, forceRefresh = false } = {}) {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      // Filter archived if needed
      if (includeArchived) {
        return this.cache
      } else {
        return this.cache.filter((v) => !v.archived)
      }
    }

    // Fetch from API
    try {
      const response = await api.post('vehicle.list', {
        includeArchived: true // Always fetch all to maintain complete cache
      })

      const vehicles = response.data || []
      this.updateCache(vehicles)

      // Return filtered results
      if (includeArchived) {
        return vehicles
      } else {
        return vehicles.filter((v) => !v.archived)
      }
    } catch (error) {
      // If API fails but we have cache, return cache as fallback
      if (this.cache) {
        console.warn('API fetch failed, returning cached data:', error)
        if (includeArchived) {
          return this.cache
        } else {
          return this.cache.filter((v) => !v.archived)
        }
      }
      throw error
    }
  }

  /**
   * Fetch a single vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<Object>} Vehicle object
   */
  async fetchVehicleById(vehicleId, forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && this.isCacheValid()) {
      const cached = this.cache.find((v) => v.vehicleId === vehicleId)
      if (cached) {
        return cached
      }
    }

    // Fetch from API
    const response = await api.post('vehicle.get', { vehicleId })
    const vehicle = response.data

    // Update cache
    this.updateVehicleInCache(vehicle)

    return vehicle
  }

  /**
   * Create a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  async createVehicle(vehicleData) {
    const response = await api.post('vehicle.create', vehicleData)
    const newVehicle = response.data

    // Add to cache
    if (this.cache) {
      this.cache.push(newVehicle)
      this.saveToSession()
    }

    return newVehicle
  }

  /**
   * Update an existing vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<Object>} Updated vehicle
   */
  async updateVehicle(vehicleId, updates) {
    const response = await api.post('vehicle.update', {
      vehicleId,
      ...updates
    })
    const updatedVehicle = response.data

    // Update cache
    this.updateVehicleInCache(updatedVehicle)

    return updatedVehicle
  }

  /**
   * Archive a vehicle (soft delete)
   * @param {string} vehicleId - Vehicle ID
   * @param {string} reason - Reason for archiving
   * @returns {Promise<Object>} Archived vehicle
   */
  async archiveVehicle(vehicleId, reason) {
    const response = await api.post('vehicle.archive', {
      vehicleId,
      reason
    })
    const archivedVehicle = response.data

    // Update cache
    this.updateVehicleInCache(archivedVehicle)

    return archivedVehicle
  }

  /**
   * Delete a vehicle permanently
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<void>}
   */
  async deleteVehicle(vehicleId) {
    await api.post('vehicle.delete', { vehicleId })

    // Remove from cache
    this.invalidateVehicle(vehicleId)
  }

  /**
   * Assign a vehicle to a fleet
   * @param {string} vehicleId - Vehicle ID
   * @param {string} fleetId - Fleet ID
   * @returns {Promise<Object>} Updated vehicle
   */
  async assignToFleet(vehicleId, fleetId) {
    const response = await api.post('vehicle.assignToFleet', {
      vehicleId,
      fleetId
    })
    const updatedVehicle = response.data

    // Update cache
    this.updateVehicleInCache(updatedVehicle)

    return updatedVehicle
  }

  /**
   * Remove a vehicle from its fleet
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Updated vehicle
   */
  async removeFromFleet(vehicleId) {
    const response = await api.post('vehicle.removeFromFleet', {
      vehicleId
    })
    const updatedVehicle = response.data

    // Update cache
    this.updateVehicleInCache(updatedVehicle)

    return updatedVehicle
  }

  /**
   * Get vehicle options for dropdowns
   * @param {boolean} includeArchived - Include archived vehicles
   * @returns {Promise<Array>} Array of vehicle options
   */
  async getVehicleOptions(includeArchived = false) {
    const vehicles = await this.fetchVehicles({ includeArchived })
    return vehicles.map((vehicle) => ({
      label: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      value: vehicle.vehicleId,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
      archived: vehicle.archived
    }))
  }

  /**
   * Get active vehicles only
   * @returns {Promise<Array>} Array of active vehicles
   */
  async getActiveVehicles() {
    return this.fetchVehicles({ includeArchived: false })
  }

  /**
   * Get archived vehicles only
   * @returns {Promise<Array>} Array of archived vehicles
   */
  async getArchivedVehicles() {
    const allVehicles = await this.fetchVehicles({ includeArchived: true })
    return allVehicles.filter((v) => v.archived)
  }

  /**
   * Refresh cache from API
   * @returns {Promise<Array>} Fresh vehicle data
   */
  async refresh() {
    return this.fetchVehicles({ includeArchived: true, forceRefresh: true })
  }
}

// Export singleton instance
export const vehicleService = new VehicleService()

// Export class for testing
export { VehicleService }
