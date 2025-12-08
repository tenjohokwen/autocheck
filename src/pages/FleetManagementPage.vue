<template>
  <q-page class="fleet-management-page q-pa-md">
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h4 class="text-h4 q-ma-none">{{ $t('fleet.management.title') }}</h4>
          <p class="text-subtitle1 text-grey-7">{{ $t('fleet.management.subtitle') }}</p>
        </div>
        <q-btn
          v-if="canCreate"
          color="primary"
          icon="add"
          :label="$t('fleet.create')"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Fleet list -->
    <FleetList
      :fleets="fleetStore.fleets"
      :loading="fleetStore.isLoading"
      @create="showCreateDialog = true"
      @view="handleViewFleet"
      @edit="handleEditFleet"
      @delete="handleDeleteFleet"
      @click="handleViewFleet"
    />

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ editingFleet ? $t('fleet.edit') : $t('fleet.create') }}
          </div>
        </q-card-section>

        <q-card-section>
          <FleetForm
            :fleet="editingFleet"
            :loading="fleetStore.isLoading"
            @submit="handleSubmitFleet"
            @cancel="handleCancelForm"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('fleet.delete.title') }}</div>
        </q-card-section>

        <q-card-section>
          <p>{{ $t('fleet.delete.confirm', { name: deletingFleet?.name }) }}</p>
          <p class="text-caption text-grey-7">
            {{ $t('fleet.delete.warning') }}
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.cancel')"
            color="grey-7"
            @click="showDeleteDialog = false"
          />
          <q-btn
            :label="$t('common.delete')"
            color="negative"
            :loading="fleetStore.isLoading"
            @click="confirmDeleteFleet"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
/**
 * FleetManagementPage.vue
 *
 * Fleet management page for Fleet Managers.
 * Allows creating, viewing, editing, and deleting fleets.
 *
 * Per constitution: Vue 3 Composition API with <script setup>
 */

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import { useFleetStore } from 'src/stores/fleetStore'
import FleetList from 'src/components/fleet/FleetList.vue'
import FleetForm from 'src/components/fleet/FleetForm.vue'

const { t: $t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const fleetStore = useFleetStore()

// State
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingFleet = ref(null)
const deletingFleet = ref(null)

// Computed
const canCreate = computed(() => {
  return authStore.user?.role === 'FLEET_MANAGER'
})

// Lifecycle
onMounted(async () => {
  try {
    await fleetStore.fetchFleets()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('fleet.error.fetchFailed'),
      caption: error.message
    })
  }
})

// Methods
function handleViewFleet(fleet) {
  router.push({
    name: 'fleet-details',
    params: { id: fleet.fleetId }
  })
}

function handleEditFleet(fleet) {
  editingFleet.value = fleet
  showCreateDialog.value = true
}

function handleDeleteFleet(fleet) {
  deletingFleet.value = fleet
  showDeleteDialog.value = true
}

async function handleSubmitFleet(formData) {
  try {
    if (editingFleet.value) {
      await fleetStore.updateFleet(editingFleet.value.fleetId, formData)
      $q.notify({
        type: 'positive',
        message: $t('fleet.success.updated')
      })
    } else {
      await fleetStore.createFleet(formData)
      $q.notify({
        type: 'positive',
        message: $t('fleet.success.created')
      })
    }
    handleCancelForm()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('fleet.error.saveFailed'),
      caption: error.message
    })
  }
}

async function confirmDeleteFleet() {
  try {
    await fleetStore.deleteFleet(deletingFleet.value.fleetId)
    $q.notify({
      type: 'positive',
      message: $t('fleet.success.deleted')
    })
    showDeleteDialog.value = false
    deletingFleet.value = null
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('fleet.error.deleteFailed'),
      caption: error.message
    })
  }
}

function handleCancelForm() {
  showCreateDialog.value = false
  editingFleet.value = null
}
</script>

<style scoped>
.fleet-management-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}
</style>
