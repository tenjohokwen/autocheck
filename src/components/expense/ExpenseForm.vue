<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-select
      v-model="formData.vehicleId"
      :options="vehicleOptions"
      :label="$t('expense.vehicle') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
      :disable="isEdit"
    />

    <q-select
      v-model="formData.category"
      :options="categoryOptions"
      :label="$t('expense.category') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
    />

    <q-input
      v-model="formData.expenseDate"
      :label="$t('expense.date') + ' *'"
      type="date"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-input
      v-model.number="formData.amount"
      :label="$t('expense.amount') + ' *'"
      type="number"
      min="0"
      step="0.01"
      prefix="$"
      :rules="[
        (val) => val !== null || $t('validation.required'),
        (val) => val > 0 || $t('validation.mustBePositive'),
      ]"
    />

    <q-input
      v-model="formData.description"
      :label="$t('expense.description') + ' *'"
      type="textarea"
      rows="2"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-input
      v-model="formData.vendor"
      :label="$t('expense.vendor')"
      type="text"
    />

    <q-input
      v-model="formData.receiptNumber"
      :label="$t('expense.receiptNumber')"
      type="text"
    />

    <q-input
      v-model="formData.notes"
      :label="$t('expense.notes')"
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
  expense: {
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

const isEdit = ref(!!props.expense)

const formData = ref({
  vehicleId: '',
  category: 'OTHER',
  expenseDate: '',
  amount: null,
  description: '',
  vendor: '',
  receiptNumber: '',
  notes: '',
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
    formData.value.expenseDate = today
  }
})

// Populate form if editing
watch(
  () => props.expense,
  (expense) => {
    if (expense) {
      formData.value = {
        vehicleId: expense.vehicleId || '',
        category: expense.category || 'OTHER',
        expenseDate: expense.expenseDate || '',
        amount: expense.amount || null,
        description: expense.description || '',
        vendor: expense.vendor || '',
        receiptNumber: expense.receiptNumber || '',
        notes: expense.notes || '',
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

  // If editing, include expenseId
  if (isEdit.value && props.expense) {
    payload.expenseId = props.expense.expenseId
  }

  emit('submit', payload)
}
</script>
