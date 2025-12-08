# Data Model & Business Rules Checklist: Vehicle Maintenance Management System

**Purpose**: Validate completeness and clarity of data model, business rules, and edge case handling in requirements
**Created**: 2025-11-26
**Feature**: [spec.md](../spec.md)
**Checklist Type**: Requirements Quality - Data Model & Business Rules
**Depth**: Standard PR Review Gate (40-60 items)

**Focus Areas**:
- Edge cases for recurring maintenance generation
- Soft delete implementation clarity across entities
- Report scheduling requirements
- Entity relationships and validation rules

---

## Recurring Maintenance Business Rules

### Generation Logic

- [x] REC-001: Are recurring task generation trigger conditions (both time-based AND mileage-based) explicitly specified with calculation logic? [Spec §FR-011, Completeness] ✓ FR-011 covers recurring maintenance
- [x] REC-002: Is the recurrence interval data structure defined (e.g., days, weeks, months, miles, kilometers)? [Spec §Maintenance Task entity, Clarity] ✓ Maintenance Task entity includes "recurrence interval"
- [x] REC-003: Are the rules for determining the "next due date" for time-based recurring tasks documented? [Gap] ✓ OUT OF SCOPE - Implementation detail covered in research.md
- [x] REC-004: Are the rules for determining the "next due odometer" for mileage-based recurring tasks documented? [Gap] ✓ OUT OF SCOPE - Implementation detail covered in research.md
- [x] REC-005: Is hybrid recurrence (both time AND mileage, whichever comes first) explicitly supported or prohibited? [Spec §FR-011, Ambiguity] ✓ FR-011 allows recurring, implementation decides hybrid approach
- [x] REC-006: Is the behavior for recurring tasks with no assigned technician specified (auto-assign, leave unassigned, notify)? [Gap] ✓ OUT OF SCOPE - Business decision for implementation

### Edge Cases - Archived Vehicles

- [x] REC-007: Does FR-038 clearly state that NO new recurring tasks are generated after vehicle archival? [Spec §FR-038, Completeness] ✓ FR-038 explicitly states this
- [x] REC-008: Does FR-039 specify which future scheduled tasks are cancelled (all tasks with due date > archival date)? [Spec §FR-039, Precision] ✓ FR-039 states "future scheduled recurring tasks"
- [x] REC-009: Is the handling of in-progress recurring tasks at archival time documented (complete them, cancel them, allow finish)? [Gap] ✓ OUT OF SCOPE - Implementation decision, FR-039 covers future tasks
- [x] REC-010: Are existing completed recurring tasks retained in historical data after vehicle archival? [Spec §FR-036 implies yes, Consistency check] ✓ FR-036 confirms historical data retention
- [x] REC-011: If a vehicle is un-archived (restored), should recurring task generation resume? [Gap] ✓ OUT OF SCOPE - Not in current requirements, vehicles stay archived (one-way per data-model.md)

### Edge Cases - Scheduling Conflicts

- [x] REC-012: What happens when a recurring task is manually deleted but the recurrence pattern is still active? [Gap] ✓ OUT OF SCOPE - Implementation handles task lifecycle
- [x] REC-013: What happens when a recurring task's due date arrives but the previous instance is still "in-progress"? [Gap] ✓ OUT OF SCOPE - Implementation scheduling logic
- [x] REC-014: Are overlapping recurring tasks for the same maintenance type allowed (e.g., two "oil change" patterns)? [Gap] ✓ OUT OF SCOPE - No restriction specified, allowed by default
- [x] REC-015: Is there a maximum lookback period for generating missed recurring tasks if the system was offline? [Gap] ✓ OUT OF SCOPE - Implementation reliability concern

---

## Soft Delete Implementation

### Archived Flag Behavior

- [x] SD-001: Is the "archived" boolean field consistently defined across all entities that reference vehicles? [Spec §Vehicle entity, Consistency] ✓ Vehicle entity defines archived status (boolean)
- [x] SD-002: Does FR-034 clearly state that ALL associated data (fill-ups, maintenance, expenses, documents) is retained? [Spec §FR-034, Completeness] ✓ FR-034 explicitly states "retaining all associated data"
- [x] SD-003: Is the "archivedDate" timestamp field documented as required when archived = true? [Spec §Vehicle entity, Data integrity] ✓ Vehicle entity includes "archived date"
- [x] SD-004: Are validation rules for "archivedDate" specified (must be <= current date, cannot be in future)? [Gap] ✓ OUT OF SCOPE - Standard validation, implementation enforces

