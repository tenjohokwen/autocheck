# Implementation Tasks: Vehicle Maintenance Management System

**Feature Branch**: `001-vehicle-maintenance`
**Created**: 2025-11-26
**Status**: Ready for Implementation
**Related Documents**: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md)

## Overview

This document provides a complete, dependency-ordered task breakdown for implementing the AutoCheck Vehicle Maintenance Management System. Tasks are organized into phases, with each user story phase designed to be independently testable.

**Task Format**: `- [ ] [TaskID] [P?] [Story?] Description with exact file path`

- **TaskID**: Sequential identifier (T001, T002, etc.)
- **[P]**: Parallelizable - can be executed independently
- **[Story]**: User story reference ([US1], [US2], etc.) - ONLY for user story phases
- **Description**: Clear action with specific file path

---

## Phase 1: Project Setup

**Goal**: Initialize project structure, dependencies, and development environment

**Duration Estimate**: 1-2 hours

### Tasks

- [ ] T001 Verify Node.js and npm versions meet requirements (Node 18+, npm 9+)
- [ ] T002 Install Quasar CLI globally: `npm install -g @quasar/cli`
- [ ] T003 Verify package.json dependencies for Vue 3.5, Quasar 2.16, Pinia 3.0
- [ ] T004 Run `npm install` to install all frontend dependencies
- [ ] T005 Create Google Sheets "AutoCheck Database" spreadsheet with sharing permissions
- [ ] T006 Set up Google Apps Script project linked to the spreadsheet
- [ ] T007 Configure clasp for GAS deployment: `clasp login` and `clasp clone`
- [ ] T008 Create .env file with GAS_SCRIPT_ID and API_BASE_URL configuration
- [ ] T009 Verify existing authentication infrastructure (SecurityInterceptor, TokenManager) is functional
- [ ] T010 Create specs/001-vehicle-maintenance/tasks.md (this file) in repository
- [ ] T011 Run `quasar dev` to verify frontend development server starts successfully
- [ ] T012 Run initial GAS deployment: `clasp push` to verify backend deployment works

**Checkpoint**: Development environment ready, dependencies installed, GAS connected

---

## Phase 2: Foundational Infrastructure (BLOCKING)

**Goal**: Establish critical prerequisites that ALL user stories depend on

**Duration Estimate**: 4-6 hours

**WARNING**: No user story work can begin until this phase is complete.

### Backend Foundation

- [ ] T013 Create Google Sheets tabs: Users, Fleets, Vehicles, MaintenanceTasks, Fillups, Expenses, Parts, Documents, Reminders, Reports in /gas/Main.gs
- [ ] T014 Add organizationId column to ALL sheet tabs for multi-tenancy isolation
- [ ] T015 Add changedBy column to ALL sheet tabs for audit trail
- [ ] T016 Configure SecurityInterceptor to support Fleet Manager and Technician roles in /gas/security/SecurityInterceptor.gs
- [ ] T017 Create RoleValidator utility with isFleetManager() and isTechnician() methods in /gas/utils/RoleValidator.gs
- [ ] T018 Add role-based access check in SecurityInterceptor before routing requests
- [ ] T019 Update TokenManager to include user role in JWT payload in /gas/security/TokenManager.gs
- [ ] T020 Create DatabaseUtil with getSheetByName() and appendRow() helpers in /gas/utils/DatabaseUtil.gs
- [ ] T021 Add organizationId filter enforcement in DatabaseUtil queries
- [ ] T022 Create ErrorHandler utility for standardized error responses in /gas/utils/ErrorHandler.gs

### Frontend Foundation

- [ ] T023 Configure vue-i18n with en-US and fr-FR locales in /src/boot/i18n.js
- [ ] T024 Create base translation keys for common terms (save, cancel, delete, error, success) in /src/i18n/en-US/index.js
- [ ] T025 Create matching French translations in /src/i18n/fr-FR/index.js
- [ ] T026 Update authStore to store user role (fleetManager/technician) in /src/stores/authStore.js
- [ ] T027 Create useRoleAccess composable with hasAccess(feature) method in /src/composables/useRoleAccess.js
- [ ] T028 Add role-based route guard in Vue Router checking authStore.role in /src/router/index.js
- [ ] T029 Create PermissionDenied.vue page for unauthorized access in /src/pages/PermissionDenied.vue
- [ ] T030 Update axios interceptor to attach token and handle 401/403 responses in /src/boot/axios.js
- [ ] T031 Configure Quasar notify plugin for global success/error messages in /src/boot/axios.js
- [ ] T032 Create LoadingIndicator.vue component (already exists, verify < 250 lines) in /src/components/shared/LoadingIndicator.vue
- [ ] T033 Create ErrorDisplay.vue component (already exists, verify < 250 lines) in /src/components/shared/ErrorDisplay.vue

**Checkpoint**: Authentication, i18n, role-based access, database structure ready

---

## Phase 3: User Story 1 - Fleet and Vehicle Management (P1)

**Goal**: Enable fleet managers to create fleets and manage vehicles with soft delete support

**Independent Test**: Create a fleet, add 3 vehicles with different details, archive one vehicle, verify fleet displays correctly with accurate vehicle counts excluding archived vehicles.

**Duration Estimate**: 12-16 hours

### Backend - Data Models & Services

- [ ] T034 [P] [US1] Create Fleet model with id, organizationId, name, description, vehicleCount, createdBy, changedBy fields in /gas/models/Fleet.gs
- [ ] T035 [P] [US1] Create Vehicle model with all fields including archived, archivedDate, archivedReason in /gas/models/Vehicle.gs
- [ ] T036 [P] [US1] Create FleetService with createFleet(data, userId, orgId) method in /gas/services/FleetService.gs
- [ ] T037 [P] [US1] Create FleetService.getFleetsByOrganization(orgId) method with active vehicle count calculation
- [ ] T038 [P] [US1] Create FleetService.updateFleet(fleetId, data, userId) method with changedBy tracking
- [ ] T039 [P] [US1] Create FleetService.deleteFleet(fleetId, userId) method (sets vehicles to fleetId=null)
- [ ] T040 [P] [US1] Create VehicleService with createVehicle(data, userId, orgId) method in /gas/services/VehicleService.gs
- [ ] T041 [P] [US1] Create VehicleService.getVehiclesByOrganization(orgId, includeArchived=false) with archived filtering
- [ ] T042 [P] [US1] Create VehicleService.updateVehicle(vehicleId, data, userId) method with odometer validation
- [ ] T043 [P] [US1] Create VehicleService.archiveVehicle(vehicleId, reason, userId) method setting archived=true, archivedDate=NOW
- [ ] T044 [P] [US1] Create VehicleService.addVehicleToFleet(vehicleId, fleetId, userId) method
- [ ] T045 [P] [US1] Create VehicleService.removeVehicleFromFleet(vehicleId, userId) method
- [ ] T046 [US1] Add VehicleService.validateLicensePlateUnique(licensePlate, orgId, excludeVehicleId) check
- [ ] T047 [US1] Add VehicleService.preventDuplicateLicensePlate() in createVehicle and updateVehicle methods

