# Feature Specification: Vehicle Maintenance Management System

**Feature Branch**: `001-vehicle-maintenance`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "The application is called autocheck and is meant to manage vehicle maintenance. A vehicle can exist on its own or as part of a fleet..."

## Clarifications

### Session 2025-11-25

- Q: Should all users have full read/write access to all features, or should there be role-based restrictions? → A: Basic role restrictions - Fleet Manager (full access), Technician (can only update assigned maintenance tasks and add parts)
- Q: How should the system handle vehicle deletion when historical data exists? → A: Soft delete - Vehicle marked as deleted/archived but data retained; not shown in active lists but appears in historical reports
- Q: How should efficiency be displayed for the first fill-up? → A: Show "N/A" or empty
- Q: Should recurring tasks continue to generate for archived vehicles? → A: Stop generating recurring tasks - No new tasks created after vehicle is archived
- Q: What authentication method should the system use? → A: Email/password with token-based authentication

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fleet and Vehicle Management (Priority: P1)

A fleet manager needs to organize and track multiple vehicles. They create a fleet (e.g., "Delivery Fleet"), add vehicles with their details (make, year, seats, license plate, vehicle type), and can later add or remove vehicles from fleets as their organization changes.

**Why this priority**: Foundation for all other features. Without vehicle and fleet management, no other functionality can work. This is the core data structure.

**Independent Test**: Create a fleet, add 3 vehicles with different details, remove one vehicle, verify the fleet displays correctly with accurate vehicle information.

**Acceptance Scenarios**:

1. **Given** I am on the fleet management page, **When** I click "Create Fleet" and enter "Delivery Trucks", **Then** a new fleet is created with that name
2. **Given** I have a fleet created, **When** I click "Add Vehicle" and enter details (Toyota, 2020, 5 seats, ABC-123, Sedan), **Then** the vehicle is added to the fleet
3. **Given** I have vehicles in a fleet, **When** I select a vehicle and click "Remove from Fleet", **Then** the vehicle is removed but still exists as an individual vehicle
4. **Given** I have an individual vehicle, **When** I select it and assign it to an existing fleet, **Then** the vehicle is added to that fleet
5. **Given** I have multiple fleets, **When** I view the fleet list, **Then** I see all fleet names with vehicle counts

---

### User Story 2 - Fuel Tracking and Efficiency Monitoring (Priority: P2)

Vehicle operators record fuel fill-ups by entering date, amount, cost, and odometer reading. The system calculates and displays fuel efficiency (MPG/L per 100km) for each vehicle, helping identify which vehicles are most/least efficient.

**Why this priority**: Critical for cost management and operational efficiency. Fuel is typically the largest operating expense for vehicle fleets.

**Independent Test**: Record 3 fill-ups for a vehicle with different amounts and odometer readings, verify the system calculates and displays average fuel efficiency correctly.

**Acceptance Scenarios**:

1. **Given** I am viewing a vehicle's details, **When** I click "Record Fill-up" and enter date, liters, cost, and odometer reading, **Then** the fill-up is logged
2. **Given** I have recorded multiple fill-ups, **When** I view the vehicle's efficiency, **Then** I see calculated MPG or L/100km based on odometer differences
3. **Given** I have multiple vehicles in a fleet, **When** I view the fleet efficiency dashboard, **Then** I see a comparison of fuel efficiency across all vehicles
4. **Given** I record a fill-up with invalid odometer (lower than previous), **When** I submit, **Then** I receive an error message

---

### User Story 3 - Maintenance Logging and Scheduling (Priority: P1)

Maintenance managers create maintenance tasks with type (Preventive, Corrective, Predictive, Inspection & Compliance), priority, due date, and status. They can schedule tasks in advance, track progress (scheduled → in-progress → completed), reschedule when needed, and assign tasks to technicians.

**Why this priority**: Core value proposition of the application. Prevents vehicle breakdowns and ensures compliance. This is the primary feature users need.

