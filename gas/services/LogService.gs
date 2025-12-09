/**
 * LogService.gs
 *
 * Service for handling application logging to Google Drive files.
 * Features daily and size-based log file rolling, and emailing of logs.
 *
 * Per constitution: Encapsulated service for a core concern (logging).
 */

const LogService = {
  LOG_FOLDER_ID_KEY: 'LOG_FOLDER_ID',
  MAX_FILE_SIZE_BYTES: 0.5 * 1024 * 1024, // 512 KiB
  LOG_EMAIL_RECIPIENT: 'softropicblessed@gmail.com',

  /**
   * Logs an error message to the appropriate log file in Google Drive.
   * @param {Error|string} error - The error object or message string to log.
   */
  logError: function (error) {
    const lock = LockService.getScriptLock()
    if (!lock.tryLock(15000)) {
      // Wait up to 15 seconds for the lock
      // If we can't get the lock, we can't write to the file, so just return silently
      return
    }

    try {
      const logFile = this.getCurrentLogFile()
      const timestamp = new Date().toISOString()
      let logMessage = `[${timestamp}], REQUEST_CONTEXT: ${JSON.stringify(REQUEST_CONTEXT)}, ERROR: `

      if (error instanceof Error) {
        logMessage += `${error.message}\nStack: ${error.stack}`
      } else if (typeof error === 'object') {
        logMessage += JSON.stringify(error, null, 2)
      } else {
        logMessage += error
      }

      // Append the new message to the file
      const currentContent = logFile.getBlob().getDataAsString()
      const newContent = currentContent + `\n\n${logMessage}`
      logFile.setContent(newContent)
    } catch (e) {
      // If logging itself fails, fall back to console.error (last resort)
      console.error('LogService: FATAL - Failed to write to log file during error logging:', e)
    } finally {
      lock.releaseLock()
    }
  },

  /**
   * Logs a general trace message to the appropriate log file in Google Drive.
   * @param {string} message - The message string to log.
   */
  trace: function (message) {
    const lock = LockService.getScriptLock()
    if (!lock.tryLock(15000)) {
      // If we can't get the lock, we can't write to the file, so just return silently
      return
    }

    try {
      const logFile = this.getCurrentLogFile()
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}], REQUEST_CONTEXT: ${JSON.stringify(REQUEST_CONTEXT)}, TRACE: ${message}`

      const currentContent = logFile.getBlob().getDataAsString()
      const newContent = currentContent + `\n\n${logMessage}`
      logFile.setContent(newContent)
    } catch (e) {
      // If logging itself fails, fall back to console.error (last resort)
      console.error('LogService: FATAL - Failed to write trace message to log file:', e)
    } finally {
      lock.releaseLock()
    }
  },

  /**
   * Gets the Google Drive folder where logs should be stored.
   * @returns {GoogleAppsScript.Drive.Folder} The log folder.
   * @throws {Error} If the LOG_FOLDER_ID script property is not set or the folder is not found.
   */
  getLogFolder: function () {
    const props = PropertiesService.getScriptProperties()
    const folderId = props.getProperty(this.LOG_FOLDER_ID_KEY)
    if (!folderId) {
      throw new Error('LogService: LOG_FOLDER_ID script property is not set.')
    }

    try {
      return DriveApp.getFolderById(folderId)
    } catch (e) {
      throw new Error(
        `LogService: Could not access log folder with ID: ${folderId}. Please ensure it exists and you have access. Original error: ${e.message}`,
      )
    }
  },

  /**
   * Gets the current log file to write to, handling daily and size-based rolling.
   * @returns {GoogleAppsScript.Drive.File} The file to write to.
   */
  getCurrentLogFile: function () {
    const logFolder = this.getLogFolder()
    const today = new Date()
    const dateString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd')
    const baseFileName = `${dateString}.log`

    let file
    let fileIndex = 0
    let fileName = baseFileName

    while (true) {
      const files = logFolder.getFilesByName(fileName)

      if (files.hasNext()) {
        file = files.next()
        if (file.getSize() < this.MAX_FILE_SIZE_BYTES) {
          return file // Found a file with space, return it.
        } else {
          // File is too large, increment index and check for the next part.
          fileIndex++
          fileName = `${dateString}-${fileIndex}.log`
        }
      } else {
        // No file found with the current name, so create it.
        return logFolder.createFile(
          fileName,
          'Log file created on ' + new Date(),
          MimeType.PLAIN_TEXT,
        )
      }
    }
  },

  /**
   * Finds today's log files and emails them to the configured recipient.
   * Intended to be run by a daily time-based trigger.
   */
  emailDailyLogs: function () {
    try {
      const logFolder = this.getLogFolder()
      const today = new Date()
      const dateString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd')

      const files = logFolder.getFiles()
      const attachments = []
      while (files.hasNext()) {
        const file = files.next()
        if (file.getName().startsWith(dateString)) {
          attachments.push(file.getAs(MimeType.PLAIN_TEXT))
        }
      }

      if (attachments.length > 0) {
        MailApp.sendEmail({
          to: this.LOG_EMAIL_RECIPIENT,
          subject: `Daily Application Logs - ${dateString}`,
          body: `Please find the attached application logs for ${dateString}`,
          attachments: attachments,
        })
      }
    } catch (e) {
      // this.logError(new Error(`Failed to email daily logs: ${e.message}`)); // Commented out to prevent recursion
      console.error('LogService: Failed to email daily logs:', e)
    }
  },
}