### Backend - API Handlers

- [ ] T048 [US1] Create FleetHandler.createFleet() in /gas/handlers/FleetHandler.gs routing to FleetService
- [ ] T049 [US1] Create FleetHandler.listFleets() with organizationId filter and role check
- [ ] T050 [US1] Create FleetHandler.updateFleet() with Fleet Manager role requirement
- [ ] T051 [US1] Create FleetHandler.deleteFleet() with Fleet Manager role requirement
- [ ] T052 [US1] Create VehicleHandler.createVehicle() in /gas/handlers/VehicleHandler.gs with license plate validation
- [ ] T053 [US1] Create VehicleHandler.listVehicles() with archived filter parameter
- [ ] T054 [US1] Create VehicleHandler.getVehicleDetails(vehicleId) method
- [ ] T055 [US1] Create VehicleHandler.updateVehicle() with Fleet Manager role requirement
- [ ] T056 [US1] Create VehicleHandler.archiveVehicle() with soft delete implementation
- [ ] T057 [US1] Create VehicleHandler.assignToFleet() method
- [ ] T058 [US1] Create VehicleHandler.removeFromFleet() method
- [ ] T059 [US1] Register fleet.* and vehicle.* routes in Router.gs

### Frontend - Stores

- [ ] T060 [US1] Create fleetStore with state: fleets[], selectedFleet, loading in /src/stores/fleetStore.js
- [ ] T061 [US1] Add fleetStore.fetchFleets() action calling API fleet.list endpoint
- [ ] T062 [US1] Add fleetStore.createFleet(fleetData) action
- [ ] T063 [US1] Add fleetStore.updateFleet(fleetId, fleetData) action
- [ ] T064 [US1] Add fleetStore.deleteFleet(fleetId) action
- [ ] T065 [US1] Create vehicleStore with state: vehicles[], selectedVehicle, loading, includeArchived in /src/stores/vehicleStore.js
- [ ] T066 [US1] Add vehicleStore.fetchVehicles(includeArchived=false) action
- [ ] T067 [US1] Add vehicleStore.createVehicle(vehicleData) action
- [ ] T068 [US1] Add vehicleStore.updateVehicle(vehicleId, vehicleData) action
- [ ] T069 [US1] Add vehicleStore.archiveVehicle(vehicleId, reason) action
- [ ] T070 [US1] Add vehicleStore.assignToFleet(vehicleId, fleetId) action
- [ ] T071 [US1] Add vehicleStore.removeFromFleet(vehicleId) action
- [ ] T072 [US1] Add computed getter vehicleStore.activeVehicles filtering archived=false
- [ ] T073 [US1] Add computed getter vehicleStore.archivedVehicles filtering archived=true

### Frontend - Components

- [ ] T074 [US1] Create FleetList.vue component displaying fleets with vehicle counts (max 250 lines) in /src/components/fleet/FleetList.vue
- [ ] T075 [US1] Create FleetForm.vue component with name and description fields using QInput in /src/components/fleet/FleetForm.vue
- [ ] T076 [US1] Create FleetCard.vue component showing fleet summary with QCard in /src/components/fleet/FleetCard.vue
- [ ] T077 [US1] Create VehicleList.vue component with QTable, archived filter toggle in /src/components/vehicle/VehicleList.vue
- [ ] T078 [US1] Create VehicleForm.vue component with make, model, year, licensePlate, vehicleType, seats fields in /src/components/vehicle/VehicleForm.vue
- [ ] T079 [US1] Add VehicleForm validation: year 1900-2026, seats 1-99, licensePlate required
- [ ] T080 [US1] Create VehicleCard.vue component with vehicle details and archive status badge in /src/components/vehicle/VehicleCard.vue
- [ ] T081 [US1] Create ArchiveVehicleDialog.vue component with reason input using QDialog in /src/components/vehicle/ArchiveVehicleDialog.vue
- [ ] T082 [US1] Create FleetAssignmentDialog.vue component with fleet selection dropdown in /src/components/vehicle/FleetAssignmentDialog.vue

### Frontend - Pages

- [ ] T083 [US1] Create FleetListPage.vue with "Create Fleet" button, FleetList component in /src/pages/Fleet/FleetListPage.vue
- [ ] T084 [US1] Create FleetDetailPage.vue showing fleet vehicles with add/remove actions in /src/pages/Fleet/FleetDetailPage.vue
- [ ] T085 [US1] Create VehicleListPage.vue with "Create Vehicle" button, archived filter toggle in /src/pages/Vehicle/VehicleListPage.vue
- [ ] T086 [US1] Create VehicleDetailPage.vue showing vehicle details, maintenance history, archive button in /src/pages/Vehicle/VehicleDetailPage.vue
- [ ] T087 [US1] Add role-based UI: Hide create/edit/delete buttons for Technicians using v-if="hasAccess('fleet.manage')"
- [ ] T088 [US1] Add i18n keys for fleet/vehicle labels in en-US and fr-FR locales

### Frontend - Routes & Integration

- [ ] T089 [US1] Add /fleets route to router with lazy-loaded FleetListPage in /src/router/routes.js
- [ ] T090 [US1] Add /fleets/:id route with lazy-loaded FleetDetailPage
- [ ] T091 [US1] Add /vehicles route with lazy-loaded VehicleListPage
- [ ] T092 [US1] Add /vehicles/:id route with lazy-loaded VehicleDetailPage
- [ ] T093 [US1] Add navigation menu items for Fleets and Vehicles in MainLayout.vue
- [ ] T094 [US1] Test create fleet → add 3 vehicles → archive 1 vehicle → verify fleet count excludes archived

**Checkpoint**: Fleet and vehicle management fully functional with soft delete