**Independent Test**: Create a preventive maintenance task (oil change) scheduled for next week, assign it to a technician, change status to in-progress when work starts, record completion with notes and cost.

**Acceptance Scenarios**:

1. **Given** I am viewing a vehicle, **When** I click "Schedule Maintenance" and select type (Preventive), enter description (Oil Change), priority (High), and due date, **Then** a new maintenance task is created with status "scheduled"
2. **Given** I have a scheduled maintenance task, **When** I click "Start Work" and assign a technician, **Then** the status changes to "in-progress" and technician is recorded
3. **Given** I have an in-progress task, **When** I click "Complete" and enter completion notes and cost, **Then** the status changes to "completed" and details are saved
4. **Given** I have a scheduled task, **When** I click "Reschedule" and select a new date, **Then** the due date is updated
5. **Given** I want to create recurring maintenance, **When** I enable "Recurring" and set interval (every 3 months or 5000 km), **Then** the system automatically creates future tasks based on the schedule

---

### User Story 4 - Maintenance Reminders and Alerts (Priority: P2)

Users receive automatic reminders when maintenance is due (within 7 days or specific mileage threshold) and when insurance renewal is approaching (30 days before expiration). This prevents missed maintenance and compliance issues.

**Why this priority**: Proactive alerts prevent costly breakdowns and legal issues from expired insurance. High value for user retention.

**Independent Test**: Create a maintenance task due in 5 days and an insurance policy expiring in 20 days, verify the system displays both alerts on the dashboard.

**Acceptance Scenarios**:

1. **Given** I have a maintenance task due in 5 days, **When** I log into the dashboard, **Then** I see a reminder notification for that task
2. **Given** I have insurance expiring in 25 days, **When** I view the vehicle details, **Then** I see an insurance renewal alert
3. **Given** I have a maintenance task overdue by 3 days, **When** I view the vehicle, **Then** the alert is highlighted in red as urgent
4. **Given** I have completed a maintenance task, **When** the due date passes, **Then** no reminder is shown for that task

---

### User Story 5 - Parts Inventory and Replacement History (Priority: P3)

Technicians record replaced parts by entering date, part type, part number, and price. They can view complete replacement history for a vehicle to understand patterns (e.g., frequent brake replacements suggesting driving issues).

**Why this priority**: Valuable for diagnostics and cost tracking but not critical for basic operations. Can be added after core maintenance features are stable.

**Independent Test**: Add 3 replaced parts for a vehicle (brake pads, oil filter, air filter) with dates and costs, view replacement history showing chronological order with total parts cost.

**Acceptance Scenarios**:

1. **Given** I am recording a completed maintenance task, **When** I click "Add Replaced Part" and enter part type (Brake Pads), part number (BP-1234), date, and price ($89.99), **Then** the part is logged
2. **Given** I have recorded multiple part replacements, **When** I view the vehicle's parts history, **Then** I see a chronological list with dates, part types, numbers, and costs
3. **Given** I view parts history, **When** I filter by part type, **Then** I see only replacements for that specific part type
4. **Given** I view parts history, **When** I calculate total, **Then** I see cumulative cost of all replaced parts

---

### User Story 6 - Expense Dashboard and Reports (Priority: P2)

Fleet managers view comprehensive expense dashboards showing fuel costs, maintenance costs, insurance, fines, tolls, and other vehicle-related expenses. They can generate reports on-demand or schedule them (weekly/monthly) to analyze spending patterns and identify cost-saving opportunities.

**Why this priority**: Financial visibility is critical for business decision-making. Helps justify fleet investments and identify problem vehicles.

**Independent Test**: Record various expenses (fuel, maintenance, insurance payment, toll), view dashboard showing categorized expenses with totals, generate a monthly report showing all expense categories.

**Acceptance Scenarios**:

