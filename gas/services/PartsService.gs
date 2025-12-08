/**
 * PartsService.gs
 *
 * Business logic for parts inventory operations.
 * Handles CRUD operations, stock management, and low stock alerts.
 */

const PartsService = {
  /**
   * Creates a new part in inventory
   * @param {Object} data - Part data
   * @param {string} createdBy - Email of creator
   * @returns {Object} Created part
   */
  createPart: function (data, createdBy) {
    SecurityInterceptor.validateRequiredFields(data, [
      'partNumber',
      'name',
      'category',
      'quantityInStock',
      'unitPrice',
    ])

    // Validate category
    this.validatePartCategory(data.category)

    // Validate quantities
    if (data.quantityInStock < 0) {
      throw new Error('Quantity in stock cannot be negative')
    }

    if (data.reorderLevel !== undefined && data.reorderLevel !== null && data.reorderLevel < 0) {
      throw new Error('Reorder level cannot be negative')
    }

    if (data.unitPrice <= 0) {
      throw new Error('Unit price must be greater than 0')
    }

    // Check if part number already exists
    const existingPart = this.getPartByPartNumber(data.partNumber)
    if (existingPart) {
      throw new Error('Part number already exists')
    }

    const partId = DatabaseUtil.generateUUID()
    const timestamp = DatabaseUtil.getCurrentTimestamp()

    const part = {
      partId: partId,
      partNumber: data.partNumber.toUpperCase(),
      name: SecurityInterceptor.sanitizeInput(data.name),
      category: data.category,
      description: data.description
        ? SecurityInterceptor.sanitizeInput(data.description)
        : '',
      manufacturer: data.manufacturer || '',
      quantityInStock: parseInt(data.quantityInStock),
      reorderLevel: data.reorderLevel !== undefined ? parseInt(data.reorderLevel) : 10,
      unitPrice: parseFloat(data.unitPrice),
      location: data.location || '',
      supplier: data.supplier || '',
      supplierPartNumber: data.supplierPartNumber || '',
      notes: data.notes ? SecurityInterceptor.sanitizeInput(data.notes) : '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: createdBy,
      changedBy: createdBy,
    }

    DatabaseUtil.appendRow('parts', DatabaseUtil.objectToRow('parts', part))

    console.log('Part created:', {
      partId: partId,
      partNumber: data.partNumber,
      quantityInStock: data.quantityInStock,
    })

    return part
  },

  /**
   * Gets all parts with optional filters
   * @param {Object} filters - Filter options (category, lowStock)
   * @returns {Array} Array of parts
   */
  getAllParts: function (filters) {
    filters = filters || {}
    let parts = DatabaseUtil.getAllRecords('parts')

    // Apply filters
    if (filters.category) {
      parts = parts.filter(function (part) {
        return part.category === filters.category
      })
    }

    if (filters.lowStock === true) {
      parts = parts.filter(function (part) {
        return part.quantityInStock <= part.reorderLevel
      })
    }

    // Sort by name
    parts.sort(function (a, b) {
      return a.name.localeCompare(b.name)
    })

    // Enrich with calculated fields
    const enrichedParts = parts.map(function (part) {
      return {
        ...part,
        isLowStock: part.quantityInStock <= part.reorderLevel,
        totalValue: Math.round(part.quantityInStock * part.unitPrice * 100) / 100,
      }
    })

    return enrichedParts
  },

  /**
   * Gets a single part by ID
   * @param {string} partId - Part ID
   * @returns {Object|null} Part or null
   */
  getPartById: function (partId) {
    const columnIndex = DatabaseUtil.getColumnIndex('parts', 'partId')
    const result = DatabaseUtil.findRowByColumn('parts', columnIndex, partId)

    if (!result) return null

    const part = result.data
    part.isLowStock = part.quantityInStock <= part.reorderLevel
    part.totalValue = Math.round(part.quantityInStock * part.unitPrice * 100) / 100

    return part
  },

  /**
   * Gets a part by part number
   * @param {string} partNumber - Part number
   * @returns {Object|null} Part or null
   */
  getPartByPartNumber: function (partNumber) {
    const columnIndex = DatabaseUtil.getColumnIndex('parts', 'partNumber')
    const result = DatabaseUtil.findRowByColumn('parts', columnIndex, partNumber.toUpperCase())

    return result ? result.data : null
  },

  /**
   * Updates a part
   * @param {string} partId - Part ID
   * @param {Object} updates - Fields to update
   * @param {string} changedBy - Email of user making changes
   * @returns {Object} Updated part
   */
  updatePart: function (partId, updates, changedBy) {
    const part = this.getPartById(partId)

    if (!part) {
      throw new Error('Part not found')
    }

    // Update allowed fields
    if (updates.partNumber !== undefined) {
      // Check if new part number conflicts with existing
      const existingPart = this.getPartByPartNumber(updates.partNumber)
      if (existingPart && existingPart.partId !== partId) {
        throw new Error('Part number already exists')
      }
      part.partNumber = updates.partNumber.toUpperCase()
    }
    if (updates.name !== undefined) {
      part.name = SecurityInterceptor.sanitizeInput(updates.name)
    }
    if (updates.category !== undefined) {
      this.validatePartCategory(updates.category)
      part.category = updates.category
    }
    if (updates.description !== undefined) {
      part.description = SecurityInterceptor.sanitizeInput(updates.description)
    }
    if (updates.manufacturer !== undefined) {
      part.manufacturer = updates.manufacturer
    }
    if (updates.quantityInStock !== undefined) {
      if (updates.quantityInStock < 0) {
        throw new Error('Quantity in stock cannot be negative')
      }
      part.quantityInStock = parseInt(updates.quantityInStock)
    }
    if (updates.reorderLevel !== undefined) {
      if (updates.reorderLevel < 0) {
        throw new Error('Reorder level cannot be negative')
      }
      part.reorderLevel = parseInt(updates.reorderLevel)
    }
    if (updates.unitPrice !== undefined) {
      if (updates.unitPrice <= 0) {
        throw new Error('Unit price must be greater than 0')
      }
      part.unitPrice = parseFloat(updates.unitPrice)
    }
    if (updates.location !== undefined) {
      part.location = updates.location
    }
    if (updates.supplier !== undefined) {
      part.supplier = updates.supplier
    }
    if (updates.supplierPartNumber !== undefined) {
      part.supplierPartNumber = updates.supplierPartNumber
    }
    if (updates.notes !== undefined) {
      part.notes = SecurityInterceptor.sanitizeInput(updates.notes)
    }

    part.updatedAt = DatabaseUtil.getCurrentTimestamp()
    part.changedBy = changedBy

    DatabaseUtil.upsertRecord('parts', 'partId', part)

    console.log('Part updated:', {
      partId: partId,
      quantityInStock: part.quantityInStock,
    })

    return part
  },

  /**
   * Deletes a part
   * @param {string} partId - Part ID
   * @param {string} changedBy - Email of user deleting
   */
  deletePart: function (partId, changedBy) {
    const part = this.getPartById(partId)

    if (!part) {
      throw new Error('Part not found')
    }

    const columnIndex = DatabaseUtil.getColumnIndex('parts', 'partId')
    const result = DatabaseUtil.findRowByColumn('parts', columnIndex, partId)

    if (result) {
      DatabaseUtil.deleteRow('parts', result.rowIndex)
    }

    console.log('Part deleted:', {
      partId: partId,
      deletedBy: changedBy,
    })
  },

  /**
   * Adjusts part quantity (add or remove stock)
   * @param {string} partId - Part ID
   * @param {number} quantity - Quantity to add (positive) or remove (negative)
   * @param {string} reason - Reason for adjustment
   * @param {string} changedBy - Email of user making adjustment
   * @returns {Object} Updated part
   */
  adjustQuantity: function (partId, quantity, reason, changedBy) {
    const part = this.getPartById(partId)

    if (!part) {
      throw new Error('Part not found')
    }

    const newQuantity = part.quantityInStock + quantity

    if (newQuantity < 0) {
      throw new Error('Insufficient stock. Cannot reduce quantity below 0.')
    }

    part.quantityInStock = newQuantity
    part.updatedAt = DatabaseUtil.getCurrentTimestamp()
    part.changedBy = changedBy

    DatabaseUtil.upsertRecord('parts', 'partId', part)

    // Log the adjustment
    console.log('Part quantity adjusted:', {
      partId: partId,
      adjustment: quantity,
      newQuantity: newQuantity,
      reason: reason,
      changedBy: changedBy,
    })

    return part
  },

  /**
   * Gets parts with low stock (at or below reorder level)
   * @returns {Array} Array of low stock parts
   */
  getLowStockParts: function () {
    return this.getAllParts({ lowStock: true })
  },

  /**
   * Gets inventory value summary
   * @returns {Object} Inventory summary with total value by category
   */
  getInventorySummary: function () {
    const parts = this.getAllParts()

    const summary = {
      totalParts: parts.length,
      totalValue: 0,
      lowStockCount: 0,
      byCategory: {
        ENGINE: { count: 0, value: 0 },
        TRANSMISSION: { count: 0, value: 0 },
        BRAKES: { count: 0, value: 0 },
        SUSPENSION: { count: 0, value: 0 },
        ELECTRICAL: { count: 0, value: 0 },
        BODY: { count: 0, value: 0 },
        INTERIOR: { count: 0, value: 0 },
        FILTERS: { count: 0, value: 0 },
        FLUIDS: { count: 0, value: 0 },
        TIRES: { count: 0, value: 0 },
        OTHER: { count: 0, value: 0 },
      },
    }

    parts.forEach(function (part) {
      const value = part.totalValue
      summary.totalValue += value
      summary.byCategory[part.category].count += 1
      summary.byCategory[part.category].value += value

      if (part.isLowStock) {
        summary.lowStockCount += 1
      }
    })

    // Round values
    summary.totalValue = Math.round(summary.totalValue * 100) / 100
    Object.keys(summary.byCategory).forEach(function (category) {
      summary.byCategory[category].value =
        Math.round(summary.byCategory[category].value * 100) / 100
    })

    return summary
  },

  /**
   * Searches parts by name or part number
   * @param {string} query - Search query
   * @returns {Array} Array of matching parts
   */
  searchParts: function (query) {
    const parts = this.getAllParts()
    const searchQuery = query.toLowerCase()

    const results = parts.filter(function (part) {
      return (
        part.name.toLowerCase().indexOf(searchQuery) !== -1 ||
        part.partNumber.toLowerCase().indexOf(searchQuery) !== -1 ||
        (part.description && part.description.toLowerCase().indexOf(searchQuery) !== -1)
      )
    })

    return results
  },

  /**
   * Validates part category
   * @param {string} category - Part category
   */
  validatePartCategory: function (category) {
    const validCategories = [
      'ENGINE',
      'TRANSMISSION',
      'BRAKES',
      'SUSPENSION',
      'ELECTRICAL',
      'BODY',
      'INTERIOR',
      'FILTERS',
      'FLUIDS',
      'TIRES',
      'OTHER',
    ]

    if (validCategories.indexOf(category) === -1) {
      throw new Error('Invalid part category. Must be: ' + validCategories.join(', '))
    }
  },
}