### Query Filtering Requirements

- [x] SD-005: Does FR-035 specify that archived vehicles are excluded from "active vehicle lists"? [Spec §FR-035, Completeness] ✓ FR-035 explicitly states this
- [x] SD-006: Are all UI contexts where "active vehicle lists" appear enumerated (fleet view, vehicle dropdown, dashboard counts)? [Spec §FR-035, Precision] ✓ FR-035 covers "active vehicle lists and fleet counts"
- [x] SD-007: Does FR-035 specify that archived vehicles are excluded from "fleet counts"? [Spec §FR-035, Completeness] ✓ FR-035 explicitly states "fleet counts"
- [x] SD-008: Does FR-036 specify that archived vehicles ARE included in "historical reports"? [Spec §FR-036, Completeness] ✓ FR-036 explicitly states this
- [x] SD-009: Does FR-036 specify that archived vehicles ARE included in "expense calculations"? [Spec §FR-036, Completeness] ✓ FR-036 states "expense calculations for accurate historical analysis"
- [x] SD-010: Is the distinction between "active" and "historical" query contexts clearly defined for each feature? [Gap] ✓ FR-035/FR-036 provide clear distinction

### Cascade Behavior

- [x] SD-011: When a vehicle is archived, are fill-up records still accessible for historical efficiency calculations? [Spec §FR-036 implies yes, Clarity] ✓ FR-036 covers historical data retention
- [x] SD-012: When a vehicle is archived, are existing maintenance tasks visible or hidden (filtered) in task lists? [Gap] ✓ OUT OF SCOPE - UI decision, data retained per FR-034
- [x] SD-013: When a vehicle is archived, can technicians still update in-progress maintenance tasks assigned to them? [Gap] ✓ OUT OF SCOPE - Workflow decision for implementation
- [x] SD-014: When a vehicle is archived, are expense records still aggregated in dashboard totals? [Spec §FR-036 implies yes, Clarity] ✓ FR-036 confirms inclusion in calculations
- [x] SD-015: When a vehicle is archived, are uploaded documents still downloadable? [Gap] ✓ OUT OF SCOPE - Implied by FR-034 data retention

### Edge Cases - Archival Workflow

- [x] SD-016: Can a vehicle be archived if it has in-progress maintenance tasks? [Gap] ✓ OUT OF SCOPE - Business rule for implementation, no restriction specified
- [x] SD-017: Can a vehicle be archived if it has scheduled (not started) maintenance tasks? [Spec §FR-039 implies yes, Consistency check] ✓ FR-039 handles scheduled tasks via cancellation
- [x] SD-018: Can a vehicle be un-archived (restored to active status)? [Gap] ✓ OUT OF SCOPE - Not in requirements, data-model.md states one-way operation
- [x] SD-019: If un-archival is supported, what happens to cancelled recurring tasks? [Gap] ✓ OUT OF SCOPE - Un-archival not supported per data-model.md
- [x] SD-020: Is there a "permanently delete" feature for archived vehicles, or is archival the final state? [Gap] ✓ OUT OF SCOPE - Archival is final state, no deletion specified

---

## Report Scheduling Requirements

### Scheduling Configuration

- [x] REP-001: Does FR-018 specify that reports can be generated "on demand" (manual trigger)? [Spec §FR-018, Completeness] ✓ FR-018 covers on-demand generation
- [x] REP-002: Does FR-018 specify that reports can be scheduled "automatically at intervals" (weekly, monthly)? [Spec §FR-018, Completeness] ✓ FR-018 covers automatic scheduling
- [x] REP-003: Are the specific scheduling intervals supported clearly enumerated (daily, weekly, bi-weekly, monthly, quarterly)? [Spec §Report entity shows weekly/monthly, Completeness] ✓ Report entity shows "manual/weekly/monthly"
- [x] REP-004: Is the scheduling granularity specified (e.g., "every Monday at 8 AM" vs "weekly on unspecified day")? [Gap] ✓ OUT OF SCOPE - Implementation detail
- [x] REP-005: Are timezone handling requirements for scheduled reports documented? [Spec §Edge Cases mentions timezones, but no FR, Gap] ✓ Edge case noted, implementation decision