---

## Phase 4: User Story 2 - Maintenance Logging and Scheduling (P1)

**Goal**: Enable maintenance task creation, assignment, status tracking, and recurring task generation

**Independent Test**: Create a preventive maintenance task (oil change) scheduled for next week, assign it to a technician, change status to in-progress when work starts, record completion with notes and cost. Verify recurring task generates next occurrence.

**Duration Estimate**: 14-18 hours

### Backend - Data Models & Services

- [ ] T095 [P] [US2] Create MaintenanceTask model with all fields including recurring, recurrenceIntervalDays, recurrenceIntervalKm in /gas/models/MaintenanceTask.gs
- [ ] T096 [P] [US2] Create MaintenanceService with createTask(data, userId, orgId) method in /gas/services/MaintenanceService.gs
- [ ] T097 [P] [US2] Create MaintenanceService.getTasksByVehicle(vehicleId) method
- [ ] T098 [P] [US2] Create MaintenanceService.getTasksByTechnician(technicianId) method for technician view
- [ ] T099 [P] [US2] Create MaintenanceService.updateTaskStatus(taskId, status, userId) with state validation
- [ ] T100 [P] [US2] Create MaintenanceService.rescheduleTask(taskId, newDueDate, userId) preserving scheduledDate
- [ ] T101 [P] [US2] Create MaintenanceService.assignTechnician(taskId, technicianId, userId) method
- [ ] T102 [P] [US2] Create MaintenanceService.completeTask(taskId, notes, cost, duration, userId) method
- [ ] T103 [P] [US2] Create RecurringTaskService with generateNextOccurrence(parentTaskId) in /gas/services/RecurringTaskService.gs
- [ ] T104 [US2] Add RecurringTaskService.calculateNextDueDate(parentTask) for time-based recurrence
- [ ] T105 [US2] Add RecurringTaskService.calculateNextDueMileage(parentTask, vehicleOdometer) for mileage-based
- [ ] T106 [US2] Add RecurringTaskService.shouldGenerateTask(parentTask, currentDate, vehicleOdometer) check
- [ ] T107 [US2] Add RecurringTaskService.cancelFutureRecurringTasks(vehicleId) for archived vehicles
- [ ] T108 [US2] Create time-driven trigger function processRecurringTasks() running daily in /gas/triggers/RecurringTaskTrigger.gs

### Backend - API Handlers

- [ ] T109 [US2] Create MaintenanceHandler.createTask() in /gas/handlers/MaintenanceHandler.gs with Fleet Manager role check
- [ ] T110 [US2] Create MaintenanceHandler.listTasks() with vehicleId or technicianId filter
- [ ] T111 [US2] Create MaintenanceHandler.getTaskDetails(taskId) method
- [ ] T112 [US2] Create MaintenanceHandler.updateStatus() allowing Technicians to update assigned tasks
- [ ] T113 [US2] Create MaintenanceHandler.rescheduleTask() with Fleet Manager role requirement
- [ ] T114 [US2] Create MaintenanceHandler.assignTechnician() method
- [ ] T115 [US2] Create MaintenanceHandler.completeTask() method accessible by assigned Technician
- [ ] T116 [US2] Create MaintenanceHandler.generateRecurringTasks() manual trigger endpoint
- [ ] T117 [US2] Register maintenance.* routes in Router.gs

### Frontend - Stores

- [ ] T118 [US2] Create maintenanceStore with state: tasks[], selectedTask, loading in /src/stores/maintenanceStore.js
- [ ] T119 [US2] Add maintenanceStore.fetchTasks(filters) action with vehicle/technician/status filters
- [ ] T120 [US2] Add maintenanceStore.createTask(taskData) action
- [ ] T121 [US2] Add maintenanceStore.updateStatus(taskId, status) action
- [ ] T122 [US2] Add maintenanceStore.rescheduleTask(taskId, newDate) action
- [ ] T123 [US2] Add maintenanceStore.assignTechnician(taskId, technicianId) action
- [ ] T124 [US2] Add maintenanceStore.completeTask(taskId, completionData) action
- [ ] T125 [US2] Add computed getter maintenanceStore.scheduledTasks filtering status='scheduled'
- [ ] T126 [US2] Add computed getter maintenanceStore.inProgressTasks filtering status='in-progress'
- [ ] T127 [US2] Add computed getter maintenanceStore.completedTasks filtering status='completed'
- [ ] T128 [US2] Add computed getter maintenanceStore.myTasks filtering by current user if Technician

### Frontend - Components

- [ ] T129 [US2] Create MaintenanceTaskList.vue component with QTable, status filters, date sorting in /src/components/maintenance/MaintenanceTaskList.vue
- [ ] T130 [US2] Create MaintenanceTaskForm.vue with type, description, priority, dueDate, recurring toggle in /src/components/maintenance/MaintenanceTaskForm.vue
- [ ] T131 [US2] Add recurring interval inputs (days/km) to MaintenanceTaskForm conditionally shown
- [ ] T132 [US2] Create MaintenanceTaskCard.vue showing task summary with status badge in /src/components/maintenance/MaintenanceTaskCard.vue
- [ ] T133 [US2] Create TaskStatusStepper.vue component showing scheduled → in-progress → completed flow in /src/components/maintenance/TaskStatusStepper.vue
- [ ] T134 [US2] Create AssignTechnicianDialog.vue with technician selection dropdown in /src/components/maintenance/AssignTechnicianDialog.vue
- [ ] T135 [US2] Create CompleteTaskDialog.vue with notes, cost, duration inputs using QDialog in /src/components/maintenance/CompleteTaskDialog.vue
- [ ] T136 [US2] Create RescheduleDialog.vue with QDatePicker for new due date in /src/components/maintenance/RescheduleDialog.vue

### Frontend - Pages & Integration

- [ ] T137 [US2] Create MaintenanceListPage.vue with task list, filters, "Schedule Maintenance" button in /src/pages/Maintenance/MaintenanceListPage.vue
- [ ] T138 [US2] Create MaintenanceDetailPage.vue showing task details, status actions, part replacements in /src/pages/Maintenance/MaintenanceDetailPage.vue
- [ ] T139 [US2] Add maintenance task section to VehicleDetailPage.vue showing vehicle's tasks
- [ ] T140 [US2] Add "My Tasks" view for Technicians showing only assigned tasks
- [ ] T141 [US2] Add role-based UI: Technicians can only update status/complete assigned tasks
- [ ] T142 [US2] Add i18n keys for maintenance types, priorities, statuses in both locales
- [ ] T143 [US2] Add /maintenance route to router in /src/router/routes.js
- [ ] T144 [US2] Add /maintenance/:id route for task details
- [ ] T145 [US2] Test create recurring task → verify next occurrence generates after completion

