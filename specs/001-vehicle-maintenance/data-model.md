# Data Model: Vehicle Maintenance Management System

**Feature**: 001-vehicle-maintenance
**Version**: 1.0
**Last Updated**: 2025-11-25
**Status**: Draft

## Overview

This document defines the comprehensive data model for the AutoCheck vehicle maintenance management system. The model is designed for implementation using Google Sheets as the data store, with considerations for query performance through appropriate indexing strategies.

## Core Principles

1. **Multi-tenancy**: All entities include `organizationId` for data isolation between different organizations
2. **Audit Trail**: All entities include `changedBy` field to track the user who last modified the record
3. **Soft Delete**: Critical entities (Vehicle) use soft delete pattern with `archived` and `archivedDate` fields
4. **Token-Based Authentication**: User entity supports JWT or session-based authentication
5. **Referential Integrity**: Foreign key relationships are maintained through ID references

## Entity Relationship Diagram

```
User 1---* Fleet (createdBy)
User 1---* Vehicle (createdBy)
User 1---* MaintenanceTask (assignedTechnician)
User 1---* Document (uploadedBy)

Fleet 1---* Vehicle (fleetId)

Vehicle 1---* MaintenanceTask
Vehicle 1---* FillUp
Vehicle 1---* Expense
Vehicle 1---* ReplacedPart
Vehicle 1---* Document
Vehicle 1---* Reminder

MaintenanceTask 1---* ReplacedPart (taskId)
MaintenanceTask 1---1 Expense (maintenanceTaskId, optional)

Report *---* Vehicle (filters)
```

---

## Entity Definitions

### 1. User

**Description**: Represents a system user with authentication credentials and role-based access control.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this user belongs to |
| username | String | NOT NULL, UNIQUE | - | Display name for the user |
| email | String | NOT NULL, UNIQUE, INDEXED | - | Email address for authentication |
| passwordHash | String | NOT NULL | - | Bcrypt hashed password |
| role | Enum | NOT NULL | 'Technician' | One of: 'Fleet Manager', 'Technician' |
| authToken | String | NULLABLE, INDEXED | null | JWT or session token for authentication |
| tokenExpiration | DateTime | NULLABLE | null | Token expiration timestamp |
| isActive | Boolean | NOT NULL | true | Account active status |
| createdAt | DateTime | NOT NULL | NOW() | Account creation timestamp |
| lastLoginAt | DateTime | NULLABLE | null | Last successful login timestamp |
| changedBy | String (UUID) | NOT NULL | self on creation | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- User 1---* Fleet (as creator)
- User 1---* Vehicle (as creator)
- User 1---* MaintenanceTask (as assignedTechnician)
- User 1---* Document (as uploader)

**Validation Rules**:
- `email` must match regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- `passwordHash` must be bcrypt hash (minimum password length: 8 characters, must include uppercase, lowercase, number)
- `role` must be one of the defined enum values
- `tokenExpiration` must be in the future if `authToken` is set
- `email` must be unique within the organization

**Indexes**:
- Primary: `id`
- Unique: `email`, `username`
- Search: `organizationId`, `authToken`, `role`
- Composite: `(organizationId, email)`, `(authToken, tokenExpiration)`

**Business Rules**:
- Fleet Managers have full CRUD access to all entities within their organization
- Technicians can only:
  - READ: Vehicles, Fleets, MaintenanceTask (assigned to them)
  - UPDATE: MaintenanceTask (status, notes, completion), ReplacedPart (add only)
  - No access to: Expense, Report, financial data
- Users cannot delete their own account if they are the only Fleet Manager

---

### 2. Fleet

**Description**: Represents a logical grouping of vehicles for organizational purposes.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this fleet belongs to |
| name | String | NOT NULL | - | Fleet name (e.g., "Delivery Trucks") |
| description | String | NULLABLE | null | Optional fleet description |
| vehicleCount | Integer | NOT NULL, COMPUTED | 0 | Count of active (non-archived) vehicles |
| createdBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who created this fleet |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Fleet 1---* Vehicle (one fleet has many vehicles)
- User 1---* Fleet (one user creates many fleets)

**Validation Rules**:
- `name` must be unique within organization
- `name` length: 1-100 characters
- `description` max length: 500 characters
- `vehicleCount` is computed field, automatically updated when vehicles are added/removed

**Indexes**:
- Primary: `id`
- Search: `organizationId`, `createdBy`
- Composite: `(organizationId, name)`

**Business Rules**:
- Deleting a fleet does not delete vehicles; they become unassigned
- Fleet names must be unique within an organization
- `vehicleCount` excludes archived vehicles

---

### 3. Vehicle

