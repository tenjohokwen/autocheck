/**
 * DatabaseUtil.gs
 *
 * Utility functions for Google Sheets database operations
 * Single-tenant architecture - no organization filtering needed
 */

const DatabaseUtil = {
  /**
   * Gets the spreadsheet ID from script properties
   * @returns {string} Spreadsheet ID
   */
  getSpreadsheetId: function () {
    const props = PropertiesService.getScriptProperties()
    const spreadsheetId = props.getProperty('AUTH_SPREADSHEET_ID')

    if (!spreadsheetId) {
      throw new Error('AUTH_SPREADSHEET_ID not configured in script properties')
    }

    return spreadsheetId
  },

  /**
   * Gets a sheet by name
   * @param {string} sheetName - Name of the sheet
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} Sheet object
   */
  getSheetByName: function (sheetName) {
    const ss = SpreadsheetApp.openById(this.getSpreadsheetId())
    const sheet = ss.getSheetByName(sheetName)

    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName)
    }

    return sheet
  },

  /**
   * Appends a row to a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array} values - Array of values to append
   */
  appendRow: function (sheetName, values) {
    const sheet = this.getSheetByName(sheetName)
    sheet.appendRow(values)
  },

  /**
   * Gets all data from a sheet (excluding header row)
   * @param {string} sheetName - Name of the sheet
   * @returns {Array<Array>} 2D array of values
   */
  getAllData: function (sheetName) {
    const sheet = this.getSheetByName(sheetName)
    const data = sheet.getDataRange().getValues()

    // Remove header row
    if (data.length > 0) {
      data.shift()
    }

    return data
  },

  /**
   * Finds rows by column value
   * @param {string} sheetName - Name of the sheet
   * @param {number} columnIndex - Column index (0-based)
   * @param {*} value - Value to search for
   * @returns {Array<Object>} Array of row objects with rowIndex and values
   */
  findRowsByColumn: function (sheetName, columnIndex, value) {
    const sheet = this.getSheetByName(sheetName)
    const data = sheet.getDataRange().getValues()
    const headers = data[0]
    const results = []

    // Start from row 1 (skip header)
    for (let i = 1; i < data.length; i++) {
      if (data[i][columnIndex] === value) {
        const rowObject = {}
        headers.forEach(function (header, index) {
          rowObject[header] = data[i][index]
        })
        results.push({
          rowIndex: i + 1, // 1-based row number
          data: rowObject,
          rawValues: data[i],
        })
      }
    }

    return results
  },

  /**
   * Finds a single row by column value
   * @param {string} sheetName - Name of the sheet
   * @param {number} columnIndex - Column index (0-based)
   * @param {*} value - Value to search for
   * @returns {Object|null} Row object or null if not found
   */
  findRowByColumn: function (sheetName, columnIndex, value) {
    const results = this.findRowsByColumn(sheetName, columnIndex, value)
    return results.length > 0 ? results[0] : null
  },

  /**
   * Updates a row by row index
   * @param {string} sheetName - Name of the sheet
   * @param {number} rowIndex - Row index (1-based, including header)
   * @param {Array} values - New values for the row
   */
  updateRow: function (sheetName, rowIndex, values) {
    const sheet = this.getSheetByName(sheetName)
    const range = sheet.getRange(rowIndex, 1, 1, values.length)
    range.setValues([values])
  },

  /**
   * Deletes a row by row index
   * @param {string} sheetName - Name of the sheet
   * @param {number} rowIndex - Row index (1-based, including header)
   */
  deleteRow: function (sheetName, rowIndex) {
    const sheet = this.getSheetByName(sheetName)
    sheet.deleteRow(rowIndex)
  },

  /**
   * Converts row data to object using headers
   * @param {string} sheetName - Name of the sheet
   * @param {Array} rowValues - Array of row values
   * @returns {Object} Object with header keys and row values
   */
  rowToObject: function (sheetName, rowValues) {
    const sheet = this.getSheetByName(sheetName)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const obj = {}

    headers.forEach(function (header, index) {
      obj[header] = rowValues[index]
    })

    return obj
  },

  /**
   * Converts object to row array using headers
   * @param {string} sheetName - Name of the sheet
   * @param {Object} obj - Object to convert
   * @returns {Array} Array of values in header order
   */
  objectToRow: function (sheetName, obj) {
    const sheet = this.getSheetByName(sheetName)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const values = []

    headers.forEach(function (header) {
      values.push(obj[header] !== undefined ? obj[header] : '')
    })

    return values
  },

  /**
   * Gets the column index for a header name
   * @param {string} sheetName - Name of the sheet
   * @param {string} headerName - Header column name
   * @returns {number} Column index (0-based) or -1 if not found
   */
  getColumnIndex: function (sheetName, headerName) {
    const sheet = this.getSheetByName(sheetName)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    return headers.indexOf(headerName)
  },

  /**
   * Generates a UUID for new records
   * @returns {string} UUID
   */
  generateUUID: function () {
    return Utilities.getUuid()
  },

  /**
   * Gets current timestamp in ISO format
   * @returns {string} ISO timestamp
   */
  getCurrentTimestamp: function () {
    return DateUtil.getCurrentTimestamp()
  },

  /**
   * Creates or updates a record by ID
   * @param {string} sheetName - Name of the sheet
   * @param {string} idColumn - Name of the ID column
   * @param {Object} data - Data object to save
   * @returns {Object} Saved data object
   */
  upsertRecord: function (sheetName, idColumn, data) {
    const idColumnIndex = this.getColumnIndex(sheetName, idColumn)

    if (idColumnIndex === -1) {
      throw new Error('ID column not found: ' + idColumn)
    }

    // Check if record exists
    const existingRow = this.findRowByColumn(sheetName, idColumnIndex, data[idColumn])

    if (existingRow) {
      // Update existing record
      const rowValues = this.objectToRow(sheetName, data)
      this.updateRow(sheetName, existingRow.rowIndex, rowValues)
    } else {
      // Insert new record
      const rowValues = this.objectToRow(sheetName, data)
      this.appendRow(sheetName, rowValues)
    }

    return data
  },

  /**
   * Gets all records as objects
   * @param {string} sheetName - Name of the sheet
   * @returns {Array<Object>} Array of record objects
   */
  getAllRecords: function (sheetName) {
    const sheet = this.getSheetByName(sheetName)
    const data = sheet.getDataRange().getValues()

    if (data.length === 0) {
      return []
    }

    const headers = data[0]
    const records = []

    // Start from row 1 (skip header)
    for (let i = 1; i < data.length; i++) {
      const record = {}
      headers.forEach(function (header, index) {
        record[header] = data[i][index]
      })
      records.push(record)
    }

    return records
  },
}
