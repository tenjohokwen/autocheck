/**
 * PartsHandler.gs
 *
 * HTTP handler for parts inventory endpoints.
 * Routes requests to PartsService and formats responses.
 */

const PartsHandler = {
  /**
   * Creates a new part
   * POST parts.create
   * Fleet Manager only
   */
  createPart: function (context) {
    RoleValidator.requireFleetManager(context.user)

    const data = context.data
    const part = PartsService.createPart(data, context.user.email)

    return {
      status: 200,
      msgKey: 'parts.created',
      message: 'Part created successfully',
      data: part,
    }
  },

  /**
   * Gets all parts with optional filters
   * POST parts.getAll
   */
  getAllParts: function (context) {
    const filters = context.data || {}
    const parts = PartsService.getAllParts(filters)

    return {
      status: 200,
      msgKey: 'parts.list',
      message: 'Parts retrieved successfully',
      data: parts,
    }
  },

  /**
   * Gets a single part by ID
   * POST parts.getById
   */
  getPartById: function (context) {
    const partId = context.data.partId

    if (!partId) {
      throw new Error('partId is required')
    }

    const part = PartsService.getPartById(partId)

    if (!part) {
      return {
        status: 404,
        msgKey: 'parts.notFound',
        message: 'Part not found',
        data: null,
      }
    }

    return {
      status: 200,
      msgKey: 'parts.details',
      message: 'Part retrieved successfully',
      data: part,
    }
  },

  /**
   * Updates a part
   * POST parts.update
   * Fleet Manager only
   */
  updatePart: function (context) {
    RoleValidator.requireFleetManager(context.user)

    const partId = context.data.partId
    const updates = context.data

    if (!partId) {
      throw new Error('partId is required')
    }

    const part = PartsService.updatePart(partId, updates, context.user.email)

    return {
      status: 200,
      msgKey: 'parts.updated',
      message: 'Part updated successfully',
      data: part,
    }
  },

  /**
   * Deletes a part
   * POST parts.delete
   * Fleet Manager only
   */
  deletePart: function (context) {
    RoleValidator.requireFleetManager(context.user)

    const partId = context.data.partId

    if (!partId) {
      throw new Error('partId is required')
    }

    PartsService.deletePart(partId, context.user.email)

    return {
      status: 200,
      msgKey: 'parts.deleted',
      message: 'Part deleted successfully',
      data: null,
    }
  },

  /**
   * Adjusts part quantity
   * POST parts.adjustQuantity
   */
  adjustQuantity: function (context) {
    const partId = context.data.partId
    const quantity = context.data.quantity
    const reason = context.data.reason || 'Manual adjustment'

    if (!partId) {
      throw new Error('partId is required')
    }

    if (quantity === undefined || quantity === null) {
      throw new Error('quantity is required')
    }

    const part = PartsService.adjustQuantity(
      partId,
      parseInt(quantity),
      reason,
      context.user.email
    )

    return {
      status: 200,
      msgKey: 'parts.quantityAdjusted',
      message: 'Part quantity adjusted successfully',
      data: part,
    }
  },

  /**
   * Gets low stock parts
   * POST parts.lowStock
   */
  getLowStockParts: function (context) {
    const parts = PartsService.getLowStockParts()

    return {
      status: 200,
      msgKey: 'parts.lowStock',
      message: 'Low stock parts retrieved successfully',
      data: parts,
    }
  },

  /**
   * Gets inventory summary
   * POST parts.summary
   */
  getInventorySummary: function (context) {
    const summary = PartsService.getInventorySummary()

    return {
      status: 200,
      msgKey: 'parts.summary',
      message: 'Inventory summary retrieved successfully',
      data: summary,
    }
  },

  /**
   * Searches parts
   * POST parts.search
   */
  searchParts: function (context) {
    const query = context.data.query

    if (!query) {
      throw new Error('query is required')
    }

    const parts = PartsService.searchParts(query)

    return {
      status: 200,
      msgKey: 'parts.search',
      message: 'Search results retrieved successfully',
      data: parts,
    }
  },
}

// Method aliases for Router compatibility
PartsHandler.create = PartsHandler.createPart
PartsHandler.getAll = PartsHandler.getAllParts
PartsHandler.getById = PartsHandler.getPartById
PartsHandler.update = PartsHandler.updatePart
PartsHandler.delete = PartsHandler.deletePart
PartsHandler.adjustQuantity = PartsHandler.adjustQuantity
PartsHandler.lowStock = PartsHandler.getLowStockParts
PartsHandler.summary = PartsHandler.getInventorySummary
PartsHandler.search = PartsHandler.searchParts
