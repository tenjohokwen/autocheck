<template>
  <q-page padding>
    <div class="q-mb-md row items-center justify-between">
      <div class="text-h4">{{ $t('repair.title') }}</div>
      <div class="row q-gutter-sm">
        <q-btn
          color="secondary"
          :label="$t('repair.viewCostAnalysis')"
          icon="analytics"
          @click="showCostAnalysisDialog = true"
        />
        <q-btn
          color="primary"
          :label="$t('repair.createRepair')"
          icon="add"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Warranty Repairs Alert -->
    <q-card
      v-if="repairStore.warrantyRepairs.length > 0"
      class="q-mb-md bg-green-1"
    >
      <q-card-section>
        <div class="text-h6 text-green-8">
          <q-icon name="security" />
          {{ $t('repair.warrantyRepairs') }}
        </div>
        <div class="text-caption text-green-7">
          {{ repairStore.warrantyRepairs.length }} {{ $t('repair.repairsUnderWarranty') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div
            v-for="repair in repairStore.warrantyRepairs.slice(0, 3)"
            :key="repair.repairId"
            class="col-12"
          >
            <q-item
              clickable
              class="bg-white rounded-borders"
              @click="viewRepair(repair)"
            >
              <q-item-section avatar>
                <q-icon name="verified" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ repair.description }}</q-item-label>
                <q-item-label caption>
                  {{ $t('repair.warrantyExpiresOn') }}:
                  {{ formatDate(repair.warrantyExpiry) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- All Repairs -->
    <repair-list
      :repairs="repairStore.repairs"
      :loading="repairStore.isLoading"
      @view="viewRepair"
      @edit="editRepair"
      @delete="confirmDelete"
      @filter="handleFilter"
    />

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 600px; max-width: 900px">
        <q-card-section>
          <div class="text-h6">
            {{
              isEditMode
                ? $t('repair.editRepair')
                : $t('repair.createRepair')
            }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 70vh" class="scroll">
          <repair-form
            :repair="selectedRepair"
            :loading="repairStore.isLoading"
            @submit="handleSubmit"
            @cancel="closeDialog"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- View Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 600px; max-width: 900px">
        <q-card-section>
          <div class="text-h6">{{ $t('repair.repairDetails') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedRepair" style="max-height: 70vh" class="scroll">
          <div class="q-gutter-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('repair.status') }}
                </div>
                <q-chip
                  :color="getStatusColor(selectedRepair.status)"
                  text-color="white"
                  :icon="getStatusIcon(selectedRepair.status)"
                >
                  {{ $t(`repair.statuses.${selectedRepair.status}`) }}
                </q-chip>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('repair.severity') }}
                </div>
                <q-chip
                  :color="getSeverityColor(selectedRepair.severity)"
                  text-color="white"
                >
                  {{ $t(`repair.severities.${selectedRepair.severity}`) }}
                </q-chip>
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('repair.description') }}
              </div>
              <div class="text-body1">{{ selectedRepair.description }}</div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('repair.repairDate') }}
                </div>
                <div class="text-body1">
                  {{ formatDate(selectedRepair.repairDate) }}
                </div>
              </div>
              <div v-if="selectedRepair.cost" class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('repair.cost') }}
                </div>
                <div class="text-h6 text-primary">
                  FCFA {{ formatNumber(selectedRepair.cost) }}
                </div>
              </div>
            </div>

            <div v-if="selectedRepair.odometerReading">
              <div class="text-caption text-grey-7">
                {{ $t('repair.odometerReading') }}
              </div>
              <div class="text-body1">
                {{ formatNumber(selectedRepair.odometerReading) }} km
              </div>
            </div>

            <div v-if="selectedRepair.laborHours">
              <div class="text-caption text-grey-7">
                {{ $t('repair.laborHours') }}
              </div>
              <div class="text-body1">{{ selectedRepair.laborHours }} hours</div>
            </div>

            <div v-if="selectedRepair.partsUsed">
              <div class="text-caption text-grey-7">
                {{ $t('repair.partsUsed') }}
              </div>
              <div class="text-body1">{{ selectedRepair.partsUsed }}</div>
            </div>

            <div v-if="selectedRepair.technicianName">
              <div class="text-caption text-grey-7">
                {{ $t('repair.technicianName') }}
              </div>
              <div class="text-body1">{{ selectedRepair.technicianName }}</div>
            </div>

            <div v-if="selectedRepair.repairShop">
              <div class="text-caption text-grey-7">
                {{ $t('repair.repairShop') }}
              </div>
              <div class="text-body1">{{ selectedRepair.repairShop }}</div>
            </div>

            <div v-if="selectedRepair.invoiceNumber">
              <div class="text-caption text-grey-7">
                {{ $t('repair.invoiceNumber') }}
              </div>
              <div class="text-body1">{{ selectedRepair.invoiceNumber }}</div>
            </div>

            <div v-if="selectedRepair.hasWarranty">
              <q-banner class="bg-green-1 text-green-8">
                <template #avatar>
                  <q-icon name="security" color="green" />
                </template>
                {{ $t('repair.underWarranty') }} -
                {{ $t('repair.expiresOn') }}:
                {{ formatDate(selectedRepair.warrantyExpiry) }}
              </q-banner>
            </div>

            <div v-if="selectedRepair.notes">
              <div class="text-caption text-grey-7">
                {{ $t('repair.notes') }}
              </div>
              <div class="text-body1">{{ selectedRepair.notes }}</div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.close')"
            color="primary"
            @click="showViewDialog = false"
          />
          <q-btn
            flat
            :label="$t('common.edit')"
            color="primary"
            @click="editFromView"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Cost Analysis Dialog -->
    <q-dialog v-model="showCostAnalysisDialog">
      <q-card style="min-width: 700px; max-width: 1000px">
        <q-card-section>
          <div class="text-h6">{{ $t('repair.costAnalysisByVehicle') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-table
            :rows="repairStore.costAnalysis"
            :columns="costAnalysisColumns"
            row-key="vehicleId"
            :pagination="{ rowsPerPage: 10 }"
            flat
          >
            <template #body-cell-vehicle="props">
              <q-td :props="props">
                <div class="text-weight-medium">
                  {{ props.row.make }} {{ props.row.model }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ props.row.licensePlate }}
                </div>
              </q-td>
            </template>

            <template #body-cell-totalCost="props">
              <q-td :props="props">
                <div class="text-weight-bold text-primary">
                  FCFA {{ formatNumber(props.row.totalCost) }}
                </div>
              </q-td>
            </template>

            <template #body-cell-repairCount="props">
              <q-td :props="props">
                <q-badge color="blue" :label="props.row.repairCount" />
              </q-td>
            </template>

            <template #body-cell-totalLaborHours="props">
              <q-td :props="props">
                {{ props.row.totalLaborHours }} hrs
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.close')"
            color="primary"
            @click="showCostAnalysisDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('repair.confirmDelete') }}</div>
        </q-card-section>

        <q-card-section>
          {{ $t('repair.confirmDeleteMessage') }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.cancel')"
            color="primary"
            @click="showDeleteDialog = false"
          />
          <q-btn
            flat
            :label="$t('common.delete')"
            color="negative"
            @click="deleteRepair"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar, date } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRepairStore } from 'src/stores/repairStore'
