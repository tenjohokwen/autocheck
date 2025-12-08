# Research Findings: Vehicle Maintenance Management System

## 1. Google Sheets Schema Design

**Decision**: Multi-sheet normalized design with indexed lookup columns and row-based partitioning strategy.

**Rationale**:
- Google Sheets has a 5 million cell limit per spreadsheet, and 10 million cells per account
- With 1000+ vehicles generating maintenance records, fuel entries, and expenses, a single-sheet approach would hit limits quickly
- Normalized design reduces data redundancy and keeps cell count manageable
- Row-based queries in Apps Script are more performant than column-based when using `getValues()` and array operations

**Implementation Notes**:

Sheet Structure:
```
1. Vehicles Sheet (columns A-P, ~1000 rows)
   - A: vehicle_id (unique, indexed)
   - B: vin
   - C: make
   - D: model
   - E: year
   - F: license_plate
   - G: odometer_current
   - H: acquisition_date
   - I: status (active/retired/maintenance)
   - J: assigned_to
   - K: fuel_type
   - L: tank_capacity
   - M: department
   - N: archived (boolean)
   - O: created_at
   - P: updated_at

2. Maintenance_Records Sheet (columns A-N, estimate 10k-50k rows)
   - A: record_id (unique)
   - B: vehicle_id (foreign key)
   - C: maintenance_type
   - D: scheduled_date
   - E: completed_date
   - F: odometer_at_service
   - G: cost
   - H: technician_id
   - I: status (pending/completed/cancelled)
   - J: notes
   - K: recurring_pattern (null or JSON)
   - L: parent_record_id (for recurring)
   - M: archived
   - N: created_at

3. Fuel_Entries Sheet (columns A-M, estimate 20k-100k rows)
   - A: entry_id
   - B: vehicle_id
   - C: date
   - D: odometer
   - E: quantity_liters
   - F: cost_per_liter
   - G: total_cost
   - H: fuel_type
   - I: location
   - J: filled_to_full (boolean)
   - K: recorded_by
   - L: archived
   - M: created_at

4. Expenses Sheet (columns A-L)
5. Documents Sheet (columns A-K)
6. Users Sheet (columns A-I)
7. Lookup_Cache Sheet (for query optimization)
```

Query Performance Strategies:
```javascript
// Use batch operations with getValues() instead of individual cell reads
function getVehicleMaintenanceRecords(vehicleId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Maintenance_Records');
  const data = sheet.getDataRange().getValues();

  // Skip header row, filter in memory (faster than QUERY for <10k rows)
  return data.slice(1).filter(row =>
    row[1] === vehicleId && !row[12] // vehicle_id match, not archived
  ).map(row => ({
    record_id: row[0],
    vehicle_id: row[1],
    maintenance_type: row[2],
    scheduled_date: row[3],
    completed_date: row[4],
    odometer_at_service: row[5],
    cost: row[6],
    technician_id: row[7],
    status: row[8],
    notes: row[9]
  }));
}

// For larger datasets, use QUERY formula in Lookup_Cache sheet
// =QUERY(Maintenance_Records!A:N, "SELECT * WHERE B = '"&A2&"' AND M = FALSE")
```

Indexing Strategy:
```javascript
// Create a lookup cache that's refreshed on data changes
function rebuildLookupCache() {
  const cache = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Lookup_Cache');
  cache.clear();

  // Build vehicle_id -> row_number index for O(1) lookups
  const vehicles = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles').getDataRange().getValues();

  const index = vehicles.slice(1).map((row, idx) => [
    row[0], // vehicle_id
    idx + 2  // row number (1-indexed + header)
  ]);

  cache.getRange(1, 1, index.length, 2).setValues(index);
}
```

**Alternatives Considered**:
- **Single denormalized sheet**: Rejected due to cell limit concerns and update complexity
- **External database (Firebase/MySQL)**: Rejected to maintain Google Workspace ecosystem and avoid additional infrastructure costs
- **Multiple spreadsheets**: Rejected due to cross-spreadsheet query complexity and quota issues

---

## 2. Recurring Maintenance Generation

**Decision**: Hybrid time-driven and on-demand trigger system with next occurrence calculation stored in maintenance records.

**Rationale**:
- Google Apps Script time-driven triggers can run at most once per hour
- Mileage-based triggers cannot be time-driven and must be checked on odometer updates
- Storing next occurrence calculation reduces repeated computation
- Batch processing during nightly trigger handles both time and mileage-based schedules

**Implementation Notes**:

Time-Driven Trigger Setup:
```javascript
// Run this once to set up the daily trigger
function setupRecurringMaintenanceTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateRecurringMaintenance') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create daily trigger at 2 AM
  ScriptApp.newTrigger('generateRecurringMaintenance')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}
```

Recurring Pattern Structure:
```javascript
// Stored as JSON in recurring_pattern column
{
  "type": "time_based", // or "mileage_based" or "both"
  "time_interval": {
    "value": 6,
    "unit": "months" // days, weeks, months, years
  },
  "mileage_interval": {
    "value": 5000,
    "unit": "km" // or "miles"
  },
  "trigger_rule": "whichever_comes_first", // or "both_required"
  "active": true
}
```

Generation Algorithm:
```javascript
function generateRecurringMaintenance() {
  const maintenanceSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Maintenance_Records');
  const vehiclesSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles');

  const maintenanceData = maintenanceSheet.getDataRange().getValues();
  const vehiclesData = vehiclesSheet.getDataRange().getValues();

  // Build vehicle lookup map
  const vehicleMap = {};
  vehiclesData.slice(1).forEach(row => {
    vehicleMap[row[0]] = {
      odometer_current: row[6],
      status: row[8],
      archived: row[13]
    };
  });

  const newRecords = [];
  const today = new Date();

  maintenanceData.slice(1).forEach(row => {
    const recurringPattern = row[10] ? JSON.parse(row[10]) : null;
    const status = row[8];
    const vehicleId = row[1];
    const completedDate = row[4];
    const odometerAtService = row[5];

    // Only process completed recurring maintenance for active vehicles
    if (!recurringPattern || !recurringPattern.active ||
        status !== 'completed' || !vehicleMap[vehicleId] ||
        vehicleMap[vehicleId].archived) {
      return;
    }

    const vehicle = vehicleMap[vehicleId];
    let shouldGenerate = false;
    let scheduledDate = null;

    // Check time-based trigger
    if (recurringPattern.type === 'time_based' || recurringPattern.type === 'both') {
      const nextDate = calculateNextDate(completedDate, recurringPattern.time_interval);

      // Generate if next date is within 7 days or past due
      if (daysDifference(today, nextDate) <= 7) {
        shouldGenerate = true;
        scheduledDate = nextDate;
      }
    }

    // Check mileage-based trigger
    if (recurringPattern.type === 'mileage_based' || recurringPattern.type === 'both') {
      const nextOdometer = odometerAtService + recurringPattern.mileage_interval.value;
      const currentOdometer = vehicle.odometer_current;

      // Generate if within 10% of target mileage
      if (currentOdometer >= nextOdometer * 0.9) {
        if (recurringPattern.trigger_rule === 'whichever_comes_first') {
          shouldGenerate = true;
        } else if (recurringPattern.type === 'both' && scheduledDate) {
          shouldGenerate = true;
        }

        if (!scheduledDate) {
          // Estimate date based on average daily mileage
          scheduledDate = estimateDateFromOdometer(currentOdometer, nextOdometer);
        }
      }
    }

    if (shouldGenerate) {
      // Check if record already exists for this vehicle/type/date range
      const duplicateExists = maintenanceData.some(existingRow =>
        existingRow[1] === vehicleId &&
        existingRow[2] === row[2] && // same maintenance_type
        existingRow[11] === row[0] && // same parent_record_id
        existingRow[8] === 'pending' &&
        Math.abs(daysDifference(existingRow[3], scheduledDate)) <= 7
      );

      if (!duplicateExists) {
        newRecords.push([
          Utilities.getUuid(), // record_id
          vehicleId,
          row[2], // maintenance_type
          scheduledDate,
          null, // completed_date
          null, // odometer_at_service
          row[6], // estimated cost
          null, // technician_id
          'pending',
          `Auto-generated from recurring schedule`,
          row[10], // copy recurring_pattern
          row[0], // parent_record_id
          false, // archived
          new Date() // created_at
        ]);
      }
    }
  });

  // Batch insert new records
  if (newRecords.length > 0) {
    const lastRow = maintenanceSheet.getLastRow();
    maintenanceSheet.getRange(lastRow + 1, 1, newRecords.length, 14)
      .setValues(newRecords);

    Logger.log(`Generated ${newRecords.length} recurring maintenance records`);
  }
}

function calculateNextDate(fromDate, interval) {
  const date = new Date(fromDate);
  switch (interval.unit) {
    case 'days':
      date.setDate(date.getDate() + interval.value);
      break;
    case 'weeks':
      date.setDate(date.getDate() + (interval.value * 7));
      break;
    case 'months':
      date.setMonth(date.getMonth() + interval.value);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + interval.value);
      break;
  }
  return date;
}

function daysDifference(date1, date2) {
  const diff = Math.abs(date2 - date1);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function estimateDateFromOdometer(currentOdometer, targetOdometer) {
  // Simple estimation: assume current average of 50km/day
  const daysToTarget = (targetOdometer - currentOdometer) / 50;
  const date = new Date();
  date.setDate(date.getDate() + daysToTarget);
  return date;
}
```