**Description**: Represents a physical vehicle with its attributes and maintenance history.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this vehicle belongs to |
| fleetId | String (UUID) | NULLABLE, FOREIGN KEY, INDEXED | null | Fleet assignment (optional) |
| make | String | NOT NULL | - | Vehicle manufacturer (e.g., "Toyota") |
| model | String | NOT NULL | - | Vehicle model (e.g., "Camry") |
| year | Integer | NOT NULL | - | Model year (e.g., 2020) |
| licensePlate | String | NOT NULL, UNIQUE, INDEXED | - | License plate number |
| vehicleType | Enum | NOT NULL | 'Sedan' | One of: 'Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Other' |
| numberOfSeats | Integer | NOT NULL | 5 | Passenger capacity |
| currentOdometer | Integer | NOT NULL | 0 | Current odometer reading (km or miles) |
| insuranceExpirationDate | Date | NULLABLE | null | Insurance policy expiration date |
| vin | String | NULLABLE, UNIQUE | null | Vehicle Identification Number |
| color | String | NULLABLE | null | Vehicle color |
| fuelType | Enum | NOT NULL | 'Gasoline' | One of: 'Gasoline', 'Diesel', 'Electric', 'Hybrid', 'CNG' |
| archived | Boolean | NOT NULL, INDEXED | false | Soft delete flag |
| archivedDate | DateTime | NULLABLE | null | Timestamp when vehicle was archived |
| archivedReason | String | NULLABLE | null | Reason for archival |
| createdBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who created this vehicle |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Vehicle *---1 Fleet (many vehicles can belong to one fleet, optional)
- Vehicle 1---* MaintenanceTask
- Vehicle 1---* FillUp
- Vehicle 1---* Expense
- Vehicle 1---* ReplacedPart
- Vehicle 1---* Document
- Vehicle 1---* Reminder

**Validation Rules**:
- `licensePlate` must be unique within organization
- `year` must be between 1900 and current year + 1
- `numberOfSeats` must be between 1 and 99
- `currentOdometer` must be >= 0
- `vehicleType` must be one of the defined enum values
- `fuelType` must be one of the defined enum values
- If `archived` is true, `archivedDate` must be set
- If `archived` is false, `archivedDate` must be null
- `vin` must be 17 characters if provided (standard VIN format)

**Indexes**:
- Primary: `id`
- Unique: `licensePlate`, `vin`
- Search: `organizationId`, `fleetId`, `archived`, `insuranceExpirationDate`
- Composite: `(organizationId, archived)`, `(organizationId, licensePlate)`, `(fleetId, archived)`

**State Transitions**:

```
[Active] --archive()--> [Archived]
  |
  | - archived = false
  | - archivedDate = null
  | - Appears in active lists
  | - Recurring tasks continue
  |
  v
[Archived]
  | - archived = true
  | - archivedDate = NOW()
  | - Hidden from active lists
  | - Recurring task generation stops
  | - Appears in historical reports
```

**Business Rules**:
- Archived vehicles are excluded from:
  - Active vehicle lists
  - Fleet vehicle counts
  - New maintenance task generation (recurring stops)
- Archived vehicles are included in:
  - Historical reports
  - Expense calculations (for date ranges that include pre-archive period)
  - Search results when explicitly filtering for archived vehicles
- Archival cancels all future scheduled recurring tasks
- Cannot un-archive a vehicle (one-way operation in current version)

---

### 4. MaintenanceTask

**Description**: Represents scheduled, in-progress, or completed maintenance work on a vehicle.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this task belongs to |
| vehicleId | String (UUID) | NOT NULL, FOREIGN KEY, INDEXED | - | Vehicle requiring maintenance |
| type | Enum | NOT NULL | 'Preventive' | One of: 'Preventive', 'Corrective', 'Predictive', 'Inspection & Compliance' |
| description | String | NOT NULL | - | Maintenance description (e.g., "Oil Change") |
| priority | Enum | NOT NULL | 'Medium' | One of: 'Low', 'Medium', 'High' |
| status | Enum | NOT NULL, INDEXED | 'scheduled' | One of: 'scheduled', 'in-progress', 'completed' |
| dueDate | Date | NOT NULL, INDEXED | - | When maintenance is due |
| scheduledDate | Date | NULLABLE | null | Originally scheduled date (for reschedule tracking) |
| startDate | DateTime | NULLABLE | null | When work actually started |
| completionDate | DateTime | NULLABLE | null | When work was completed |
| assignedTechnicianId | String (UUID) | NULLABLE, FOREIGN KEY, INDEXED | null | Technician assigned to this task |
| durationMinutes | Integer | NULLABLE | null | Time taken to complete (minutes) |
| notes | Text | NULLABLE | null | Detailed notes about the work performed |
| cost | Decimal(10,2) | NULLABLE | null | Total cost of maintenance |
| isRecurring | Boolean | NOT NULL | false | Whether this generates recurring tasks |
| recurrenceIntervalDays | Integer | NULLABLE | null | Days between occurrences (time-based) |
| recurrenceIntervalKm | Integer | NULLABLE | null | Kilometers between occurrences (mileage-based) |
| parentTaskId | String (UUID) | NULLABLE, FOREIGN KEY | null | Parent task if this was auto-generated from recurring |
| nextOccurrenceDate | Date | NULLABLE, INDEXED | null | Calculated next due date for recurring tasks |
| lastGeneratedDate | Date | NULLABLE | null | Last date a child task was generated |
| cancelledAt | DateTime | NULLABLE | null | When recurring task generation was cancelled |
| createdBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who created this task |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Vehicle 1---* MaintenanceTask (one vehicle has many tasks)
- User 1---* MaintenanceTask (one technician assigned to many tasks)
- MaintenanceTask 1---* ReplacedPart (one task can have many parts replaced)
- MaintenanceTask 1---1 Expense (one task can create one expense record, optional)
- MaintenanceTask 1---* MaintenanceTask (parent-child for recurring tasks)

