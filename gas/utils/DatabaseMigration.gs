/**
 * DatabaseMigration.gs
 *
 * Migration scripts to update database schema
 */

const DatabaseMigration = {
  /**
   * Migrates maintenanceTasks sheet to new schema
   * Renames 'type' column to 'taskType' and updates other column names
   */
  migrateMaintenanceTasksSchema: function () {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('AUTH_SPREADSHEET_ID')
    if (!spreadsheetId) {
      throw new Error('AUTH_SPREADSHEET_ID not configured')
    }

    const ss = SpreadsheetApp.openById(spreadsheetId)
    const sheet = ss.getSheetByName('maintenanceTasks')

    if (!sheet) {
      throw new Error('maintenanceTasks sheet not found')
    }

    console.log('Starting maintenanceTasks schema migration...')

    // Get current headers
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    console.log('Current headers:', currentHeaders)

    // Define the new schema
    const newHeaders = [
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

    // Column mapping: old name -> new name
    const columnMapping = {
      'type': 'taskType',
      'dueDate': 'scheduledDate',
      'recurring': 'isRecurring',
      'startDate': null, // Remove this column
      'duration': null, // Remove this column
      'cost': null, // Remove this column
    }

    // Get all data
    const dataRange = sheet.getDataRange()
    const allData = dataRange.getValues()
    const numRows = allData.length
    const numCols = currentHeaders.length

    console.log('Found', numRows - 1, 'data rows and', numCols, 'columns')

    // Create a mapping of current column indices
    const currentColumnIndices = {}
    currentHeaders.forEach(function (header, index) {
      currentColumnIndices[header] = index
    })

    // Create new data array
    const newData = []

    // Add header row
    newData.push(newHeaders)

    // Migrate data rows
    for (let i = 1; i < numRows; i++) {
      const oldRow = allData[i]
      const newRow = []

      newHeaders.forEach(function (newHeader) {
        // Find the old column name for this header
        let oldHeader = newHeader
        for (let key in columnMapping) {
          if (columnMapping[key] === newHeader) {
            oldHeader = key
            break
          }
        }

        // Get the value from the old row
        const oldIndex = currentColumnIndices[oldHeader]
        if (oldIndex !== undefined) {
          newRow.push(oldRow[oldIndex] || '')
        } else {
          // Column doesn't exist in old schema, use empty value
          newRow.push('')
        }
      })

      newData.push(newRow)
    }

    // Clear the sheet
    sheet.clear()

    // Write new data
    if (newData.length > 0) {
      sheet.getRange(1, 1, newData.length, newHeaders.length).setValues(newData)

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, newHeaders.length)
      headerRange.setFontWeight('bold')
      headerRange.setBackground('#e8eaf6')

      // Freeze header row
      sheet.setFrozenRows(1)

      // Auto-resize columns
      for (let i = 1; i <= newHeaders.length; i++) {
        sheet.autoResizeColumn(i)
      }
    }

    console.log('Migration complete!')
    console.log('Migrated', numRows - 1, 'records')

    return {
      success: true,
      message: 'maintenanceTasks schema migrated successfully',
      recordsMigrated: numRows - 1,
      oldHeaders: currentHeaders,
      newHeaders: newHeaders,
    }
  },

  /**
   * Verifies the maintenanceTasks schema is correct
   */
  verifyMaintenanceTasksSchema: function () {
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('AUTH_SPREADSHEET_ID')
    const ss = SpreadsheetApp.openById(spreadsheetId)
    const sheet = ss.getSheetByName('maintenanceTasks')

    if (!sheet) {
      return {
        success: false,
        message: 'maintenanceTasks sheet not found',
      }
    }

    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const expectedHeaders = [
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

    const hasTaskType = currentHeaders.indexOf('taskType') !== -1
    const hasOldType = currentHeaders.indexOf('type') !== -1

    return {
      success: hasTaskType && !hasOldType,
      hasTaskType: hasTaskType,
      hasOldType: hasOldType,
      currentHeaders: currentHeaders,
      expectedHeaders: expectedHeaders,
      message: hasTaskType
        ? 'Schema is correct'
        : "Schema needs migration - 'type' column should be renamed to 'taskType'",
    }
  },
}

/**
 * Run this function to migrate maintenanceTasks schema
 */
function migrateMaintenanceTasksSchema() {
  return DatabaseMigration.migrateMaintenanceTasksSchema()
}

/**
 * Run this function to verify maintenanceTasks schema
 */
function verifyMaintenanceTasksSchema() {
  return DatabaseMigration.verifyMaintenanceTasksSchema()
}