1. **Given** I have recorded expenses across multiple categories, **When** I view the expense dashboard, **Then** I see totals for each category (fuel, maintenance, insurance, fines, tolls, fees, financing)
2. **Given** I am on the dashboard, **When** I select a date range (last 30 days), **Then** the dashboard updates to show only expenses within that period
3. **Given** I want a detailed report, **When** I click "Generate Report" and select parameters (vehicle, date range, categories), **Then** a report is generated showing itemized expenses
4. **Given** I want automatic reports, **When** I click "Schedule Report" and set frequency (weekly/monthly) and recipients, **Then** reports are automatically sent at the specified interval
5. **Given** I view the dashboard, **When** I compare vehicles, **Then** I see running costs per vehicle to identify which vehicles are most expensive to operate

---

### User Story 7 - Document Management (Priority: P3)

Users upload and store vehicle-related documents (insurance certificates, registration, service receipts, inspection reports) in the system. Documents are organized by vehicle and can be retrieved when needed (e.g., during traffic stops or audits).

**Why this priority**: Important for compliance and organization but not core to daily operations. Can be added after financial and maintenance features are working.

**Independent Test**: Upload 3 documents for a vehicle (insurance PDF, registration image, service receipt), verify they are displayed with upload dates, download a document to confirm it's intact.

**Acceptance Scenarios**:

1. **Given** I am viewing a vehicle's details, **When** I click "Upload Document", select a file (PDF or image), and assign a category (Insurance), **Then** the document is uploaded and displayed in the vehicle's document list
2. **Given** I have uploaded documents, **When** I view the document list, **Then** I see document names, categories, upload dates, and file sizes
3. **Given** I want to view a document, **When** I click on it, **Then** it opens in a new tab or downloads to my device
4. **Given** I have multiple documents, **When** I search by category or keyword, **Then** relevant documents are filtered and displayed

---

### User Story 8 - Repair History Tracking (Priority: P2)

Maintenance managers view complete repair history for vehicles, including what was repaired, who performed the work, how long it took, detailed notes, and costs. This helps with warranty claims, technician performance evaluation, and identifying chronic vehicle issues.

**Why this priority**: Essential for fleet operations and accountability. Helps identify recurring problems and evaluate service quality.

**Independent Test**: Record 2 repairs for a vehicle with different technicians, durations, and costs. View repair history showing all details in chronological order with total repair costs.

**Acceptance Scenarios**:

1. **Given** I have completed maintenance tasks, **When** I view the repair history, **Then** I see each repair with date, description, assigned technician, duration, notes, and cost
2. **Given** I want to analyze repairs, **When** I filter by technician, **Then** I see only repairs performed by that technician
3. **Given** I view repair history, **When** I sort by cost (highest to lowest), **Then** repairs are reordered accordingly
4. **Given** I need warranty information, **When** I view a specific repair, **Then** I see complete details including parts used and labor hours

---

### Edge Cases

