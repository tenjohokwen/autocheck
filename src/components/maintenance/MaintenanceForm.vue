<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-select
      v-model="formData.vehicleId"
      :options="vehicleOptions"
      :label="$t('maintenance.vehicle') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
      :disable="isEdit"
    />

    <q-select
      v-model="formData.taskType"
      :options="taskTypeOptions"
      :label="$t('maintenance.taskType') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
    />

    <q-input
      v-model="formData.description"
      :label="$t('maintenance.description') + ' *'"
      type="textarea"
      rows="3"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-select
      v-model="formData.priority"
      :options="priorityOptions"
      :label="$t('maintenance.priority')"
      emit-value
      map-options
    />

    <q-input
      v-model="formData.scheduledDate"
      :label="$t('maintenance.scheduledDate') + ' *'"
      type="date"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-input
      v-model.number="formData.dueOdometer"
      :label="$t('maintenance.dueOdometer')"
      type="number"
      min="0"
    />

    <q-select
      v-if="isEdit"
      v-model="formData.status"
      :options="statusOptions"
      :label="$t('maintenance.status')"
      emit-value
      map-options
    />

    <q-input
      v-if="isEdit && formData.status === 'COMPLETED'"
      v-model.number="formData.laborHours"
      :label="$t('maintenance.laborHours')"
      type="number"
      min="0"
      step="0.5"
    />

    <q-input
      v-if="isEdit"
      v-model="formData.notes"
      :label="$t('maintenance.notes')"
      type="textarea"
      rows="3"
    />

    <q-checkbox
      v-if="!isEdit"
      v-model="formData.isRecurring"
      :label="$t('maintenance.isRecurring')"
    />

    <div v-if="formData.isRecurring && !isEdit" class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-select
          v-model="formData.recurrenceType"
          :options="recurrenceTypeOptions"
          :label="$t('maintenance.recurrenceType')"
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          v-model.number="formData.recurrenceInterval"
          :label="$t('maintenance.recurrenceInterval')"
          type="number"
          min="1"
        />
      </div>
    </div>

    <div class="row q-gutter-sm justify-end">
      <q-btn
        flat
        :label="$t('common.cancel')"
        color="primary"
        @click="$emit('cancel')"
      />
      <q-btn
        type="submit"
        :label="isEdit ? $t('common.update') : $t('common.create')"
        color="primary"
        :loading="loading"
      />
    </div>
  </q-form>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from 'src/stores/vehicleStore'

const props = defineProps({
  task: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const { t } = useI18n()
const vehicleStore = useVehicleStore()

const isEdit = ref(!!props.task)

const formData = ref({
  vehicleId: '',
  taskType: 'PREVENTIVE',
  description: '',
  priority: 'MEDIUM',
  scheduledDate: '',
  dueOdometer: null,
  status: 'SCHEDULED',
  assignedTechnician: '',
  isRecurring: false,
  recurrenceType: null,
  recurrenceInterval: null,
  laborHours: null,
  notes: '',
})

const vehicleOptions = ref([])

const taskTypeOptions = [
  { label: t('maintenance.taskTypes.PREVENTIVE'), value: 'PREVENTIVE' },
  { label: t('maintenance.taskTypes.CORRECTIVE'), value: 'CORRECTIVE' },
  { label: t('maintenance.taskTypes.PREDICTIVE'), value: 'PREDICTIVE' },
  { label: t('maintenance.taskTypes.INSPECTION'), value: 'INSPECTION' },
]

const priorityOptions = [
  { label: t('maintenance.priorities.LOW'), value: 'LOW' },
  { label: t('maintenance.priorities.MEDIUM'), value: 'MEDIUM' },
  { label: t('maintenance.priorities.HIGH'), value: 'HIGH' },
]

const statusOptions = [
  { label: t('maintenance.statuses.SCHEDULED'), value: 'SCHEDULED' },
  { label: t('maintenance.statuses.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('maintenance.statuses.COMPLETED'), value: 'COMPLETED' },
  { label: t('maintenance.statuses.CANCELLED'), value: 'CANCELLED' },
]

const recurrenceTypeOptions = [
  { label: t('maintenance.recurrenceTypes.DAYS'), value: 'DAYS' },
  { label: t('maintenance.recurrenceTypes.WEEKS'), value: 'WEEKS' },
  { label: t('maintenance.recurrenceTypes.MONTHS'), value: 'MONTHS' },
  { label: t('maintenance.recurrenceTypes.KILOMETERS'), value: 'KILOMETERS' },
]

onMounted(async () => {
  // Fetch vehicles for dropdown
  try {
    await vehicleStore.fetchVehicles()
    vehicleOptions.value = vehicleStore.activeVehicles.map((v) => ({
      label: `${v.make} ${v.model} (${v.licensePlate})`,
      value: v.vehicleId,
    }))
  } catch (error) {
    console.error('Failed to load vehicles:', error)
  }
})

// Populate form if editing
watch(
  () => props.task,
  (task) => {
    if (task) {
      formData.value = {
        vehicleId: task.vehicleId || '',
        taskType: task.taskType || 'PREVENTIVE',
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        scheduledDate: task.scheduledDate || '',
        dueOdometer: task.dueOdometer || null,
        status: task.status || 'SCHEDULED',
        assignedTechnician: task.assignedTechnician || '',
        isRecurring: task.isRecurring || false,
        recurrenceType: task.recurrenceType || null,
        recurrenceInterval: task.recurrenceInterval || null,
        laborHours: task.laborHours || null,
        notes: task.notes || '',
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  const payload = { ...formData.value }

  // Clean up null values
  Object.keys(payload).forEach((key) => {
    if (payload[key] === null || payload[key] === '') {
      delete payload[key]
    }
  })

  // If editing, include taskId
  if (isEdit.value && props.task) {
    payload.taskId = props.task.taskId
  }

  emit('submit', payload)
}
</script>
