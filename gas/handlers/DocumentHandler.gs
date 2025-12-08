/**
 * DocumentHandler.gs
 *
 * HTTP handler for document management endpoints.
 * Routes requests to DocumentService and formats responses.
 */

const DocumentHandler = {
  /**
   * Creates a new document
   * POST document.create
   */
  createDocument: function (context) {
    const data = context.payload
    const document = DocumentService.createDocument(data, context.user.email)

    return {
      status: 200,
      msgKey: 'document.created',
      message: 'Document created successfully',
      data: document,
    }
  },

  /**
   * Gets all documents with optional filters
   * POST document.getAll
   */
  getAllDocuments: function (context) {
    const filters = context.payload || {}
    const documents = DocumentService.getAllDocuments(filters)

    return {
      status: 200,
      msgKey: 'document.list',
      message: 'Documents retrieved successfully',
      data: documents,
    }
  },

  /**
   * Gets a single document by ID
   * POST document.getById
   */
  getDocumentById: function (context) {
    const documentId = context.payload.documentId

    if (!documentId) {
      throw new Error('documentId is required')
    }

    const document = DocumentService.getDocumentById(documentId)

    if (!document) {
      return {
        status: 404,
        msgKey: 'document.notFound',
        message: 'Document not found',
        data: null,
      }
    }

    return {
      status: 200,
      msgKey: 'document.details',
      message: 'Document retrieved successfully',
      data: document,
    }
  },

  /**
   * Updates a document
   * POST document.update
   */
  updateDocument: function (context) {
    const documentId = context.payload.documentId
    const updates = context.payload

    if (!documentId) {
      throw new Error('documentId is required')
    }

    const document = DocumentService.updateDocument(documentId, updates, context.user.email)

    return {
      status: 200,
      msgKey: 'document.updated',
      message: 'Document updated successfully',
      data: document,
    }
  },

  /**
   * Deletes a document
   * POST document.delete
   */
  deleteDocument: function (context) {
    const documentId = context.payload.documentId

    if (!documentId) {
      throw new Error('documentId is required')
    }

    DocumentService.deleteDocument(documentId, context.user.email)

    return {
      status: 200,
      msgKey: 'document.deleted',
      message: 'Document deleted successfully',
      data: null,
    }
  },

  /**
   * Gets documents by vehicle
   * POST document.byVehicle
   */
  getDocumentsByVehicle: function (context) {
    const vehicleId = context.payload.vehicleId

    if (!vehicleId) {
      throw new Error('vehicleId is required')
    }

    const documents = DocumentService.getDocumentsByVehicle(vehicleId)

    return {
      status: 200,
      msgKey: 'document.byVehicle',
      message: 'Vehicle documents retrieved successfully',
      data: documents,
    }
  },

  /**
   * Gets expiring documents
   * POST document.expiring
   */
  getExpiringDocuments: function (context) {
    const days = context.payload.days || 30
    const documents = DocumentService.getExpiringDocuments(days)

    return {
      status: 200,
      msgKey: 'document.expiring',
      message: 'Expiring documents retrieved successfully',
      data: documents,
    }
  },

  /**
   * Gets expired documents
   * POST document.expired
   */
  getExpiredDocuments: function (context) {
    const documents = DocumentService.getExpiredDocuments()

    return {
      status: 200,
      msgKey: 'document.expired',
      message: 'Expired documents retrieved successfully',
      data: documents,
    }
  },

  /**
   * Searches documents
   * POST document.search
   */
  searchDocuments: function (context) {
    const query = context.payload.query

    if (!query) {
      throw new Error('query is required')
    }

    const documents = DocumentService.searchDocuments(query)

    return {
      status: 200,
      msgKey: 'document.search',
      message: 'Search results retrieved successfully',
      data: documents,
    }
  },
}
