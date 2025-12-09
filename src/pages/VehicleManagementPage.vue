<template>
  <q-page class="vehicle-management-page q-pa-md">
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h4 class="text-h4 q-ma-none">{{ $t('vehicle.management.title') }}</h4>
          <p class="text-subtitle1 text-grey-7">{{ $t('vehicle.management.subtitle') }}</p>
        </div>
        <q-btn
          v-if="canCreate"
          color="primary"
          icon="add"
          :label="$t('vehicle.create')"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Vehicle list -->
    <VehicleList
      :vehicles="vehicleStore.vehicles"
      :loading="vehicleStore.isLoading"
      @create="showCreateDialog = true"
      @view="handleViewVehicle"
      @edit="handleEditVehicle"
      @archive="handleArchiveVehicle"
      @click="handleViewVehicle"
      @toggle-archived="handleToggleArchived"
    />

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">
            {{ editingVehicle ? $t('vehicle.edit') : $t('vehicle.create') }}
          </div>
        </q-card-section>

        <q-card-section>
          <VehicleForm
            :vehicle="editingVehicle"
            :loading="vehicleStore.isLoading"
            @submit="handleSubmitVehicle"
            @cancel="handleCancelForm"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Archive Confirmation Dialog -->
    <q-dialog v-model="showArchiveDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('vehicle.archive.title') }}</div>
        </q-card-section>

        <q-card-section>
          <p>{{ $t('vehicle.archive.confirm', { vehicle: archivingVehicle?.licensePlate }) }}</p>

          <q-input
            v-model="archiveReason"
            :label="$t('vehicle.archive.reason')"
            type="textarea"
            outlined
            rows="3"
            class="q-mt-md"
          />

          <p class="text-caption text-grey-7 q-mt-md">
            {{ $t('vehicle.archive.warning') }}
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.cancel')"
            color="grey-7"
            @click="handleCancelArchive"
          />
          <q-btn
            :label="$t('common.archive')"
            color="warning"
            :loading="vehicleStore.isLoading"
            @click="confirmArchiveVehicle"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
/**
 * VehicleManagementPage.vue
 *
 * Vehicle management page for Fleet Managers.
 * Allows creating, viewing, editing, and archiving vehicles.
 *
 * Per constitution: Vue 3 Composition API with <script setup>
 */

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import { useVehicleStore } from 'src/stores/vehicleStore'
import VehicleList from 'src/components/vehicle/VehicleList.vue'
import VehicleForm from 'src/components/vehicle/VehicleForm.vue'

const { t: $t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const vehicleStore = useVehicleStore()

// State
const showCreateDialog = ref(false)
const showArchiveDialog = ref(false)
const editingVehicle = ref(null)
const archivingVehicle = ref(null)
const archiveReason = ref('')

// Computed
const canCreate = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

// Lifecycle
onMounted(async () => {
  try {
    await vehicleStore.fetchVehicles(false)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('vehicle.error.fetchFailed'),
      caption: error.message
    })
  }
})

// Methods
function handleViewVehicle(vehicle) {
  router.push({
    name: 'vehicle-details',
    params: { id: vehicle.vehicleId }
  })
}

function handleEditVehicle(vehicle) {
  editingVehicle.value = vehicle
  showCreateDialog.value = true
}

function handleArchiveVehicle(vehicle) {
  archivingVehicle.value = vehicle
  archiveReason.value = ''
  showArchiveDialog.value = true
}

async function handleToggleArchived(includeArchived) {
  try {
    await vehicleStore.fetchVehicles(includeArchived)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('vehicle.error.fetchFailed'),
      caption: error.message
    })
  }
}

async function handleSubmitVehicle(formData) {
  try {
    if (editingVehicle.value) {
      await vehicleStore.updateVehicle(editingVehicle.value.vehicleId, formData)
      $q.notify({
        type: 'positive',
        message: $t('vehicle.success.updated')
      })
    } else {
      await vehicleStore.createVehicle(formData)
      $q.notify({
        type: 'positive',
        message: $t('vehicle.success.created')
      })
    }
    handleCancelForm()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('vehicle.error.saveFailed'),
      caption: error.message
    })
  }
}

async function confirmArchiveVehicle() {
  try {
    await vehicleStore.archiveVehicle(
      archivingVehicle.value.vehicleId,
      archiveReason.value || 'No reason provided'
    )
    $q.notify({
      type: 'positive',
      message: $t('vehicle.success.archived')
    })
    handleCancelArchive()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('vehicle.error.archiveFailed'),
      caption: error.message
    })
  }
}

function handleCancelForm() {
  showCreateDialog.value = false
  editingVehicle.value = null
}

function handleCancelArchive() {
  showArchiveDialog.value = false
  archivingVehicle.value = null
  archiveReason.value = ''
}
</script>

<style scoped>
.vehicle-management-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}
</style>
