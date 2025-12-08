# AutoCheck - Quick Start Guide

## What's Been Implemented ✅

### Foundation (100% Complete)
- ✅ **Authentication System** - User signup, login, email verification, password reset
- ✅ **Role-Based Access Control** - Fleet Manager and Technician roles with permission checks
- ✅ **Database Utilities** - Complete ORM-like abstraction over Google Sheets
- ✅ **Security Layer** - Request validation, token management, route protection

### Fleet & Vehicle Management (100% Complete)
- ✅ **Fleet Management**
  - Create, edit, and delete fleets
  - View all fleets with vehicle counts
  - Assign/remove vehicles from fleets

- ✅ **Vehicle Management**
  - Create vehicles with full validation (make, model, year, seats, license plate, type, odometer, insurance)
  - Edit vehicle details
  - Archive vehicles with reason (soft delete)
  - View active and archived vehicles
  - License plate duplicate prevention
  - Fleet assignment management

## Getting Started

### Prerequisites
- Node.js v22.16.0
- npm 11.4.2
- Google Account (for Google Sheets backend)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Google Sheets Backend**

   a. Create a new Google Spreadsheet

   b. Open Google Apps Script editor (Extensions > Apps Script)

   c. Run the database setup:
   ```javascript
   // In Apps Script editor
   DatabaseSetup.setupDatabase()
   ```

   d. Configure script properties:
   - Go to Project Settings > Script Properties
   - Add property: `AUTH_SPREADSHEET_ID` = Your spreadsheet ID

   e. Deploy as web app:
   - Click Deploy > New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Copy the deployment URL

3. **Configure Frontend**

   Update `.env` file:
   ```
   VITE_API_BASE_URL=<Your Google Apps Script deployment URL>
   VITE_APP_ENV=development
   VITE_DEBUG_MODE=true
   ```

4. **Deploy Google Apps Script Code**

   ```bash
   # Login to Google
   clasp login

   # Push code to Apps Script
   clasp push
   ```

5. **Start Development Server**
   ```bash
   quasar dev
   ```

## Project Structure

```
autocheck/
├── gas/                          # Google Apps Script backend
│   ├── handlers/                 # HTTP request handlers
│   │   ├── AuthHandler.gs
│   │   ├── FleetHandler.gs      ✅ NEW
│   │   └── VehicleHandler.gs    ✅ NEW
│   ├── services/                 # Business logic
│   │   ├── FleetService.gs      ✅ NEW
│   │   ├── VehicleService.gs    ✅ NEW
│   │   └── UserService.gs
│   ├── security/
│   │   ├── SecurityInterceptor.gs
│   │   ├── TokenManager.gs
│   │   └── RoleValidator.gs     ✅ NEW
│   └── utils/
│       ├── DatabaseUtil.gs      ✅ NEW
│       ├── DatabaseSetup.gs     ✅ NEW
│       ├── Router.gs            ✅ UPDATED
│       └── ResponseHandler.gs
│
├── src/                          # Vue 3 frontend
│   ├── components/
│   │   ├── fleet/               ✅ NEW
│   │   │   ├── FleetCard.vue
│   │   │   ├── FleetForm.vue
│   │   │   └── FleetList.vue
│   │   ├── vehicle/             ✅ NEW
│   │   │   ├── VehicleCard.vue
│   │   │   ├── VehicleForm.vue
│   │   │   └── VehicleList.vue
│   │   └── auth/
│   ├── pages/
│   │   ├── FleetManagementPage.vue    ✅ NEW
│   │   ├── VehicleManagementPage.vue  ✅ NEW
│   │   └── auth/
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── fleetStore.js        ✅ NEW
│   │   └── vehicleStore.js      ✅ NEW
│   ├── router/
│   │   └── routes.js            ✅ UPDATED
│   └── i18n/
│       ├── en.json              ✅ UPDATED
│       └── fr.json              ✅ UPDATED
│
└── specs/
    └── 001-vehicle-maintenance/
        └── IMPLEMENTATION_STATUS.md  ✅ UPDATED
```

## Available Routes

### Public Routes (No Authentication)
- `/` - Home page
- `/signup` - Create account
- `/login` - Login
- `/verify-email` - Email verification
- `/verify-token` - Token verification

### Authenticated Routes
- `/app/profile` - User profile
- `/app/fleets` - Fleet management ✅ NEW
- `/app/vehicles` - Vehicle management ✅ NEW

## API Endpoints

### Fleet Management
- `fleet.create` - Create new fleet (Fleet Manager only)
- `fleet.list` - List all fleets
- `fleet.get` - Get single fleet by ID
- `fleet.update` - Update fleet (Fleet Manager only)
- `fleet.delete` - Delete fleet (Fleet Manager only)
- `fleet.getVehicles` - Get vehicles in fleet

### Vehicle Management
- `vehicle.create` - Create new vehicle (Fleet Manager only)
- `vehicle.list` - List all vehicles (with optional archived filter)
- `vehicle.get` - Get single vehicle by ID
- `vehicle.update` - Update vehicle (Fleet Manager only)
- `vehicle.archive` - Archive vehicle (Fleet Manager only)
- `vehicle.assignToFleet` - Assign vehicle to fleet (Fleet Manager only)
- `vehicle.removeFromFleet` - Remove vehicle from fleet (Fleet Manager only)
- `vehicle.delete` - Permanently delete vehicle (Fleet Manager only)

## User Roles

### Fleet Manager
- Full access to all features
- Can create, edit, and delete fleets
- Can create, edit, archive, and delete vehicles
- Can schedule maintenance tasks
- Can view financial data and reports

