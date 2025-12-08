<template>
  <div class="reminder-list">
    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.vehicleId"
              :options="vehicleOptions"
              :label="$t('reminder.filterByVehicle')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.type"
              :options="typeOptions"
              :label="$t('reminder.filterByType')"
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
              :label="$t('reminder.filterByStatus')"
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
    <q-card v-else-if="reminders.length === 0" class="text-center q-pa-lg">
      <q-icon name="notifications_none" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        {{ $t('reminder.noReminders') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        {{ $t('reminder.noRemindersDescription') }}
      </div>
    </q-card>

    <!-- Reminder Grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="reminder in reminders"
        :key="reminder.reminderId"
        class="col-12 col-sm-6 col-md-4"
      >
        <reminder-card
          :reminder="reminder"
          @view="$emit('view', reminder)"
          @acknowledge="$emit('acknowledge', reminder)"
          @dismiss="$emit('dismiss', reminder)"
          @complete="$emit('complete', reminder)"
          @delete="$emit('delete', reminder)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from 'src/stores/vehicleStore'
import ReminderCard from './ReminderCard.vue'

defineProps({
  reminders: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['view', 'acknowledge', 'dismiss', 'complete', 'delete', 'filter'])

const { t } = useI18n()
const vehicleStore = useVehicleStore()

const filters = ref({
  vehicleId: null,
  type: null,
  status: null,
})

const vehicleOptions = ref([])

const typeOptions = [
  { label: t('reminder.types.MAINTENANCE'), value: 'MAINTENANCE' },
  { label: t('reminder.types.INSURANCE'), value: 'INSURANCE' },
  { label: t('reminder.types.REGISTRATION'), value: 'REGISTRATION' },
  { label: t('reminder.types.INSPECTION'), value: 'INSPECTION' },
  { label: t('reminder.types.CUSTOM'), value: 'CUSTOM' },
]

const statusOptions = [
  { label: t('reminder.statuses.ACTIVE'), value: 'ACTIVE' },
  { label: t('reminder.statuses.ACKNOWLEDGED'), value: 'ACKNOWLEDGED' },
  { label: t('reminder.statuses.COMPLETED'), value: 'COMPLETED' },
  { label: t('reminder.statuses.DISMISSED'), value: 'DISMISSED' },
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
  if (filters.value.type) {
    cleanFilters.type = filters.value.type
  }
  if (filters.value.status) {
    cleanFilters.status = filters.value.status
  }

  emit('filter', cleanFilters)
}
</script>