On-Demand Mileage Check:
```javascript
// Called when odometer is updated via API
function checkMileageTriggersForVehicle(vehicleId, newOdometer) {
  const maintenanceSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Maintenance_Records');
  const data = maintenanceSheet.getDataRange().getValues();

  const pendingMileageTriggers = data.slice(1).filter(row => {
    const pattern = row[10] ? JSON.parse(row[10]) : null;
    return pattern &&
           (pattern.type === 'mileage_based' || pattern.type === 'both') &&
           row[1] === vehicleId &&
           row[8] === 'completed' &&
           pattern.active;
  });

  // Generate if needed
  pendingMileageTriggers.forEach(row => {
    // Similar logic as generateRecurringMaintenance but for single vehicle
  });
}
```

**Alternatives Considered**:
- **Minute-based triggers**: Rejected due to Google Apps Script quota limits (90 minutes/day for consumer accounts)
- **Real-time triggers on sheet edit**: Rejected due to performance impact on UI and complexity
- **External cron service**: Rejected to maintain single-platform architecture

---

## 3. Document Upload to Google Drive

**Decision**: Hierarchical folder structure with per-vehicle folders, chunked upload for large files, and quota-aware retry logic.

**Rationale**:
- Google Drive API provides robust file management within Google Workspace
- Apps Script has 10MB limit for file uploads via `UrlFetchApp`, but can use `DriveApp` for direct uploads
- Hierarchical structure enables permissions management at folder level
- Chunked uploads prevent memory issues with large files

**Implementation Notes**:

Folder Structure:
```
Fleet Documents (root folder)
├── Vehicles/
│   ├── {vehicle_id_1}/
│   │   ├── Registration/
│   │   ├── Insurance/
│   │   ├── Maintenance/
│   │   └── Inspection/
│   ├── {vehicle_id_2}/
│   └── ...
├── General Documents/
│   ├── Policies/
│   └── Forms/
└── Archived/
```

Google Apps Script Upload Handler:
```javascript
// doPost endpoint for file uploads
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'uploadDocument') {
      return handleDocumentUpload(payload);
    }

    return createResponse(400, { error: 'Invalid action' });
  } catch (error) {
    Logger.log('Error in doPost: ' + error);
    return createResponse(500, { error: error.toString() });
  }
}

function handleDocumentUpload(payload) {
  const { vehicleId, documentType, fileName, fileData, mimeType } = payload;

  // Validate file size (10MB limit for Apps Script)
  const fileSize = Math.ceil(fileData.length * 0.75); // Base64 decode estimate
  if (fileSize > 10 * 1024 * 1024) {
    return createResponse(413, {
      error: 'File size exceeds 10MB limit. Please upload smaller files.'
    });
  }

  // Get or create vehicle folder structure
  const vehicleFolder = getOrCreateVehicleFolder(vehicleId);
  const documentTypeFolder = getOrCreateFolder(vehicleFolder, documentType);

  // Decode base64 and create file
  const blob = Utilities.newBlob(
    Utilities.base64Decode(fileData),
    mimeType,
    fileName
  );

  const file = documentTypeFolder.createFile(blob);

  // Set file permissions (view only for technicians, edit for managers)
  const fileId = file.getId();
  setDocumentPermissions(fileId, vehicleId);

  // Record in Documents sheet
  const documentId = recordDocument({
    vehicle_id: vehicleId,
    document_type: documentType,
    file_name: fileName,
    file_id: fileId,
    file_url: file.getUrl(),
    uploaded_by: payload.uploadedBy,
    file_size: file.getSize()
  });

  return createResponse(200, {
    success: true,
    document_id: documentId,
    file_url: file.getUrl(),
    file_id: fileId
  });
}

function getOrCreateVehicleFolder(vehicleId) {
  const rootFolderName = 'Fleet Documents';
  const vehiclesFolderName = 'Vehicles';

  // Get or create root folder
  let rootFolder;
  const rootFolders = DriveApp.getFoldersByName(rootFolderName);
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootFolderName);
  }

  // Get or create Vehicles folder
  const vehiclesFolder = getOrCreateFolder(rootFolder, vehiclesFolderName);

  // Get or create specific vehicle folder
  return getOrCreateFolder(vehiclesFolder, vehicleId);
}

function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

function setDocumentPermissions(fileId, vehicleId) {
  const file = DriveApp.getFileById(fileId);

  // Get vehicle assignment
  const vehiclesSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles');
  const vehiclesData = vehiclesSheet.getDataRange().getValues();
  const vehicle = vehiclesData.find(row => row[0] === vehicleId);

  if (!vehicle) return;

  // Share with assigned user (if exists)
  const assignedTo = vehicle[9]; // assigned_to column
  if (assignedTo) {
    file.addViewer(assignedTo);
  }

  // Fleet managers get edit access
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const fleetManagers = usersData.filter(row => row[5] === 'fleet_manager');

  fleetManagers.forEach(manager => {
    file.addEditor(manager[2]); // email column
  });
}

function recordDocument(docData) {
  const documentsSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Documents');

  const documentId = Utilities.getUuid();
  const row = [
    documentId,
    docData.vehicle_id,
    docData.document_type,
    docData.file_name,
    docData.file_id,
    docData.file_url,
    docData.uploaded_by,
    docData.file_size,
    new Date(), // uploaded_at
    false, // archived
    new Date() // created_at
  ];

  documentsSheet.appendRow(row);
  return documentId;
}

function createResponse(statusCode, data) {
  return ContentService.createTextOutput(JSON.stringify({
    statusCode: statusCode,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}
```