**Validation Rules**:
- `dueDate` should not be in the past for new tasks (warning, not error)
- `status` must follow state transition rules (see below)
- If `status` is 'in-progress', `startDate` must be set
- If `status` is 'completed', `completionDate` must be set
- `completionDate` must be >= `startDate` if both are set
- If `isRecurring` is true, at least one of `recurrenceIntervalDays` or `recurrenceIntervalKm` must be set
- `recurrenceIntervalDays` must be > 0 if set
- `recurrenceIntervalKm` must be > 0 if set
- `cost` must be >= 0 if set
- `durationMinutes` must be > 0 if set

**Indexes**:
- Primary: `id`
- Search: `organizationId`, `vehicleId`, `status`, `dueDate`, `assignedTechnicianId`, `isRecurring`, `nextOccurrenceDate`, `parentTaskId`
- Composite: `(organizationId, status, dueDate)`, `(vehicleId, status)`, `(assignedTechnicianId, status)`, `(isRecurring, nextOccurrenceDate)`

**State Transitions**:

```
[scheduled] --start work--> [in-progress] --complete--> [completed]
     |                            |
     |                            |
     +--------reschedule----------+

State: scheduled
  - Can transition to: in-progress, scheduled (reschedule)
  - Required fields: dueDate
  - Optional fields: assignedTechnicianId

State: in-progress
  - Can transition to: completed
  - Required fields: startDate, assignedTechnicianId
  - Optional fields: durationMinutes

State: completed
  - Terminal state (no further transitions)
  - Required fields: startDate, completionDate
  - Optional fields: notes, cost, durationMinutes
```

**Business Rules**:
- Recurring task generation:
  - Time-based: New task created when `nextOccurrenceDate` <= TODAY
  - Mileage-based: New task created when `vehicle.currentOdometer` >= (last task odometer + recurrenceIntervalKm)
  - Generation stops when vehicle is archived (`cancelledAt` is set)
- Reminder generation:
  - Reminder created when `dueDate` <= TODAY + 7 days AND status != 'completed'
  - Overdue highlighted when `dueDate` < TODAY AND status != 'completed'
- Technicians can only be assigned to tasks for vehicles in their organization
- Rescheduling preserves original `scheduledDate` for audit purposes

---

### 5. FillUp

**Description**: Represents a fuel refueling event with calculated efficiency metrics.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this record belongs to |
| vehicleId | String (UUID) | NOT NULL, FOREIGN KEY, INDEXED | - | Vehicle that was refueled |
| fillUpDate | Date | NOT NULL, INDEXED | - | Date of refueling |
| fuelAmount | Decimal(10,2) | NOT NULL | - | Amount of fuel added (liters or gallons) |
| fuelCost | Decimal(10,2) | NOT NULL | - | Total cost of fuel |
| odometerReading | Integer | NOT NULL, INDEXED | - | Odometer reading at fill-up (km or miles) |
| fuelUnit | Enum | NOT NULL | 'liters' | One of: 'liters', 'gallons' |
| distanceUnit | Enum | NOT NULL | 'km' | One of: 'km', 'miles' |
| isFull | Boolean | NOT NULL | true | Whether tank was filled completely |
| previousOdometerReading | Integer | NULLABLE, COMPUTED | null | Previous fill-up odometer reading |
| distanceTraveled | Integer | NULLABLE, COMPUTED | null | odometerReading - previousOdometerReading |
| efficiency | Decimal(10,2) | NULLABLE, COMPUTED | null | Calculated fuel efficiency |
| efficiencyUnit | String | COMPUTED | - | "L/100km", "MPG", or "km/L" |
| notes | String | NULLABLE | null | Additional notes about fill-up |
| location | String | NULLABLE | null | Gas station or location |
| createdBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who recorded this fill-up |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Vehicle 1---* FillUp (one vehicle has many fill-ups)
- FillUp 1---1 Expense (one fill-up can create one expense record, auto-generated)

**Validation Rules**:
- `fuelAmount` must be > 0
- `fuelCost` must be >= 0
- `odometerReading` must be >= previous odometer reading for the same vehicle
- `fillUpDate` should not be in the future (warning)
- `odometerReading` should be >= vehicle's `currentOdometer` at time of creation

**Indexes**:
- Primary: `id`
- Search: `organizationId`, `vehicleId`, `fillUpDate`, `odometerReading`
- Composite: `(vehicleId, fillUpDate)`, `(vehicleId, odometerReading)`

**Efficiency Calculation Rules**:

