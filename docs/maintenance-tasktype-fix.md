# Maintenance TaskType Fix - Database Schema Migration Guide

⚠️ **Note**: This document covers the database schema fix. For the update functionality fix, see [maintenance-tasktype-update-fix.md](maintenance-tasktype-update-fix.md).

## Problem

The maintenance task type field was not being saved because of a mismatch between the database schema and the application code:

- **Database Schema**: Uses column name `'type'`
- **Application Code**: Uses field name `'taskType'`

When saving a maintenance task, the `taskType` value couldn't map to the `'type'` column, so it was either not saved or saved to the wrong column.

**This fix addresses CREATE operations.** For UPDATE operations, see the companion fix in [maintenance-tasktype-update-fix.md](maintenance-tasktype-update-fix.md).

## Solution

We've updated the database schema and created a migration script to fix existing data.

### Changes Made

#### 1. Updated Database Schema ([gas/utils/DatabaseSetup.gs](../gas/utils/DatabaseSetup.gs))

Changed the maintenanceTasks sheet schema from:
```javascript
const headers = [
  'taskId',
  'vehicleId',
  'type',           // ❌ Old name
  'description',
  'priority',
  'dueDate',        // ❌ Old name
  'status',
  'assignedTechnician',
  'startDate',      // ❌ Removed
  'completedDate',
  'duration',       // ❌ Removed
  'notes',
  'cost',           // ❌ Removed
  'recurring',      // ❌ Old name
  'recurrenceInterval',
  'recurrenceType',
  'createdAt',
  'updatedAt',
  'createdBy',
  'changedBy',
]
```

To:
```javascript
const headers = [
  'taskId',
  'vehicleId',
  'taskType',           // ✅ Matches application code
  'description',
  'priority',
  'scheduledDate',      // ✅ Matches application code
  'dueOdometer',        // ✅ New field
  'status',
  'assignedTechnician',
  'isRecurring',        // ✅ Matches application code
  'recurrenceInterval',
  'recurrenceType',
  'completedDate',
  'laborHours',         // ✅ New field
  'notes',
  'createdAt',
  'updatedAt',
  'createdBy',
  'changedBy',
]
```

#### 2. Created Migration Script ([gas/utils/DatabaseMigration.gs](../gas/utils/DatabaseMigration.gs))

A new migration utility that:
- Renames columns to match application code
- Preserves all existing data
- Removes obsolete columns
- Adds new columns with empty values

## How to Apply the Fix

### Step 1: Verify Current Schema

1. Open your Google Apps Script project
2. Run the verification function to check if migration is needed:

```javascript
verifyMaintenanceTasksSchema()
```

**Expected Output if migration is needed:**
```json
{
  "success": false,
  "hasTaskType": false,
  "hasOldType": true,
  "message": "Schema needs migration - 'type' column should be renamed to 'taskType'",
  "currentHeaders": [...],
  "expectedHeaders": [...]
}
```

### Step 2: Run the Migration

⚠️ **IMPORTANT: Backup your data first!**

1. Export your maintenanceTasks sheet as CSV (File > Download > CSV)
2. In Apps Script, run the migration function:

```javascript
migrateMaintenanceTasksSchema()
```

**Expected Output:**
```json
{
  "success": true,
  "message": "maintenanceTasks schema migrated successfully",
  "recordsMigrated": 25,
  "oldHeaders": ["taskId", "vehicleId", "type", ...],
  "newHeaders": ["taskId", "vehicleId", "taskType", ...]
}
```

### Step 3: Verify Migration Success

Run the verification function again:

```javascript
verifyMaintenanceTasksSchema()
```

**Expected Output after successful migration:**
```json
{
  "success": true,
  "hasTaskType": true,
  "hasOldType": false,
  "message": "Schema is correct"
}
```

### Step 4: Test in Application

1. Log into your AutoCheck application
2. Navigate to the Maintenance page
3. Create a new maintenance task
4. Select a task type (e.g., "Preventive")
5. Fill in other required fields and save
6. View the task details - the task type should now display correctly