Vue 3 Frontend Upload Component:
```javascript
// composables/useDocumentUpload.js
import { ref } from 'vue';
import { useQuasar } from 'quasar';

export function useDocumentUpload() {
  const $q = useQuasar();
  const isUploading = ref(false);
  const uploadProgress = ref(0);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async function uploadDocument(file, vehicleId, documentType, uploadedBy) {
    if (file.size > MAX_FILE_SIZE) {
      $q.notify({
        type: 'negative',
        message: 'File size exceeds 10MB limit',
        caption: 'Please select a smaller file'
      });
      return { success: false, error: 'File too large' };
    }

    isUploading.value = true;
    uploadProgress.value = 0;

    try {
      // Read file as base64
      const fileData = await readFileAsBase64(file);

      // Upload to GAS endpoint
      const response = await fetch(import.meta.env.VITE_GAS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          action: 'uploadDocument',
          vehicleId,
          documentType,
          fileName: file.name,
          fileData,
          mimeType: file.type,
          uploadedBy
        })
      });

      const result = await response.json();

      if (result.statusCode === 200) {
        $q.notify({
          type: 'positive',
          message: 'Document uploaded successfully'
        });
        return { success: true, data: result.data };
      } else {
        throw new Error(result.data.error);
      }
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Upload failed',
        caption: error.message
      });
      return { success: false, error: error.message };
    } finally {
      isUploading.value = false;
      uploadProgress.value = 0;
    }
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    isUploading,
    uploadProgress,
    uploadDocument
  };
}
```

Quota Management:
```javascript
// Track daily upload quota
function checkUploadQuota(userEmail) {
  const quotaSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Upload_Quota');
  const today = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd');

  const data = quotaSheet.getDataRange().getValues();
  const userQuota = data.find(row => row[0] === userEmail && row[1] === today);

  const DAILY_LIMIT = 100; // 100 uploads per user per day

  if (userQuota && userQuota[2] >= DAILY_LIMIT) {
    throw new Error('Daily upload quota exceeded. Please try again tomorrow.');
  }

  // Update quota
  if (userQuota) {
    const rowIndex = data.indexOf(userQuota) + 1;
    quotaSheet.getRange(rowIndex, 3).setValue(userQuota[2] + 1);
  } else {
    quotaSheet.appendRow([userEmail, today, 1]);
  }
}
```

**Alternatives Considered**:
- **Store files as base64 in sheets**: Rejected due to cell limit and poor performance
- **External storage (S3/Azure)**: Rejected to maintain Google ecosystem integration
- **Google Cloud Storage**: Rejected due to additional billing complexity

---

## 4. Soft Delete Implementation

**Decision**: Archived flag column with filtered queries and separate archival policy for old data.

**Rationale**:
- Single sheet with archived flag maintains referential integrity
- Filtered queries exclude archived records from normal operations
- Historical reporting can include archived data when needed
- Separate archival process moves old data to archive sheet after retention period

**Implementation Notes**:

Archived Flag Pattern:
```javascript
// Soft delete vehicle
function archiveVehicle(vehicleId, archivedBy) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles');
  const data = sheet.getDataRange().getValues();

  const rowIndex = data.findIndex(row => row[0] === vehicleId);
  if (rowIndex === -1) {
    throw new Error('Vehicle not found');
  }

  // Set archived flag (column N, index 13)
  sheet.getRange(rowIndex + 1, 14).setValue(true);
  sheet.getRange(rowIndex + 1, 16).setValue(new Date()); // updated_at

  // Log archival action
  logAudit({
    entity_type: 'vehicle',
    entity_id: vehicleId,
    action: 'archive',
    performed_by: archivedBy,
    timestamp: new Date()
  });

  return { success: true };
}

// Restore archived vehicle
function restoreVehicle(vehicleId, restoredBy) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles');
  const data = sheet.getDataRange().getValues();

  const rowIndex = data.findIndex(row => row[0] === vehicleId);
  if (rowIndex === -1) {
    throw new Error('Vehicle not found');
  }

  sheet.getRange(rowIndex + 1, 14).setValue(false);
  sheet.getRange(rowIndex + 1, 16).setValue(new Date());

  logAudit({
    entity_type: 'vehicle',
    entity_id: vehicleId,
    action: 'restore',
    performed_by: restoredBy,
    timestamp: new Date()
  });

  return { success: true };
}
```

Query Patterns:
```javascript
// Default: Exclude archived records
function getActiveVehicles() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles');
  const data = sheet.getDataRange().getValues();

  return data.slice(1).filter(row => !row[13]) // archived flag is false
    .map(row => ({
      vehicle_id: row[0],
      vin: row[1],
      make: row[2],
      model: row[3],
      year: row[4],
      license_plate: row[5],
      odometer_current: row[6],
      status: row[8]
    }));
}

// Include archived for historical reports
function getAllVehiclesForReport(includeArchived = true) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles');
  const data = sheet.getDataRange().getValues();

  const filtered = includeArchived
    ? data.slice(1)
    : data.slice(1).filter(row => !row[13]);

  return filtered.map(row => ({
    vehicle_id: row[0],
    vin: row[1],
    make: row[2],
    model: row[3],
    year: row[4],
    archived: row[13]
  }));
}

// QUERY formula approach for dashboard
// =QUERY(Vehicles!A:P, "SELECT A, B, C, D, E WHERE N = FALSE ORDER BY A")
```

Vue 3 Filter Component:
```vue
<!-- components/ArchiveFilter.vue -->
<template>
  <q-toggle
    v-model="showArchived"
    label="Show archived items"
    @update:model-value="emit('update:showArchived', $event)"
  />
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['update:showArchived']);
const showArchived = ref(false);
</script>
```

Data Archival Policy (Move to separate sheet after 3 years):
```javascript
// Run annually to move old archived data
function archiveOldData() {
  const RETENTION_YEARS = 3;
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - RETENTION_YEARS);

  const sheets = [
    'Maintenance_Records',
    'Fuel_Entries',
    'Expenses'
  ];

  sheets.forEach(sheetName => {
    const sourceSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(sheetName);
    const archiveSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(sheetName + '_Archive') ||
      SpreadsheetApp.getActiveSpreadsheet()
        .insertSheet(sheetName + '_Archive');

    const data = sourceSheet.getDataRange().getValues();
    const header = data[0];
    const archivedFlagIndex = header.indexOf('archived');
    const createdAtIndex = header.indexOf('created_at');

    // Find rows that are archived and older than cutoff
    const rowsToArchive = [];
    const rowIndicesToDelete = [];

    data.slice(1).forEach((row, idx) => {
      const isArchived = row[archivedFlagIndex];
      const createdAt = new Date(row[createdAtIndex]);

      if (isArchived && createdAt < cutoffDate) {
        rowsToArchive.push(row);
        rowIndicesToDelete.push(idx + 2); // +2 for header and 0-index
      }
    });

    // Move to archive sheet
    if (rowsToArchive.length > 0) {
      // Ensure archive sheet has header
      if (archiveSheet.getLastRow() === 0) {
        archiveSheet.appendRow(header);
      }

      const lastRow = archiveSheet.getLastRow();
      archiveSheet.getRange(
        lastRow + 1, 1,
        rowsToArchive.length,
        rowsToArchive[0].length
      ).setValues(rowsToArchive);

      // Delete from source sheet (in reverse to maintain indices)
      rowIndicesToDelete.reverse().forEach(rowIndex => {
        sourceSheet.deleteRow(rowIndex);
      });

      Logger.log(`Archived ${rowsToArchive.length} rows from ${sheetName}`);
    }
  });
}

// Setup annual trigger
function setupArchivalTrigger() {
  ScriptApp.newTrigger('archiveOldData')
    .timeBased()
    .onMonthDay(1) // First day of month
    .atHour(3)
    .create();
}
```

**Alternatives Considered**:
- **Separate archived sheets**: Rejected due to query complexity and referential integrity issues
- **Hard delete with audit log**: Rejected due to regulatory requirements for data retention
- **Timestamp-based soft delete**: Rejected in favor of explicit boolean flag for clarity

---

## 5. Role-Based UI Rendering

**Decision**: Pinia store for permissions with route guards and composable for component-level checks.

**Rationale**:
- Pinia provides reactive state management integrated with Vue 3
- Route guards prevent unauthorized access at navigation level
- Composable pattern allows reusable permission checks in components
- Centralized permission logic ensures consistency

**Implementation Notes**:

Pinia Store for Authentication and Permissions:
```javascript
// stores/auth.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isAuthenticated = ref(false);

  const userRole = computed(() => user.value?.role || null);
  const permissions = computed(() => {
    if (!user.value) return [];

    // Role-based permission mapping
    const rolePermissions = {
      fleet_manager: [
        'vehicles:read',
        'vehicles:write',
        'vehicles:delete',
        'maintenance:read',
        'maintenance:write',
        'maintenance:approve',
        'fuel:read',
        'fuel:write',
        'expenses:read',
        'expenses:write',
        'reports:generate',
        'users:manage',
        'documents:read',
        'documents:write'
      ],
      technician: [
        'vehicles:read',
        'maintenance:read',
        'maintenance:write',
        'fuel:read',
        'fuel:write',
        'expenses:read',
        'documents:read'
      ],
      viewer: [
        'vehicles:read',
        'maintenance:read',
        'fuel:read',
        'reports:view',
        'documents:read'
      ]
    };

    return rolePermissions[user.value.role] || [];
  });

  function hasPermission(permission) {
    return permissions.value.includes(permission);
  }

  function hasAnyPermission(permissionList) {
    return permissionList.some(p => hasPermission(p));
  }

  function hasAllPermissions(permissionList) {
    return permissionList.every(p => hasPermission(p));
  }

  async function login(email, password) {
    try {
      const response = await fetch(import.meta.env.VITE_GAS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      });

      const result = await response.json();

      if (result.statusCode === 200) {
        user.value = result.data.user;
        isAuthenticated.value = true;
        localStorage.setItem('auth_token', result.data.token);
        return { success: true };
      } else {
        throw new Error(result.data.error);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  function logout() {
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('auth_token');
  }

  async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(import.meta.env.VITE_GAS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          action: 'verifyToken',
          token
        })
      });

      const result = await response.json();

      if (result.statusCode === 200) {
        user.value = result.data.user;
        isAuthenticated.value = true;
        return true;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }

    logout();
    return false;
  }

  return {
    user,
    isAuthenticated,
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    checkAuth
  };
});
```

Vue Router with Route Guards:
```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue')
      },
      {
        path: 'vehicles',
        name: 'vehicles',
        component: () => import('@/pages/VehiclesPage.vue'),
        meta: { permissions: ['vehicles:read'] }
      },
      {
        path: 'vehicles/:id',
        name: 'vehicle-details',
        component: () => import('@/pages/VehicleDetailsPage.vue'),
        meta: { permissions: ['vehicles:read'] }
      },
      {
        path: 'maintenance',
        name: 'maintenance',
        component: () => import('@/pages/MaintenancePage.vue'),
        meta: { permissions: ['maintenance:read'] }
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/pages/ReportsPage.vue'),
        meta: { permissions: ['reports:generate', 'reports:view'], requireAny: true }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/pages/UsersPage.vue'),
        meta: { permissions: ['users:manage'] }
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/pages/UnauthorizedPage.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check authentication
  if (to.meta.requiresAuth !== false) {
    const isAuthenticated = authStore.isAuthenticated || await authStore.checkAuth();

    if (!isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
  }

  // Check permissions
  if (to.meta.permissions) {
    const hasPermission = to.meta.requireAny
      ? authStore.hasAnyPermission(to.meta.permissions)
      : authStore.hasAllPermissions(to.meta.permissions);

    if (!hasPermission) {
      next({ name: 'unauthorized' });
      return;
    }
  }

  next();
});

export default router;
```

Composable for Component-Level Permissions:
```javascript
// composables/usePermissions.js
import { useAuthStore } from '@/stores/auth';

export function usePermissions() {
  const authStore = useAuthStore();

  return {
    can: authStore.hasPermission,
    canAny: authStore.hasAnyPermission,
    canAll: authStore.hasAllPermissions,
    userRole: authStore.userRole,
    isFleetManager: () => authStore.userRole === 'fleet_manager',
    isTechnician: () => authStore.userRole === 'technician'
  };
}
```

Component Usage Examples:
```vue
<!-- pages/VehiclesPage.vue -->
<template>
  <q-page padding>
    <div class="row q-mb-md">
      <div class="col">
        <h4>Fleet Vehicles</h4>
      </div>
      <div class="col-auto" v-if="can('vehicles:write')">
        <q-btn
          color="primary"
          icon="add"
          label="Add Vehicle"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <q-table
      :rows="vehicles"
      :columns="columns"
      row-key="vehicle_id"
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="edit"
            v-if="can('vehicles:write')"
            @click="editVehicle(props.row)"
          />
          <q-btn
            flat
            round
            icon="delete"
            v-if="can('vehicles:delete')"
            @click="deleteVehicle(props.row)"
          />
          <q-btn
            flat
            round
            icon="visibility"
            @click="viewVehicle(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePermissions } from '@/composables/usePermissions';
import { useVehicles } from '@/composables/useVehicles';

const { can } = usePermissions();
const { vehicles, fetchVehicles } = useVehicles();
const showAddDialog = ref(false);

const columns = [
  { name: 'vehicle_id', label: 'ID', field: 'vehicle_id', align: 'left' },
  { name: 'make', label: 'Make', field: 'make', align: 'left' },
  { name: 'model', label: 'Model', field: 'model', align: 'left' },
  { name: 'year', label: 'Year', field: 'year', align: 'left' },
  { name: 'license_plate', label: 'License', field: 'license_plate', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'actions', label: 'Actions', align: 'center' }
];

onMounted(() => {
  fetchVehicles();
});
</script>
```

Conditional Menu Items:
```vue
<!-- layouts/MainLayout.vue -->
<template>
  <q-layout view="hHh lpR fFf">
    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <q-list>
        <q-item-label header>Fleet Management</q-item-label>

        <q-item clickable to="/" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/vehicles" v-if="can('vehicles:read')">
          <q-item-section avatar>
            <q-icon name="directions_car" />
          </q-item-section>
          <q-item-section>Vehicles</q-item-section>
        </q-item>

        <q-item clickable to="/maintenance" v-if="can('maintenance:read')">
          <q-item-section avatar>
            <q-icon name="build" />
          </q-item-section>
          <q-item-section>Maintenance</q-item-section>
        </q-item>

        <q-item clickable to="/reports" v-if="canAny(['reports:generate', 'reports:view'])">
          <q-item-section avatar>
            <q-icon name="assessment" />
          </q-item-section>
          <q-item-section>Reports</q-item-section>
        </q-item>

        <q-item clickable to="/users" v-if="can('users:manage')">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>Users</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { usePermissions } from '@/composables/usePermissions';

const { can, canAny } = usePermissions();
const leftDrawerOpen = ref(false);
</script>
```

**Alternatives Considered**:
- **Backend-only authorization**: Rejected as frontend checks improve UX by hiding unavailable features
- **Role-based components**: Rejected in favor of permission-based for finer granularity
- **Vuex instead of Pinia**: Rejected as Pinia is the official state management for Vue 3

---

## 6. Fuel Efficiency Calculation

**Decision**: Distance-based calculation with running average, handling edge cases for first fill-up and partial fills.

**Rationale**:
- MPG (miles per gallon) and L/100km are standard fuel efficiency metrics
- Distance-based calculation (odometer difference) is more accurate than time-based
- First fill-up cannot calculate efficiency without baseline
- Partial fills should not be used for efficiency calculation

**Implementation Notes**:

Calculation Formulas:
```javascript
// MPG = Miles traveled / Gallons consumed
// L/100km = (Liters consumed / Kilometers traveled) * 100

function calculateFuelEfficiency(fuelEntry, previousEntry) {
  // Cannot calculate on first entry or if not filled to full
  if (!previousEntry || !fuelEntry.filled_to_full) {
    return {
      mpg: null,
      liters_per_100km: null,
      message: fuelEntry.filled_to_full
        ? 'First fill-up, no previous data'
        : 'Partial fill, efficiency not calculated'
    };
  }

  const distanceKm = fuelEntry.odometer - previousEntry.odometer;
  const liters = fuelEntry.quantity_liters;

  // Validate data
  if (distanceKm <= 0) {
    return {
      mpg: null,
      liters_per_100km: null,
      message: 'Invalid odometer reading'
    };
  }

  if (liters <= 0) {
    return {
      mpg: null,
      liters_per_100km: null,
      message: 'Invalid fuel quantity'
    };
  }

  // Calculate L/100km
  const liters_per_100km = (liters / distanceKm) * 100;

  // Convert to MPG (assuming US gallons: 1 gallon = 3.78541 liters, 1 mile = 1.60934 km)
  const miles = distanceKm / 1.60934;
  const gallons = liters / 3.78541;
  const mpg = miles / gallons;

  return {
    mpg: Math.round(mpg * 10) / 10, // Round to 1 decimal
    liters_per_100km: Math.round(liters_per_100km * 10) / 10,
    distance_km: distanceKm,
    distance_miles: Math.round(miles * 10) / 10
  };
}
```

Google Apps Script Implementation:
```javascript
function addFuelEntry(payload) {
  const { vehicleId, date, odometer, quantity_liters, cost_per_liter,
          fuel_type, location, filled_to_full, recorded_by } = payload;

  const fuelSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Fuel_Entries');

  // Get previous entry for this vehicle to calculate efficiency
  const data = fuelSheet.getDataRange().getValues();
  const vehicleEntries = data.slice(1)
    .filter(row => row[1] === vehicleId && !row[11]) // same vehicle, not archived
    .sort((a, b) => new Date(b[2]) - new Date(a[2])); // sort by date desc

  const previousEntry = vehicleEntries.length > 0 ? {
    odometer: vehicleEntries[0][3],
    quantity_liters: vehicleEntries[0][4],
    filled_to_full: vehicleEntries[0][9]
  } : null;

  // Calculate efficiency
  const currentEntry = {
    odometer: odometer,
    quantity_liters: quantity_liters,
    filled_to_full: filled_to_full
  };

  const efficiency = calculateFuelEfficiency(currentEntry, previousEntry);

  // Create new entry
  const entryId = Utilities.getUuid();
  const total_cost = quantity_liters * cost_per_liter;

  const row = [
    entryId,
    vehicleId,
    new Date(date),
    odometer,
    quantity_liters,
    cost_per_liter,
    total_cost,
    fuel_type,
    location,
    filled_to_full,
    recorded_by,
    false, // archived
    new Date(), // created_at
    efficiency.mpg,
    efficiency.liters_per_100km
  ];

  fuelSheet.appendRow(row);

  // Update vehicle odometer
  updateVehicleOdometer(vehicleId, odometer);

  // Check mileage-based maintenance triggers
  checkMileageTriggersForVehicle(vehicleId, odometer);

  return {
    success: true,
    entry_id: entryId,
    efficiency: efficiency
  };
}

function updateVehicleOdometer(vehicleId, newOdometer) {
  const vehiclesSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Vehicles');
  const data = vehiclesSheet.getDataRange().getValues();

  const rowIndex = data.findIndex(row => row[0] === vehicleId);
  if (rowIndex !== -1) {
    // Update odometer_current (column G, index 6)
    vehiclesSheet.getRange(rowIndex + 1, 7).setValue(newOdometer);
    // Update updated_at
    vehiclesSheet.getRange(rowIndex + 1, 16).setValue(new Date());
  }
}
```

Running Average Calculation:
```javascript
function getVehicleFuelEfficiencyStats(vehicleId, period = 'all') {
  const fuelSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Fuel_Entries');
  const data = fuelSheet.getDataRange().getValues();

  // Filter entries for this vehicle with valid efficiency data
  let entries = data.slice(1)
    .filter(row =>
      row[1] === vehicleId && // vehicle_id
      !row[11] && // not archived
      row[13] !== null && // has mpg
      row[14] !== null // has liters_per_100km
    );

  // Apply period filter
  const now = new Date();
  if (period === 'last_30_days') {
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    entries = entries.filter(row => new Date(row[2]) >= thirtyDaysAgo);
  } else if (period === 'last_90_days') {
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    entries = entries.filter(row => new Date(row[2]) >= ninetyDaysAgo);
  }

  if (entries.length === 0) {
    return {
      count: 0,
      avg_mpg: null,
      avg_liters_per_100km: null,
      min_mpg: null,
      max_mpg: null,
      trend: null
    };
  }

  // Calculate statistics
  const mpgValues = entries.map(row => row[13]);
  const litersValues = entries.map(row => row[14]);

  const avg_mpg = mpgValues.reduce((a, b) => a + b, 0) / mpgValues.length;
  const avg_liters_per_100km = litersValues.reduce((a, b) => a + b, 0) / litersValues.length;

  const min_mpg = Math.min(...mpgValues);
  const max_mpg = Math.max(...mpgValues);

  // Calculate trend (simple linear regression on last 10 entries)
  let trend = 'stable';
  if (entries.length >= 10) {
    const recent = mpgValues.slice(-10);
    const older = mpgValues.slice(-20, -10);
    if (older.length >= 10) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (change > 5) trend = 'improving';
      else if (change < -5) trend = 'declining';
    }
  }

  return {
    count: entries.length,
    avg_mpg: Math.round(avg_mpg * 10) / 10,
    avg_liters_per_100km: Math.round(avg_liters_per_100km * 10) / 10,
    min_mpg: Math.round(min_mpg * 10) / 10,
    max_mpg: Math.round(max_mpg * 10) / 10,
    trend: trend
  };
}
```

Vue 3 Display Component:
```vue
<!-- components/FuelEfficiencyDisplay.vue -->
<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ $t('fuel.efficiency') }}</div>
    </q-card-section>

    <q-card-section v-if="efficiency.mpg !== null">
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <div class="text-caption">{{ $t('fuel.mpg') }}</div>
          <div class="text-h5">{{ efficiency.mpg }}</div>
          <div class="text-caption text-grey">
            {{ $t('fuel.distance', { distance: efficiency.distance_miles }) }} miles
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption">{{ $t('fuel.liters_per_100km') }}</div>
          <div class="text-h5">{{ efficiency.liters_per_100km }}</div>
          <div class="text-caption text-grey">
            {{ $t('fuel.distance', { distance: efficiency.distance_km }) }} km
          </div>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <div class="text-subtitle2">{{ $t('fuel.running_average') }}</div>
      <div class="row q-col-gutter-sm q-mt-xs">
        <div class="col-4">
          <q-badge color="primary">
            {{ stats.avg_mpg }} MPG
          </q-badge>
        </div>
        <div class="col-4">
          <q-badge color="secondary">
            {{ stats.avg_liters_per_100km }} L/100km
          </q-badge>
        </div>
        <div class="col-4">
          <q-badge :color="getTrendColor(stats.trend)">
            {{ $t('fuel.trend.' + stats.trend) }}
          </q-badge>
        </div>
      </div>
    </q-card-section>

    <q-card-section v-else>
      <q-banner class="bg-grey-3">
        <template v-slot:avatar>
          <q-icon name="info" color="primary" />
        </template>
        {{ efficiency.message || $t('fuel.no_data') }}
      </q-banner>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  efficiency: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    default: () => ({
      avg_mpg: null,
      avg_liters_per_100km: null,
      trend: 'stable'
    })
  }
});

const { t } = useI18n();

function getTrendColor(trend) {
  return {
    'improving': 'positive',
    'declining': 'negative',
    'stable': 'grey'
  }[trend] || 'grey';
}
</script>
```

**Alternatives Considered**:
- **Time-based efficiency**: Rejected as distance is more accurate measure
- **Include partial fills in calculation**: Rejected due to inaccuracy in fuel quantity
- **Imperial vs Metric only**: Rejected in favor of supporting both for bilingual needs

