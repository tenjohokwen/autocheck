/**
 * UserService.gs
 *
 * Provides database operations for user management.
 * Interacts with the 'users' sheet in Google Sheets.
 *
 * Schema (matches DatabaseSetup.gs):
 * A: userId, B: email, C: passwordHash, D: username, E: role, F: status,
 * G: token, H: tokenExpiry, I: verificationToken, J: verificationExpiry,
 * K: resetToken, L: resetExpiry, M: createdAt, N: updatedAt
 */

const UserService = {
  /**
   * Gets the users sheet
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} Users sheet
   */
  getUsersSheet: function () {
    const props = PropertiesService.getScriptProperties()
    const spreadsheetId = props.getProperty('AUTH_SPREADSHEET_ID')
    const ss = SpreadsheetApp.openById(spreadsheetId)
    return ss.getSheetByName('users')
  },

  /**
   * Creates a new user
   * @param {Object} userData - User data object
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password
   * @param {string} userData.username - Username (optional)
   * @param {string} userData.role - User role (ROLE_ADMIN or ROLE_USER)
   * @returns {Object} Created user object (without password)
   */
  createUser: function (userData) {
    const sheet = this.getUsersSheet()

    // Check if user already exists
    const existingUser = this.getUserByEmail(userData.email)
    if (existingUser) {
      throw ResponseHandler.conflictError(
        'User with this email already exists',
        'error.user.alreadyExists',
      )
    }

    // Generate userId
    const userId = Utilities.getUuid()

    // Hash password with embedded salt
    const passwordHash = PasswordUtil.hashPasswordWithSalt(userData.password)

    // Generate verification token
    const verificationToken = Utilities.getUuid()
    const verificationExpiry = DateUtil.addHours(new Date(), 24).getTime()

    // Create user row
    const now = DateUtil.getCurrentTimestamp()
    const row = [
      userId, // A: userId
      userData.email, // B: email
      passwordHash, // C: passwordHash
      userData.username || '', // D: username
      userData.role || 'ROLE_USER', // E: role
      'PENDING', // F: status
      '', // G: token (session token, set on login)
      '', // H: tokenExpiry
      verificationToken, // I: verificationToken
      verificationExpiry, // J: verificationExpiry
      '', // K: resetToken
      '', // L: resetExpiry
      now, // M: createdAt
      now, // N: updatedAt
    ]

    sheet.appendRow(row)

    return {
      userId: userId,
      email: userData.email,
      username: userData.username || '',
      role: userData.role || 'ROLE_USER',
      status: 'PENDING',
      verificationToken: verificationToken,
      createdAt: now,
    }
  },

  /**
   * Gets a user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null if not found
   */
  getUserByEmail: function (email) {
    const sheet = this.getUsersSheet()
    const data = sheet.getDataRange().getValues()

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        // Column B is email now
        return {
          userId: data[i][0],
          email: data[i][1],
          passwordHash: data[i][2],
          username: data[i][3],
          role: data[i][4],
          status: data[i][5],
          token: data[i][6],
          tokenExpiry: data[i][7],
          verificationToken: data[i][8],
          verificationExpiry: data[i][9],
          resetToken: data[i][10],
          resetExpiry: data[i][11],
          createdAt: data[i][12],
          updatedAt: data[i][13],
          rowIndex: i + 1, // Store row index for updates
        }
      }
    }

    return null
  },

  /**
   * Updates a user's data
   * @param {string} email - User email
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated user object (without password)
   */
  updateUser: function (email, updates) {
    const user = this.getUserByEmail(email)
    if (!user) {
      throw ResponseHandler.notFoundError('User not found', 'error.user.notFound')
    }

    const sheet = this.getUsersSheet()
    const row = user.rowIndex
    const now = DateUtil.getCurrentTimestamp()

    // Update allowed fields
    if (updates.password !== undefined) {
      const newHash = PasswordUtil.hashPasswordWithSalt(updates.password)
      sheet.getRange(row, 3).setValue(newHash) // C: passwordHash
    }
    if (updates.username !== undefined) {
      sheet.getRange(row, 4).setValue(updates.username) // D: username
    }
    if (updates.role !== undefined) {
      sheet.getRange(row, 5).setValue(updates.role) // E: role
    }
    if (updates.status !== undefined) {
      sheet.getRange(row, 6).setValue(updates.status) // F: status
    }
    if (updates.token !== undefined) {
      sheet.getRange(row, 7).setValue(updates.token) // G: token
    }
    if (updates.tokenExpiry !== undefined) {
      sheet.getRange(row, 8).setValue(updates.tokenExpiry) // H: tokenExpiry
    }
    if (updates.verificationToken !== undefined) {
      sheet.getRange(row, 9).setValue(updates.verificationToken) // I: verificationToken
    }
    if (updates.verificationExpiry !== undefined) {
      sheet.getRange(row, 10).setValue(updates.verificationExpiry) // J: verificationExpiry
    }
    if (updates.resetToken !== undefined) {
      sheet.getRange(row, 11).setValue(updates.resetToken) // K: resetToken
    }
    if (updates.resetExpiry !== undefined) {
      sheet.getRange(row, 12).setValue(updates.resetExpiry) // L: resetExpiry
    }

    // Always update updatedAt timestamp
    sheet.getRange(row, 14).setValue(now) // N: updatedAt

    // Return updated user (fetch fresh data)
    const updatedUser = this.getUserByEmail(email)
    delete updatedUser.passwordHash
    delete updatedUser.resetToken
    return updatedUser
  },

  /**
   * Verifies a user's email
   * @param {string} email - User email
   * @param {string} token - Verification token
   * @returns {Object} Updated user object
   */
  verifyEmail: function (email, token) {
    const user = this.getUserByEmail(email)
    if (!user) {
      throw ResponseHandler.notFoundError('User not found', 'error.user.notFound')
    }

    if (user.status === 'VERIFIED') {
      throw ResponseHandler.validationError('User already verified', 'error.user.alreadyVerified')
    }

    if (user.verificationToken !== token) {
      throw ResponseHandler.validationError(
        'Invalid verification token',
        'error.verification.invalidToken',
      )
    }

    if (DateUtil.isExpired(user.verificationExpiry)) {
      throw ResponseHandler.validationError(
        'Verification token expired',
        'error.verification.tokenExpired',
      )
    }

    return this.updateUser(email, {
      status: 'VERIFIED',
      verificationToken: '',
      verificationExpiry: '',
    })
  },

  /**
   * Updates session token on login
   * @param {string} email - User email
   * @param {string} token - Session token
   * @param {number} tokenExpiry - Token expiry timestamp
   */
  updateSessionToken: function (email, token, tokenExpiry) {
    this.updateUser(email, {
      token: token,
      tokenExpiry: tokenExpiry,
    })
  },

  /**
   * Generates and stores password reset token
   * @param {string} email - User email
   * @returns {string} Generated reset token (OTP)
   */
  generatePasswordResetOTP: function (email) {
    const user = this.getUserByEmail(email)
    if (!user) {
      throw ResponseHandler.notFoundError('User not found', 'error.user.notFound')
    }

    const otp = PasswordUtil.generateOTP()
    const resetExpiry = DateUtil.createOTPExpiry()

    this.updateUser(email, {
      resetToken: otp,
      resetExpiry: resetExpiry,
    })

    return otp
  },

  /**
   * Verifies password reset OTP
   * @param {string} email - User email
   * @param {string} otp - OTP to verify
   * @returns {boolean} True if OTP is valid
   */
  verifyPasswordResetOTP: function (email, otp) {
    const user = this.getUserByEmail(email)
    if (!user) {
      throw ResponseHandler.notFoundError('User not found', 'error.user.notFound')
    }

    // Convert both to strings for comparison (Google Sheets may store as number)
    const storedOTP = String(user.resetToken || '')
    const providedOTP = String(otp)

    if (!storedOTP || storedOTP !== providedOTP) {
      throw ResponseHandler.validationError('Invalid OTP', 'error.otp.invalid')
    }

    if (DateUtil.isExpired(user.resetExpiry)) {
      throw ResponseHandler.validationError('OTP expired', 'error.otp.expired')
    }

    return true
  },

  /**
   * Resets user password with verified OTP
   * @param {string} email - User email
   * @param {string} otp - Verified OTP
   * @param {string} newPassword - New password
   * @returns {Object} Updated user object
   */
  resetPassword: function (email, otp, newPassword) {
    // Verify OTP first
    this.verifyPasswordResetOTP(email, otp)

    // Update password and clear reset token
    return this.updateUser(email, {
      password: newPassword,
      resetToken: '',
      resetExpiry: '',
    })
  },
}
