/**
 * Router.gs
 *
 * Routes incoming requests to appropriate handler methods.
 * Discovers and invokes handler methods dynamically based on action string.
 *
 * Per constitution: Route requests to appropriate methods, handle method discovery.
 *
 * Action Format: 'handler.method'
 * Example: 'auth.login' -> AuthHandler.login()
 */

const Router = {
  /**
   * Routes a validated request to the appropriate handler
   * @param {Object} context - Validated request context from SecurityInterceptor
   * @returns {Object} Handler response
   */
  route: function (context) {
    const action = context.action
    const parts = action.split('.')

    if (parts.length !== 2) {
      throw ResponseHandler.validationError(
        'Invalid action format. Expected: handler.method',
        'error.router.invalidAction',
      )
    }

    const handlerName = parts[0]
    const methodName = parts[1]

    // Get the handler object
    const handler = this.getHandler(handlerName)

    if (!handler) {
      throw ResponseHandler.notFoundError(
        'Handler not found: ' + handlerName,
        'error.router.handlerNotFound',
      )
    }

    // Get the method from the handler
    const method = handler[methodName]

    if (!method || typeof method !== 'function') {
      throw ResponseHandler.notFoundError(
        'Method not found: ' + handlerName + '.' + methodName,
        'error.router.methodNotFound',
      )
    }

    // Log the route
    console.log('Routing to:', action, {
      user: context.user ? context.user.email : 'public',
      timestamp: DateUtil.getCurrentTimestamp(),
    })

    // Invoke the method with context
    return method.call(handler, context)
  },

  /**
   * Gets a handler object by name
   * @param {string} handlerName - Name of the handler (e.g., 'auth', 'metadata')
   * @returns {Object} Handler object
   */
  getHandler: function (handlerName) {
    // Map handler names to handler objects
    const handlers = {
      auth: AuthHandler,
    }

    return handlers[handlerName] || null
  },

  /**
   * Lists all available routes (for documentation/debugging)
   * @returns {Object} Map of handler.method -> description
   */
  listRoutes: function () {
    return {
      // Auth routes
      'auth.signup': 'Create a new user account',
      'auth.verifyEmail': 'Verify user email with token',
      'auth.resendVerification': 'Resend verification email',
      'auth.login': 'Authenticate user and get token',
      'auth.ping': 'Extend session by refreshing token',
      'auth.requestPasswordReset': 'Request password reset OTP',
      'auth.verifyOTP': 'Verify OTP for password reset',
      'auth.resetPassword': 'Reset password with verified OTP',
    }
  },
}