import RepairList from 'src/components/repair/RepairList.vue'
import RepairForm from 'src/components/repair/RepairForm.vue'

const $q = useQuasar()
const { t } = useI18n()
const repairStore = useRepairStore()

const showDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const showCostAnalysisDialog = ref(false)
const selectedRepair = ref(null)
const isEditMode = ref(false)

const costAnalysisColumns = [
  {
    name: 'vehicle',
    label: t('repair.vehicle'),
    field: 'vehicleId',
    align: 'left',
    sortable: true,
  },
  {
    name: 'totalCost',
    label: t('repair.totalCost'),
    field: 'totalCost',
    align: 'right',
    sortable: true,
    sort: (a, b) => b - a,
  },
  {
    name: 'repairCount',
    label: t('repair.repairCount'),
    field: 'repairCount',
    align: 'center',
    sortable: true,
  },
  {
    name: 'totalLaborHours',
    label: t('repair.totalLaborHours'),
    field: 'totalLaborHours',
    align: 'right',
    sortable: true,
  },
]

onMounted(async () => {
  try {
    await Promise.all([
      repairStore.fetchRepairs(),
      repairStore.fetchCostAnalysis(),
      repairStore.fetchWarrantyRepairs(),
    ])
  } catch (error) {
    console.error('Error loading repair data:', error)
    $q.notify({
      type: 'negative',
      message: t('repair.errorLoadingRepairs'),
    })
  }
})