```javascript
// For first fill-up of a vehicle:
if (previousFillUp == null) {
  efficiency = null  // Display as "N/A"
}

// For subsequent fill-ups:
else {
  distanceTraveled = odometerReading - previousOdometerReading

  // Metric (L/100km)
  if (fuelUnit == 'liters' && distanceUnit == 'km') {
    efficiency = (fuelAmount / distanceTraveled) * 100
    efficiencyUnit = "L/100km"
  }

  // Imperial (MPG)
  if (fuelUnit == 'gallons' && distanceUnit == 'miles') {
    efficiency = distanceTraveled / fuelAmount
    efficiencyUnit = "MPG"
  }

  // Mixed (km per liter)
  if (fuelUnit == 'liters' && distanceUnit == 'km') {
    efficiency = distanceTraveled / fuelAmount
    efficiencyUnit = "km/L"
  }
}

// Average efficiency for vehicle:
avgEfficiency = AVG(efficiency) WHERE vehicleId = X AND efficiency IS NOT NULL
```

**Business Rules**:
- Each fill-up automatically creates a corresponding Expense record (category: 'fuel')
- First fill-up for a vehicle shows efficiency as "N/A" or empty
- Odometer readings must be monotonically increasing for a vehicle
- Efficiency is only calculated for full tank fill-ups when `isFull` is true

---

### 6. Expense

**Description**: Represents a vehicle-related expense for financial tracking and reporting.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this expense belongs to |
| vehicleId | String (UUID) | NOT NULL, FOREIGN KEY, INDEXED | - | Vehicle this expense is for |
| category | Enum | NOT NULL, INDEXED | - | One of: 'fuel', 'maintenance', 'insurance', 'fines', 'tolls', 'fees', 'financing', 'other' |
| expenseDate | Date | NOT NULL, INDEXED | - | Date expense was incurred |
| amount | Decimal(10,2) | NOT NULL | - | Expense amount |
| description | String | NOT NULL | - | Expense description |
| receiptNumber | String | NULLABLE | null | Receipt or invoice number |
| vendor | String | NULLABLE | null | Vendor or service provider name |
| maintenanceTaskId | String (UUID) | NULLABLE, FOREIGN KEY | null | Related maintenance task (if applicable) |
| fillUpId | String (UUID) | NULLABLE, FOREIGN KEY | null | Related fill-up (if applicable) |
| documentId | String (UUID) | NULLABLE, FOREIGN KEY | null | Related receipt document (if uploaded) |
| isRecurring | Boolean | NOT NULL | false | Whether this is a recurring expense |
| recurrenceIntervalDays | Integer | NULLABLE | null | Days between occurrences |
| notes | Text | NULLABLE | null | Additional notes |
| createdBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who recorded this expense |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Vehicle 1---* Expense (one vehicle has many expenses)
- MaintenanceTask 1---1 Expense (one task can have one expense, optional)
- FillUp 1---1 Expense (one fill-up creates one expense, auto-generated)
- Document 1---* Expense (one receipt document can be linked to many expenses)

**Validation Rules**:
- `amount` must be > 0
- `category` must be one of the defined enum values
- `expenseDate` should not be in the future (warning)
- If `category` is 'fuel', `fillUpId` should be set
- If `category` is 'maintenance', `maintenanceTaskId` should be set
- If `isRecurring` is true, `recurrenceIntervalDays` must be > 0
- Cannot have both `maintenanceTaskId` and `fillUpId` set (mutually exclusive)

**Indexes**:
- Primary: `id`
- Search: `organizationId`, `vehicleId`, `category`, `expenseDate`, `maintenanceTaskId`, `fillUpId`
- Composite: `(organizationId, category, expenseDate)`, `(vehicleId, expenseDate)`, `(vehicleId, category)`

**Business Rules**:
- Fuel expenses are auto-generated from FillUp records
- Maintenance expenses are optionally created from MaintenanceTask completion
- Recurring expenses (e.g., monthly insurance payments) auto-generate new records
- Expenses for archived vehicles are included in historical reports
- Expense dashboard filters:
  - By date range
  - By vehicle or fleet
  - By category
  - By amount range

---

### 7. ReplacedPart

**Description**: Represents a part that was replaced during vehicle maintenance.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this record belongs to |
| vehicleId | String (UUID) | NOT NULL, FOREIGN KEY, INDEXED | - | Vehicle the part was replaced on |
| maintenanceTaskId | String (UUID) | NULLABLE, FOREIGN KEY, INDEXED | null | Associated maintenance task (optional) |
| replacementDate | Date | NOT NULL, INDEXED | - | Date part was replaced |
| partType | String | NOT NULL, INDEXED | - | Type of part (e.g., "Brake Pads", "Oil Filter") |
| partNumber | String | NULLABLE | null | Manufacturer part number |
| partName | String | NOT NULL | - | Part name/description |
| manufacturer | String | NULLABLE | null | Part manufacturer |
| quantity | Integer | NOT NULL | 1 | Number of parts replaced |
| unitPrice | Decimal(10,2) | NOT NULL | - | Price per unit |
| totalPrice | Decimal(10,2) | COMPUTED | - | quantity * unitPrice |
| warranty | String | NULLABLE | null | Warranty information (e.g., "12 months") |
| supplier | String | NULLABLE | null | Where part was purchased |
| odometerAtReplacement | Integer | NULLABLE | null | Odometer reading when replaced |
| notes | Text | NULLABLE | null | Additional notes |
| createdBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who recorded this part |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Vehicle 1---* ReplacedPart (one vehicle has many replaced parts)
- MaintenanceTask 1---* ReplacedPart (one task can replace many parts)

