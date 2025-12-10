# Maintenance TaskType Update Fix

## Problem

Only the "Preventive" task type was being recorded in the database. When users selected other task types (Corrective, Predictive, or Inspection), those selections were not being saved.

### Root Cause

The issue was in the `updateMaintenanceTask` function in [gas/services/MaintenanceService.gs](../gas/services/MaintenanceService.gs).

**The update function was missing the `taskType` field entirely.**

When a user:
1. Creates a new task → taskType is saved correctly (default: PREVENTIVE)
2. Edits that task and changes the taskType → taskType is NOT updated because the update function doesn't handle it

This meant:
- ✅ New tasks with PREVENTIVE (default) are saved correctly
- ❌ Changing taskType to CORRECTIVE, PREDICTIVE, or INSPECTION doesn't work
- ❌ Editing an existing task and changing its taskType has no effect

## Solution

Added the `taskType` field to the list of updatable fields in the `updateMaintenanceTask` function.

### Changes Made

**File**: [gas/services/MaintenanceService.gs](../gas/services/MaintenanceService.gs)

**Lines 137-145**: Added validation and update logic for taskType

```javascript
// BEFORE (missing taskType handling)
updateMaintenanceTask: function (taskId, updates, changedBy) {
  const task = this.getMaintenanceTaskById(taskId)

  // Validate status if being updated
  if (updates.status) {
    this.validateTaskStatus(updates.status)
  }

  // Update allowed fields
  if (updates.description !== undefined) {
    task.description = SecurityInterceptor.sanitizeInput(updates.description)
  }
  // ... other fields ...
}
```

```javascript
// AFTER (includes taskType handling)
updateMaintenanceTask: function (taskId, updates, changedBy) {
  const task = this.getMaintenanceTaskById(taskId)

  // Validate status if being updated
  if (updates.status) {
    this.validateTaskStatus(updates.status)
  }

  // Validate task type if being updated
  if (updates.taskType) {
    this.validateTaskType(updates.taskType)
  }

  // Update allowed fields
  if (updates.taskType !== undefined) {
    task.taskType = updates.taskType
  }
  if (updates.description !== undefined) {
    task.description = SecurityInterceptor.sanitizeInput(updates.description)
  }
  // ... other fields ...
}
```

**Lines 182-186**: Updated console log to include taskType for debugging

```javascript
// BEFORE
console.log('Maintenance task updated:', {
  taskId: taskId,
  status: task.status,
})

// AFTER
console.log('Maintenance task updated:', {
  taskId: taskId,
  taskType: task.taskType,
  status: task.status,
})
```

## How to Apply the Fix

### Option 1: Deploy Updated Code (Recommended)

1. The fix is already in the code ([gas/services/MaintenanceService.gs](../gas/services/MaintenanceService.gs))
2. Deploy the updated backend to Google Apps Script
3. Test by editing a maintenance task and changing its task type

### Option 2: Manual Fix (if you need to apply it separately)

1. Open your Google Apps Script project
2. Navigate to `gas/services/MaintenanceService.gs`
3. Find the `updateMaintenanceTask` function (around line 125)
4. Add the taskType validation and update logic as shown above
5. Save and deploy

## Testing the Fix

### Before Fix
1. Create a new maintenance task (taskType defaults to PREVENTIVE)
2. Edit the task and change taskType to CORRECTIVE
3. Save the task
4. View the task details
5. ❌ **Result**: TaskType still shows PREVENTIVE

### After Fix
1. Create a new maintenance task (taskType defaults to PREVENTIVE)
2. Edit the task and change taskType to CORRECTIVE
3. Save the task
4. View the task details
5. ✅ **Result**: TaskType now shows CORRECTIVE

### Test All Task Types

Create and edit tasks with each type to verify:
- ✅ PREVENTIVE - Preventive maintenance
- ✅ CORRECTIVE - Corrective maintenance (repairs)
- ✅ PREDICTIVE - Predictive maintenance (based on analysis)
- ✅ INSPECTION - Regular inspections

## Related Fixes

This fix works in conjunction with the database schema fix documented in [maintenance-tasktype-fix.md](maintenance-tasktype-fix.md).

**Both fixes are needed for complete functionality:**

1. **Schema Fix** (maintenance-tasktype-fix.md):
   - Changes database column from `'type'` to `'taskType'`
   - Ensures data is saved to the correct column
   - Required for CREATE operations

2. **Update Fix** (this document):
   - Adds taskType to the update function
   - Ensures taskType can be changed when editing
   - Required for UPDATE operations

## Verification

After deploying the fix, verify it's working:

### 1. Check Logs
When you update a task, the console log should show:
```
Maintenance task updated: {
  taskId: "abc-123-def-456",
  taskType: "CORRECTIVE",  // ✅ Should reflect the new value
  status: "SCHEDULED"
}
```

### 2. Check Database
Open your Google Sheet and verify:
- The `taskType` column exists (from schema fix)
- Task records show the correct taskType value
- Editing a task updates the taskType in the sheet

### 3. Check UI
In the application:
- Create a task with PREVENTIVE → should save
- Edit it to CORRECTIVE → should update
- View the task → should show CORRECTIVE
- Edit it to INSPECTION → should update
- View the task → should show INSPECTION

## Troubleshooting

### TaskType still not updating after fix

**Possible causes:**
1. Code not deployed to Apps Script
2. Browser cache not cleared
3. Old version of code still running

**Solutions:**
1. Redeploy the Apps Script backend
2. Clear browser cache and reload
3. Check Apps Script logs to verify the updated log message appears

### "Invalid task type" error

**Problem:** Validation is working, but value being sent is incorrect

**Solution:** Check that the form is sending uppercase values:
- ✅ Correct: `PREVENTIVE`, `CORRECTIVE`, `PREDICTIVE`, `INSPECTION`
- ❌ Incorrect: `preventive`, `Preventive`, etc.

### TaskType shows "undefined" in UI

**Problem:** Schema fix not applied

**Solution:**
1. Run the database migration from [maintenance-tasktype-fix.md](maintenance-tasktype-fix.md)
2. Ensure the column is named `taskType` not `type`

## Summary

**What was broken:**
- Only PREVENTIVE task type could be saved (because it's the default)
- Changing to CORRECTIVE, PREDICTIVE, or INSPECTION had no effect

**What was fixed:**
- Added taskType to the update function
- Added validation for taskType during updates
- Added logging to track taskType changes

**Result:**
- ✅ All four task types can now be saved
- ✅ Task types can be changed when editing tasks
- ✅ Task types display correctly in the UI

---

**Last Updated**: December 2025
**Applies to**: Maintenance task type update functionality
**Related**: [maintenance-tasktype-fix.md](maintenance-tasktype-fix.md) (schema fix)