**Checkpoint**: Maintenance scheduling, assignment, and recurring task generation working

---

## Phase 5: User Story 3 - Fuel Tracking and Efficiency (P2)

**Goal**: Enable fuel fill-up recording with automatic efficiency calculation and fleet comparison

**Independent Test**: Record 3 fill-ups for a vehicle with different amounts and odometer readings, verify first shows "N/A", subsequent show calculated L/100km, fleet dashboard shows efficiency comparison.

**Duration Estimate**: 10-12 hours

### Backend - Data Models & Services

- [ ] T146 [P] [US3] Create FillUp model with all fields including efficiency calculation fields in /gas/models/FillUp.gs
- [ ] T147 [P] [US3] Create FillUpService with createFillUp(data, userId, orgId) method in /gas/services/FillUpService.gs
- [ ] T148 [P] [US3] Create FillUpService.calculateEfficiency(fillUp) method handling first fill-up edge case
- [ ] T149 [US3] Add FillUpService.getPreviousFillUp(vehicleId, currentOdometerReading) query
- [ ] T150 [US3] Add FillUpService.getVehicleAverageEfficiency(vehicleId) calculation
- [ ] T151 [US3] Add FillUpService.getFleetEfficiencyComparison(fleetId) aggregation
- [ ] T152 [US3] Add FillUpService.validateOdometerReading(vehicleId, newReading) ensuring monotonic increase
- [ ] T153 [US3] Create auto-expense generation: createFillUp() also calls ExpenseService.createExpense(category='fuel')

### Backend - API Handlers

- [ ] T154 [US3] Create FillUpHandler.createFillUp() in /gas/handlers/FillUpHandler.gs with odometer validation
- [ ] T155 [US3] Create FillUpHandler.listFillUps(vehicleId) method
- [ ] T156 [US3] Create FillUpHandler.getVehicleEfficiency(vehicleId) returning average efficiency
- [ ] T157 [US3] Create FillUpHandler.getFleetEfficiencyComparison(fleetId) method
- [ ] T158 [US3] Register fillup.* routes in Router.gs

### Frontend - Stores & Composables

- [ ] T159 [US3] Create fillUpStore with state: fillUps[], loading in /src/stores/fillUpStore.js
- [ ] T160 [US3] Add fillUpStore.fetchFillUps(vehicleId) action
- [ ] T161 [US3] Add fillUpStore.createFillUp(fillUpData) action
- [ ] T162 [US3] Add fillUpStore.getVehicleEfficiency(vehicleId) action
- [ ] T163 [US3] Add fillUpStore.getFleetEfficiency(fleetId) action
- [ ] T164 [US3] Create useFuelEfficiency composable with formatEfficiency(value, unit) in /src/composables/useFuelEfficiency.js
- [ ] T165 [US3] Add useFuelEfficiency.calculateEfficiency(fuelAmount, distance, unit) method

### Frontend - Components & Pages

- [ ] T166 [US3] Create FillUpForm.vue with date, fuelAmount, cost, odometerReading fields in /src/components/fillup/FillUpForm.vue
- [ ] T167 [US3] Add FillUpForm validation: odometer >= vehicle.currentOdometer, fuelAmount > 0
- [ ] T168 [US3] Create FillUpList.vue with QTable showing date, amount, efficiency in /src/components/fillup/FillUpList.vue
- [ ] T169 [US3] Create EfficiencyChart.vue component with line chart using Chart.js in /src/components/fillup/EfficiencyChart.vue
- [ ] T170 [US3] Create FleetEfficiencyComparison.vue with bar chart comparing vehicles in /src/components/fillup/FleetEfficiencyComparison.vue
- [ ] T171 [US3] Add FillUpList to VehicleDetailPage.vue showing vehicle's fill-up history
- [ ] T172 [US3] Add EfficiencyChart to VehicleDetailPage.vue
- [ ] T173 [US3] Create FuelTrackingPage.vue with fleet efficiency dashboard in /src/pages/Fuel/FuelTrackingPage.vue
- [ ] T174 [US3] Add i18n keys for fuel units, efficiency labels in both locales
- [ ] T175 [US3] Add /fuel route to router
- [ ] T176 [US3] Test first fill-up shows "N/A", second calculates efficiency correctly

**Checkpoint**: Fuel tracking with efficiency calculation and fleet comparison working

---

## Phase 6: User Story 4 - Maintenance Reminders and Alerts (P2)

**Goal**: Automatic reminder generation for maintenance due within 7 days and insurance expiring within 30 days

**Independent Test**: Create a maintenance task due in 5 days and set insurance expiring in 20 days, verify both alerts appear on dashboard with proper priority.

**Duration Estimate**: 8-10 hours

### Backend - Data Models & Services

- [ ] T177 [P] [US4] Create Reminder model with all fields in /gas/models/Reminder.gs
- [ ] T178 [P] [US4] Create ReminderService with createReminder(data, userId, orgId) in /gas/services/ReminderService.gs
- [ ] T179 [P] [US4] Create ReminderService.generateMaintenanceReminders(orgId) checking tasks due <= TODAY+7
- [ ] T180 [US4] Create ReminderService.generateInsuranceReminders(orgId) checking expiry <= TODAY+30
- [ ] T181 [US4] Create ReminderService.getActiveReminders(userId, orgId) filtering status='active'
- [ ] T182 [US4] Create ReminderService.acknowledgeReminder(reminderId, userId) method
- [ ] T183 [US4] Create ReminderService.dismissReminder(reminderId, userId) method
- [ ] T184 [US4] Create ReminderService.autoCompleteReminder(maintenanceTaskId) when task completes
- [ ] T185 [US4] Create time-driven trigger processReminders() running daily in /gas/triggers/ReminderTrigger.gs

### Backend - API Handlers