- What happens when a maintenance task is overdue by months but still in "scheduled" status?
- How does the system prevent duplicate vehicle entries (same license plate)?
- What happens when a user tries to schedule maintenance for a date in the past?
- What happens when insurance expiration date is not provided by the user?
- How does the system handle multiple fill-ups recorded on the same day with same odometer reading?
- What happens when a document upload fails due to file size or network issues?
- How does the system handle timezone differences for scheduled maintenance and reports?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create named fleets (e.g., "Delivery Fleet", "Executive Vehicles")
- **FR-002**: System MUST allow users to create vehicles with make, model year, number of seats, license plate number, and vehicle type
- **FR-003**: System MUST allow users to add existing vehicles to fleets and remove vehicles from fleets
- **FR-004**: System MUST support vehicles existing independently without fleet assignment
- **FR-005**: System MUST allow users to record fuel fill-ups with date, fuel amount, cost, and odometer reading
- **FR-006**: System MUST calculate and display fuel efficiency (MPG or L/100km) based on odometer differences between fill-ups
- **FR-007**: System MUST allow users to create maintenance tasks with type (Preventive, Corrective, Predictive, Inspection & Compliance), description, priority, and due date
- **FR-008**: System MUST support maintenance task states: scheduled, in-progress, completed
- **FR-009**: System MUST allow users to reschedule maintenance tasks by changing the due date
- **FR-010**: System MUST allow users to assign maintenance tasks to technicians
- **FR-011**: System MUST allow users to create recurring maintenance tasks with interval (time-based or mileage-based)
- **FR-012**: System MUST automatically generate future maintenance tasks based on recurring schedules
- **FR-013**: System MUST display reminders for maintenance tasks due within 7 days or within specified mileage threshold
- **FR-014**: System MUST display reminders for insurance renewals due within 30 days
- **FR-015**: System MUST allow users to record replaced parts with date, part type, part number, and price
- **FR-016**: System MUST display complete parts replacement history for each vehicle
- **FR-017**: System MUST track and categorize vehicle expenses: fuel, maintenance, insurance, fines, tolls, fees, financing
- **FR-018**: System MUST display expense dashboard showing totals by category and date range
- **FR-019**: System MUST allow users to generate expense reports filtered by vehicle, date range, and expense categories
- **FR-020**: System MUST allow users to schedule automatic reports (weekly or monthly) to be sent to specified recipients
- **FR-021**: System MUST calculate and display running costs per vehicle
- **FR-022**: System MUST allow users to upload documents (PDF, images) associated with vehicles
- **FR-023**: System MUST organize documents by category (Insurance, Registration, Service Receipts, Inspection Reports, Other)
- **FR-024**: System MUST allow users to view and download uploaded documents
- **FR-025**: System MUST display complete repair history showing date, description, assigned technician, duration, notes, and cost
- **FR-026**: System MUST allow filtering and sorting of repair history by technician, cost, date
- **FR-027**: System MUST support both English and French languages for all user-facing text
- **FR-028**: System MUST prevent duplicate vehicles with the same license plate number
- **FR-029**: System MUST validate odometer readings to ensure they are not lower than previous readings
- **FR-030**: System MUST highlight overdue maintenance tasks with visual indicators
- **FR-031**: System MUST support two user roles: Fleet Manager (full access to all features) and Technician (can only update assigned maintenance tasks, add replaced parts, and view vehicle/maintenance data)
- **FR-032**: System MUST restrict Technicians from creating/deleting vehicles, fleets, or scheduling new maintenance tasks
- **FR-033**: System MUST restrict Technicians from accessing expense dashboards, reports, and financial data
- **FR-034**: System MUST implement soft delete for vehicles - marking them as archived/deleted while retaining all associated data
- **FR-035**: System MUST exclude archived vehicles from active vehicle lists and fleet counts
- **FR-036**: System MUST include archived vehicles in historical reports and expense calculations for accurate historical analysis
- **FR-037**: System MUST display "N/A" or leave efficiency empty for the first fill-up record when no previous odometer reading exists for comparison
- **FR-038**: System MUST stop generating new recurring maintenance tasks when a vehicle is archived
- **FR-039**: System MUST cancel or mark as inactive all future scheduled recurring tasks for archived vehicles
- **FR-040**: System MUST authenticate users via email and password credentials
- **FR-041**: System MUST use token-based authentication (JWT or session tokens) to maintain user sessions
- **FR-042**: System MUST enforce password strength requirements (minimum length, complexity)
- **FR-043**: System MUST provide password reset functionality via email verification

### Key Entities