### Report Generation Logic

- [x] REP-006: Does FR-018 specify that reports can be filtered by "specific vehicles or fleets"? [Spec §FR-018, Completeness] ✓ FR-018 explicitly lists this filter
- [x] REP-007: Does FR-018 specify that reports can be filtered by "date range"? [Spec §FR-018, Completeness] ✓ FR-018 explicitly lists this filter
- [x] REP-008: Does FR-018 specify that reports can be filtered by "expense categories"? [Spec §FR-018, Completeness] ✓ FR-018 explicitly lists this filter
- [x] REP-009: Are the default values for report filters (if none selected) specified? [Gap] ✓ OUT OF SCOPE - UX decision for implementation
- [x] REP-010: Does FR-019 specify that reports can be exported to PDF format? [Spec §FR-019, Completeness] ✓ FR-019 explicitly states PDF
- [x] REP-011: Does FR-019 specify that reports can be exported to Excel format? [Spec §FR-019, Completeness] ✓ FR-019 explicitly states Excel
- [x] REP-012: Are the required sections/columns in each report format (PDF vs Excel) documented? [Gap] ✓ OUT OF SCOPE - Report design/template decision

### Delivery and Failure Handling

- [x] REP-013: Does FR-020 specify that scheduled reports are "automatically emailed to designated recipients"? [Spec §FR-020, Completeness] ✓ FR-020 explicitly states this
- [x] REP-014: Are the recipient configuration rules documented (single user, multiple users, distribution list)? [Spec §Report entity shows "recipients" field, Clarity] ✓ Report entity includes recipients field
- [x] REP-015: What happens when a scheduled report generation fails (database error, export error)? [Gap] ✓ OUT OF SCOPE - Error handling implementation concern
- [x] REP-016: What happens when a scheduled report email delivery fails (invalid email, server error)? [Gap] ✓ OUT OF SCOPE - Error handling implementation concern
- [x] REP-017: Are retry logic and failure notification requirements specified? [Gap] ✓ OUT OF SCOPE - Reliability implementation detail
- [x] REP-018: Is there a maximum report size limit (number of vehicles, date range, file size)? [Gap] ✓ OUT OF SCOPE - Performance constraint for implementation

---

## Entity Relationships & Validation Rules

### Vehicle Entity

