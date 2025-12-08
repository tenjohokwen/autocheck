<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-select
      v-model="formData.vehicleId"
      :options="vehicleOptions"
      :label="$t('fuel.vehicle') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
      :disable="isEdit"
    />

    <q-input
      v-model="formData.date"
      :label="$t('fuel.date') + ' *'"
      type="date"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-input
      v-model.number="formData.odometer"
      :label="$t('fuel.odometer') + ' *'"
      type="number"
      min="0"
      suffix="km"
      :rules="[
        (val) => val !== null || $t('validation.required'),
        (val) => val >= 0 || $t('validation.mustBePositive'),
      ]"
    />

    <q-input
      v-model.number="formData.liters"
      :label="$t('fuel.liters') + ' *'"
      type="number"
      min="0"
      step="0.01"
      suffix="L"
      :rules="[
        (val) => val !== null || $t('validation.required'),
        (val) => val > 0 || $t('validation.mustBePositive'),
      ]"
    />

    <q-input
      v-model.number="formData.cost"
      :label="$t('fuel.cost') + ' *'"
      type="number"
      min="0"
      step="0.01"
      prefix="$"
      :rules="[
        (val) => val !== null || $t('validation.required'),
        (val) => val >= 0 || $t('validation.mustBePositive'),
      ]"
    />

    <q-select
      v-model="formData.fuelType"
      :options="fuelTypeOptions"
      :label="$t('fuel.fuelType')"
      emit-value
      map-options
    />

    <q-checkbox v-model="formData.fullTank" :label="$t('fuel.fullTank')" />

    <q-input
      v-model="formData.station"
      :label="$t('fuel.station')"
      type="text"
    />

    <q-input
      v-model="formData.notes"
      :label="$t('fuel.notes')"
      type="textarea"
      rows="3"
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
  record: {
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

const isEdit = ref(!!props.record)

const formData = ref({
  vehicleId: '',
  date: '',
  odometer: null,
  liters: null,
  cost: null,
  fuelType: 'REGULAR',
  fullTank: true,
  station: '',
  notes: '',
})

const vehicleOptions = ref([])

const fuelTypeOptions = [
  { label: t('fuel.fuelTypes.REGULAR'), value: 'REGULAR' },
  { label: t('fuel.fuelTypes.PREMIUM'), value: 'PREMIUM' },
  { label: t('fuel.fuelTypes.DIESEL'), value: 'DIESEL' },
  { label: t('fuel.fuelTypes.ELECTRIC'), value: 'ELECTRIC' },
  { label: t('fuel.fuelTypes.HYBRID'), value: 'HYBRID' },
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

  // Set default date to today
  if (!isEdit.value) {
    const today = new Date().toISOString().split('T')[0]
    formData.value.date = today
  }
})

// Populate form if editing
watch(
  () => props.record,
  (record) => {
    if (record) {
      formData.value = {
        vehicleId: record.vehicleId || '',
        date: record.date || '',
        odometer: record.odometer || null,
        liters: record.liters || null,
        cost: record.cost || null,
        fuelType: record.fuelType || 'REGULAR',
        fullTank: record.fullTank !== undefined ? record.fullTank : true,
        station: record.station || '',
        notes: record.notes || '',
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

  // If editing, include recordId
  if (isEdit.value && props.record) {
    payload.recordId = props.record.recordId
  }

  emit('submit', payload)
}
</script>
