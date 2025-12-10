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
    this.createFuelRecordsSheet(ss)
    this.createExpensesSheet(ss)
    this.createPartsSheet(ss)
    this.createRepairsSheet(ss)
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
        'maintenanceTasks',
        'fuelRecords',
        'expenses',
        'parts',
        'repairs',
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
   * Creates maintenanceTasks sheet
   */
  createMaintenanceTasksSheet: function (ss) {
    const headers = [
      'taskId',
      'vehicleId',
      'taskType',
      'description',
      'priority',
      'scheduledDate',
      'dueOdometer',
      'status',
      'assignedTechnician',
      'isRecurring',
      'recurrenceInterval',
      'recurrenceType',
      'completedDate',
      'laborHours',
      'notes',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
    ]
    this.createSheet(ss, 'maintenanceTasks', headers)
  },

  /**
   * Creates fuelRecords sheet
   */
  createFuelRecordsSheet: function (ss) {
    const headers = [
      'recordId',
      'vehicleId',
      'date',
      'odometer',
      'liters',
      'cost',
      'costPerLiter',
      'fuelType',
      'fullTank',
      'station',
      'notes',
      'efficiency',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
    ]
    this.createSheet(ss, 'fuelRecords', headers)
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
      'partNumber',
      'name',
      'category',
      'description',
      'manufacturer',
      'quantityInStock',
      'reorderLevel',
      'unitPrice',
      'location',
      'supplier',
      'supplierPartNumber',
      'notes',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
    ]
    this.createSheet(ss, 'parts', headers)
  },

  /**
   * Creates repairs sheet
   */
  createRepairsSheet: function (ss) {
    const headers = [
      'repairId',
      'vehicleId',
      'repairDate',
      'description',
      'status',
      'severity',
      'cost',
      'odometerReading',
      'laborHours',
      'partsUsed',
      'technicianName',
      'repairShop',
      'warrantyExpiry',
      'isWarrantyClaim',
      'invoiceNumber',
      'notes',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
    ]
    this.createSheet(ss, 'repairs', headers)
  },

  /**
   * Creates documents sheet
   */
  createDocumentsSheet: function (ss) {
    const headers = [
      'documentId',
      'vehicleId',
      'documentType',
      'title',
      'description',
      'documentUrl',
      'issueDate',
      'expiryDate',
      'documentNumber',
      'issuedBy',
      'tags',
      'notes',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
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
      'title',
      'description',
      'dueDate',
      'priority',
      'status',
      'triggerThresholdDays',
      'triggerThresholdKm',
      'acknowledgedAt',
      'completedAt',
      'notes',
      'createdAt',
      'updatedAt',
      'createdBy',
      'changedBy',
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
      'maintenanceTasks',
      'fuelRecords',
      'expenses',
      'parts',
      'repairs',
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
