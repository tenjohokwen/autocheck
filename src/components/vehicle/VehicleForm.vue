<template>
  <q-form
    @submit.prevent="handleSubmit"
    class="vehicle-form"
  >
    <div class="row q-col-gutter-md">
      <!-- Make -->
      <div class="col-12 col-sm-6">
        <q-input
          v-model="formData.make"
          :label="$t('vehicle.form.make')"
          outlined
          :rules="[val => !!val || $t('validation.required', { field: $t('vehicle.form.make') })]"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="precision_manufacturing" />
          </template>
        </q-input>
      </div>

      <!-- Model -->
      <div class="col-12 col-sm-6">
        <q-input
          v-model="formData.model"
          :label="$t('vehicle.form.model')"
          outlined
          :rules="[val => !!val || $t('validation.required', { field: $t('vehicle.form.model') })]"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="local_offer" />
          </template>
        </q-input>
      </div>

      <!-- Year -->
      <div class="col-12 col-sm-6">
        <q-input
          v-model.number="formData.year"
          :label="$t('vehicle.form.year')"
          type="number"
          outlined
          :rules="[
            val => !!val || $t('validation.required', { field: $t('vehicle.form.year') }),
            val => val >= 1900 || $t('validation.min', { field: $t('vehicle.form.year'), value: 1900 }),
            val => val <= currentYear + 1 || $t('validation.max', { field: $t('vehicle.form.year'), value: currentYear + 1 })
          ]"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="event" />
          </template>
        </q-input>
      </div>

      <!-- Seats -->
      <div class="col-12 col-sm-6">
        <q-input
          v-model.number="formData.seats"
          :label="$t('vehicle.form.seats')"
          type="number"
          outlined
          :rules="[
            val => !!val || $t('validation.required', { field: $t('vehicle.form.seats') }),
            val => val >= 1 || $t('validation.min', { field: $t('vehicle.form.seats'), value: 1 }),
            val => val <= 99 || $t('validation.max', { field: $t('vehicle.form.seats'), value: 99 })
          ]"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="event_seat" />
          </template>
        </q-input>
      </div>

      <!-- License Plate -->
      <div class="col-12 col-sm-6">
        <q-input
          v-model="formData.licensePlate"
          :label="$t('vehicle.form.licensePlate')"
          outlined
          :rules="[val => !!val || $t('validation.required', { field: $t('vehicle.form.licensePlate') })]"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="badge" />
          </template>
        </q-input>
      </div>

      <!-- Vehicle Type -->
      <div class="col-12 col-sm-6">
        <q-select
          v-model="formData.vehicleType"
          :label="$t('vehicle.form.vehicleType')"
          :options="vehicleTypeOptions"
          outlined
          emit-value
          map-options
          :rules="[val => !!val || $t('validation.required', { field: $t('vehicle.form.vehicleType') })]"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="category" />
          </template>
        </q-select>
      </div>

      <!-- Current Odometer -->
      <div class="col-12 col-sm-6">
        <q-input
          v-model.number="formData.currentOdometer"
          :label="$t('vehicle.form.currentOdometer')"
          type="number"
          suffix="km"
          outlined
          :rules="[
            val => val === null || val === '' || val >= 0 || $t('validation.min', { field: $t('vehicle.form.currentOdometer'), value: 0 })
          ]"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="speed" />
          </template>
        </q-input>
      </div>

      <!-- Insurance Expiry -->
      <div class="col-12 col-sm-6">
        <q-input
          v-model="formData.insuranceExpiry"
          :label="$t('vehicle.form.insuranceExpiry')"
          outlined
          mask="date"
        >
          <template #prepend>
            <q-icon name="event" />
          </template>
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="formData.insuranceExpiry">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup :label="$t('common.close')" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
    </div>

    <!-- Form actions -->
    <div class="row q-gutter-sm justify-end q-mt-md">
      <q-btn
        flat
        :label="$t('common.cancel')"
        color="grey-7"
        @click="$emit('cancel')"
      />
      <q-btn
        type="submit"
        :label="editMode ? $t('common.update') : $t('common.create')"
        color="primary"
        :loading="loading"
        :disable="loading"
      />
    </div>
  </q-form>
</template>

<script setup>
/**
 * VehicleForm.vue
 *
 * Form for creating and editing vehicles.
 * Includes all required fields per FR-028, FR-029.
 *
 * Per constitution: Vue 3 Composition API with <script setup>
 */

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

// Component props
const props = defineProps({
  vehicle: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Component emits
const emit = defineEmits(['submit', 'cancel'])

// State
const formData = ref({
  make: '',
  model: '',
  year: new Date().getFullYear(),
  seats: 5,
  licensePlate: '',
  vehicleType: 'CAR',
  currentOdometer: null,
  insuranceExpiry: ''
})

const editMode = ref(false)

// Computed
const currentYear = computed(() => new Date().getFullYear())

const vehicleTypeOptions = computed(() => [
  { label: $t('vehicle.vehicleTypes.CAR'), value: 'CAR' },
  { label: $t('vehicle.vehicleTypes.TRUCK'), value: 'TRUCK' },
  { label: $t('vehicle.vehicleTypes.VAN'), value: 'VAN' },
  { label: $t('vehicle.vehicleTypes.SUV'), value: 'SUV' },
  { label: $t('vehicle.vehicleTypes.MOTORCYCLE'), value: 'MOTORCYCLE' },
  { label: $t('vehicle.vehicleTypes.BUS'), value: 'BUS' },
  { label: $t('vehicle.vehicleTypes.OTHER'), value: 'OTHER' }
])

// Watch for vehicle prop changes
watch(() => props.vehicle, (newVehicle) => {
  if (newVehicle) {
    formData.value = {
      make: newVehicle.make || '',
      model: newVehicle.model || '',
      year: newVehicle.year || new Date().getFullYear(),
      seats: newVehicle.seats || 5,
      licensePlate: newVehicle.licensePlate || '',
      vehicleType: newVehicle.vehicleType || 'CAR',
      currentOdometer: newVehicle.currentOdometer || null,
      insuranceExpiry: newVehicle.insuranceExpiry || ''
    }
    editMode.value = true
  } else {
    formData.value = {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      seats: 5,
      licensePlate: '',
      vehicleType: 'CAR',
      currentOdometer: null,
      insuranceExpiry: ''
    }
    editMode.value = false
  }
}, { immediate: true })

// Methods
function handleSubmit() {
  emit('submit', {
    ...formData.value
  })
}
</script>

<style scoped>
.vehicle-form {
  min-width: 300px;
}
</style>