---

## 7. Report Generation in GAS

**Decision**: Template-based PDF generation using Google Docs API with scheduled exports and email delivery via time-driven triggers.

**Rationale**:
- Google Apps Script has built-in utilities for PDF/Excel export
- Template approach allows customization and branding
- Time-driven triggers enable scheduled report generation
- Email delivery integrates with Gmail API
- No external dependencies or costs

**Implementation Notes**:

Report Template Structure:
```javascript
// Create report templates as Google Docs with placeholders
// Example placeholders: {{vehicle_count}}, {{maintenance_summary}}, {{fuel_costs}}

function generateMaintenanceReport(startDate, endDate, format = 'pdf') {
  const templateId = PropertiesService.getScriptProperties()
    .getProperty('MAINTENANCE_REPORT_TEMPLATE_ID');

  // Copy template
  const template = DriveApp.getFileById(templateId);
  const reportName = `Maintenance Report ${Utilities.formatDate(startDate, 'GMT', 'yyyy-MM-dd')} to ${Utilities.formatDate(endDate, 'GMT', 'yyyy-MM-dd')}`;
  const copy = template.makeCopy(reportName);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();

  // Gather data
  const maintenanceData = getMaintenanceDataForPeriod(startDate, endDate);
  const vehicleData = getVehicleData();
  const expenseData = getExpenseDataForPeriod(startDate, endDate);

  // Calculate summary statistics
  const totalMaintenance = maintenanceData.length;
  const completedMaintenance = maintenanceData.filter(m => m.status === 'completed').length;
  const totalCost = maintenanceData.reduce((sum, m) => sum + (m.cost || 0), 0);
  const avgCost = totalMaintenance > 0 ? totalCost / totalMaintenance : 0;

  // Replace placeholders
  body.replaceText('{{report_date}}', Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd'));
  body.replaceText('{{start_date}}', Utilities.formatDate(startDate, 'GMT', 'yyyy-MM-dd'));
  body.replaceText('{{end_date}}', Utilities.formatDate(endDate, 'GMT', 'yyyy-MM-dd'));
  body.replaceText('{{vehicle_count}}', vehicleData.length.toString());
  body.replaceText('{{total_maintenance}}', totalMaintenance.toString());
  body.replaceText('{{completed_maintenance}}', completedMaintenance.toString());
  body.replaceText('{{total_cost}}', `$${totalCost.toFixed(2)}`);
  body.replaceText('{{avg_cost}}', `$${avgCost.toFixed(2)}`);

  // Insert detailed table
  const tables = body.getTables();
  if (tables.length > 0) {
    const table = tables[0];

    // Clear existing rows except header
    while (table.getNumRows() > 1) {
      table.removeRow(1);
    }

    // Add data rows
    maintenanceData.forEach(record => {
      const row = table.appendTableRow();
      row.appendTableCell(record.vehicle_id);
      row.appendTableCell(record.maintenance_type);
      row.appendTableCell(Utilities.formatDate(record.completed_date, 'GMT', 'yyyy-MM-dd'));
      row.appendTableCell(`$${(record.cost || 0).toFixed(2)}`);
      row.appendTableCell(record.status);
    });
  }

  doc.saveAndClose();

  // Export to desired format
  let file;
  if (format === 'pdf') {
    file = exportToPDF(copy.getId(), reportName);
  } else if (format === 'xlsx') {
    file = exportToExcel(maintenanceData, reportName);
  }

  // Clean up temporary doc
  DriveApp.getFileById(copy.getId()).setTrashed(true);

  return {
    file_id: file.getId(),
    file_url: file.getUrl(),
    file_name: file.getName()
  };
}

function exportToPDF(docId, fileName) {
  const doc = DriveApp.getFileById(docId);
  const blob = doc.getAs('application/pdf');
  blob.setName(fileName + '.pdf');

  // Save to Reports folder
  const reportsFolder = getOrCreateReportsFolder();
  return reportsFolder.createFile(blob);
}

function exportToExcel(data, fileName) {
  const ss = SpreadsheetApp.create(fileName);
  const sheet = ss.getActiveSheet();

  // Set headers
  const headers = [
    'Vehicle ID', 'Maintenance Type', 'Scheduled Date',
    'Completed Date', 'Odometer', 'Cost', 'Technician', 'Status'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // Add data
  const rows = data.map(record => [
    record.vehicle_id,
    record.maintenance_type,
    record.scheduled_date,
    record.completed_date,
    record.odometer_at_service,
    record.cost,
    record.technician_id,
    record.status
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);

  // Move to Reports folder
  const file = DriveApp.getFileById(ss.getId());
  const reportsFolder = getOrCreateReportsFolder();
  file.moveTo(reportsFolder);

  return file;
}

function getOrCreateReportsFolder() {
  const rootFolderName = 'Fleet Documents';
  const reportsFolderName = 'Reports';

  let rootFolder;
  const rootFolders = DriveApp.getFoldersByName(rootFolderName);
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootFolderName);
  }

  return getOrCreateFolder(rootFolder, reportsFolderName);
}
```

Scheduled Report Generation:
```javascript
// Set up monthly report trigger
function setupMonthlyReportTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateMonthlyReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create trigger for first day of month at 6 AM
  ScriptApp.newTrigger('generateMonthlyReport')
    .timeBased()
    .onMonthDay(1)
    .atHour(6)
    .create();
}

function generateMonthlyReport() {
  const today = new Date();
  const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Generate reports
  const maintenanceReport = generateMaintenanceReport(
    firstDayLastMonth,
    lastDayLastMonth,
    'pdf'
  );

  const fuelReport = generateFuelReport(
    firstDayLastMonth,
    lastDayLastMonth,
    'xlsx'
  );

  // Email to fleet managers
  emailReportToManagers([maintenanceReport, fuelReport], 'Monthly Fleet Report');
}
```

Email Delivery:
```javascript
function emailReportToManagers(reports, subject) {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Users');
  const usersData = usersSheet.getDataRange().getValues();

  // Get fleet manager emails
  const managerEmails = usersData
    .slice(1)
    .filter(row => row[5] === 'fleet_manager' && !row[7]) // role and not archived
    .map(row => row[2]); // email column

  if (managerEmails.length === 0) {
    Logger.log('No fleet managers found to send report');
    return;
  }

  // Prepare email body
  const body = `
    <h2>${subject}</h2>
    <p>Please find attached the monthly fleet reports:</p>
    <ul>
      ${reports.map(r => `<li><a href="${r.file_url}">${r.file_name}</a></li>`).join('\n')}
    </ul>
    <p>This is an automated report generated by the Fleet Management System.</p>
  `;

  // Prepare attachments
  const attachments = reports.map(r =>
    DriveApp.getFileById(r.file_id).getBlob()
  );

  // Send email
  managerEmails.forEach(email => {
    GmailApp.sendEmail(email, subject, '', {
      htmlBody: body,
      attachments: attachments,
      name: 'Fleet Management System'
    });
  });

  Logger.log(`Report sent to ${managerEmails.length} fleet managers`);
}
```

Custom Report API Endpoint:
```javascript
// doPost endpoint for on-demand report generation
function handleGenerateReport(payload) {
  const { reportType, startDate, endDate, format, emailTo } = payload;

  let report;

  switch (reportType) {
    case 'maintenance':
      report = generateMaintenanceReport(
        new Date(startDate),
        new Date(endDate),
        format
      );
      break;
    case 'fuel':
      report = generateFuelReport(
        new Date(startDate),
        new Date(endDate),
        format
      );
      break;
    case 'expense':
      report = generateExpenseReport(
        new Date(startDate),
        new Date(endDate),
        format
      );
      break;
    case 'fleet_summary':
      report = generateFleetSummaryReport(format);
      break;
    default:
      return createResponse(400, { error: 'Invalid report type' });
  }

  // Email if requested
  if (emailTo) {
    GmailApp.sendEmail(emailTo, `${reportType} Report`, '', {
      htmlBody: `<p>Your requested report is attached.</p>`,
      attachments: [DriveApp.getFileById(report.file_id).getBlob()],
      name: 'Fleet Management System'
    });
  }

  return createResponse(200, {
    success: true,
    report: report
  });
}
```

