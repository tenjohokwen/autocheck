/**
 * DatabaseSetup.gs
 *
 * Utility functions to initialize Google Sheets database structure
 * Run setupDatabase() function manually in Apps Script editor to create all sheets
 */

const DatabaseSetup = {
  /**
   * Creates all required sheets with proper column headers
   * Run this function once to initialize the database
   */
  setupDatabase: function () {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('AUTH_SPREADSHEET_ID')

    if (!spreadsheetId) {
      throw new Error(
        'AUTH_SPREADSHEET_ID not configured. Please set it in Project Settings > Script Properties',
      )
    }

    const ss = SpreadsheetApp.openById(spreadsheetId)

    console.log('Setting up AutoCheck database...')

    // Create all sheets
    this.createUsersSheet(ss)
    this.createFleetsSheet(ss)
    this.createVehiclesSheet(ss)
    this.createMaintenanceTasksSheet(ss)
    this.createFillupsSheet(ss)
    this.createExpensesSheet(ss)
    this.createPartsSheet(ss)
    this.createDocumentsSheet(ss)
    this.createRemindersSheet(ss)
    this.createReportsSheet(ss)

    console.log('Database setup complete!')
    console.log('All sheets created with proper column headers.')

    return {
      success: true,
      message: 'Database initialized successfully',
      sheets: [
        'users',
        'fleets',
        'vehicles',
        'maintenance_tasks',
        'fillups',
        'expenses',
        'parts',
        'documents',
        'reminders',
        'reports',
      ],
    }
  },

  /**
   * Creates or updates a sheet with specified headers
   * @param {Spreadsheet} ss - Spreadsheet object
   * @param {string} sheetName - Name of the sheet
   * @param {Array<string>} headers - Array of column headers
   */
  createSheet: function (ss, sheetName, headers) {
    let sheet = ss.getSheetByName(sheetName)

    if (sheet) {
      console.log('Sheet "' + sheetName + '" already exists, updating headers...')
    } else {
      sheet = ss.insertSheet(sheetName)
      console.log('Created sheet: ' + sheetName)
    }

    // Set headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length)
    headerRange.setValues([headers])
    headerRange.setFontWeight('bold')
    headerRange.setBackground('#e8eaf6')

    // Freeze header row
    sheet.setFrozenRows(1)

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i)
    }
  },

  /**
   * Creates users sheet
   */
  createUsersSheet: function (ss) {
    const headers = [
      'userId',
      'email',
      'passwordHash',
      'username',
      'role',
      'status',
      'token',
      'tokenExpiry',
      'verificationToken',
      'verificationExpiry',
      'resetToken',
      'resetExpiry',
      'createdAt',
      'updatedAt',
    ]
    this.createSheet(ss, 'users', headers)
  },

  /**
   * Creates fleets sheet (single-tenant, no orgId)
   */
  createFleetsSheet: function (ss) {
    const headers = ['fleetId', 'name', 'description', 'vehicleCount', 'createdAt', 'updatedAt', 'createdBy', 'changedBy']
    this.createSheet(ss, 'fleets', headers)
  },

  /**
   * Creates vehicles sheet
   */
  createVehiclesSheet: function (ss) {
    const headers = [
      'vehicleId',
      'make',
      'model',
      'year',
      'seats',
      'licensePlate',
      'vehicleType',
      'currentOdometer',
      'fleetId',
      'insuranceExpiry',
      'archived',
      'archivedDate',
      'archivedReason',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
    ]
    this.createSheet(ss, 'vehicles', headers)
  },

  /**
   * Creates maintenance_tasks sheet
   */
  createMaintenanceTasksSheet: function (ss) {
    const headers = [
      'taskId',
      'vehicleId',
      'type',
      'description',
      'priority',
      'dueDate',
      'status',
      'assignedTechnician',
      'startDate',
      'completedDate',
      'duration',
      'notes',
      'cost',
      'recurring',
      'recurrenceInterval',
      'recurrenceType',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
    ]
    this.createSheet(ss, 'maintenance_tasks', headers)
  },

  /**
   * Creates fillups sheet
   */
  createFillupsSheet: function (ss) {
    const headers = [
      'fillupId',
      'vehicleId',
      'date',
      'fuelAmount',
      'cost',
      'odometerReading',
      'efficiency',
      'createdAt',
      'createdBy',
    ]
    this.createSheet(ss, 'fillups', headers)
  },

  /**
   * Creates expenses sheet
   */
  createExpensesSheet: function (ss) {
    const headers = [
      'expenseId',
      'vehicleId',
      'category',
      'date',
      'amount',
      'description',
      'receiptUrl',
      'createdAt',
      'createdBy',
    ]
    this.createSheet(ss, 'expenses', headers)
  },

  /**
   * Creates parts sheet
   */
  createPartsSheet: function (ss) {
    const headers = [
      'partId',
      'vehicleId',
      'taskId',
      'date',
      'partType',
      'partNumber',
      'price',
      'createdAt',
      'createdBy',
    ]
    this.createSheet(ss, 'parts', headers)
  },

  /**
   * Creates documents sheet
   */
  createDocumentsSheet: function (ss) {
    const headers = [
      'documentId',
      'vehicleId',
      'category',
      'fileName',
      'fileType',
      'fileSize',
      'driveFileId',
      'uploadDate',
      'uploadedBy',
    ]
    this.createSheet(ss, 'documents', headers)
  },

  /**
   * Creates reminders sheet
   */
  createRemindersSheet: function (ss) {
    const headers = [
      'reminderId',
      'vehicleId',
      'type',
      'dueDate',
      'threshold',
      'acknowledged',
      'acknowledgedDate',
      'createdAt',
    ]
    this.createSheet(ss, 'reminders', headers)
  },

  /**
   * Creates reports sheet
   */
  createReportsSheet: function (ss) {
    const headers = [
      'reportId',
      'name',
      'vehicleFilter',
      'dateRangeStart',
      'dateRangeEnd',
      'categories',
      'format',
      'schedule',
      'recipients',
      'lastGenerated',
      'createdAt',
      'createdBy',
    ]
    this.createSheet(ss, 'reports', headers)
  },

  /**
   * Verifies all sheets exist
   * @returns {Object} Verification result
   */
  verifyDatabase: function () {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('AUTH_SPREADSHEET_ID')
    const ss = SpreadsheetApp.openById(spreadsheetId)

    const requiredSheets = [
      'users',
      'fleets',
      'vehicles',
      'maintenance_tasks',
      'fillups',
      'expenses',
      'parts',
      'documents',
      'reminders',
      'reports',
    ]

    const existing = []
    const missing = []

    requiredSheets.forEach(function (sheetName) {
      if (ss.getSheetByName(sheetName)) {
        existing.push(sheetName)
      } else {
        missing.push(sheetName)
      }
    })

    return {
      success: missing.length === 0,
      existing: existing,
      missing: missing,
      message: missing.length === 0 ? 'All sheets exist' : 'Missing sheets: ' + missing.join(', '),
    }
  },
}

/**
 * Run this function manually to set up the database
 */
function setupDatabase() {
  return DatabaseSetup.setupDatabase()
}

/**
 * Run this function to verify database structure
 */
function verifyDatabase() {
  return DatabaseSetup.verifyDatabase()
}
