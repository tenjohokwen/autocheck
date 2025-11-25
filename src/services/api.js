/**
 * api.js
 *
 * API client for communicating with Google Apps Script backend.
 * Handles request/response formatting, error handling, and token management.
 *
 * Per constitution: Clean, readable code with clear error handling.
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_GAS_API_URL

/**
 * Creates axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  },
})

/**
 * API client object
 */
export const api = {
  /**
   * Makes a POST request to the API
   * @param {string} action - API action (e.g., 'auth.login')
   * @param {Object} data - Request data
   * @param {string} token - Optional auth token
   * @returns {Promise<Object>} Response data
   */
  async post(action, data = {}, token = null) {
    try {
      // Get token from localStorage if not provided
      if (!token) {
        token = localStorage.getItem('auth_token')
      }

      // Build request payload
      const payload = {
        action: action,
        data: data,
      }

      // Add token for secured endpoints
      if (token) {
        payload.token = token
      }

      // Make request
      const response = await axiosInstance.post('', payload)

      // Check response status
      if (response.data.status >= 400) {
        throw new ApiError(response.data.status, response.data.message, response.data.msgKey)
      }

      // Handle token refresh from response (15-minute TTL)
      if (response.data.token && response.data.token.value) {
        localStorage.setItem('auth_token', response.data.token.value)
        localStorage.setItem('auth_expiry', response.data.token.ttl) // Use 'auth_expiry' to match authStore
        if (response.data.token.username) {
          localStorage.setItem('auth_username', response.data.token.username)
        }

        // Dispatch event for session monitor
        window.dispatchEvent(
          new CustomEvent('token-refreshed', {
            detail: {
              ttl: response.data.token.ttl,
              value: response.data.token.value,
            },
          }),
        )
      }

      return response.data
    } catch (error) {
      // Handle axios errors
      if (error.response) {
        // Server responded with error
        const data = error.response.data
        throw new ApiError(
          data.status || error.response.status,
          data.message || 'Server error',
          data.msgKey || 'error.server',
        )
      } else if (error.request) {
        // Request made but no response
        throw new ApiError(
          0,
          'No response from server. Check your internet connection.',
          'error.network',
        )
      } else if (error instanceof ApiError) {
        // Re-throw ApiError
        throw error
      } else {
        // Other errors
        throw new ApiError(0, error.message || 'Unknown error occurred', 'error.unknown')
      }
    }
  },

  /**
   * Makes a GET request (for health checks)
   * @returns {Promise<Object>} Response data
   */
  async get() {
    try {
      const response = await axiosInstance.get('')
      return response.data
    } catch (error) {
      throw new ApiError(
        error.response?.status || 0,
        error.message || 'Request failed',
        'error.request',
      )
    }
  },
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(status, message, msgKey) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.msgKey = msgKey
  }
}

/**
 * Authentication API methods
 */
export const authApi = {
  signup: (email, password) => api.post('auth.signup', { email, password }),

  verifyEmail: (email, token) => api.post('auth.verifyEmail', { email, token }),

  resendVerification: (email) => api.post('auth.resendVerification', { email }),

  login: (email, password) => api.post('auth.login', { email, password }),

  requestPasswordReset: (email) => api.post('auth.requestPasswordReset', { email }),

  verifyOTP: (email, otp) => api.post('auth.verifyOTP', { email, otp }),

  resetPassword: (email, otp, newPassword) =>
    api.post('auth.resetPassword', { email, otp, newPassword }),
}