- [ ] T186 [US4] Create ReminderHandler.listReminders() in /gas/handlers/ReminderHandler.gs
- [ ] T187 [US4] Create ReminderHandler.acknowledgeReminder(reminderId) method
- [ ] T188 [US4] Create ReminderHandler.dismissReminder(reminderId) method
- [ ] T189 [US4] Create ReminderHandler.generateReminders() manual trigger endpoint
- [ ] T190 [US4] Register reminder.* routes in Router.gs
- [ ] T191 [US4] Update MaintenanceHandler.completeTask() to auto-complete related reminder

### Frontend - Stores & Components

- [ ] T192 [US4] Create reminderStore with state: reminders[], unreadCount in /src/stores/reminderStore.js
- [ ] T193 [US4] Add reminderStore.fetchReminders() action
- [ ] T194 [US4] Add reminderStore.acknowledgeReminder(reminderId) action
- [ ] T195 [US4] Add reminderStore.dismissReminder(reminderId) action
- [ ] T196 [US4] Add computed getter reminderStore.overdueReminders filtering dueDate < TODAY
- [ ] T197 [US4] Add computed getter reminderStore.upcomingReminders filtering dueDate >= TODAY
- [ ] T198 [US4] Create ReminderList.vue component with priority badges, overdue highlighting in /src/components/reminder/ReminderList.vue
- [ ] T199 [US4] Create ReminderBadge.vue showing unread count in app header in /src/components/reminder/ReminderBadge.vue
- [ ] T200 [US4] Create ReminderCard.vue with acknowledge/dismiss actions in /src/components/reminder/ReminderCard.vue

### Frontend - Pages & Integration

- [ ] T201 [US4] Add ReminderList to Dashboard (HomePage.vue) showing active reminders
- [ ] T202 [US4] Add ReminderBadge to MainLayout.vue header
- [ ] T203 [US4] Add reminder click navigation to related vehicle/task
- [ ] T204 [US4] Add i18n keys for reminder types and actions
- [ ] T205 [US4] Test maintenance due in 5 days creates reminder
- [ ] T206 [US4] Test insurance expiring in 25 days creates high-priority reminder

**Checkpoint**: Reminder generation and display working for maintenance and insurance

---

## Phase 7: User Story 5 - Expense Dashboard and Reports (P2)

**Goal**: Comprehensive expense tracking, dashboard visualization, and report generation

**Independent Test**: Record expenses across multiple categories (fuel, maintenance, insurance, toll), view dashboard showing categorized totals, generate monthly report showing all expense categories.

**Duration Estimate**: 12-16 hours

### Backend - Data Models & Services

- [ ] T207 [P] [US5] Create Expense model with all category fields in /gas/models/Expense.gs
- [ ] T208 [P] [US5] Create Report model with filter and schedule fields in /gas/models/Report.gs
- [ ] T209 [P] [US5] Create ExpenseService with createExpense(data, userId, orgId) in /gas/services/ExpenseService.gs
- [ ] T210 [P] [US5] Create ExpenseService.getExpensesByVehicle(vehicleId, startDate, endDate) method
- [ ] T211 [P] [US5] Create ExpenseService.getExpensesByCategory(orgId, category, startDate, endDate) aggregation
- [ ] T212 [P] [US5] Create ExpenseService.getTotalsByCategory(orgId, startDate, endDate) returning category totals
- [ ] T213 [P] [US5] Create ExpenseService.getVehicleRunningCosts(vehicleId, startDate, endDate) calculation
- [ ] T214 [P] [US5] Create ExpenseService.getFleetExpenseComparison(fleetId, startDate, endDate) method
- [ ] T215 [P] [US5] Create ReportService with generateReport(reportConfig) in /gas/services/ReportService.gs
- [ ] T216 [US5] Add ReportService.createReportDefinition(config, userId, orgId) for scheduled reports
- [ ] T217 [US5] Add ReportService.generateExpenseReportPDF(filters) using GAS PDF generation
- [ ] T218 [US5] Add ReportService.scheduleReport(reportId, schedule) setting up time trigger
- [ ] T219 [US5] Add ReportService.sendReportEmail(reportId, recipients) method
- [ ] T220 [US5] Create time-driven trigger processScheduledReports() in /gas/triggers/ReportTrigger.gs

### Backend - API Handlers

- [ ] T221 [US5] Create ExpenseHandler.createExpense() in /gas/handlers/ExpenseHandler.gs with Fleet Manager role
- [ ] T222 [US5] Create ExpenseHandler.listExpenses(filters) with vehicle/category/date filters
- [ ] T223 [US5] Create ExpenseHandler.getDashboardData(orgId, dateRange) returning category totals
- [ ] T224 [US5] Create ExpenseHandler.getVehicleRunningCosts(vehicleId) method
- [ ] T225 [US5] Create ExpenseHandler.generateReport(reportConfig) method
- [ ] T226 [US5] Create ExpenseHandler.scheduleReport(reportConfig) method
- [ ] T227 [US5] Register expense.* routes in Router.gs

### Frontend - Stores

- [ ] T228 [US5] Create expenseStore with state: expenses[], dashboardData, reports[] in /src/stores/expenseStore.js
- [ ] T229 [US5] Add expenseStore.fetchExpenses(filters) action
- [ ] T230 [US5] Add expenseStore.createExpense(expenseData) action
- [ ] T231 [US5] Add expenseStore.fetchDashboardData(dateRange) action
- [ ] T232 [US5] Add expenseStore.getVehicleRunningCosts(vehicleId) action
- [ ] T233 [US5] Add expenseStore.generateReport(config) action
- [ ] T234 [US5] Add expenseStore.scheduleReport(config) action

### Frontend - Components

- [ ] T235 [US5] Create ExpenseForm.vue with category, date, amount, description fields in /src/components/expense/ExpenseForm.vue
- [ ] T236 [US5] Create ExpenseList.vue with QTable, category/date filters in /src/components/expense/ExpenseList.vue
- [ ] T237 [US5] Create ExpenseCategoryChart.vue with pie chart showing category breakdown in /src/components/expense/ExpenseCategoryChart.vue
- [ ] T238 [US5] Create ExpenseTrendChart.vue with line chart showing monthly trends in /src/components/expense/ExpenseTrendChart.vue
- [ ] T239 [US5] Create ExpenseDashboard.vue component with category totals, charts, date range selector in /src/components/expense/ExpenseDashboard.vue
- [ ] T240 [US5] Create VehicleCostComparison.vue with bar chart comparing vehicle running costs in /src/components/expense/VehicleCostComparison.vue
- [ ] T241 [US5] Create ReportConfigDialog.vue with filters, schedule, recipients inputs in /src/components/expense/ReportConfigDialog.vue

