<template>
  <div class="expense-dashboard">
    <!-- Date Range Filter -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-4">
            <q-input
              v-model="filters.startDate"
              :label="$t('expense.startDate')"
              type="date"
              dense
              @update:model-value="loadDashboard"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model="filters.endDate"
              :label="$t('expense.endDate')"
              type="date"
              dense
              @update:model-value="loadDashboard"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.vehicleId"
              :options="vehicleOptions"
              :label="$t('expense.filterByVehicle')"
              emit-value
              map-options
              clearable
              dense
              @update:model-value="loadDashboard"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="dashboardData" class="row q-col-gutter-md">
      <!-- Total Expenses Card -->
      <div class="col-12">
        <q-card>
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">{{ $t('expense.totalExpenses') }}</div>
            <div class="text-h3">FCFA {{ formatNumber(dashboardData.totalExpenses) }}</div>
            <div class="text-caption">
              {{ dashboardData.count }} {{ $t('expense.transactions') }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Category Breakdown -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">{{ $t('expense.byCategory') }}</div>
            <div class="q-gutter-sm">
              <div
                v-for="(amount, category) in dashboardData.byCategory"
                :key="category"
                class="row items-center"
              >
                <div class="col">
                  <q-icon
                    :name="getCategoryIcon(category)"
                    :color="getCategoryColor(category)"
                    size="sm"
                  />
                  {{ $t(`expense.categories.${category}`) }}
                </div>
                <div class="col-auto text-bold">
                  FCFA {{ formatNumber(amount) }}
                </div>
                <div class="col-12">
                  <q-linear-progress
                    :value="amount / dashboardData.totalExpenses"
                    :color="getCategoryColor(category)"
                    size="8px"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Category Distribution Pie -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">{{ $t('expense.distribution') }}</div>
            <div class="row q-gutter-sm">
              <div
                v-for="(amount, category) in getTopCategories()"
                :key="category"
                class="col-12"
              >
                <q-chip
                  :color="getCategoryColor(category)"
                  text-color="white"
                  square
                >
                  {{ $t(`expense.categories.${category}`) }}:
                  {{ getPercentage(amount, dashboardData.totalExpenses) }}%
                </q-chip>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <q-card v-else class="text-center q-pa-lg">
      <q-icon name="account_balance_wallet" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        {{ $t('expense.noDashboardData') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        {{ $t('expense.noDashboardDataDescription') }}
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVehicleStore } from 'src/stores/vehicleStore'

const props = defineProps({
  dashboardData: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['filter'])

const vehicleStore = useVehicleStore()

const filters = ref({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  vehicleId: null,
})

const vehicleOptions = ref([])

onMounted(async () => {
  // Load vehicles for filter
  try {
    await vehicleStore.fetchVehicles()
    vehicleOptions.value = vehicleStore.vehicles.map((v) => ({
      label: `${v.make} ${v.model} (${v.licensePlate})`,
      value: v.vehicleId,
    }))
  } catch (error) {
    console.error('Failed to load vehicles:', error)
  }

  // Load initial dashboard
  loadDashboard()
})

function loadDashboard() {
  const cleanFilters = {}

  if (filters.value.startDate) {
    cleanFilters.startDate = filters.value.startDate
  }
  if (filters.value.endDate) {
    cleanFilters.endDate = filters.value.endDate
  }
  if (filters.value.vehicleId) {
    cleanFilters.vehicleId = filters.value.vehicleId
  }

  emit('filter', cleanFilters)
}

function getDefaultStartDate() {
  // Last 30 days
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate() {
  // Today
  return new Date().toISOString().split('T')[0]
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0.00'
  return parseFloat(value).toFixed(2)
}

function getPercentage(amount, total) {
  if (total === 0) return 0
  return ((amount / total) * 100).toFixed(1)
}

function getTopCategories() {
  if (!props.dashboardData?.byCategory) return {}

  // Filter out categories with 0 amount
  const filtered = {}
  Object.entries(props.dashboardData.byCategory).forEach(([category, amount]) => {
    if (amount > 0) {
      filtered[category] = amount
    }
  })

  return filtered
}

function getCategoryIcon(category) {
  const icons = {
    FUEL: 'local_gas_station',
    MAINTENANCE: 'build',
    INSURANCE: 'shield',
    FINES: 'gavel',
    TOLLS: 'toll',
    FEES: 'receipt',
    FINANCING: 'account_balance',
    OTHER: 'more_horiz',
  }
  return icons[category] || 'attach_money'
}

function getCategoryColor(category) {
  const colors = {
    FUEL: 'blue',
    MAINTENANCE: 'orange',
    INSURANCE: 'purple',
    FINES: 'red',
    TOLLS: 'teal',
    FEES: 'brown',
    FINANCING: 'indigo',
    OTHER: 'grey',
  }
  return colors[category] || 'grey'
}
</script>
