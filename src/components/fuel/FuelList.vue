<template>
  <div class="fuel-list">
    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.vehicleId"
              :options="vehicleOptions"
              :label="$t('fuel.filterByVehicle')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model="filters.startDate"
              :label="$t('fuel.startDate')"
              type="date"
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model="filters.endDate"
              :label="$t('fuel.endDate')"
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
    <q-card v-else-if="records.length === 0" class="text-center q-pa-lg">
      <q-icon name="local_gas_station" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        {{ $t('fuel.noRecords') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        {{ $t('fuel.noRecordsDescription') }}
      </div>
    </q-card>

    <!-- Record Grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="record in records"
        :key="record.recordId"
        class="col-12 col-sm-6 col-md-4"
      >
        <fuel-card
          :record="record"
          @view="$emit('view', record)"
          @edit="$emit('edit', record)"
          @delete="$emit('delete', record)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVehicleStore } from 'src/stores/vehicleStore'
import FuelCard from './FuelCard.vue'

defineProps({
  records: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['view', 'edit', 'delete', 'filter'])

const vehicleStore = useVehicleStore()

const filters = ref({
  vehicleId: null,
  startDate: null,
  endDate: null,
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
})

function applyFilters() {
  const cleanFilters = {}

  if (filters.value.vehicleId) {
    cleanFilters.vehicleId = filters.value.vehicleId
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
