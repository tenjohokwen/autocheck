<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-select
      v-model="formData.vehicleId"
      :options="vehicleOptions"
      :label="$t('reminder.vehicle') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
      :disable="isEdit"
    />

    <q-select
      v-model="formData.type"
      :options="typeOptions"
      :label="$t('reminder.type') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
    />

    <q-input
      v-model="formData.title"
      :label="$t('reminder.title') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-input
      v-model="formData.description"
      :label="$t('reminder.description')"
      type="textarea"
      rows="3"
    />

    <q-input
      v-model="formData.dueDate"
      :label="$t('reminder.dueDate') + ' *'"
      type="date"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-select
      v-model="formData.priority"
      :options="priorityOptions"
      :label="$t('reminder.priority')"
      emit-value
      map-options
    />

    <q-input
      v-model.number="formData.triggerThresholdDays"
      :label="$t('reminder.triggerThresholdDays')"
      type="number"
      min="1"
      suffix="days"
      hint="Days before due date to show reminder"
    />

    <q-input
      v-model.number="formData.triggerThresholdKm"
      :label="$t('reminder.triggerThresholdKm')"
      type="number"
      min="0"
      suffix="km"
      hint="Optional: Show reminder when vehicle odometer is within this many km"
    />

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
  reminder: {
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

const isEdit = ref(!!props.reminder)

const formData = ref({
  vehicleId: '',
  type: 'CUSTOM',
  title: '',
  description: '',
  dueDate: '',
  priority: 'MEDIUM',
  triggerThresholdDays: 7,
  triggerThresholdKm: null,
})

const vehicleOptions = ref([])

const typeOptions = [
  { label: t('reminder.types.MAINTENANCE'), value: 'MAINTENANCE' },
  { label: t('reminder.types.INSURANCE'), value: 'INSURANCE' },
  { label: t('reminder.types.REGISTRATION'), value: 'REGISTRATION' },
  { label: t('reminder.types.INSPECTION'), value: 'INSPECTION' },
  { label: t('reminder.types.CUSTOM'), value: 'CUSTOM' },
]

const priorityOptions = [
  { label: t('reminder.priorities.LOW'), value: 'LOW' },
  { label: t('reminder.priorities.MEDIUM'), value: 'MEDIUM' },
  { label: t('reminder.priorities.HIGH'), value: 'HIGH' },
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
  () => props.reminder,
  (reminder) => {
    if (reminder) {
      formData.value = {
        vehicleId: reminder.vehicleId || '',
        type: reminder.type || 'CUSTOM',
        title: reminder.title || '',
        description: reminder.description || '',
        dueDate: reminder.dueDate || '',
        priority: reminder.priority || 'MEDIUM',
        triggerThresholdDays: reminder.triggerThresholdDays || 7,
        triggerThresholdKm: reminder.triggerThresholdKm || null,
      }
    }
  },
  { immediate: true }
)

function onSubmit() {
  const payload = { ...formData.value }

  // Clean up null/empty values
  Object.keys(payload).forEach((key) => {
    if (payload[key] === null || payload[key] === '') {
      delete payload[key]
    }
  })

  // If editing, include reminderId
  if (isEdit.value && props.reminder) {
    payload.reminderId = props.reminder.reminderId
  }

  emit('submit', payload)
}
</script>