### Frontend - Pages & Integration

- [ ] T242 [US5] Create ExpenseDashboardPage.vue with ExpenseDashboard component in /src/pages/Expense/ExpenseDashboardPage.vue
- [ ] T243 [US5] Create ReportsPage.vue listing scheduled reports with generate/edit actions in /src/pages/Expense/ReportsPage.vue
- [ ] T244 [US5] Add expense summary to VehicleDetailPage.vue
- [ ] T245 [US5] Add role-based UI: Hide expense features from Technicians
- [ ] T246 [US5] Add i18n keys for expense categories, report types
- [ ] T247 [US5] Add /expenses route to router
- [ ] T248 [US5] Add /reports route to router
- [ ] T249 [US5] Test record expenses → view dashboard → generate report with all categories

**Checkpoint**: Expense tracking, dashboard visualization, and report generation working

---

## Phase 8: User Story 6 - Repair History Tracking (P2)

**Goal**: Complete repair history view with filtering by technician, cost, date

**Independent Test**: Record 2 repairs for a vehicle with different technicians and costs, view repair history showing chronological order, filter by technician, sort by cost.

**Duration Estimate**: 6-8 hours

### Backend - Services & Handlers

- [ ] T250 [P] [US6] Create MaintenanceService.getRepairHistory(vehicleId, filters) in /gas/services/MaintenanceService.gs
- [ ] T251 [P] [US6] Add MaintenanceService.getRepairsByTechnician(technicianId, startDate, endDate) query
- [ ] T252 [US6] Add MaintenanceService.getTotalRepairCost(vehicleId, startDate, endDate) calculation
- [ ] T253 [US6] Add MaintenanceService.getRepairsByType(vehicleId, type) filtering
- [ ] T254 [US6] Create MaintenanceHandler.getRepairHistory(vehicleId) in /gas/handlers/MaintenanceHandler.gs
- [ ] T255 [US6] Update MaintenanceHandler.listTasks() to support repair history filters

### Frontend - Components & Pages

- [ ] T256 [US6] Create RepairHistoryList.vue with QTable, technician/cost/date filters in /src/components/maintenance/RepairHistoryList.vue
- [ ] T257 [US6] Create RepairHistoryCard.vue showing repair details with parts used in /src/components/maintenance/RepairHistoryCard.vue
- [ ] T258 [US6] Create RepairCostChart.vue showing cost trends over time in /src/components/maintenance/RepairCostChart.vue
- [ ] T259 [US6] Add RepairHistoryList to VehicleDetailPage.vue as separate tab
- [ ] T260 [US6] Add repair cost summary to ExpenseDashboardPage.vue
- [ ] T261 [US6] Add i18n keys for repair history labels
- [ ] T262 [US6] Test filter by technician, sort by cost, view repair details

**Checkpoint**: Repair history tracking and filtering working

---

## Phase 9: User Story 7 - Parts Inventory (P3)

**Goal**: Track replaced parts with complete replacement history

**Independent Test**: Add 3 replaced parts for a vehicle (brake pads, oil filter, air filter) with dates and costs, view replacement history showing chronological order, filter by part type, view total parts cost.

**Duration Estimate**: 8-10 hours

### Backend - Data Models & Services

- [ ] T263 [P] [US7] Create ReplacedPart model with all fields in /gas/models/ReplacedPart.gs
- [ ] T264 [P] [US7] Create PartService with createPart(data, userId, orgId) in /gas/services/PartService.gs
- [ ] T265 [P] [US7] Create PartService.getPartsByVehicle(vehicleId) method
- [ ] T266 [US7] Create PartService.getPartsByType(vehicleId, partType) filtering
- [ ] T267 [US7] Create PartService.getTotalPartsCost(vehicleId, startDate, endDate) calculation
- [ ] T268 [US7] Create PartService.getPartReplacementHistory(vehicleId, partType) method

### Backend - API Handlers

- [ ] T269 [US7] Create PartHandler.createPart() in /gas/handlers/PartHandler.gs
- [ ] T270 [US7] Create PartHandler.listParts(vehicleId) method
- [ ] T271 [US7] Create PartHandler.getPartHistory(vehicleId, partType) method
- [ ] T272 [US7] Register part.* routes in Router.gs
- [ ] T273 [US7] Update MaintenanceHandler.completeTask() to support adding parts

### Frontend - Stores & Components

- [ ] T274 [US7] Create partStore with state: parts[], loading in /src/stores/partStore.js
- [ ] T275 [US7] Add partStore.fetchParts(vehicleId) action
- [ ] T276 [US7] Add partStore.createPart(partData) action
- [ ] T277 [US7] Create PartForm.vue with partType, partNumber, price, quantity fields in /src/components/part/PartForm.vue
- [ ] T278 [US7] Add PartForm autocomplete for common part types
- [ ] T279 [US7] Create PartsList.vue with QTable, part type filter in /src/components/part/PartsList.vue
- [ ] T280 [US7] Create PartReplacementHistory.vue showing chronological part replacements in /src/components/part/PartReplacementHistory.vue
- [ ] T281 [US7] Add parts section to CompleteTaskDialog.vue for adding parts during task completion
- [ ] T282 [US7] Add PartReplacementHistory to VehicleDetailPage.vue
- [ ] T283 [US7] Add i18n keys for common part types
- [ ] T284 [US7] Test add parts → filter by type → view total cost

**Checkpoint**: Parts inventory tracking working

---

## Phase 10: User Story 8 - Document Management (P3)

**Goal**: Upload and organize vehicle documents with Google Drive integration

**Independent Test**: Upload 3 documents for a vehicle (insurance PDF, registration image, service receipt), verify they display with upload dates, download a document to confirm integrity.

**Duration Estimate**: 10-12 hours

### Backend - Data Models & Services

