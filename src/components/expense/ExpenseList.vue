<template>
  <div class="expense-list">
    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filters.vehicleId"
              :options="vehicleOptions"
              :label="$t('expense.filterByVehicle')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filters.category"
              :options="categoryOptions"
              :label="$t('expense.filterByCategory')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.startDate"
              :label="$t('expense.startDate')"
              type="date"
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.endDate"
              :label="$t('expense.endDate')"
              type="date"
              clearable
              @update:model-value="applyFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Empty State -->
    <q-card v-else-if="expenses.length === 0" class="text-center q-pa-lg">
      <q-icon name="receipt_long" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        {{ $t('expense.noExpenses') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        {{ $t('expense.noExpensesDescription') }}
      </div>
    </q-card>

    <!-- Expense Grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="expense in expenses"
        :key="expense.expenseId"
        class="col-12 col-sm-6 col-md-4"
      >
        <expense-card
          :expense="expense"
          @view="$emit('view', expense)"
          @edit="$emit('edit', expense)"
          @delete="$emit('delete', expense)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from 'src/stores/vehicleStore'
import ExpenseCard from './ExpenseCard.vue'

defineProps({
  expenses: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['view', 'edit', 'delete', 'filter'])

const { t } = useI18n()
const vehicleStore = useVehicleStore()

const filters = ref({
  vehicleId: null,
  category: null,
  startDate: null,
  endDate: null,
})

const vehicleOptions = ref([])

const categoryOptions = [
  { label: t('expense.categories.FUEL'), value: 'FUEL' },
  { label: t('expense.categories.MAINTENANCE'), value: 'MAINTENANCE' },
  { label: t('expense.categories.INSURANCE'), value: 'INSURANCE' },
  { label: t('expense.categories.FINES'), value: 'FINES' },
  { label: t('expense.categories.TOLLS'), value: 'TOLLS' },
  { label: t('expense.categories.FEES'), value: 'FEES' },
  { label: t('expense.categories.FINANCING'), value: 'FINANCING' },
  { label: t('expense.categories.OTHER'), value: 'OTHER' },
]

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
})

function applyFilters() {
  const cleanFilters = {}

  if (filters.value.vehicleId) {
    cleanFilters.vehicleId = filters.value.vehicleId
  }
  if (filters.value.category) {
    cleanFilters.category = filters.value.category
  }
  if (filters.value.startDate) {
    cleanFilters.startDate = filters.value.startDate
  }
  if (filters.value.endDate) {
    cleanFilters.endDate = filters.value.endDate
  }

  emit('filter', cleanFilters)
}
</script>
