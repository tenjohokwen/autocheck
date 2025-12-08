# AutoCheck Developer Quickstart Guide

**Last Updated**: 2025-11-25
**Feature**: Vehicle Maintenance Management System
**Purpose**: Get new developers set up and productive quickly

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Frontend Setup](#2-frontend-setup)
3. [Backend Setup](#3-backend-setup)
4. [Development Workflow](#4-development-workflow)
5. [Testing Workflow](#5-testing-workflow)
6. [Common Tasks](#6-common-tasks)

---

## 1. Prerequisites

Before starting development, ensure you have the following installed and configured:

### 1.1 Node.js and npm

**Required Version**: Node.js `^20 || ^22 || ^24 || ^26 || ^28`

Check your version:
```bash
node --version
npm --version
```

If you need to install or update Node.js:
- Download from [nodejs.org](https://nodejs.org/)
- Or use a version manager like [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install 22
  nvm use 22
  ```

### 1.2 Quasar CLI

Install the Quasar CLI globally:
```bash
npm install -g @quasar/cli
```

Verify installation:
```bash
quasar --version
```

### 1.3 Google Account

You'll need a Google Account for Google Apps Script development:
- Create one at [accounts.google.com](https://accounts.google.com)
- Enable Google Apps Script API at [script.google.com/home/usersettings](https://script.google.com/home/usersettings)

### 1.4 IDE Setup (Recommended)

**Visual Studio Code** with the following extensions:

- **Volar** (Vue Language Features) - Essential for Vue 3 development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **i18n Ally** - i18n key management
- **Google Apps Script** (optional) - For GAS development

**VS Code Settings** (add to `.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  }
}
```

### 1.5 Git Configuration

Configure git with your information:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 2. Frontend Setup

### 2.1 Clone Repository

```bash
cd ~/dev/gitrepos/bluegithub
git clone https://github.com/yourusername/autocheck.git
cd autocheck
```

### 2.2 Install Dependencies

```bash
npm install
```

This will install all dependencies defined in `package.json` and run the Quasar post-install setup.

### 2.3 Environment Configuration

Create a `.env` file in the project root (copy from `.env.example` if available):

```bash
# Create .env file
touch .env
```

Add the following configuration:

```env
# Google Apps Script Backend URL
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Application Environment
VITE_APP_ENV=development

# Optional: Enable debug logging
VITE_DEBUG_MODE=true
```

**Important**: Replace `YOUR_DEPLOYMENT_ID` with your actual Google Apps Script deployment URL after completing the backend setup.

### 2.4 Run Development Server

Start the Quasar development server:

```bash
npm run dev
# or
quasar dev
```

The application will open automatically in your browser at `http://localhost:9000` (or another port if 9000 is in use).

### 2.5 Project Structure Orientation

Familiarize yourself with the project structure:

```
autocheck/
├── src/
│   ├── App.vue                 # Root component
│   ├── boot/                   # Boot files (pinia, i18n, axios)
│   │   ├── axios.js           # Axios configuration
│   │   ├── i18n.js            # i18n setup
│   │   └── pinia.js           # Pinia store initialization
│   ├── components/            # Reusable Vue components (max 250 lines each)
│   ├── composables/           # Composition API composables
│   ├── css/                   # Global styles
│   ├── i18n/                  # Internationalization
│   │   ├── en-US/            # English translations
│   │   │   └── index.js
│   │   └── fr-FR/            # French translations
│   │       └── index.js
│   ├── layouts/               # Layout components
│   │   ├── MainLayout.vue    # Authenticated app layout
│   │   └── EmptyLayout.vue   # Public pages layout
│   ├── pages/                 # Page components (route views)
│   ├── router/                # Vue Router configuration
│   │   ├── index.js          # Router setup
│   │   └── routes.js         # Route definitions
│   ├── services/              # API service layer
│   └── stores/                # Pinia stores
│       ├── index.js
│       └── authStore.js      # Authentication state
├── gas/                       # Google Apps Script backend
├── public/                    # Static assets
├── specs/                     # Feature specifications
├── docs/                      # Project documentation
├── package.json               # Project dependencies
├── quasar.config.js          # Quasar configuration
└── eslint.config.js          # ESLint configuration
```

**Key Conventions** (per project constitution):
- **Component Size**: Maximum 250 lines per component
- **Composition API Only**: No Options API allowed (`vueOptionsAPI: false`)
- **Lazy Loading**: All routes are lazy-loaded for performance
- **Material Icons**: Use Quasar's Material Icons icon set
- **i18n Required**: All user-facing text must use i18n keys

---

## 3. Backend Setup

The backend uses Google Apps Script connected to Google Sheets for data storage.

### 3.1 Access Google Apps Script Editor

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Name the project: `AutoCheck Backend`

### 3.2 Create Database Spreadsheet

1. Create a new Google Spreadsheet named **"AutoCheck Database"**
2. Create the following sheets with these exact names:

#### Sheet: `users`
Columns: `userId | email | passwordHash | role | orgId | status | createdAt | verificationToken`

#### Sheet: `fleets`
Columns: `fleetId | name | orgId | vehicleCount | createdAt | updatedAt`

#### Sheet: `vehicles`
Columns: `vehicleId | make | model | year | seats | licensePlate | type | fleetId | odometer | insuranceExpiry | archived | archivedDate | orgId | createdAt`

#### Sheet: `fillups`
Columns: `fillupId | vehicleId | date | fuelAmount | cost | odometer | efficiency | orgId | createdAt`

#### Sheet: `maintenance_tasks`
Columns: `taskId | vehicleId | type | description | priority | dueDate | status | assignedTo | startDate | completionDate | duration | notes | cost | recurring | recurrenceInterval | orgId | createdAt`

#### Sheet: `parts`
Columns: `partId | vehicleId | taskId | date | partType | partNumber | price | orgId | createdAt`

#### Sheet: `expenses`
Columns: `expenseId | vehicleId | category | date | amount | description | receiptUrl | orgId | createdAt`

#### Sheet: `documents`
Columns: `documentId | vehicleId | category | fileName | fileType | fileSize | fileUrl | orgId | uploadDate`

**Tip**: Copy the spreadsheet ID from the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

### 3.3 Upload Backend Code

**Option A: Manual Upload**

1. In Apps Script editor, click **+** next to Files
2. For each `.gs` file in the `gas/` directory:
   - Click **Script** to create a new script file
   - Name it exactly as it appears in the folder structure (e.g., `security/SecurityInterceptor`)
   - Copy and paste the content
   - Save

**Option B: Using clasp (Recommended)**

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to Google account
clasp login

# Enable Google Apps Script API
# Visit: https://script.google.com/home/usersettings
# Toggle "Google Apps Script API" to ON

# Create project (from autocheck root directory)
cd gas
clasp create --title "AutoCheck Backend" --type standalone

# Push all files
clasp push

# Open in browser
clasp open
```

### 3.4 Configure Script Properties

In the Apps Script editor:

1. Click **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. Add the following properties:

| Property                  | Example Value                       | Description                  |
| ------------------------- | ----------------------------------- | ---------------------------- |
| `AUTH_SPREADSHEET_ID`     | `1abc...xyz`                        | Your spreadsheet ID          |
| `CLIENT`                  | `autocheck`                         | Client identifier            |
| `ENV`                     | `development`                       | Environment (dev/test/prod)  |
| `ENCRYPTION_KEY`          | `aBc123...XyZ` (32 characters)      | Encryption key for passwords |
| `TOKEN_TTL_MINUTES`       | `60`                                | Token expiration time        |
| `OTP_TTL_HOURS`           | `2`                                 | OTP expiration time          |
| `APP_TIMEZONE`            | `America/New_York`                  | Application timezone         |
| `APP_NAME`                | `AutoCheck`                         | Application name             |

**Generate Encryption Key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.5 Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click **Select type** > **Web app**
3. Configure:
   - **Description**: `Development v1`
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. **Authorize** the app when prompted
6. **Copy the Web App URL** (you'll need this for frontend `.env`)

Example URL:
```
https://script.google.com/macros/s/AKfycby.../exec
```

### 3.6 Configure SecurityInterceptor Routes

The SecurityInterceptor determines which routes require authentication.

In `gas/security/SecurityInterceptor.gs`, verify the public routes:

```javascript
const PUBLIC_ROUTES = [
  'auth.signup',
  'auth.login',
  'auth.verifyEmail',
  'auth.verifyToken',
  'health.check'
]
```

All other routes will require a valid authentication token in the `Authorization` header.

### 3.7 Test Backend Deployment

Run the test function in Apps Script:

1. In the Apps Script editor, select **testSetup** from the function dropdown
2. Click **Run**
3. Check the logs (View > Logs) for any errors

Test with curl:
```bash
curl -X GET "YOUR_WEB_APP_URL"
```

Expected response:
```json
{
  "status": 200,
  "msgKey": "health.ok",
  "message": "API is up and running",
  "data": {
    "version": "0.0.1",
    "environment": "development",
    "timestamp": "2025-11-25T10:30:00Z"
  }
}
```

### 3.8 Update Frontend .env

Update your `.env` file with the deployed Web App URL:

```env
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart the Quasar dev server to pick up the new environment variable.

---

## 4. Development Workflow

### 4.1 Creating New Components

**Rule**: Each component must be **maximum 250 lines** (per project constitution).

**Steps**:

1. Create component file in `src/components/`:
   ```bash
   touch src/components/VehicleCard.vue
   ```

2. Use the component template:
   ```vue
   <template>
     <div class="vehicle-card">
       <!-- Component markup -->
     </div>
   </template>

   <script setup>
   import { ref, computed } from 'vue'
   import { useI18n } from 'vue-i18n'

   // Props
   const props = defineProps({
     vehicle: {
       type: Object,
       required: true
     }
   })

   // Composables
   const { t } = useI18n()

   // State
   const isExpanded = ref(false)

   // Methods
   function toggleExpand() {
     isExpanded.value = !isExpanded.value
   }
   </script>

   <style lang="scss" scoped>
   .vehicle-card {
     // Component styles
   }
   </style>
   ```

3. **If component exceeds 250 lines**, split it:
   - Extract sub-components
   - Extract logic to composables (`src/composables/`)
   - Move complex logic to services (`src/services/`)

### 4.2 Adding New API Endpoints

**Pattern**: Handler → Service → Router Registration

**Example**: Add endpoint to create a fleet

#### Step 1: Create Service (`gas/services/FleetService.gs`)

```javascript
const FleetService = {
  createFleet(userId, fleetName) {
    const sheet = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty('AUTH_SPREADSHEET_ID')
    ).getSheetByName('fleets')

    const fleetId = Utilities.getUuid()
    const timestamp = DateUtil.getCurrentTimestamp()

    sheet.appendRow([
      fleetId,
      fleetName,
      userId, // orgId
      0, // vehicleCount
      timestamp,
      timestamp
    ])

    return {
      fleetId: fleetId,
      name: fleetName,
      vehicleCount: 0,
      createdAt: timestamp
    }
  }
}
```

#### Step 2: Create Handler (`gas/handlers/FleetHandler.gs`)

```javascript
const FleetHandler = {
  createFleet(context) {
    const { fleetName } = context.data

    // Validation
    if (!fleetName || fleetName.trim().length === 0) {
      throw new Error('Fleet name is required')
    }

    // Call service
    const fleet = FleetService.createFleet(context.user.userId, fleetName)

    return {
      status: 201,
      msgKey: 'fleet.created',
      message: 'Fleet created successfully',
      data: fleet
    }
  }
}
```

#### Step 3: Register Route (`gas/utils/Router.gs`)

```javascript
const Router = {
  route(context) {
    const routes = {
      'auth.signup': AuthHandler.signup,
      'auth.login': AuthHandler.login,
      'fleet.create': FleetHandler.createFleet, // Add this line
      // ... other routes
    }

    const handler = routes[context.action]

    if (!handler) {
      throw new Error('Invalid action: ' + context.action)
    }

    return handler(context)
  }
}
```

#### Step 4: Deploy Changes

```bash
# If using clasp
cd gas
clasp push

# Then deploy new version in Apps Script editor
# Deploy > New deployment
```

#### Step 5: Create Frontend Service (`src/services/fleetService.js`)

```javascript
import api from 'boot/axios'

export const fleetService = {
  async createFleet(fleetName) {
    const response = await api.post('', {
      action: 'fleet.create',
      data: { fleetName }
    })
    return response.data
  }
}
```

### 4.3 Adding i18n Keys

**Rule**: All user-facing text must use i18n. English (`en-US`) and French (`fr-FR`) must be kept in parity.

**Steps**:

1. Add key to English (`src/i18n/en-US/index.js`):
   ```javascript
   export default {
     fleet: {
       created: 'Fleet created successfully',
       createButton: 'Create Fleet',
       nameLabel: 'Fleet Name',
       namePlaceholder: 'Enter fleet name',
       deleteConfirm: 'Are you sure you want to delete this fleet?'
     }
   }
   ```

2. Add matching key to French (`src/i18n/fr-FR/index.js`):
   ```javascript
   export default {
     fleet: {
       created: 'Flotte créée avec succès',
       createButton: 'Créer une flotte',
       nameLabel: 'Nom de la flotte',
       namePlaceholder: 'Entrez le nom de la flotte',
       deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette flotte?'
     }
   }
   ```

3. Use in components:
   ```vue
   <script setup>
   import { useI18n } from 'vue-i18n'
   const { t } = useI18n()
   </script>

   <template>
     <q-btn :label="t('fleet.createButton')" @click="createFleet" />
   </template>
   ```

### 4.4 Running Linting and Formatting

**Lint code**:
```bash
npm run lint
```

**Format code**:
```bash
npm run format
```

**Fix linting errors automatically**:
```bash
npm run lint -- --fix
```

**Pre-commit hook** (recommended):
Create `.husky/pre-commit`:
```bash
#!/bin/sh
npm run lint
npm run format
```

### 4.5 Building for Production

**Development build**:
```bash
npm run build
```

Output: `dist/spa/`

**Production deployment**:
1. Build the application
2. Upload `dist/spa/` contents to your web server
3. Configure web server to serve `index.html` for all routes (SPA mode)

---

## 5. Testing Workflow

### 5.1 Writing Component Tests

The project uses **Vitest** and **Vue Test Utils** for testing.

**Test file naming**: `ComponentName.spec.js`

**Example**: `src/components/__tests__/VehicleCard.spec.js`

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VehicleCard from '../VehicleCard.vue'

describe('VehicleCard', () => {
  it('renders vehicle make and model', () => {
    const vehicle = {
      make: 'Toyota',
      model: 'Camry',
      year: 2020
    }

    const wrapper = mount(VehicleCard, {
      props: { vehicle }
    })

    expect(wrapper.text()).toContain('Toyota')
    expect(wrapper.text()).toContain('Camry')
  })

  it('toggles expanded state on click', async () => {
    const vehicle = { make: 'Toyota', model: 'Camry', year: 2020 }
    const wrapper = mount(VehicleCard, { props: { vehicle } })

    await wrapper.find('.expand-button').trigger('click')

    expect(wrapper.vm.isExpanded).toBe(true)
  })
})
```

**Run tests**:
```bash
npm run test
```

### 5.2 Writing Contract Tests

Contract tests verify that frontend and backend agree on API structure.

**Example**: `src/services/__tests__/fleetService.contract.spec.js`

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { fleetService } from '../fleetService'

describe('Fleet Service Contract', () => {
  let createdFleetId

  it('POST fleet.create returns expected structure', async () => {
    const response = await fleetService.createFleet('Test Fleet')

    expect(response).toHaveProperty('status', 201)
    expect(response).toHaveProperty('msgKey', 'fleet.created')
    expect(response.data).toHaveProperty('fleetId')
    expect(response.data).toHaveProperty('name', 'Test Fleet')
    expect(response.data).toHaveProperty('vehicleCount', 0)

    createdFleetId = response.data.fleetId
  })

  afterAll(async () => {
    // Cleanup: delete test fleet
    if (createdFleetId) {
      await fleetService.deleteFleet(createdFleetId)
    }
  })
})
```

### 5.3 Manual Testing on Mobile

**Chrome DevTools Device Mode**:

1. Open DevTools (F12)
2. Click **Toggle Device Toolbar** (Ctrl+Shift+M)
3. Select device preset (iPhone 12, Pixel 5, etc.)
4. Test responsive behavior and touch interactions

**Recommended Test Devices**:
- iPhone 12 Pro (390x844)
- iPhone SE (375x667)
- Pixel 5 (393x851)
- iPad Pro 12.9" (1024x1366)

**Test Checklist**:
- [ ] Navigation works on small screens
- [ ] Forms are easily fillable on mobile
- [ ] Buttons are large enough for touch (min 44x44px)
- [ ] Text is readable without zooming
- [ ] Horizontal scrolling is not required
- [ ] Modals/dialogs fit within viewport

---

## 6. Common Tasks

### 6.1 Adding a New Pinia Store

**Example**: Create a vehicle store

**File**: `src/stores/vehicleStore.js`

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { vehicleService } from 'src/services/vehicleService'

export const useVehicleStore = defineStore('vehicle', () => {
  // State
  const vehicles = ref([])
  const currentVehicle = ref(null)
  const loading = ref(false)

  // Getters
  const archivedVehicles = computed(() =>
    vehicles.value.filter(v => v.archived)
  )

  const activeVehicles = computed(() =>
    vehicles.value.filter(v => !v.archived)
  )

  // Actions
  async function fetchVehicles() {
    loading.value = true
    try {
      const response = await vehicleService.getVehicles()
      vehicles.value = response.data
    } finally {
      loading.value = false
    }
  }

  async function createVehicle(vehicleData) {
    const response = await vehicleService.createVehicle(vehicleData)
    vehicles.value.push(response.data)
    return response.data
  }

  function $reset() {
    vehicles.value = []
    currentVehicle.value = null
    loading.value = false
  }

  return {
    // State
    vehicles,
    currentVehicle,
    loading,
    // Getters
    archivedVehicles,
    activeVehicles,
    // Actions
    fetchVehicles,
    createVehicle,
    $reset
  }
})
```

**Register in**: `src/stores/index.js`

```javascript
import { store } from 'quasar/wrappers'
import { createPinia } from 'pinia'

export default store(() => {
  const pinia = createPinia()
  return pinia
})

// Export stores for easy importing
export { useAuthStore } from './authStore'
export { useVehicleStore } from './vehicleStore'
```

**Use in components**:

```vue
<script setup>
import { useVehicleStore } from 'stores/vehicleStore'
import { onMounted } from 'vue'

const vehicleStore = useVehicleStore()

onMounted(async () => {
  await vehicleStore.fetchVehicles()
})
</script>

<template>
  <div v-if="vehicleStore.loading">Loading...</div>
  <div v-for="vehicle in vehicleStore.activeVehicles" :key="vehicle.vehicleId">
    {{ vehicle.make }} {{ vehicle.model }}
  </div>
</template>
```

### 6.2 Adding a New Page with Route

**Example**: Create a Fleet Management page

#### Step 1: Create Page Component

**File**: `src/pages/FleetManagementPage.vue`

```vue
<template>
  <q-page padding>
    <h1>{{ t('fleet.title') }}</h1>
    <q-btn
      :label="t('fleet.createButton')"
      color="primary"
      @click="showCreateDialog = true"
    />
    <!-- Fleet list and management UI -->
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const showCreateDialog = ref(false)
</script>
```

#### Step 2: Add Route

**File**: `src/router/routes.js`

```javascript
const routes = [
  // ... existing routes
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'profile',
        name: 'profile',
        component: () => import('pages/ProfilePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'fleets',
        name: 'fleets',
        component: () => import('pages/FleetManagementPage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
]
```

#### Step 3: Add Navigation Link

**File**: `src/layouts/MainLayout.vue`

```vue
<q-item clickable :to="{ name: 'fleets' }">
  <q-item-section avatar>
    <q-icon name="directions_car" />
  </q-item-section>
  <q-item-section>
    <q-item-label>{{ t('nav.fleets') }}</q-item-label>
  </q-item-section>
</q-item>
```

### 6.3 Adding Role-Based Permission Check

**Example**: Restrict fleet deletion to Fleet Managers only

#### Backend: Enforce in Handler

**File**: `gas/handlers/FleetHandler.gs`

```javascript
const FleetHandler = {
  deleteFleet(context) {
    // Check role
    if (context.user.role !== 'FLEET_MANAGER') {
      throw new Error('Only fleet managers can delete fleets')
    }

    const { fleetId } = context.data
    FleetService.deleteFleet(fleetId)

    return {
      status: 200,
      msgKey: 'fleet.deleted',
      message: 'Fleet deleted successfully'
    }
  }
}
```

#### Frontend: Hide UI Elements

**File**: `src/pages/FleetManagementPage.vue`

```vue
<script setup>
import { useAuthStore } from 'stores/authStore'
import { computed } from 'vue'

const authStore = useAuthStore()

const isFleetManager = computed(() =>
  authStore.user?.role === 'FLEET_MANAGER'
)
</script>

<template>
  <q-btn
    v-if="isFleetManager"
    label="Delete Fleet"
    color="negative"
    @click="deleteFleet"
  />
</template>
```

#### Frontend: Route Guard (Optional)

**File**: `src/router/index.js`

```javascript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.requiresRole && authStore.user?.role !== to.meta.requiresRole) {
    next({ name: 'forbidden' })
  } else {
    next()
  }
})
```

**Usage in routes**:
```javascript
{
  path: 'fleet-settings',
  name: 'fleet-settings',
  component: () => import('pages/FleetSettingsPage.vue'),
  meta: {
    requiresAuth: true,
    requiresRole: 'FLEET_MANAGER'
  }
}
```

### 6.4 Deploying Frontend Build

#### Development/Staging Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Test the build locally**:
   ```bash
   npx serve dist/spa
   ```
   Visit `http://localhost:3000` to verify.

3. **Deploy to web server**:
   Upload contents of `dist/spa/` to your web server.

   **Example with rsync**:
   ```bash
   rsync -avz --delete dist/spa/ user@server:/var/www/autocheck/
   ```

   **Example with GitHub Pages**:
   ```bash
   npm install -g gh-pages
   gh-pages -d dist/spa
   ```

#### Production Deployment

1. **Update environment**:
   Create `.env.production`:
   ```env
   VITE_API_BASE_URL=https://script.google.com/macros/s/PRODUCTION_DEPLOYMENT_ID/exec
   VITE_APP_ENV=production
   VITE_DEBUG_MODE=false
   ```

2. **Build for production**:
   ```bash
   npm run build
   ```

3. **Configure web server** (example for Nginx):
   ```nginx
   server {
     listen 80;
     server_name autocheck.example.com;
     root /var/www/autocheck;
     index index.html;

     # SPA fallback: serve index.html for all routes
     location / {
       try_files $uri $uri/ /index.html;
     }

     # Cache static assets
     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }
   }
   ```

4. **Deploy**:
   ```bash
   rsync -avz --delete dist/spa/ user@server:/var/www/autocheck/
   sudo systemctl reload nginx
   ```

---

## Quick Reference

### Essential Commands

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Deploy backend (with clasp)
cd gas && clasp push

# Install new dependency
npm install <package-name>
```

### File Path Conventions

- **Components**: `src/components/ComponentName.vue`
- **Pages**: `src/pages/PageName.vue`
- **Stores**: `src/stores/storeName.js`
- **Services**: `src/services/serviceName.js`
- **Composables**: `src/composables/useFeatureName.js`
- **i18n**: `src/i18n/en-US/index.js` and `src/i18n/fr-FR/index.js`

### Code Style Guidelines

- **Vue 3 Composition API only** (no Options API)
- **Max 250 lines per component**
- **TypeScript NOT used** (plain JavaScript)
- **ESLint + Prettier enforced**
- **i18n required for all user-facing text**
- **Material Icons for all icons**

---

## Troubleshooting

### "Module not found" errors

**Solution**: Ensure dependencies are installed
```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend returns 401 Unauthorized

**Solution**: Check authentication token
1. Verify token is sent in `Authorization` header
2. Check token expiration (default: 60 minutes)
3. Re-login to get fresh token

### i18n keys not working

**Solution**: Check key path and restart dev server
```bash
# Verify key exists in both en-US and fr-FR
# Then restart
npm run dev
```

### Quasar components not found

**Solution**: Ensure Quasar CLI is installed
```bash
npm install -g @quasar/cli
quasar --version
```

---

## Additional Resources

- [Quasar Documentation](https://quasar.dev)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia Documentation](https://pinia.vuejs.org)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Project Specification](./spec.md)
- [Gas Setup Guide](../../docs/gas-setup.md)
- [Branching Strategy](../../docs/branching-strategy.md)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check existing documentation in `/docs`
2. Review the feature specification in `/specs/001-vehicle-maintenance/spec.md`
3. Ask the development team
4. Refer to the project constitution in `.claude/constitution.md` (if available)

---

**Happy coding!**
