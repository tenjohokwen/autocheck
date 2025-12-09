/**
 * ResponseInterceptor.gs
 *
 * Automatically adds token refresh to all authenticated responses.
 * This ensures the frontend receives a fresh token with every API call,
 * extending the session without handlers needing to be aware of it.
 *
 * Per SESSION_TIMER_ARCHITECTURE.md:
 * - Frontend expects token refresh in response.token
 * - api.js updates localStorage and dispatches 'token-refreshed' event
 * - useSessionMonitor resets all three timers
 *
 * Integration Point:
 * - Called by Main.gs after handler execution
 * - Wraps handler response with token if request was authenticated
 */

const ResponseInterceptor = {
  /**
   * Intercepts handler response and adds token refresh for authenticated requests
   *
   * @param {Object} context - Request context from SecurityInterceptor
   * @param {Object} handlerResult - Raw result from handler
   * @returns {Object} Enhanced response with token (if authenticated)
   */
  addTokenRefresh: function (context, handlerResult) {
    // If request was public (no user), return response as-is
    if (!context.user) {
      return handlerResult
    }

    // Request was authenticated - add token refresh
    // Generate fresh token for the authenticated user
    const newToken = TokenManager.generateToken(context.user.email)

    // Enhance handler result with token
    const enhancedResult = {
      status: handlerResult.status || 200,
      msgKey: handlerResult.msgKey,
      message: handlerResult.message,
      data: handlerResult.data || {},
      token: {
        value: newToken.value,
        ttl: newToken.ttl, // Absolute timestamp when token expires
        username: context.user.email,
      },
    }

    return enhancedResult
  },

  /**
   * Checks if a response already has a token
   * Some handlers (like auth.login, auth.ping) manually include tokens
   * We should not override those
   *
   * @param {Object} handlerResult - Handler response
   * @returns {boolean} True if response already has token
   */
  hasToken: function (handlerResult) {
    return handlerResult && handlerResult.token && handlerResult.token.value
  },

  /**
   * Intercepts and enhances response (main entry point)
   * Only adds token if:
   * - Request was authenticated (context.user exists)
   * - Response doesn't already have a token
   *
   * @param {Object} context - Request context
   * @param {Object} handlerResult - Handler response
   * @returns {Object} Enhanced response
   */
  intercept: function (context, handlerResult) {
    // Skip if response already has token (auth endpoints handle their own)
    if (this.hasToken(handlerResult)) {
      return handlerResult
    }

    // Add token for authenticated requests
    return this.addTokenRefresh(context, handlerResult)
  },
}
