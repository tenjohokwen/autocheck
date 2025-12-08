<template>
  <div class="repair-list">
    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filters.vehicleId"
              :options="vehicleOptions"
              :label="$t('repair.filterByVehicle')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              :label="$t('repair.filterByStatus')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filters.severity"
              :options="severityOptions"
              :label="$t('repair.filterBySeverity')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.startDate"
              :label="$t('repair.startDate')"
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
    <q-card v-else-if="repairs.length === 0" class="text-center q-pa-lg">
      <q-icon name="build" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        {{ $t('repair.noRepairs') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        {{ $t('repair.noRepairsDescription') }}
      </div>
    </q-card>

    <!-- Repair Grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="repair in repairs"
        :key="repair.repairId"
        class="col-12 col-sm-6 col-md-4"
      >
        <repair-card
          :repair="repair"
          @view="$emit('view', repair)"
          @edit="$emit('edit', repair)"
          @delete="$emit('delete', repair)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from 'src/stores/vehicleStore'
import RepairCard from './RepairCard.vue'

defineProps({
  repairs: {
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
  status: null,
  severity: null,
  startDate: null,
})

const vehicleOptions = ref([])

const statusOptions = [
  { label: t('repair.statuses.SCHEDULED'), value: 'SCHEDULED' },
  { label: t('repair.statuses.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('repair.statuses.COMPLETED'), value: 'COMPLETED' },
  { label: t('repair.statuses.CANCELLED'), value: 'CANCELLED' },
]

const severityOptions = [
  { label: t('repair.severities.LOW'), value: 'LOW' },
  { label: t('repair.severities.MEDIUM'), value: 'MEDIUM' },
  { label: t('repair.severities.HIGH'), value: 'HIGH' },
  { label: t('repair.severities.CRITICAL'), value: 'CRITICAL' },
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
  if (filters.value.status) {
    cleanFilters.status = filters.value.status
  }
  if (filters.value.severity) {
    cleanFilters.severity = filters.value.severity
  }
  if (filters.value.startDate) {
    cleanFilters.startDate = filters.value.startDate
  }

  emit('filter', cleanFilters)
}
</script>