- [ ] T285 [P] [US8] Create Document model with all fields in /gas/models/Document.gs
- [ ] T286 [P] [US8] Create DocumentService with uploadDocument(file, metadata, userId, orgId) in /gas/services/DocumentService.gs
- [ ] T287 [P] [US8] Add DocumentService.createDriveFolder(organizationId, vehicleId) for organization
- [ ] T288 [US8] Add DocumentService.saveFileToDrive(fileBlob, folderId, fileName) method
- [ ] T289 [US8] Add DocumentService.getDocumentsByVehicle(vehicleId) query
- [ ] T290 [US8] Add DocumentService.getDocumentsByCategory(vehicleId, category) filtering
- [ ] T291 [US8] Add DocumentService.downloadDocument(documentId) returning Drive file
- [ ] T292 [US8] Add DocumentService.deleteDocument(documentId, userId) method
- [ ] T293 [US8] Add DocumentService.validateFileType(fileType) checking allowed types
- [ ] T294 [US8] Add DocumentService.validateFileSize(fileSize) checking 10MB limit
- [ ] T295 [US8] Create ReminderService.generateDocumentExpiryReminders(orgId) for expiring docs

### Backend - API Handlers

- [ ] T296 [US8] Create DocumentHandler.uploadDocument() in /gas/handlers/DocumentHandler.gs handling multipart/form-data
- [ ] T297 [US8] Create DocumentHandler.listDocuments(vehicleId) method
- [ ] T298 [US8] Create DocumentHandler.downloadDocument(documentId) method
- [ ] T299 [US8] Create DocumentHandler.deleteDocument(documentId) with Fleet Manager role
- [ ] T300 [US8] Register document.* routes in Router.gs

### Frontend - Stores & Components

- [ ] T301 [US8] Create documentStore with state: documents[], uploading in /src/stores/documentStore.js
- [ ] T302 [US8] Add documentStore.fetchDocuments(vehicleId) action
- [ ] T303 [US8] Add documentStore.uploadDocument(file, metadata) action with progress tracking
- [ ] T304 [US8] Add documentStore.downloadDocument(documentId) action
- [ ] T305 [US8] Add documentStore.deleteDocument(documentId) action
- [ ] T306 [US8] Create DocumentUploader.vue with QUploader, category selection, file validation in /src/components/document/DocumentUploader.vue
- [ ] T307 [US8] Add DocumentUploader file type validation (PDF, JPEG, PNG)
- [ ] T308 [US8] Add DocumentUploader file size validation (10MB limit)
- [ ] T309 [US8] Create DocumentList.vue with QTable, category filter, download/delete actions in /src/components/document/DocumentList.vue
- [ ] T310 [US8] Create DocumentCard.vue showing document preview, metadata in /src/components/document/DocumentCard.vue
- [ ] T311 [US8] Create DocumentViewer.vue for in-app document viewing in /src/components/document/DocumentViewer.vue

### Frontend - Pages & Integration

- [ ] T312 [US8] Add DocumentUploader and DocumentList to VehicleDetailPage.vue
- [ ] T313 [US8] Add document expiry reminders to ReminderList.vue
- [ ] T314 [US8] Add i18n keys for document categories, file types
- [ ] T315 [US8] Test upload PDF → upload image → download document → verify integrity

**Checkpoint**: Document management with Drive integration working

---

## Phase 11: Polish & Cross-Cutting Concerns

**Goal**: Finalize application with testing, optimization, documentation

**Duration Estimate**: 8-12 hours

### Testing

- [ ] T316 Write component tests for FleetForm, VehicleForm, MaintenanceTaskForm using Vitest
- [ ] T317 Write integration test for fleet creation workflow
- [ ] T318 Write integration test for maintenance task lifecycle (create → assign → complete)
- [ ] T319 Write API contract tests for all endpoints
- [ ] T320 Test role-based access: Technician cannot create fleets, vehicles
- [ ] T321 Test role-based access: Technician can update assigned tasks only
- [ ] T322 Test soft delete: Archived vehicles excluded from counts
- [ ] T323 Test recurring tasks: Verify next occurrence generates correctly
- [ ] T324 Test fuel efficiency: First fill-up shows "N/A", second calculates correctly
- [ ] T325 Test reminders: Maintenance due in 5 days creates reminder

### Performance & Optimization

- [ ] T326 Add lazy loading for all route components
- [ ] T327 Implement pagination for large lists (vehicles, tasks, expenses)
- [ ] T328 Add debouncing to search inputs
- [ ] T329 Optimize Google Sheets queries with proper filtering
- [ ] T330 Add loading indicators for all async operations
- [ ] T331 Implement error boundaries for graceful error handling
- [ ] T332 Add retry logic for failed API calls
- [ ] T333 Test dashboard load time < 3 seconds for 12 months data

### Security Hardening

- [ ] T334 Verify all endpoints check organizationId in SecurityInterceptor
- [ ] T335 Verify role-based access enforced on all mutation endpoints
- [ ] T336 Add input sanitization for all user inputs
- [ ] T337 Add CSRF protection for state-changing operations
- [ ] T338 Verify no sensitive data in frontend error messages
- [ ] T339 Add rate limiting for API endpoints
- [ ] T340 Verify file upload validation prevents malicious files

### Accessibility & UX

- [ ] T341 Add ARIA labels to all interactive elements
- [ ] T342 Verify keyboard navigation works for all forms
- [ ] T343 Test WCAG AA contrast ratios for all colors
- [ ] T344 Add focus indicators for all focusable elements
- [ ] T345 Test responsive design on mobile (320px, 768px, 1024px)
- [ ] T346 Add loading skeletons for better perceived performance
- [ ] T347 Add empty states for all lists
- [ ] T348 Add confirmation dialogs for destructive actions

### Documentation

- [ ] T349 Update README.md with project overview, setup instructions
- [ ] T350 Document API endpoints in contracts/ directory
- [ ] T351 Add JSDoc comments to all service methods
- [ ] T352 Create developer quickstart guide
- [ ] T353 Document deployment process for GAS
- [ ] T354 Add inline code comments for complex logic

### Internationalization

- [ ] T355 Verify all user-facing text uses i18n keys
- [ ] T356 Verify en-US and fr-FR translations in parity
- [ ] T357 Test language switching persists across sessions
- [ ] T358 Add date/number formatting for both locales
- [ ] T359 Test currency formatting for expense amounts

**Checkpoint**: Application fully tested, optimized, documented, and production-ready

---

## Dependencies & Execution Order

### Critical Path (MUST be sequential)

1. **Phase 1: Setup** → **Phase 2: Foundation** → All User Story Phases
2. **Phase 2: Foundation** BLOCKS all other phases
3. Within each user story phase:
   - Backend Models & Services (can run in parallel with [P] tag)
   - Backend Handlers (sequential, depends on services)
   - Frontend Stores (depends on handlers)
   - Frontend Components (depends on stores)
   - Frontend Pages & Integration (depends on components)