Vue 3 Report Generation UI:
```vue
<!-- components/ReportGenerator.vue -->
<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ $t('reports.generate') }}</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="generateReport">
        <q-select
          v-model="reportType"
          :options="reportTypes"
          :label="$t('reports.type')"
          emit-value
          map-options
          class="q-mb-md"
        />

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-6">
            <q-input
              v-model="startDate"
              :label="$t('reports.start_date')"
              type="date"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="endDate"
              :label="$t('reports.end_date')"
              type="date"
            />
          </div>
        </div>

        <q-select
          v-model="format"
          :options="formatOptions"
          :label="$t('reports.format')"
          emit-value
          map-options
          class="q-mb-md"
        />

        <q-checkbox
          v-model="emailReport"
          :label="$t('reports.email_me')"
          class="q-mb-md"
        />

        <q-btn
          type="submit"
          color="primary"
          :label="$t('reports.generate')"
          :loading="isGenerating"
        />
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const { t } = useI18n();
const authStore = useAuthStore();

const reportType = ref('maintenance');
const startDate = ref('');
const endDate = ref('');
const format = ref('pdf');
const emailReport = ref(false);
const isGenerating = ref(false);

const reportTypes = [
  { label: t('reports.types.maintenance'), value: 'maintenance' },
  { label: t('reports.types.fuel'), value: 'fuel' },
  { label: t('reports.types.expense'), value: 'expense' },
  { label: t('reports.types.fleet_summary'), value: 'fleet_summary' }
];

const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel (XLSX)', value: 'xlsx' }
];

async function generateReport() {
  isGenerating.value = true;

  try {
    const response = await fetch(import.meta.env.VITE_GAS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        action: 'generateReport',
        reportType: reportType.value,
        startDate: startDate.value,
        endDate: endDate.value,
        format: format.value,
        emailTo: emailReport.value ? authStore.user.email : null
      })
    });

    const result = await response.json();

    if (result.statusCode === 200) {
      $q.notify({
        type: 'positive',
        message: t('reports.generated_success')
      });

      // Open report in new tab
      window.open(result.data.report.file_url, '_blank');
    } else {
      throw new Error(result.data.error);
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('reports.generated_error'),
      caption: error.message
    });
  } finally {
    isGenerating.value = false;
  }
}
</script>
```

**Alternatives Considered**:
- **Third-party reporting tools (Jasper, Crystal Reports)**: Rejected due to cost and integration complexity
- **Client-side PDF generation**: Rejected due to limited data access and processing power
- **Spreadsheet-only reports**: Rejected as PDF provides better presentation and sharing

---

## 8. Bilingual i18n in Vue 3

**Decision**: Nested key structure with vue-i18n, route-based language detection, and centralized translation management.

**Rationale**:
- vue-i18n is the standard i18n solution for Vue 3
- Nested keys provide better organization for large translation files
- Route-based detection enables bookmarkable URLs with language preference
- Centralized management ensures translation parity across en-US and fr-FR

**Implementation Notes**:

Project Setup:
```bash
npm install vue-i18n
```

i18n Configuration:
```javascript
// src/i18n/index.js
import { createI18n } from 'vue-i18n';
import enUS from './locales/en-US.json';
import frFR from './locales/fr-FR.json';

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: localStorage.getItem('user-locale') || 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': enUS,
    'fr-FR': frFR
  },
  datetimeFormats: {
    'en-US': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }
    },
    'fr-FR': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }
    }
  },
  numberFormats: {
    'en-US': {
      currency: {
        style: 'currency',
        currency: 'USD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    'fr-FR': {
      currency: {
        style: 'currency',
        currency: 'CAD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    }
  }
});

export default i18n;
```

Translation File Structure (Nested Keys):
```json
// src/i18n/locales/en-US.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "loading": "Loading...",
    "no_data": "No data available",
    "confirm": "Confirm",
    "back": "Back"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "login_failed": "Login failed",
    "unauthorized": "You do not have permission to access this page"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "vehicles": "Vehicles",
    "maintenance": "Maintenance",
    "fuel": "Fuel",
    "expenses": "Expenses",
    "reports": "Reports",
    "users": "Users"
  },
  "vehicles": {
    "title": "Fleet Vehicles",
    "add_vehicle": "Add Vehicle",
    "edit_vehicle": "Edit Vehicle",
    "vehicle_details": "Vehicle Details",
    "fields": {
      "vin": "VIN",
      "make": "Make",
      "model": "Model",
      "year": "Year",
      "license_plate": "License Plate",
      "odometer": "Odometer",
      "status": "Status",
      "assigned_to": "Assigned To",
      "fuel_type": "Fuel Type",
      "department": "Department"
    },
    "status": {
      "active": "Active",
      "retired": "Retired",
      "maintenance": "In Maintenance"
    }
  },
  "maintenance": {
    "title": "Maintenance Records",
    "add_record": "Add Maintenance",
    "schedule_maintenance": "Schedule Maintenance",
    "fields": {
      "maintenance_type": "Maintenance Type",
      "scheduled_date": "Scheduled Date",
      "completed_date": "Completed Date",
      "odometer": "Odometer at Service",
      "cost": "Cost",
      "technician": "Technician",
      "status": "Status",
      "notes": "Notes"
    },
    "types": {
      "oil_change": "Oil Change",
      "tire_rotation": "Tire Rotation",
      "brake_service": "Brake Service",
      "inspection": "Inspection",
      "engine_repair": "Engine Repair",
      "transmission": "Transmission Service",
      "other": "Other"
    },
    "recurring": {
      "enable": "Enable Recurring",
      "pattern": "Recurrence Pattern",
      "time_based": "Time-based",
      "mileage_based": "Mileage-based",
      "both": "Time and Mileage"
    }
  },
  "fuel": {
    "title": "Fuel Entries",
    "add_entry": "Add Fuel Entry",
    "efficiency": "Fuel Efficiency",
    "fields": {
      "date": "Date",
      "odometer": "Odometer",
      "quantity": "Quantity",
      "cost_per_unit": "Cost per Unit",
      "total_cost": "Total Cost",
      "location": "Location",
      "filled_to_full": "Filled to Full"
    },
    "mpg": "MPG (Miles per Gallon)",
    "liters_per_100km": "L/100km",
    "distance": "Distance: {distance}",
    "running_average": "Running Average",
    "trend": {
      "improving": "Improving",
      "declining": "Declining",
      "stable": "Stable"
    },
    "no_data": "Fuel efficiency data not available. Add more fuel entries to calculate."
  },
  "reports": {
    "title": "Reports",
    "generate": "Generate Report",
    "type": "Report Type",
    "start_date": "Start Date",
    "end_date": "End Date",
    "format": "Format",
    "email_me": "Email me the report",
    "types": {
      "maintenance": "Maintenance Report",
      "fuel": "Fuel Report",
      "expense": "Expense Report",
      "fleet_summary": "Fleet Summary"
    },
    "generated_success": "Report generated successfully",
    "generated_error": "Failed to generate report"
  }
}
```

