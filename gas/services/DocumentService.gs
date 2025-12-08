/**
 * DocumentService.gs
 *
 * Business logic for document management operations.
 * Handles CRUD operations, document categorization, and expiry tracking.
 * Note: Actual file storage uses Google Drive integration.
 */

const DocumentService = {
  /**
   * Creates a new document record
   * @param {Object} data - Document data
   * @param {string} createdBy - Email of creator
   * @returns {Object} Created document
   */
  createDocument: function (data, createdBy) {
    SecurityInterceptor.validateRequiredFields(data, [
      'vehicleId',
      'documentType',
      'title',
      'documentUrl',
    ])

    // Validate document type
    this.validateDocumentType(data.documentType)

    // Validate vehicle exists
    const vehicle = VehicleService.getVehicleById(data.vehicleId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    const documentId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    const document = {
      documentId: documentId,
      vehicleId: data.vehicleId,
      documentType: data.documentType,
      title: SecurityInterceptor.sanitizeInput(data.title),
      description: data.description
        ? SecurityInterceptor.sanitizeInput(data.description)
        : '',
      documentUrl: data.documentUrl, // Google Drive file ID or URL
      fileName: data.fileName || '',
      fileSize: data.fileSize || null,
      mimeType: data.mimeType || '',
      issueDate: data.issueDate || '',
      expiryDate: data.expiryDate || '',
      documentNumber: data.documentNumber || '',
      issuedBy: data.issuedBy || '',
      tags: data.tags || '',
      notes: data.notes ? SecurityInterceptor.sanitizeInput(data.notes) : '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    DatabaseUtil.appendRow('documents', DatabaseUtil.objectToRow('documents', document))

    console.log('Document created:', {
      documentId: documentId,
      vehicleId: data.vehicleId,
      documentType: data.documentType,
    })

    return document
  },

  /**
   * Gets all documents with optional filters
   * @param {Object} filters - Filter options (vehicleId, documentType, expiring)
   * @returns {Array} Array of documents
   */
  getAllDocuments: function (filters) {
    filters = filters || {}
    let documents = DatabaseUtil.getAllRecords('documents')

    // Apply filters
    if (filters.vehicleId) {
      documents = documents.filter(function (doc) {
        return doc.vehicleId === filters.vehicleId
      })
    }

    if (filters.documentType) {
      documents = documents.filter(function (doc) {
        return doc.documentType === filters.documentType
      })
    }

    if (filters.expiring === true && filters.days) {
      const daysAhead = parseInt(filters.days)
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysAhead)
      const targetTime = targetDate.getTime()
      const now = new Date().getTime()

      documents = documents.filter(function (doc) {
        if (!doc.expiryDate) return false
        const expiryTime = new Date(doc.expiryDate).getTime()
        return expiryTime > now && expiryTime <= targetTime
      })
    }

    // Sort by creation date descending
    documents.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Enrich with computed fields
    const enrichedDocuments = documents.map(function (doc) {
      return this.enrichDocument(doc)
    }, this)

    return enrichedDocuments
  },

  /**
   * Gets a single document by ID
   * @param {string} documentId - Document ID
   * @returns {Object|null} Document or null
   */
  getDocumentById: function (documentId) {
    const columnIndex = DatabaseUtil.getColumnIndex('documents', 'documentId')
    const result = DatabaseUtil.findRowByColumn('documents', columnIndex, documentId)

    if (!result) return null

    return this.enrichDocument(result.data)
  },

  /**
   * Updates a document
   * @param {string} documentId - Document ID
   * @param {Object} updates - Fields to update
   * @param {string} changedBy - Email of user making changes
   * @returns {Object} Updated document
   */
  updateDocument: function (documentId, updates, changedBy) {
    const document = this.getDocumentById(documentId)

    if (!document) {
      throw new Error('Document not found')
    }

    // Update allowed fields
    if (updates.documentType !== undefined) {
      this.validateDocumentType(updates.documentType)
      document.documentType = updates.documentType
    }
    if (updates.title !== undefined) {
      document.title = SecurityInterceptor.sanitizeInput(updates.title)
    }
    if (updates.description !== undefined) {
      document.description = SecurityInterceptor.sanitizeInput(updates.description)
    }
    if (updates.documentUrl !== undefined) {
      document.documentUrl = updates.documentUrl
    }
    if (updates.fileName !== undefined) {
      document.fileName = updates.fileName
    }
    if (updates.fileSize !== undefined) {
      document.fileSize = updates.fileSize
    }
    if (updates.mimeType !== undefined) {
      document.mimeType = updates.mimeType
    }
    if (updates.issueDate !== undefined) {
      document.issueDate = updates.issueDate
    }
    if (updates.expiryDate !== undefined) {
      document.expiryDate = updates.expiryDate
    }
    if (updates.documentNumber !== undefined) {
      document.documentNumber = updates.documentNumber
    }
    if (updates.issuedBy !== undefined) {
      document.issuedBy = updates.issuedBy
    }
    if (updates.tags !== undefined) {
      document.tags = updates.tags
    }
    if (updates.notes !== undefined) {
      document.notes = SecurityInterceptor.sanitizeInput(updates.notes)
    }

    document.updatedAt = DatabaseUtil.getCurrentTimestamp()
    document.changedBy = changedBy

    DatabaseUtil.upsertRecord('documents', 'documentId', document)

    console.log('Document updated:', {
      documentId: documentId,
    })

    return this.enrichDocument(document)
  },

  /**
   * Deletes a document
   * @param {string} documentId - Document ID
   * @param {string} changedBy - Email of user deleting
   */
  deleteDocument: function (documentId, changedBy) {
    const document = this.getDocumentById(documentId)

    if (!document) {
      throw new Error('Document not found')
    }

    const columnIndex = DatabaseUtil.getColumnIndex('documents', 'documentId')
    const result = DatabaseUtil.findRowByColumn('documents', columnIndex, documentId)

    if (result) {
      DatabaseUtil.deleteRow('documents', result.rowIndex)
    }

    console.log('Document deleted:', {
      documentId: documentId,
      deletedBy: changedBy,
    })
  },

  /**
   * Gets documents by vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Array} Array of documents for the vehicle
   */
  getDocumentsByVehicle: function (vehicleId) {
    return this.getAllDocuments({ vehicleId: vehicleId })
  },

  /**
   * Gets expiring documents
   * @param {number} days - Number of days ahead to check (default 30)
   * @returns {Array} Array of documents expiring within the specified days
   */
  getExpiringDocuments: function (days) {
    days = days || 30
    return this.getAllDocuments({ expiring: true, days: days })
  },

  /**
   * Gets expired documents
   * @returns {Array} Array of expired documents
   */
  getExpiredDocuments: function () {
    const documents = DatabaseUtil.getAllRecords('documents')
    const now = new Date().getTime()

    const expiredDocs = documents.filter(function (doc) {
      if (!doc.expiryDate) return false
      return new Date(doc.expiryDate).getTime() < now
    })

    return expiredDocs.map(function (doc) {
      return this.enrichDocument(doc)
    }, this)
  },

  /**
   * Enriches document with computed fields
   * @param {Object} document - Document object
   * @returns {Object} Enriched document
   */
  enrichDocument: function (document) {
    const enriched = { ...document }

    if (document.expiryDate) {
      const expiryTime = new Date(document.expiryDate).getTime()
      const now = new Date().getTime()
      const daysUntilExpiry = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24))

      enriched.isExpired = expiryTime < now
      enriched.daysUntilExpiry = daysUntilExpiry
      enriched.isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30
    } else {
      enriched.isExpired = false
      enriched.daysUntilExpiry = null
      enriched.isExpiringSoon = false
    }

    return enriched
  },

  /**
   * Searches documents by title or tags
   * @param {string} query - Search query
   * @returns {Array} Array of matching documents
   */
  searchDocuments: function (query) {
    const documents = this.getAllDocuments()
    const searchQuery = query.toLowerCase()

    const results = documents.filter(function (doc) {
      return (
        doc.title.toLowerCase().indexOf(searchQuery) !== -1 ||
        (doc.description && doc.description.toLowerCase().indexOf(searchQuery) !== -1) ||
        (doc.tags && doc.tags.toLowerCase().indexOf(searchQuery) !== -1) ||
        (doc.documentNumber && doc.documentNumber.toLowerCase().indexOf(searchQuery) !== -1)
      )
    })

    return results
  },

  /**
   * Validates document type
   * @param {string} documentType - Document type
   */
  validateDocumentType: function (documentType) {
    const validTypes = [
      'REGISTRATION',
      'INSURANCE',
      'INSPECTION',
      'MAINTENANCE',
      'REPAIR',
      'MANUAL',
      'WARRANTY',
      'INVOICE',
      'PHOTO',
      'OTHER',
    ]

    if (validTypes.indexOf(documentType) === -1) {
      throw new Error('Invalid document type. Must be: ' + validTypes.join(', '))
    }
  },
}