### Technician
- Can view all vehicles and fleets
- Can update assigned maintenance tasks
- Can add parts to maintenance records
- Cannot create/delete vehicles or fleets
- Cannot access financial data

## Key Features

### Vehicle Archive System (FR-034, FR-038, FR-039)
- Vehicles are archived (soft delete) instead of permanently deleted
- Archive requires a reason
- Archived vehicles are hidden by default but can be toggled visible
- Future maintenance tasks are automatically cancelled on archive
- All historical data is retained

### Validation
- **License Plate** - Required, duplicate check (FR-028)
- **Year** - Must be between 1900 and current year + 1
- **Seats** - Must be between 1 and 99
- **Odometer** - Must be >= 0 (FR-029)

### Internationalization
- Full English and French translation support
- Language switcher available on all pages
- Translation parity maintained between languages

## Testing the Application

### 1. Create a Fleet Manager Account
```bash
# Navigate to /signup
# Use email: manager@example.com
# After signup, verify email via link
```

### 2. Create a Fleet
```bash
# Navigate to /app/fleets
# Click "Create Fleet"
# Enter name and description
# Submit
```

### 3. Create Vehicles
```bash
# Navigate to /app/vehicles
# Click "Create Vehicle"
# Fill in required fields:
#   - Make: Toyota
#   - Model: Camry
#   - Year: 2024
#   - Seats: 5
#   - License Plate: ABC-123
#   - Type: Car
#   - Odometer: 10000
# Submit
```

### 4. Assign Vehicle to Fleet
```bash
# In vehicle card, click actions
# Select "Assign to Fleet"
# Choose fleet from dropdown
# Submit
```

### 5. Archive a Vehicle
```bash
# In vehicle card, click "Archive"
# Enter reason: "Sold to customer"
# Confirm archive
# Toggle "Show archived" to see archived vehicles
```

## Development Workflow

### Adding a New Feature

Follow the established 4-layer pattern:

1. **Backend Service** (`gas/services/`)
   - Create business logic
   - Add CRUD operations
   - Implement validations

2. **Backend Handler** (`gas/handlers/`)
   - Create HTTP request handlers
   - Add role-based access control
   - Return standardized responses

3. **Register Routes** (`gas/utils/Router.gs`)
   - Add handler to handlers object
   - Document routes in listRoutes()

4. **Frontend Store** (`src/stores/`)
   - Create Pinia store
   - Add state, computed, and actions
   - Implement API calls

5. **Frontend Components** (`src/components/`)
   - Create Card component (display)
   - Create Form component (create/edit)
   - Create List component (grid view)

6. **Frontend Page** (`src/pages/`)
   - Create management page
   - Wire up components
   - Add dialogs and confirmations

7. **Add Routes** (`src/router/routes.js`)
   - Register new routes
   - Set authentication requirements

8. **Translations** (`src/i18n/`)
   - Add English translations
   - Add French translations (maintain parity)

## Next Steps

### Remaining Features (213 tasks)

1. **Maintenance Logging** (51 tasks)
   - Schedule preventive maintenance
   - Log completed maintenance
   - Track service history
   - Assign technicians

2. **Fuel Tracking** (31 tasks)
   - Record fuel purchases
   - Track fuel consumption
   - Calculate efficiency metrics

3. **Reminders** (30 tasks)
   - Maintenance reminders
   - Insurance renewal alerts
   - Inspection due dates

4. **Expense Dashboard** (43 tasks)
   - View all expenses
   - Filter by vehicle/fleet
   - Export reports
   - Cost analysis

5. **Repair History** (13 tasks)
   - View complete repair history
   - Filter by vehicle
   - Search by date range

6. **Parts Inventory** (22 tasks)
   - Track replaced parts
   - Monitor inventory levels
   - Parts cost tracking

7. **Document Management** (31 tasks)
   - Upload vehicle documents
   - Organize by category
   - Track expiry dates

### Polish & Testing (44 tasks)
- Navigation menu updates
- Dashboard/home page
- Error handling improvements
- Mobile responsiveness
- Cross-browser testing

## Troubleshooting

### Common Issues

**Issue**: "AUTH_SPREADSHEET_ID not configured"
- **Solution**: Add spreadsheet ID to script properties in Google Apps Script

**Issue**: "Invalid authentication token"
- **Solution**: Clear browser localStorage and login again

**Issue**: CORS errors
- **Solution**: Ensure Google Apps Script is deployed as web app with "Anyone" access

**Issue**: Components not rendering
- **Solution**: Check browser console for import errors, ensure all dependencies installed

## Architecture Decisions

1. **Single-Tenant** - Each customer gets dedicated deployment (no multi-tenancy complexity)
2. **Soft Delete** - Vehicles archived instead of deleted (data retention)
3. **Google Sheets** - Database with ORM-like abstraction via DatabaseUtil
4. **Vue 3 Composition API** - All components use `<script setup>`
5. **Quasar Framework** - Material Design components, responsive grid
6. **Pinia** - Domain-organized state management
7. **i18n** - English and French with complete parity

## Resources

- **Spec Document**: `specs/001-vehicle-maintenance/spec.md`
- **Implementation Status**: `specs/001-vehicle-maintenance/IMPLEMENTATION_STATUS.md`
- **API Contracts**: `specs/001-vehicle-maintenance/api-contracts/`
- **Data Model**: `specs/001-vehicle-maintenance/data-model.md`

## Support

For issues or questions:
1. Check IMPLEMENTATION_STATUS.md for implementation patterns
2. Review existing components for reference implementations
3. Consult spec.md for business requirements
4. Check API contracts for endpoint specifications

---

**Current Progress**: 112/359 tasks (31%)
**Status**: Foundation + User Story 1 Complete ✅
**Estimated Completion**: 3-4 weeks for remaining features