**Validation Rules**:
- `replacementDate` should not be in the future (warning)
- `quantity` must be > 0
- `unitPrice` must be >= 0
- `totalPrice` is computed: quantity * unitPrice
- `partType` should be from a predefined list (configurable)
- `odometerAtReplacement` should be <= vehicle's current odometer

**Indexes**:
- Primary: `id`
- Search: `organizationId`, `vehicleId`, `maintenanceTaskId`, `partType`, `replacementDate`
- Composite: `(vehicleId, partType, replacementDate)`, `(vehicleId, replacementDate)`

**Common Part Types** (for UI autocomplete):
- Engine Oil
- Oil Filter
- Air Filter
- Fuel Filter
- Brake Pads
- Brake Rotors
- Battery
- Spark Plugs
- Tires
- Windshield Wipers
- Transmission Fluid
- Coolant
- Serpentine Belt
- Timing Belt
- Alternator
- Starter Motor

**Business Rules**:
- Parts can be recorded independently or as part of a maintenance task
- Part replacement history helps identify recurring issues
- Technicians can add parts to their assigned maintenance tasks
- Part costs feed into vehicle expense tracking
- Warranty information tracked for warranty claims

---

### 8. Document

**Description**: Represents an uploaded file associated with a vehicle (insurance, registration, receipts, etc.).

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this document belongs to |
| vehicleId | String (UUID) | NOT NULL, FOREIGN KEY, INDEXED | - | Vehicle this document is for |
| category | Enum | NOT NULL, INDEXED | 'Other' | One of: 'Insurance', 'Registration', 'Service Receipt', 'Inspection Report', 'Manual', 'Photo', 'Other' |
| fileName | String | NOT NULL | - | Original file name |
| fileType | String | NOT NULL | - | MIME type (e.g., "application/pdf", "image/jpeg") |
| fileSize | Integer | NOT NULL | - | File size in bytes |
| fileStoragePath | String | NOT NULL, UNIQUE | - | Path to file in storage system |
| description | String | NULLABLE | null | Document description |
| tags | String | NULLABLE | null | Comma-separated tags for search |
| expirationDate | Date | NULLABLE, INDEXED | null | Document expiration (for insurance, registration) |
| documentDate | Date | NULLABLE, INDEXED | null | Date on document (e.g., receipt date) |
| maintenanceTaskId | String (UUID) | NULLABLE, FOREIGN KEY | null | Related maintenance task (if applicable) |
| uploadedBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who uploaded this document |
| uploadedAt | DateTime | NOT NULL | NOW() | Upload timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Vehicle 1---* Document (one vehicle has many documents)
- User 1---* Document (one user uploads many documents)
- MaintenanceTask 1---* Document (one task can have many documents)

**Validation Rules**:
- `fileType` must be one of: PDF, JPEG, PNG, GIF, TIFF, DOC, DOCX, XLS, XLSX
- `fileSize` must be <= 10MB (10,485,760 bytes)
- `fileName` should be sanitized to prevent path traversal attacks
- `fileStoragePath` must be unique
- `expirationDate` should be in the future if set (warning if expired)

**Indexes**:
- Primary: `id`
- Unique: `fileStoragePath`
- Search: `organizationId`, `vehicleId`, `category`, `expirationDate`, `documentDate`, `maintenanceTaskId`, `uploadedBy`
- Composite: `(vehicleId, category)`, `(vehicleId, expirationDate)`, `(organizationId, category, expirationDate)`

**Supported File Types**:
- **Documents**: PDF, DOC, DOCX, XLS, XLSX
- **Images**: JPEG, JPG, PNG, GIF, TIFF
- **Maximum Size**: 10MB per file

**Business Rules**:
- Documents are stored with unique UUID-based file names to prevent collisions
- Original file name preserved in `fileName` field for display
- Expired documents (insurance, registration) trigger reminders
- Documents can be deleted, but deletion is logged in audit trail
- Document access restricted by organization membership
- Thumbnail generation for image files (async process)
- Full-text search supported for PDF documents (future enhancement)

---

### 9. Reminder

**Description**: Represents an alert for upcoming maintenance, insurance renewal, or other time-sensitive events.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this reminder belongs to |
| vehicleId | String (UUID) | NOT NULL, FOREIGN KEY, INDEXED | - | Vehicle this reminder is for |
| type | Enum | NOT NULL, INDEXED | - | One of: 'maintenance', 'insurance', 'registration', 'inspection', 'custom' |
| title | String | NOT NULL | - | Reminder title |
| description | Text | NULLABLE | null | Detailed reminder description |
| dueDate | Date | NOT NULL, INDEXED | - | When the action is due |
| triggerThresholdDays | Integer | NOT NULL | 7 | Days before due date to show reminder |
| triggerThresholdKm | Integer | NULLABLE | null | Kilometers before due to show reminder |
| priority | Enum | NOT NULL | 'Medium' | One of: 'Low', 'Medium', 'High' |
| status | Enum | NOT NULL, INDEXED | 'active' | One of: 'active', 'acknowledged', 'dismissed', 'completed' |
| maintenanceTaskId | String (UUID) | NULLABLE, FOREIGN KEY | null | Related maintenance task (if applicable) |
| documentId | String (UUID) | NULLABLE, FOREIGN KEY | null | Related document (e.g., expiring insurance) |
| acknowledgedBy | String (UUID) | NULLABLE, FOREIGN KEY | null | User who acknowledged reminder |
| acknowledgedAt | DateTime | NULLABLE | null | When reminder was acknowledged |
| completedAt | DateTime | NULLABLE | null | When related action was completed |
| isOverdue | Boolean | COMPUTED | - | true if dueDate < TODAY and status = 'active' |
| daysUntilDue | Integer | COMPUTED | - | dueDate - TODAY |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this record |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Vehicle 1---* Reminder (one vehicle has many reminders)
- MaintenanceTask 1---1 Reminder (one task can have one reminder)
- Document 1---1 Reminder (one document can have one reminder, e.g., expiring insurance)

