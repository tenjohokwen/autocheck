<template>
  <div class="maintenance-list">
    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.vehicleId"
              :options="vehicleOptions"
              :label="$t('maintenance.filterByVehicle')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              :label="$t('maintenance.filterByStatus')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.assignedTechnician"
              :options="technicianOptions"
              :label="$t('maintenance.filterByTechnician')"
              emit-value
              map-options
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
    <q-card v-else-if="tasks.length === 0" class="text-center q-pa-lg">
      <q-icon name="build" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        {{ $t('maintenance.noTasks') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        {{ $t('maintenance.noTasksDescription') }}
      </div>
    </q-card>

    <!-- Task Grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="task in tasks"
        :key="task.taskId"
        class="col-12 col-sm-6 col-md-4"
      >
        <maintenance-card
          :task="task"
          @view="$emit('view', task)"
          @edit="$emit('edit', task)"
          @delete="$emit('delete', task)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from 'src/stores/vehicleStore'
import MaintenanceCard from './MaintenanceCard.vue'

defineProps({
  tasks: {
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
  assignedTechnician: null,
})

const vehicleOptions = ref([])
const technicianOptions = ref([])

const statusOptions = [
  { label: t('maintenance.statuses.SCHEDULED'), value: 'SCHEDULED' },
  { label: t('maintenance.statuses.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('maintenance.statuses.COMPLETED'), value: 'COMPLETED' },
  { label: t('maintenance.statuses.CANCELLED'), value: 'CANCELLED' },
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

  // TODO: Load technicians for filter
  // This would require fetching users with TECHNICIAN role
  technicianOptions.value = []
})

function applyFilters() {
  const cleanFilters = {}

  if (filters.value.vehicleId) {
    cleanFilters.vehicleId = filters.value.vehicleId
  }
  if (filters.value.status) {
    cleanFilters.status = filters.value.status
  }
  if (filters.value.assignedTechnician) {
    cleanFilters.assignedTechnician = filters.value.assignedTechnician
  }

  emit('filter', cleanFilters)
}
</script>