## Column Mapping

The migration script automatically handles these column renames:

| Old Column Name | New Column Name | Notes |
|----------------|-----------------|-------|
| `type` | `taskType` | Main fix for the issue |
| `dueDate` | `scheduledDate` | Matches application code |
| `recurring` | `isRecurring` | Boolean field, clearer naming |
| `startDate` | _(removed)_ | Not used in current schema |
| `duration` | _(removed)_ | Not used in current schema |
| `cost` | _(removed)_ | Not used in current schema |
| _(none)_ | `dueOdometer` | New field added |
| _(none)_ | `laborHours` | New field added |

## Rollback (If Needed)

If something goes wrong during migration:

1. **Restore from backup**: Import your CSV backup
2. **Manual rollback**: The migration script only updates the maintenanceTasks sheet, so you can manually restore the old headers if needed

## Technical Details

### Why This Happened

The `DatabaseUtil.objectToRow()` function (in [gas/utils/DatabaseUtil.gs](../gas/utils/DatabaseUtil.gs)) maps JavaScript object properties to Google Sheets columns **by matching property names to column headers**.

When the service creates a task with `taskType: 'PREVENTIVE'`, but the sheet has a column named `'type'`, the mapping fails and the value isn't saved to the correct column.

### Example of the Issue

**JavaScript Object (from MaintenanceService.gs:43):**
```javascript
const task = {
  taskId: 'abc-123',
  vehicleId: 'def-456',
  taskType: 'PREVENTIVE',  // ❌ This field name doesn't match
  description: 'Oil change',
  // ... other fields
}
```

**Google Sheet Headers (old schema):**
```
taskId | vehicleId | type | description | ...
                     ↑
                     ❌ Column name doesn't match 'taskType'
```

**Result:** The `taskType` value has nowhere to go, so it's not saved.

### The Fix

**Updated Google Sheet Headers:**
```
taskId | vehicleId | taskType | description | ...
                     ↑
                     ✅ Now matches the object property name
```

**Result:** The `taskType` value is correctly saved to the `taskType` column.

## After Migration

Once migration is complete:

1. ✅ New maintenance tasks will have their task type saved correctly
2. ✅ Existing tasks will retain all their data (except the old `type` column which had empty values)
3. ✅ Task types will display properly in the UI
4. ✅ Filters by task type will work correctly

## Troubleshooting

### "AUTH_SPREADSHEET_ID not configured"

**Problem:** Script properties not set

**Solution:**
1. Go to Project Settings (gear icon)
2. Add script property: `AUTH_SPREADSHEET_ID` with your spreadsheet ID

### "maintenanceTasks sheet not found"

**Problem:** Database not initialized

**Solution:** Run `setupDatabase()` first to create all sheets

### Migration runs but data is lost

**Problem:** Data wasn't backed up

**Solution:**
1. Stop immediately
2. Check Google Sheets version history (File > Version History)
3. Restore to version before migration
4. Back up data and try again

### Task type still not saving after migration

**Problem:** Possible caching or deployment issue

**Solutions:**
1. **Clear browser cache** and refresh the application
2. **Redeploy the backend**: In Apps Script, create a new deployment
3. **Check logs**: In Apps Script, View > Execution log to see if errors occur
4. **Verify schema again**: Run `verifyMaintenanceTasksSchema()` to confirm

## For New Installations

If you're setting up a fresh database:

1. Run `setupDatabase()` - this will use the updated schema automatically
2. No migration needed - the schema is already correct

## Questions?

If you encounter issues not covered here:

1. Check the Apps Script execution logs (View > Execution log)
2. Verify the spreadsheet ID is correct
3. Ensure you have edit permissions on the spreadsheet
4. Review the migration output for specific error messages

---

**Last Updated**: December 2025
**Applies to**: AutoCheck version with maintenance task type fix