function openCreateDialog() {
  selectedRepair.value = null
  isEditMode.value = false
  showDialog.value = true
}

function viewRepair(repair) {
  selectedRepair.value = repair
  showViewDialog.value = true
}

function editRepair(repair) {
  selectedRepair.value = repair
  isEditMode.value = true
  showDialog.value = true
}

function editFromView() {
  showViewDialog.value = false
  isEditMode.value = true
  showDialog.value = true
}

function confirmDelete(repair) {
  selectedRepair.value = repair
  showDeleteDialog.value = true
}

async function handleSubmit(data) {
  try {
    if (isEditMode.value) {
      await repairStore.updateRepair(data.repairId, data)
      $q.notify({
        type: 'positive',
        message: t('repair.repairUpdated'),
      })
    } else {
      await repairStore.createRepair(data)
      $q.notify({
        type: 'positive',
        message: t('repair.repairCreated'),
      })
    }
    closeDialog()
    // Refresh data
    await Promise.all([
      repairStore.fetchRepairs(),
      repairStore.fetchCostAnalysis(),
    ])
  } catch (error) {
    console.error('Error saving repair:', error)
    $q.notify({
      type: 'negative',
      message: error.message || t('repair.errorSavingRepair'),
    })
  }
}

async function deleteRepair() {
  try {
    await repairStore.deleteRepair(selectedRepair.value.repairId)
    $q.notify({
      type: 'positive',
      message: t('repair.repairDeleted'),
    })
    showDeleteDialog.value = false
    selectedRepair.value = null
    // Refresh data
    await Promise.all([
      repairStore.fetchRepairs(),
      repairStore.fetchCostAnalysis(),
    ])
  } catch (error) {
    console.error('Error deleting repair:', error)
    $q.notify({
      type: 'negative',
      message: error.message || t('repair.errorDeletingRepair'),
    })
  }
}

function closeDialog() {
  showDialog.value = false
  selectedRepair.value = null
  isEditMode.value = false
}

async function handleFilter(filters) {
  try {
    await repairStore.fetchRepairs(filters)
  } catch (error) {
    console.error('Error applying filters:', error)
    $q.notify({
      type: 'negative',
      message: t('repair.errorLoadingRepairs'),
    })
  }
}

function getStatusColor(status) {
  const colors = {
    SCHEDULED: 'blue',
    IN_PROGRESS: 'orange',
    COMPLETED: 'green',
    CANCELLED: 'grey',
  }
  return colors[status] || 'grey'
}

function getStatusIcon(status) {
  const icons = {
    SCHEDULED: 'event',
    IN_PROGRESS: 'build',
    COMPLETED: 'check_circle',
    CANCELLED: 'cancel',
  }
  return icons[status] || 'info'
}

function getSeverityColor(severity) {
  const colors = {
    LOW: 'blue-grey',
    MEDIUM: 'orange',
    HIGH: 'deep-orange',
    CRITICAL: 'red',
  }
  return colors[severity] || 'grey'
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return parseFloat(value).toLocaleString()
}

function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD')
}
</script>