```json
// src/i18n/locales/fr-FR.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "add": "Ajouter",
    "search": "Rechercher",
    "loading": "Chargement...",
    "no_data": "Aucune donnée disponible",
    "confirm": "Confirmer",
    "back": "Retour"
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    "email": "Courriel",
    "password": "Mot de passe",
    "login_failed": "Échec de la connexion",
    "unauthorized": "Vous n'avez pas la permission d'accéder à cette page"
  },
  "navigation": {
    "dashboard": "Tableau de bord",
    "vehicles": "Véhicules",
    "maintenance": "Entretien",
    "fuel": "Carburant",
    "expenses": "Dépenses",
    "reports": "Rapports",
    "users": "Utilisateurs"
  },
  "vehicles": {
    "title": "Véhicules de la flotte",
    "add_vehicle": "Ajouter un véhicule",
    "edit_vehicle": "Modifier le véhicule",
    "vehicle_details": "Détails du véhicule",
    "fields": {
      "vin": "NIV",
      "make": "Marque",
      "model": "Modèle",
      "year": "Année",
      "license_plate": "Plaque d'immatriculation",
      "odometer": "Odomètre",
      "status": "Statut",
      "assigned_to": "Assigné à",
      "fuel_type": "Type de carburant",
      "department": "Département"
    },
    "status": {
      "active": "Actif",
      "retired": "Retiré",
      "maintenance": "En entretien"
    }
  },
  "maintenance": {
    "title": "Dossiers d'entretien",
    "add_record": "Ajouter un entretien",
    "schedule_maintenance": "Planifier un entretien",
    "fields": {
      "maintenance_type": "Type d'entretien",
      "scheduled_date": "Date prévue",
      "completed_date": "Date d'achèvement",
      "odometer": "Odomètre au service",
      "cost": "Coût",
      "technician": "Technicien",
      "status": "Statut",
      "notes": "Notes"
    },
    "types": {
      "oil_change": "Vidange d'huile",
      "tire_rotation": "Permutation des pneus",
      "brake_service": "Service de freins",
      "inspection": "Inspection",
      "engine_repair": "Réparation du moteur",
      "transmission": "Service de transmission",
      "other": "Autre"
    },
    "recurring": {
      "enable": "Activer la récurrence",
      "pattern": "Modèle de récurrence",
      "time_based": "Basé sur le temps",
      "mileage_based": "Basé sur le kilométrage",
      "both": "Temps et kilométrage"
    }
  },
  "fuel": {
    "title": "Entrées de carburant",
    "add_entry": "Ajouter une entrée de carburant",
    "efficiency": "Efficacité du carburant",
    "fields": {
      "date": "Date",
      "odometer": "Odomètre",
      "quantity": "Quantité",
      "cost_per_unit": "Coût par unité",
      "total_cost": "Coût total",
      "location": "Emplacement",
      "filled_to_full": "Rempli au maximum"
    },
    "mpg": "MPG (Miles par gallon)",
    "liters_per_100km": "L/100km",
    "distance": "Distance: {distance}",
    "running_average": "Moyenne mobile",
    "trend": {
      "improving": "En amélioration",
      "declining": "En baisse",
      "stable": "Stable"
    },
    "no_data": "Données d'efficacité du carburant non disponibles. Ajoutez plus d'entrées de carburant pour calculer."
  },
  "reports": {
    "title": "Rapports",
    "generate": "Générer un rapport",
    "type": "Type de rapport",
    "start_date": "Date de début",
    "end_date": "Date de fin",
    "format": "Format",
    "email_me": "M'envoyer le rapport par courriel",
    "types": {
      "maintenance": "Rapport d'entretien",
      "fuel": "Rapport de carburant",
      "expense": "Rapport de dépenses",
      "fleet_summary": "Résumé de la flotte"
    },
    "generated_success": "Rapport généré avec succès",
    "generated_error": "Échec de la génération du rapport"
  }
}
```

Language Switcher Component:
```vue
<!-- components/LanguageSwitcher.vue -->
<template>
  <q-btn-dropdown
    flat
    :label="currentLocaleLabel"
    icon="language"
  >
    <q-list>
      <q-item
        v-for="locale in availableLocales"
        :key="locale.value"
        clickable
        v-close-popup
        @click="changeLocale(locale.value)"
        :active="locale.value === currentLocale"
      >
        <q-item-section avatar>
          <q-icon :name="locale.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ locale.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { locale } = useI18n();
const router = useRouter();

const availableLocales = [
  { value: 'en-US', label: 'English', icon: 'flag' },
  { value: 'fr-FR', label: 'Français', icon: 'flag' }
];

const currentLocale = computed(() => locale.value);
const currentLocaleLabel = computed(() => {
  const current = availableLocales.find(l => l.value === locale.value);
  return current ? current.label : '';
});

function changeLocale(newLocale) {
  locale.value = newLocale;
  localStorage.setItem('user-locale', newLocale);

  // Update HTML lang attribute
  document.querySelector('html').setAttribute('lang', newLocale);

  // Optionally update route to include locale
  // router.push({ params: { ...router.currentRoute.value.params, locale: newLocale } });
}
</script>
```

Route-based Language Detection:
```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import i18n from '@/i18n';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Routes...
  ]
});

router.beforeEach((to, from, next) => {
  // Check if route has locale parameter
  const routeLocale = to.params.locale;
  if (routeLocale && ['en-US', 'fr-FR'].includes(routeLocale)) {
    i18n.global.locale.value = routeLocale;
    localStorage.setItem('user-locale', routeLocale);
  }

  next();
});

export default router;
```

Translation Parity Validation Script:
```javascript
// scripts/validate-translations.js
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const enUS = JSON.parse(fs.readFileSync(path.join(localesDir, 'en-US.json'), 'utf8'));
const frFR = JSON.parse(fs.readFileSync(path.join(localesDir, 'fr-FR.json'), 'utf8'));

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = getAllKeys(enUS);
const frKeys = getAllKeys(frFR);

const missingInFR = enKeys.filter(key => !frKeys.includes(key));
const missingInEN = frKeys.filter(key => !enKeys.includes(key));

if (missingInFR.length > 0) {
  console.error('Missing keys in fr-FR:');
  missingInFR.forEach(key => console.error(`  - ${key}`));
}

if (missingInEN.length > 0) {
  console.error('Missing keys in en-US:');
  missingInEN.forEach(key => console.error(`  - ${key}`));
}

if (missingInFR.length === 0 && missingInEN.length === 0) {
  console.log('All translations are in parity!');
  process.exit(0);
} else {
  process.exit(1);
}
```

Add to package.json:
```json
{
  "scripts": {
    "validate-i18n": "node scripts/validate-translations.js"
  }
}
```

Usage in Components:
```vue
<template>
  <div>
    <!-- Simple translation -->
    <h1>{{ $t('vehicles.title') }}</h1>

    <!-- With interpolation -->
    <p>{{ $t('fuel.distance', { distance: 125.5 }) }}</p>

    <!-- Date formatting -->
    <span>{{ $d(new Date(), 'short') }}</span>

    <!-- Number formatting -->
    <span>{{ $n(1234.56, 'currency') }}</span>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t, d, n } = useI18n();

// Can also use programmatically
const message = t('common.save');
</script>
```

**Alternatives Considered**:
- **Flat key structure**: Rejected due to poor organization for large projects
- **Separate files per feature**: Rejected in favor of single locale file for easier management
- **Server-side translations**: Rejected as frontend-only is sufficient for this application
- **i18next instead of vue-i18n**: Rejected as vue-i18n is Vue-specific and better integrated

---

## Summary

This research document provides comprehensive technical decisions for implementing a vehicle maintenance management system with:

1. **Scalable Google Sheets schema** supporting 1000+ vehicles with normalized structure
2. **Automated recurring maintenance** via time-driven triggers and on-demand checks
3. **Document management** with Google Drive integration and 10MB upload support
4. **Soft delete pattern** with archived flags and data archival policies
5. **Role-based access control** using Pinia stores and Vue Router guards
6. **Accurate fuel efficiency** calculations with MPG and L/100km support
7. **Template-based report generation** with PDF/Excel export and email delivery
8. **Bilingual i18n** with nested keys and translation parity validation

All decisions prioritize the Google Workspace ecosystem, Vue 3 best practices, and maintainability for long-term operation.