- **User**: Represents a system user. Attributes: username, email, password hash, role (Fleet Manager or Technician), organization reference, authentication token, token expiration
- **Fleet**: Represents a group of vehicles (e.g., "Delivery Fleet"). Attributes: name, creation date, vehicle count
- **Vehicle**: Represents an individual vehicle. Attributes: make, model, year, number of seats, license plate, vehicle type, current odometer, fleet assignment (optional), insurance expiration date (optional), archived status (boolean), archived date
- **Fill-up**: Represents a refueling event. Attributes: vehicle reference, date, fuel amount, cost, odometer reading, calculated efficiency
- **Maintenance Task**: Represents scheduled or completed maintenance. Attributes: vehicle reference, type (Preventive/Corrective/Predictive/Inspection), description, priority (Low/Medium/High), due date, status (scheduled/in-progress/completed), assigned technician, start date, completion date, duration, notes, cost, recurring (boolean), recurrence interval
- **Replaced Part**: Represents a part replaced during maintenance. Attributes: vehicle reference, maintenance task reference (optional), date, part type, part number, price
- **Expense**: Represents a vehicle-related cost. Attributes: vehicle reference, category (fuel/maintenance/insurance/fines/tolls/fees/financing), date, amount, description, receipt reference (optional)
- **Document**: Represents an uploaded file. Attributes: vehicle reference, category, file name, file type, file size, upload date, file storage location
- **Reminder**: Represents an alert for upcoming maintenance or insurance renewal. Attributes: vehicle reference, type (maintenance/insurance), due date, threshold, acknowledged (boolean)
- **Report**: Represents a generated or scheduled expense report. Attributes: name, vehicle filter, date range, categories included, format (PDF/Excel), schedule (manual/weekly/monthly), recipients

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a fleet and add 5 vehicles with complete details in under 5 minutes
- **SC-002**: System calculates fuel efficiency within 2 seconds of recording a fill-up
- **SC-003**: Users receive maintenance reminders at least 7 days before due date with 100% reliability
- **SC-004**: Dashboard loads expense summary for 12 months of data in under 3 seconds
- **SC-005**: Users can generate a comprehensive expense report in under 10 seconds
- **SC-006**: 95% of users successfully complete their first maintenance task scheduling without assistance
- **SC-007**: System supports at least 1000 vehicles across multiple fleets without performance degradation
- **SC-008**: Users can upload and retrieve documents in under 30 seconds per file
- **SC-009**: Recurring maintenance tasks are automatically created with 100% accuracy based on mileage or time intervals
- **SC-010**: Fleet managers reduce missed maintenance by at least 80% compared to manual tracking
- **SC-011**: Users can view complete repair history for any vehicle in under 2 seconds
- **SC-012**: System prevents 100% of duplicate vehicle entries with same license plate
- **SC-013**: Expense dashboard provides clear cost comparison between vehicles enabling data-driven decisions on vehicle replacement
- **SC-014**: 90% of users find the mobile interface usable for recording fill-ups and maintenance on-site

## Assumptions

- Users have basic computer literacy and can navigate web applications
- Insurance expiration dates are optional; not all users will track insurance in the system
- Fuel efficiency calculation assumes metric units (liters, kilometers) by default with option for imperial units (gallons, miles)
- Maintenance recurring intervals support both time-based (e.g., every 3 months) and mileage-based (e.g., every 5000 km)
- Document uploads support common formats: PDF, JPEG, PNG with maximum file size of 10MB per document
- Scheduled reports are sent via email to registered users
- Reminders are displayed in the dashboard; email/SMS notifications are out of scope for initial version
- Users belong to organizations; fleet access control is based on organizational membership
- All monetary values are stored in a single currency (configurable per organization)
- Timezone for scheduled maintenance and reports is based on user's organization location

## Out of Scope

- Real-time GPS tracking of vehicles
- Predictive maintenance algorithms using sensor data
- Automated parts ordering and inventory management
- Integration with third-party service providers (repair shops, insurance companies)
- Mobile native applications (iOS/Android)
- Telematics device integration
- Driver behavior monitoring
- Route optimization and dispatch
- Fuel card integration
- Multi-tenancy with separate databases per organization
- Audit trail for all data changes
- Role-based access control beyond Fleet Manager and Technician roles (no custom roles, no granular permissions)
- Vehicle resale value tracking
- Carbon footprint calculation

## Dependencies

- Email service provider for scheduled report delivery
- File storage service for document uploads (cloud storage or local filesystem)
- Date/time calculation library for recurring task generation
- Report generation library for PDF and Excel export
- Chart/graph library for expense dashboard visualizations
- i18n library for English/French localization
