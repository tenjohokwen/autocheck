<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <q-select
      v-model="formData.vehicleId"
      :options="vehicleOptions"
      :label="$t('repair.vehicle') + ' *'"
      :rules="[(val) => !!val || $t('validation.required')]"
      emit-value
      map-options
      :disable="isEdit"
    />

    <q-input
      v-model="formData.repairDate"
      :label="$t('repair.repairDate') + ' *'"
      type="date"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <q-input
      v-model="formData.description"
      :label="$t('repair.description') + ' *'"
      type="textarea"
      rows="3"
      :rules="[(val) => !!val || $t('validation.required')]"
    />

    <div class="row q-col-gutter-md">
      <div class="col-6">
        <q-select
          v-model="formData.status"
          :options="statusOptions"
          :label="$t('repair.status') + ' *'"
          :rules="[(val) => !!val || $t('validation.required')]"
          emit-value
          map-options
        />
      </div>
      <div class="col-6">
        <q-select
          v-model="formData.severity"
          :options="severityOptions"
          :label="$t('repair.severity') + ' *'"
          :rules="[(val) => !!val || $t('validation.required')]"
          emit-value
          map-options
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-6">
        <q-input
          v-model.number="formData.cost"
          :label="$t('repair.cost')"
          type="number"
          min="0"
          step="0.01"
          prefix="FCFA"
          :rules="[
            (val) => val === null || val >= 0 || $t('validation.mustBePositive'),
          ]"
        />
      </div>
      <div class="col-6">
        <q-input
          v-model.number="formData.odometerReading"
          :label="$t('repair.odometerReading')"
          type="number"
          min="0"
          suffix="km"
          :rules="[
            (val) => val === null || val >= 0 || $t('validation.mustBePositive'),
          ]"
        />
      </div>
    </div>

    <q-input
      v-model.number="formData.laborHours"
      :label="$t('repair.laborHours')"
      type="number"
      min="0"
      step="0.5"
      suffix="hours"
      :rules="[
        (val) => val === null || val >= 0 || $t('validation.mustBePositive'),
      ]"
    />

    <q-input
      v-model="formData.partsUsed"
      :label="$t('repair.partsUsed')"
      type="textarea"
      rows="2"
      :hint="$t('repair.partsUsedHint')"
    />

    <div class="row q-col-gutter-md">
      <div class="col-6">
        <q-input
          v-model="formData.technicianName"
          :label="$t('repair.technicianName')"
          type="text"
        />
      </div>
      <div class="col-6">
        <q-input
          v-model="formData.repairShop"
          :label="$t('repair.repairShop')"
          type="text"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-6">
        <q-input
          v-model="formData.invoiceNumber"
          :label="$t('repair.invoiceNumber')"
          type="text"
        />
      </div>
      <div class="col-6">
        <q-checkbox
          v-model="formData.isWarrantyClaim"
          :label="$t('repair.isWarrantyClaim')"
        />
      </div>
    </div>

    <q-input
      v-if="formData.isWarrantyClaim"
      v-model="formData.warrantyExpiry"
      :label="$t('repair.warrantyExpiry')"
      type="date"
    />

    <q-input
      v-model="formData.notes"
      :label="$t('repair.notes')"
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
  repair: {
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

const isEdit = ref(!!props.repair)

const formData = ref({
  vehicleId: '',
  repairDate: '',
  description: '',
  status: 'SCHEDULED',
  severity: 'MEDIUM',
  cost: null,
  odometerReading: null,
  laborHours: null,
  partsUsed: '',
  technicianName: '',
  repairShop: '',
  warrantyExpiry: '',
  isWarrantyClaim: false,
  invoiceNumber: '',
  notes: '',
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
    formData.value.repairDate = today
  }
})

// Populate form if editing
watch(
  () => props.repair,
  (repair) => {
    if (repair) {
      formData.value = {
        vehicleId: repair.vehicleId || '',
        repairDate: repair.repairDate || '',
        description: repair.description || '',
        status: repair.status || 'SCHEDULED',
        severity: repair.severity || 'MEDIUM',
        cost: repair.cost || null,
        odometerReading: repair.odometerReading || null,
        laborHours: repair.laborHours || null,
        partsUsed: repair.partsUsed || '',
        technicianName: repair.technicianName || '',
        repairShop: repair.repairShop || '',
        warrantyExpiry: repair.warrantyExpiry || '',
        isWarrantyClaim: repair.isWarrantyClaim || false,
        invoiceNumber: repair.invoiceNumber || '',
        notes: repair.notes || '',
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

  // If editing, include repairId
  if (isEdit.value && props.repair) {
    payload.repairId = props.repair.repairId
  }

  emit('submit', payload)
}
</script>
