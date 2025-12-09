<template>
  <q-page padding>
    <div class="q-pb-md">
      <div class="text-h4 text-weight-bold">{{ $t('navigation.dashboard') }}</div>
      <div class="text-grey-7">{{ $t('dashboard.welcome') }}</div>
    </div>

    <!-- Alert Cards Row -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Overdue Reminders Alert -->
      <div v-if="reminderStore.overdueCount > 0" class="col-12 col-md-6">
        <q-card class="bg-red-1 cursor-pointer" @click="goToReminders">
          <q-card-section class="row items-center">
            <q-icon name="warning" color="red" size="md" class="q-mr-md" />
            <div class="col">
              <div class="text-h6 text-red-9">
                {{ reminderStore.overdueCount }} {{ $t('dashboard.overdueReminders') }}
              </div>
              <div class="text-caption text-red-8">
                {{ $t('dashboard.overdueRemindersDescription') }}
              </div>
            </div>
            <q-icon name="chevron_right" color="red" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Expired Documents Alert -->
      <div v-if="documentStore.expiredCount > 0" class="col-12 col-md-6">
        <q-card class="bg-orange-1 cursor-pointer" @click="goToDocuments">
          <q-card-section class="row items-center">
            <q-icon name="error" color="orange" size="md" class="q-mr-md" />
            <div class="col">
              <div class="text-h6 text-orange-9">
                {{ documentStore.expiredCount }} {{ $t('dashboard.expiredDocuments') }}
              </div>
              <div class="text-caption text-orange-8">
                {{ $t('dashboard.expiredDocumentsDescription') }}
              </div>
            </div>
            <q-icon name="chevron_right" color="orange" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Low Stock Parts Alert -->
      <div v-if="partsStore.lowStockCount > 0" class="col-12 col-md-6">
        <q-card class="bg-amber-1 cursor-pointer" @click="goToParts">
          <q-card-section class="row items-center">
            <q-icon name="inventory_2" color="amber-9" size="md" class="q-mr-md" />
            <div class="col">
              <div class="text-h6 text-amber-9">
                {{ partsStore.lowStockCount }} {{ $t('dashboard.lowStockParts') }}
              </div>
              <div class="text-caption text-amber-9">
                {{ $t('dashboard.lowStockPartsDescription') }}
              </div>
            </div>
            <q-icon name="chevron_right" color="amber-9" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Active Reminders -->
      <div v-if="reminderStore.activeCount > 0 && reminderStore.overdueCount === 0" class="col-12 col-md-6">
        <q-card class="bg-blue-1 cursor-pointer" @click="goToReminders">
          <q-card-section class="row items-center">
            <q-icon name="notifications_active" color="blue" size="md" class="q-mr-md" />
            <div class="col">
              <div class="text-h6 text-blue-9">
                {{ reminderStore.activeCount }} {{ $t('dashboard.activeReminders') }}
              </div>
              <div class="text-caption text-blue-8">
                {{ $t('dashboard.activeRemindersDescription') }}
              </div>
            </div>
            <q-icon name="chevron_right" color="blue" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Fleet Summary -->
      <div class="col-12 col-md-3">
        <q-card>
          <q-card-section>
            <div class="text-h3 text-primary">{{ fleetSummary.vehicleCount }}</div>
            <div class="text-caption text-grey-7">{{ $t('dashboard.totalVehicles') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Upcoming Maintenance -->
      <div class="col-12 col-md-3">
        <q-card class="cursor-pointer" @click="goToMaintenance">
          <q-card-section>
            <div class="text-h3 text-orange">{{ upcomingMaintenance.length }}</div>
            <div class="text-caption text-grey-7">{{ $t('dashboard.upcomingMaintenance') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Parts Inventory Value -->
      <div v-if="partsStore.summary" class="col-12 col-md-3">
        <q-card class="cursor-pointer" @click="goToParts">
          <q-card-section>
            <div class="text-h3 text-green">FCFA {{ formatNumber(partsStore.summary.totalValue) }}</div>
            <div class="text-caption text-grey-7">{{ $t('dashboard.inventoryValue') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Monthly Expenses (Fleet Manager Only) -->
      <div v-if="authStore.user?.role === 'ROLE_ADMIN' && expenseDashboard" class="col-12 col-md-3">
        <q-card class="cursor-pointer" @click="goToExpenses">
          <q-card-section>
            <div class="text-h3 text-red">FCFA {{ formatNumber(expenseDashboard.totalCost) }}</div>
            <div class="text-caption text-grey-7">{{ $t('dashboard.monthlyExpenses') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Upcoming Maintenance Tasks -->
    <q-card v-if="upcomingMaintenance.length > 0" class="q-mb-md">
      <q-card-section>
        <div class="text-h6 text-weight-medium q-mb-md">
          <q-icon name="build" class="q-mr-sm" />
          {{ $t('dashboard.upcomingMaintenance') }}
        </div>
        <q-list separator>
          <q-item
            v-for="task in upcomingMaintenance.slice(0, 5)"
            :key="task.taskId"
            clickable
            @click="goToMaintenance"
          >
            <q-item-section avatar>
              <q-avatar :color="getPriorityColor(task.priority)" text-color="white" icon="event" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ task.description }}</q-item-label>
              <q-item-label caption>
                {{ getVehicleName(task.vehicleId) }} - {{ formatDate(task.scheduledDate) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="getPriorityColor(task.priority)">
                {{ $t(`maintenance.priorities.${task.priority}`) }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="upcomingMaintenance.length > 5" class="text-center q-pt-md">
          <q-btn flat color="primary" :label="$t('dashboard.viewAll')" @click="goToMaintenance" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Recent Fuel Records -->
    <q-card v-if="recentFuelRecords.length > 0" class="q-mb-md">
      <q-card-section>
        <div class="text-h6 text-weight-medium q-mb-md">
          <q-icon name="local_gas_station" class="q-mr-sm" />
          {{ $t('dashboard.recentFuelRecords') }}
        </div>
        <q-list separator>
          <q-item v-for="record in recentFuelRecords.slice(0, 5)" :key="record.fuelId" clickable @click="goToFuel">
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" icon="local_gas_station" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ getVehicleName(record.vehicleId) }}</q-item-label>
              <q-item-label caption>
                {{ formatDate(record.date) }} - {{ record.liters }}L @ FCFA {{ formatNumber(record.costPerLiter) }}/L
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-weight-bold">FCFA {{ formatNumber(record.cost) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="recentFuelRecords.length > 5" class="text-center q-pt-md">
          <q-btn flat color="primary" :label="$t('dashboard.viewAll')" @click="goToFuel" />
        </div>
      </q-card-section>
    </q-card>

    <!-- Quick Actions -->
    <q-card>
      <q-card-section>
        <div class="text-h6 text-weight-medium q-mb-md">
          <q-icon name="flash_on" class="q-mr-sm" />
          {{ $t('dashboard.quickActions') }}
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-md-3">
            <q-btn
              unelevated
              color="primary"
              class="full-width"
              icon="directions_car"
              :label="$t('dashboard.addVehicle')"
              @click="goToVehicles"
            />
          </div>
          <div class="col-6 col-md-3">
            <q-btn
              unelevated
              color="orange"
              class="full-width"
              icon="build"
              :label="$t('dashboard.logMaintenance')"
              @click="goToMaintenance"
            />
          </div>
          <div class="col-6 col-md-3">
            <q-btn
              unelevated
              color="green"
              class="full-width"
              icon="local_gas_station"
              :label="$t('dashboard.addFuel')"
              @click="goToFuel"
            />
          </div>
          <div class="col-6 col-md-3">
            <q-btn
              unelevated
              color="blue"
              class="full-width"
              icon="notifications"
              :label="$t('dashboard.addReminder')"
              @click="goToReminders"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { date } from 'quasar'
import { useAuthStore } from 'src/stores/authStore'
import { useVehicleStore } from 'src/stores/vehicleStore'
import { useMaintenanceStore } from 'src/stores/maintenanceStore'
import { useFuelStore } from 'src/stores/fuelStore'
import { useReminderStore } from 'src/stores/reminderStore'
import { useExpenseStore } from 'src/stores/expenseStore'
import { usePartsStore } from 'src/stores/partsStore'
import { useDocumentStore } from 'src/stores/documentStore'

const router = useRouter()
const authStore = useAuthStore()
const vehicleStore = useVehicleStore()
const maintenanceStore = useMaintenanceStore()
const fuelStore = useFuelStore()
const reminderStore = useReminderStore()
const expenseStore = useExpenseStore()
const partsStore = usePartsStore()
const documentStore = useDocumentStore()

const expenseDashboard = ref(null)

// Computed properties
const fleetSummary = computed(() => ({
  vehicleCount: vehicleStore.vehicles.filter((v) => !v.archived).length,
}))

const upcomingMaintenance = computed(() => {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return maintenanceStore.tasks
    .filter((task) => {
      if (task.status !== 'SCHEDULED') return false
      if (!task.scheduledDate) return false

      const scheduledDate = new Date(task.scheduledDate)
      return scheduledDate >= now && scheduledDate <= sevenDaysFromNow
    })
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
})

const recentFuelRecords = computed(() => {
  return [...fuelStore.records]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
})

// Helper functions
function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'MMM D, YYYY')
}

function formatNumber(value) {
  if (value == null) return '0.00'
  return parseFloat(value).toFixed(2)
}

function getVehicleName(vehicleId) {
  const vehicle = vehicleStore.vehicles.find((v) => v.vehicleId === vehicleId)
  if (!vehicle) return 'Unknown'
  return `${vehicle.make} ${vehicle.model}`
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'HIGH':
      return 'red'
    case 'MEDIUM':
      return 'orange'
    case 'LOW':
      return 'green'
    default:
      return 'grey'
  }
}

// Navigation functions
function goToVehicles() {
  router.push({ name: 'vehicles' })
}

function goToMaintenance() {
  router.push({ name: 'maintenance' })
}

function goToFuel() {
  router.push({ name: 'fuel' })
}

function goToReminders() {
  router.push({ name: 'reminders' })
}

function goToExpenses() {
  router.push({ name: 'expenses' })
}

function goToParts() {
  router.push({ name: 'parts' })
}

function goToDocuments() {
  router.push({ name: 'documents' })
}

// Load data on mount
onMounted(async () => {
  try {
    // Load all necessary data
    await Promise.all([
      vehicleStore.fetchVehicles(),
      maintenanceStore.fetchTasks(),
      fuelStore.fetchRecords(),
      reminderStore.fetchReminders(),
      partsStore.fetchParts(),
      partsStore.fetchSummary(),
      documentStore.fetchDocuments(),
    ])

    // Load expense dashboard if Fleet Manager
    if (authStore.user?.role === 'ROLE_ADMIN') {
      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        expenseDashboard.value = await expenseStore.fetchDashboard({
          startDate: date.formatDate(startOfMonth, 'YYYY-MM-DD'),
          endDate: date.formatDate(endOfMonth, 'YYYY-MM-DD'),
        })
      } catch (error) {
        console.error('Error loading expense dashboard:', error)
      }
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
})
</script>