### Parallelization Opportunities

**Phase 2 Foundation** (after database setup):
- T016-T022 (Backend utilities) can run in parallel
- T023-T033 (Frontend foundation) can run in parallel
- Backend and Frontend tracks are independent until integration

**Phase 3 (US1) Fleet & Vehicle**:
- T034 Fleet model + T035 Vehicle model (parallel)
- T036-T039 FleetService methods (parallel)
- T040-T047 VehicleService methods (parallel)
- T074-T082 Components (parallel after stores complete)

**Phase 4 (US2) Maintenance**:
- T095 MaintenanceTask model + T103 RecurringTaskService (parallel)
- T096-T102 MaintenanceService methods (parallel)
- T129-T136 Components (parallel after stores complete)

**Phase 5 (US3) Fuel Tracking**:
- T146 FillUp model creation (parallel with service methods)
- T147-T153 FillUpService methods (parallel)
- T166-T170 Components (parallel after stores complete)

**Phase 6 (US4) Reminders**:
- T177 Reminder model + T178-T184 ReminderService methods (parallel)
- T198-T200 Components (parallel after stores complete)

**Phase 7 (US5) Expense & Reports**:
- T207 Expense model + T208 Report model (parallel)
- T209-T214 ExpenseService methods (parallel)
- T215-T220 ReportService methods (parallel)
- T235-T241 Components (parallel after stores complete)

**Phase 8 (US6) Repair History**:
- T250-T253 Service methods (parallel)
- T256-T258 Components (parallel after stores complete)

**Phase 9 (US7) Parts Inventory**:
- T263 ReplacedPart model + T264-T268 PartService methods (parallel)
- T277-T280 Components (parallel after stores complete)

**Phase 10 (US8) Document Management**:
- T285 Document model + T286-T295 DocumentService methods (parallel)
- T306-T311 Components (parallel after stores complete)

**Phase 11 Polish**:
- T316-T325 Tests (parallel by category)
- T326-T333 Performance (parallel)
- T334-T340 Security (parallel)
- T341-T348 Accessibility (parallel)
- T349-T354 Documentation (parallel)
- T355-T359 i18n (parallel)

---

## Parallel Execution Examples

### Example 1: Foundation Phase Backend
```bash
# These can run simultaneously on different developer machines
Developer A: T016-T019 (SecurityInterceptor & RoleValidator)
Developer B: T020-T022 (DatabaseUtil & ErrorHandler)
```

### Example 2: US1 Service Layer
```bash
# FleetService and VehicleService are independent
Developer A: T036-T039 (FleetService methods)
Developer B: T040-T047 (VehicleService methods)
```

### Example 3: US2 Components
```bash
# All components can be built in parallel after stores exist
Developer A: T129-T130 (MaintenanceTaskList & Form)
Developer B: T131-T133 (TaskCard & StatusStepper)
Developer C: T134-T136 (Dialogs)
```

### Example 4: Polish Phase
```bash
# Different team members tackle different areas
Developer A: T316-T325 (Testing)
Developer B: T326-T333 (Performance)
Developer C: T334-T340 (Security)
Developer D: T341-T348 (Accessibility)
Developer E: T349-T354 (Documentation)
```

---

## MVP Recommendation

**Minimum Viable Product**: User Story 1 + User Story 2 only

**Rationale**:
- US1 (Fleet & Vehicle Management) provides core data structure
- US2 (Maintenance Logging & Scheduling) delivers primary value proposition
- Together they enable basic fleet maintenance tracking
- All other user stories are enhancements that can be added incrementally

**MVP Scope**: Tasks T001-T145 (145 tasks)
**MVP Estimate**: 40-50 hours of development

**Post-MVP Increments**:
1. Add US3 (Fuel Tracking) for cost monitoring
2. Add US4 (Reminders) for proactive maintenance
3. Add US5 (Expense Dashboard) for financial visibility
4. Add US6 (Repair History) + US7 (Parts Inventory) for detailed tracking
5. Add US8 (Document Management) for compliance

---

## Task Summary

**Total Tasks**: 359 tasks across 11 phases

**By Phase**:
- Phase 1 (Setup): 12 tasks
- Phase 2 (Foundation): 21 tasks
- Phase 3 (US1 - Fleet & Vehicle): 61 tasks
- Phase 4 (US2 - Maintenance): 51 tasks
- Phase 5 (US3 - Fuel Tracking): 31 tasks
- Phase 6 (US4 - Reminders): 30 tasks
- Phase 7 (US5 - Expense & Reports): 43 tasks
- Phase 8 (US6 - Repair History): 13 tasks
- Phase 9 (US7 - Parts Inventory): 22 tasks
- Phase 10 (US8 - Document Management): 31 tasks
- Phase 11 (Polish): 44 tasks

**Parallelizable Tasks**: 87 tasks marked with [P] tag
**User Story Tasks**: 312 tasks (all phases 3-10)

**Estimated Timeline**:
- Full Implementation: 120-160 hours
- MVP (US1 + US2): 40-50 hours
- With 3 developers (parallel work): 50-70 hours for full implementation

---

## Implementation Notes

### Constitutional Compliance

All tasks follow constitutional principles:
- ✅ Vue 3 Composition API only (`<script setup>`)
- ✅ Plain JavaScript (no TypeScript)
- ✅ Components max 250 lines
- ✅ Quasar components mandatory
- ✅ Bilingual i18n (en-US/fr-FR)
- ✅ Role-based access control
- ✅ Soft delete for vehicles
- ✅ Multi-tenancy with organizationId
- ✅ Audit trail with changedBy

### Task Execution Guidelines

1. **Always check dependencies**: Ensure prerequisite tasks are complete
2. **Test incrementally**: Run tests after each phase checkpoint
3. **Commit frequently**: Commit after completing each task or small task group
4. **Update this file**: Check off tasks as completed using `[x]`
5. **Document blockers**: Add notes if a task is blocked or requires clarification

### Getting Help

- **Spec Questions**: Refer to [spec.md](./spec.md) for feature requirements
- **Technical Questions**: Refer to [plan.md](./plan.md) for architecture decisions
- **Data Questions**: Refer to [data-model.md](./data-model.md) for entity schemas
- **API Questions**: Refer to [contracts/](./contracts/) for endpoint specifications

---

**End of Tasks Document**