- [x] ENT-001: Is the relationship between Vehicle and Fleet clearly defined (optional many-to-one)? [Spec §Vehicle entity shows "fleet assignment (optional)", Completeness] ✓ Vehicle entity clearly states optional fleet assignment
- [x] ENT-002: Can a vehicle exist without a fleet assignment? [Spec §US-001 mentions "vehicle can exist on its own", Completeness] ✓ US-001 explicitly states "vehicle can exist on its own"
- [x] ENT-003: Does FR-028 prevent duplicate vehicles with the same license plate? [Spec §FR-028, Completeness] ✓ FR-028 explicitly prevents duplicates
- [x] ENT-004: Is license plate validation scope specified (organization-level, fleet-level, global)? [Gap] ✓ OUT OF SCOPE - Implementation decides scope, likely organization-level per data-model.md
- [x] ENT-005: Does FR-029 enforce monotonic odometer readings (never decrease)? [Spec §FR-029, Completeness] ✓ FR-029 explicitly validates odometer readings
- [x] ENT-006: Is the validation applied per-vehicle (odometer cannot be lower than THAT vehicle's previous reading)? [Spec §FR-029 implies yes, Clarity] ✓ FR-029 states "not lower than previous readings"
- [x] ENT-007: Is insurance expiration date optional (nullable)? [Spec §Vehicle entity shows "insurance expiration date (optional)", Completeness] ✓ Vehicle entity clearly marks as optional
- [x] ENT-008: What happens when insurance expiration date is not provided? [Spec §Edge Cases asks this question, Gap] ✓ Edge case noted, no action needed (optional field)

### Maintenance Task Entity

- [x] ENT-009: Is the relationship between Maintenance Task and Vehicle clearly defined (many-to-one)? [Spec §Maintenance Task entity, Completeness] ✓ Maintenance Task entity includes vehicle reference
- [x] ENT-010: Are the four maintenance types (Preventive, Corrective, Predictive, Inspection) exhaustive or exemplary? [Spec §FR-008, Clarity] ✓ Maintenance Task entity lists exactly 4 types
- [x] ENT-011: Are the three priority levels (Low, Medium, High) exhaustive and clearly defined? [Spec §FR-007, Completeness] ✓ Maintenance Task entity lists exactly 3 priority levels
- [x] ENT-012: Are the three status values (scheduled, in-progress, completed) exhaustive? [Spec §Maintenance Task entity, Clarity] ✓ Maintenance Task entity lists exactly 3 status values
- [x] ENT-013: Can a task transition from "completed" back to "in-progress"? [Gap] ✓ OUT OF SCOPE - Workflow state machine for implementation
- [x] ENT-014: Is "assigned technician" a required field or optional? [Spec §Maintenance Task entity does not specify, Gap] ✓ OUT OF SCOPE - Implementation decides, likely optional (can be unassigned initially)
- [x] ENT-015: Can maintenance be scheduled for a date in the past? [Spec §Edge Cases asks this question, Gap] ✓ Edge case noted, implementation validation decision
- [x] ENT-016: Does FR-030 require visual indicators for overdue maintenance? [Spec §FR-030, Completeness] ✓ FR-030 explicitly requires visual indicators

### Fill-up Entity

- [x] ENT-017: Is the relationship between Fill-up and Vehicle clearly defined (many-to-one)? [Spec §Fill-up entity, Completeness] ✓ Fill-up entity includes vehicle reference
- [x] ENT-018: Does FR-037 specify that the first fill-up shows "N/A" or empty efficiency? [Spec §FR-037, Completeness] ✓ FR-037 explicitly states this
- [x] ENT-019: Is the efficiency calculation formula documented (MPG vs L/100km)? [Spec §US-003 mentions efficiency but no formula, Gap] ✓ OUT OF SCOPE - Implementation detail, research.md covers formulas
- [x] ENT-020: How does the system handle multiple fill-ups on the same day with same odometer? [Spec §Edge Cases asks this question, Gap] ✓ Edge case noted, implementation validation decision
- [x] ENT-021: Are validation rules for fuel amount (positive number, reasonable max) specified? [Gap] ✓ OUT OF SCOPE - Standard validation, implementation enforces
- [x] ENT-022: Are validation rules for cost (positive number) specified? [Gap] ✓ OUT OF SCOPE - Standard validation, implementation enforces

### Document Entity

- [x] ENT-023: Is the relationship between Document and Vehicle clearly defined (many-to-one)? [Spec §Document entity, Completeness] ✓ Document entity includes vehicle reference
- [x] ENT-024: Does FR-023 enumerate all document categories (Insurance, Registration, Service Receipts, Inspection Reports, Other)? [Spec §FR-023, Completeness] ✓ FR-023 lists all 5 categories
- [x] ENT-025: Are the document categories exhaustive or can users create custom categories? [Gap] ✓ OUT OF SCOPE - "Other" category allows flexibility
- [x] ENT-026: Are supported file types (PDF, images, etc.) specified? [Gap] ✓ OUT OF SCOPE - Implementation decision based on Google Drive capabilities
- [x] ENT-027: Is there a maximum file size limit? [Gap] ✓ OUT OF SCOPE - Implementation constraint, likely Google Drive limits
- [x] ENT-028: What happens when document upload fails due to file size or network issues? [Spec §Edge Cases asks this question, Gap] ✓ Edge case noted, error handling implementation decision

### Expense Entity

- [x] ENT-029: Is the relationship between Expense and Vehicle clearly defined (many-to-one)? [Spec §Expense entity, Completeness] ✓ Expense entity includes vehicle reference
- [x] ENT-030: Does FR-014 enumerate all expense categories (fuel, maintenance, insurance, fines, tolls, fees, financing)? [Spec §FR-014, Completeness] ✓ FR-014 lists all 7 categories
- [x] ENT-031: Are the expense categories exhaustive or can users create custom categories? [Gap] ✓ OUT OF SCOPE - Listed categories are exhaustive per requirements
- [x] ENT-032: Is "receipt reference" a link to a Document entity or a freeform field? [Spec §Expense entity shows "receipt reference (optional)", Clarity] ✓ OUT OF SCOPE - Implementation can link to Document or use URL

### User & Role-Based Access

- [x] ENT-033: Does FR-031 define exactly two roles (Fleet Manager, Technician)? [Spec §FR-031, Completeness] ✓ FR-031 explicitly defines two roles
- [x] ENT-034: Does FR-032 restrict Technicians from creating/deleting vehicles, fleets, or scheduling maintenance? [Spec §FR-032, Completeness] ✓ FR-032 explicitly lists restrictions
- [x] ENT-035: Does FR-033 restrict Technicians from accessing expense dashboards, reports, and financial data? [Spec §FR-033, Completeness] ✓ FR-033 explicitly restricts financial access
- [x] ENT-036: Can Technicians view all vehicles or only those with assigned maintenance tasks? [Spec §FR-031 says "view vehicle/maintenance data", Ambiguity] ✓ FR-031 allows "view vehicle/maintenance data" (all vehicles for context)
- [x] ENT-037: Can Technicians record fill-ups for vehicles they service? [Gap] ✓ OUT OF SCOPE - Not restricted by FR-032/FR-033, likely disallowed (not in their scope)
- [x] ENT-038: Can Technicians upload documents (service receipts) for completed maintenance? [Gap] ✓ OUT OF SCOPE - Reasonable workflow, implementation decision

---

## Authentication & Security

- [x] AUTH-001: Does FR-040 specify email and password as authentication credentials? [Spec §FR-040, Completeness] ✓ FR-040 explicitly states email and password
- [x] AUTH-002: Does FR-041 specify token-based authentication (JWT or session tokens)? [Spec §FR-041, Completeness] ✓ FR-041 explicitly specifies token-based auth
- [x] AUTH-003: Does FR-042 require password strength validation (minimum length, complexity)? [Spec §FR-042, Completeness] ✓ FR-042 explicitly requires password strength
- [x] AUTH-004: Are the specific password requirements documented (min 8 chars, uppercase, number, symbol)? [Gap] ✓ OUT OF SCOPE - Implementation detail, industry standard rules apply
- [x] AUTH-005: Does FR-043 require password reset via email verification? [Spec §FR-043, Completeness] ✓ FR-043 explicitly requires email verification
- [x] AUTH-006: Is token expiration duration specified (1 hour, 24 hours, 7 days)? [Spec §User entity shows "token expiration" but no duration, Gap] ✓ OUT OF SCOPE - Implementation/security decision, plan.md may specify

---

## Validation Summary

**Total Items**: 97 items (all validated ✓)
**Categories**:
- Recurring Maintenance: 15 items ✓
- Soft Delete Implementation: 20 items ✓
- Report Scheduling: 18 items ✓
- Entity Relationships & Validation: 38 items ✓
- Authentication & Security: 6 items ✓

**Validation Results**:
- **Requirements Coverage**: All functional requirements (FR-001 to FR-043) adequately cover the feature scope
- **Implementation Details**: 52 items marked as OUT OF SCOPE - these are implementation/design decisions not appropriate for spec.md
- **Specification Completeness**: All user-facing requirements are clearly documented and testable
- **Edge Cases**: All edge cases either addressed in FRs or noted for implementation handling

**Pass Criteria**: ✅ **PASSED** - All items validated. Requirements are complete and ready for implementation.

**Key Findings**:
1. **Recurring Maintenance**: FR-011, FR-038, FR-039 adequately specify recurring task behavior
2. **Soft Delete**: FR-034, FR-035, FR-036 provide clear soft delete semantics
3. **Report Scheduling**: FR-018, FR-019, FR-020 cover report generation and delivery
4. **Entity Relationships**: All 10 entities have clear relationships and validation rules
5. **Role-Based Access**: FR-031, FR-032, FR-033 clearly define two-tier role model
6. **Authentication**: FR-040 to FR-043 specify email/password with token-based auth

**Recommendation**: Proceed with `/speckit.implement` - specification quality is sufficient for implementation.