**Validation Rules**:
- `dueDate` should be in the future for new reminders
- `triggerThresholdDays` must be > 0
- `triggerThresholdKm` must be > 0 if set
- If `status` is 'acknowledged', `acknowledgedBy` and `acknowledgedAt` must be set
- If `status` is 'completed', `completedAt` must be set
- `type` must be one of the defined enum values

**Indexes**:
- Primary: `id`
- Search: `organizationId`, `vehicleId`, `type`, `status`, `dueDate`, `maintenanceTaskId`, `documentId`
- Composite: `(organizationId, status, dueDate)`, `(vehicleId, status, dueDate)`, `(status, dueDate)`

**Reminder Generation Rules**:

```javascript
// Maintenance reminders (auto-generated from MaintenanceTask)
if (maintenanceTask.status == 'scheduled' &&
    maintenanceTask.dueDate <= TODAY + 7 days) {
  createReminder({
    type: 'maintenance',
    dueDate: maintenanceTask.dueDate,
    triggerThresholdDays: 7
  })
}

// Insurance reminders (auto-generated from Vehicle)
if (vehicle.insuranceExpirationDate <= TODAY + 30 days) {
  createReminder({
    type: 'insurance',
    dueDate: vehicle.insuranceExpirationDate,
    triggerThresholdDays: 30,
    priority: 'High'
  })
}

// Registration reminders (auto-generated from Document)
if (document.category == 'Registration' &&
    document.expirationDate <= TODAY + 30 days) {
  createReminder({
    type: 'registration',
    dueDate: document.expirationDate,
    triggerThresholdDays: 30
  })
}
```

**State Transitions**:

```
[active] --acknowledge--> [acknowledged]
   |                           |
   |                           |
   +-------complete-----------[completed]
   |
   +-------dismiss----------->[dismissed]

active: Reminder is shown to users
acknowledged: User has seen reminder but not acted
dismissed: User explicitly dismissed reminder
completed: Related action has been completed
```

**Business Rules**:
- Active reminders appear on dashboard and vehicle detail pages
- Overdue reminders (dueDate < TODAY) highlighted in red
- Reminders auto-complete when related task is completed
- Dismissed reminders hidden from view but retained for audit
- Users can snooze reminders (updates dueDate)
- Email notifications for High priority reminders (future enhancement)

---

### 10. Report

**Description**: Represents a generated or scheduled expense report with filters and recipients.

**Fields**:

| Field Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| id | String (UUID) | PRIMARY KEY, NOT NULL | auto-generated | Unique identifier |
| organizationId | String (UUID) | NOT NULL, INDEXED | - | Organization this report belongs to |
| reportName | String | NOT NULL | - | Report name/title |
| reportType | Enum | NOT NULL | 'expense' | One of: 'expense', 'maintenance', 'fuel', 'fleet_summary', 'custom' |
| format | Enum | NOT NULL | 'PDF' | One of: 'PDF', 'Excel', 'CSV', 'JSON' |
| schedule | Enum | NOT NULL | 'manual' | One of: 'manual', 'daily', 'weekly', 'monthly', 'quarterly' |
| isActive | Boolean | NOT NULL | true | Whether scheduled report is active |
| filterVehicleIds | Text | NULLABLE | null | JSON array of vehicle IDs to include |
| filterFleetIds | Text | NULLABLE | null | JSON array of fleet IDs to include |
| filterCategories | Text | NULLABLE | null | JSON array of expense categories to include |
| filterStartDate | Date | NULLABLE | null | Report date range start |
| filterEndDate | Date | NULLABLE | null | Report date range end |
| groupBy | Enum | NULLABLE | null | One of: 'vehicle', 'fleet', 'category', 'month', 'week' |
| sortBy | Enum | NULLABLE | null | One of: 'date', 'amount', 'vehicle', 'category' |
| sortOrder | Enum | NOT NULL | 'desc' | One of: 'asc', 'desc' |
| includeSummary | Boolean | NOT NULL | true | Include summary section |
| includeCharts | Boolean | NOT NULL | true | Include charts/graphs |
| recipients | Text | NULLABLE | null | JSON array of email addresses for scheduled reports |
| lastGeneratedAt | DateTime | NULLABLE, INDEXED | null | Last time report was generated |
| nextScheduledAt | DateTime | NULLABLE, INDEXED | null | Next scheduled generation time |
| generatedCount | Integer | NOT NULL | 0 | Number of times report has been generated |
| fileStoragePath | String | NULLABLE | null | Path to last generated report file |
| createdBy | String (UUID) | NOT NULL, FOREIGN KEY | - | User ID who created this report |
| createdAt | DateTime | NOT NULL | NOW() | Creation timestamp |
| changedBy | String (UUID) | NOT NULL | - | User ID who last modified this report |
| updatedAt | DateTime | NOT NULL | NOW() | Last modification timestamp |

**Relationships**:
- Report *---* Vehicle (many-to-many through filterVehicleIds)
- Report *---* Fleet (many-to-many through filterFleetIds)

**Validation Rules**:
- `reportName` must be unique within organization
- `filterStartDate` must be <= `filterEndDate` if both are set
- If `schedule` is not 'manual', `recipients` must contain at least one email
- `recipients` must be valid JSON array of email addresses
- `filterVehicleIds` must be valid JSON array of UUIDs
- `filterFleetIds` must be valid JSON array of UUIDs
- `filterCategories` must be valid JSON array of expense categories
- If `schedule` is not 'manual', `nextScheduledAt` must be set

**Indexes**:
- Primary: `id`
- Search: `organizationId`, `reportType`, `schedule`, `isActive`, `lastGeneratedAt`, `nextScheduledAt`, `createdBy`
- Composite: `(organizationId, schedule, isActive, nextScheduledAt)`, `(organizationId, reportType)`

**Schedule Calculation**:

```javascript
// Daily: Every day at configured time (e.g., 6 AM)
if (schedule == 'daily') {
  nextScheduledAt = TODAY + 1 day at 6:00 AM
}

// Weekly: Every Monday at configured time
if (schedule == 'weekly') {
  nextScheduledAt = NEXT_MONDAY at 6:00 AM
}

// Monthly: First day of next month at configured time
if (schedule == 'monthly') {
  nextScheduledAt = FIRST_DAY_OF_NEXT_MONTH at 6:00 AM
}

// Quarterly: First day of next quarter at configured time
if (schedule == 'quarterly') {
  nextScheduledAt = FIRST_DAY_OF_NEXT_QUARTER at 6:00 AM
}
```

**Report Types**:

1. **Expense Report**: All expenses by category, vehicle, date range
2. **Maintenance Report**: All maintenance tasks with costs, status, technicians
3. **Fuel Report**: All fill-ups with efficiency calculations, trends
4. **Fleet Summary**: Overview of entire fleet with totals and averages
5. **Custom**: User-defined filters and groupings

**Business Rules**:
- Scheduled reports run automatically at configured times
- Reports sent via email to recipients as PDF/Excel attachments
- Manual reports generated on-demand
- Report history retained for audit (last 100 generations)
- Reports can be paused (isActive = false) without deletion
- Filter combinations create custom report views
- Charts include:
  - Expense trends over time
  - Category breakdowns (pie chart)
  - Vehicle cost comparisons (bar chart)
  - Fuel efficiency trends (line chart)

---

## Data Isolation & Security

### Organization-Level Isolation

All queries MUST include `organizationId` filter:

```sql
-- Good (includes organizationId)
SELECT * FROM Vehicle WHERE organizationId = 'org-123' AND archived = false

-- Bad (missing organizationId - security risk!)
SELECT * FROM Vehicle WHERE archived = false
```

### Row-Level Security Rules

1. Users can only access data within their organization
2. Fleet Managers have full access within organization
3. Technicians have restricted access:
   - READ: All vehicles, fleets, maintenance tasks
   - UPDATE: Only maintenance tasks assigned to them
   - NO ACCESS: Expenses, reports, financial data

### Audit Trail

All modifications tracked via:
- `changedBy`: User ID who made the change
- `updatedAt`: Timestamp of change
- Consider separate audit log table for full change history (future enhancement)

---

## Query Performance Optimization

### Indexing Strategy for Google Sheets

Google Sheets has limited native indexing, but query performance can be optimized through:

1. **Sheet Organization**:
   - One sheet per entity
   - Sorted by most commonly queried field
   - Separate archive sheets for historical data

2. **Computed Columns**:
   - Pre-calculate derived values (efficiency, totals, etc.)
   - Use formula columns for frequently accessed calculations

3. **Data Partitioning**:
   - Separate active and archived vehicles into different sheets
   - Archive old data periodically (e.g., expenses older than 2 years)

4. **Query Optimization**:
   - Always filter by `organizationId` first
   - Use QUERY function with WHERE clauses
   - Limit result sets with LIMIT clause
   - Avoid full table scans

### Example Google Sheets Queries

```javascript
// Active vehicles for organization
=QUERY(Vehicle!A:Z, "SELECT * WHERE organizationId = 'org-123' AND archived = false")

// Upcoming maintenance tasks
=QUERY(MaintenanceTask!A:Z, "SELECT * WHERE organizationId = 'org-123' AND status = 'scheduled' AND dueDate <= date '" & TEXT(TODAY()+7,"yyyy-MM-dd") & "' ORDER BY dueDate")

// Monthly expenses by category
=QUERY(Expense!A:Z, "SELECT category, SUM(amount) WHERE organizationId = 'org-123' AND expenseDate >= date '" & TEXT(DATE(YEAR(TODAY()),MONTH(TODAY()),1),"yyyy-MM-dd") & "' GROUP BY category")

// Vehicle fuel efficiency
=QUERY(FillUp!A:Z, "SELECT vehicleId, AVG(efficiency) WHERE organizationId = 'org-123' AND efficiency IS NOT NULL GROUP BY vehicleId")
```

---

## Data Migration & Seeding

### Initial Data Setup

For new organizations, seed data should include:

1. **Default User**: Fleet Manager account
2. **Sample Vehicle Types**: Common vehicle types for dropdown
3. **Part Categories**: Standard automotive parts for autocomplete
4. **Expense Categories**: All defined expense categories

### Data Import

Support CSV import for bulk data:
- Vehicles: make, model, year, license plate, etc.
- Maintenance history: tasks, dates, costs
- Expenses: historical expense records

### Data Export

Support data export for backup/migration:
- Full organization export (all entities)
- Selective export (vehicles, expenses, etc.)
- Format: JSON, CSV, Excel

---

## Future Enhancements

### Potential Schema Extensions

1. **ServiceProvider Entity**: Track external repair shops, suppliers
2. **Insurance Policy Entity**: Detailed insurance policy tracking
3. **Driver Entity**: Track individual drivers, assignments to vehicles
4. **Fuel Card Entity**: Track fuel card transactions
5. **Warranty Entity**: Track vehicle and part warranties
6. **Notification Entity**: Persistent notification history
7. **AuditLog Entity**: Complete change history for all entities

### Scalability Considerations

When migrating from Google Sheets to database:
- Add database indexes matching the defined index strategy
- Implement proper foreign key constraints
- Add database-level validation rules
- Implement soft delete for all entities
- Add version fields for optimistic locking

---

## Validation Summary

### Cross-Entity Validations

1. **Odometer Consistency**:
   - FillUp.odometerReading >= previous FillUp.odometerReading
   - MaintenanceTask odometer >= previous MaintenanceTask odometer
   - Vehicle.currentOdometer = MAX(all related odometer readings)

2. **Date Consistency**:
   - FillUp.fillUpDate <= TODAY
   - MaintenanceTask.completionDate >= MaintenanceTask.startDate
   - Expense.expenseDate <= TODAY

3. **Referential Integrity**:
   - All foreign keys must reference existing records
   - Cannot delete Vehicle with active MaintenanceTask records
   - Cannot delete User who is assigned to active MaintenanceTask

4. **Business Logic**:
   - Archived vehicles excluded from active lists
   - Technicians only see assigned tasks
   - Fleet Managers see all organization data

---

## Appendix: Enum Definitions

### User.role
- `Fleet Manager`: Full access to all features
- `Technician`: Limited access (update tasks, add parts)

### Vehicle.vehicleType
- `Sedan`
- `SUV`
- `Truck`
- `Van`
- `Motorcycle`
- `Other`

### Vehicle.fuelType
- `Gasoline`
- `Diesel`
- `Electric`
- `Hybrid`
- `CNG` (Compressed Natural Gas)

### MaintenanceTask.type
- `Preventive`: Scheduled maintenance
- `Corrective`: Repair work
- `Predictive`: Based on diagnostics
- `Inspection & Compliance`: Safety/regulatory inspections

### MaintenanceTask.priority
- `Low`
- `Medium`
- `High`

### MaintenanceTask.status
- `scheduled`: Task is planned
- `in-progress`: Work has started
- `completed`: Work is finished

### Expense.category
- `fuel`: Fuel purchases
- `maintenance`: Repair and service costs
- `insurance`: Insurance premiums
- `fines`: Traffic tickets, violations
- `tolls`: Road tolls
- `fees`: Registration, licensing fees
- `financing`: Loan payments, lease payments
- `other`: Miscellaneous expenses

### Document.category
- `Insurance`: Insurance certificates
- `Registration`: Vehicle registration
- `Service Receipt`: Maintenance receipts
- `Inspection Report`: Safety inspection reports
- `Manual`: Owner's manuals
- `Photo`: Vehicle photos
- `Other`: Other documents

### Reminder.type
- `maintenance`: Maintenance due
- `insurance`: Insurance renewal
- `registration`: Registration renewal
- `inspection`: Inspection due
- `custom`: User-defined reminder

### Reminder.status
- `active`: Reminder is visible
- `acknowledged`: User has seen reminder
- `dismissed`: User dismissed reminder
- `completed`: Related action completed

### Report.reportType
- `expense`: Expense reports
- `maintenance`: Maintenance reports
- `fuel`: Fuel and efficiency reports
- `fleet_summary`: Fleet overview
- `custom`: Custom reports

### Report.format
- `PDF`: Adobe PDF
- `Excel`: Microsoft Excel (.xlsx)
- `CSV`: Comma-separated values
- `JSON`: JSON format

### Report.schedule
- `manual`: On-demand only
- `daily`: Every day
- `weekly`: Every week
- `monthly`: Every month
- `quarterly`: Every quarter

---

## Document Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | System | Initial data model creation |

---

**End of Data Model Document**
