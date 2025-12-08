<template>
  <q-page padding>
    <div class="q-mb-md row items-center justify-between">
      <div class="text-h4">{{ $t('fuel.title') }}</div>
      <q-btn
        color="primary"
        :label="$t('fuel.addRecord')"
        icon="add"
        @click="openCreateDialog"
      />
    </div>

    <!-- Fuel Efficiency Section (FR-006) -->
    <q-card v-if="selectedVehicleId" class="q-mb-md">
      <q-card-section class="bg-blue-1">
        <div class="text-h6 text-blue-8">
          <q-icon name="show_chart" />
          {{ $t('fuel.fuelEfficiency') }}
        </div>
        <div class="text-caption text-blue-7">
          {{ $t('fuel.efficiencyDescription') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="selectedVehicleId"
              :options="vehicleOptions"
              :label="$t('fuel.selectVehicle')"
              emit-value
              map-options
              @update:model-value="loadEfficiency"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-btn
              color="primary"
              :label="$t('fuel.calculate')"
              icon="calculate"
              :loading="calculatingEfficiency"
              @click="loadEfficiency"
            />
          </div>
        </div>

        <div v-if="efficiency" class="q-mt-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h3 text-primary">
                    {{ efficiency.averageLPer100km || 'N/A' }}
                  </div>
                  <div class="text-subtitle2 text-grey-7">
                    {{ $t('fuel.litersPer100km') }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h3 text-primary">
                    {{ efficiency.averageMPG || 'N/A' }}
                  </div>
                  <div class="text-subtitle2 text-grey-7">
                    {{ $t('fuel.milesPerGallon') }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-caption text-grey-7">
                    {{ $t('fuel.totalDistance') }}
                  </div>
                  <div class="text-h6">
                    {{ formatNumber(efficiency.totalDistance) }} km
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-caption text-grey-7">
                    {{ $t('fuel.totalLiters') }}
                  </div>
                  <div class="text-h6">
                    {{ formatNumber(efficiency.totalLiters) }} L
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <div v-if="efficiency.message" class="q-mt-sm text-caption text-grey-7">
            {{ efficiency.message }}
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Fuel Statistics -->
    <q-card v-if="statistics" class="q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ $t('fuel.statistics') }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">
              {{ $t('fuel.totalCost') }}
            </div>
            <div class="text-h6">${{ formatNumber(statistics.totalCost) }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">
              {{ $t('fuel.totalLiters') }}
            </div>
            <div class="text-h6">{{ formatNumber(statistics.totalLiters) }} L</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">
              {{ $t('fuel.averageCostPerLiter') }}
            </div>
            <div class="text-h6">
              ${{ formatNumber(statistics.averageCostPerLiter) }}/L
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Fuel Record List -->
    <fuel-list
      :records="fuelStore.records"
      :loading="fuelStore.isLoading"
      @view="viewRecord"
      @edit="editRecord"
      @delete="confirmDelete"
      @filter="handleFilter"
    />

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">
            {{
              isEditMode ? $t('fuel.editRecord') : $t('fuel.addRecord')
            }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <fuel-form
            :record="selectedRecord"
            :loading="fuelStore.isLoading"
            @submit="handleSubmit"
            @cancel="closeDialog"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- View Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 500px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">{{ $t('fuel.recordDetails') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedRecord">
          <div class="q-gutter-sm">
            <div>
              <div class="text-caption text-grey-7">{{ $t('fuel.date') }}</div>
              <div class="text-body1">{{ formatDate(selectedRecord.date) }}</div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('fuel.odometer') }}
                </div>
                <div class="text-body1">
                  {{ formatNumber(selectedRecord.odometer) }} km
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('fuel.liters') }}
                </div>
                <div class="text-body1">{{ formatNumber(selectedRecord.liters) }} L</div>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">{{ $t('fuel.cost') }}</div>
                <div class="text-body1">${{ formatNumber(selectedRecord.cost) }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('fuel.costPerLiter') }}
                </div>
                <div class="text-body1">
                  ${{ formatNumber(selectedRecord.cost / selectedRecord.liters) }}/L
                </div>
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('fuel.fuelType') }}
              </div>
              <div class="text-body1">
                {{ $t(`fuel.fuelTypes.${selectedRecord.fuelType}`) }}
              </div>
            </div>

            <div v-if="selectedRecord.station">
              <div class="text-caption text-grey-7">
                {{ $t('fuel.station') }}
              </div>
              <div class="text-body1">{{ selectedRecord.station }}</div>
            </div>

            <div v-if="selectedRecord.notes">
              <div class="text-caption text-grey-7">{{ $t('fuel.notes') }}</div>
              <div class="text-body1">{{ selectedRecord.notes }}</div>
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

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('fuel.confirmDelete') }}</div>
        </q-card-section>

        <q-card-section>
          {{ $t('fuel.confirmDeleteMessage') }}
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
            @click="deleteRecord"
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
import { useFuelStore } from 'src/stores/fuelStore'
import { useVehicleStore } from 'src/stores/vehicleStore'
import FuelList from 'src/components/fuel/FuelList.vue'
import FuelForm from 'src/components/fuel/FuelForm.vue'

const $q = useQuasar()
const { t } = useI18n()
const fuelStore = useFuelStore()
const vehicleStore = useVehicleStore()

const showDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedRecord = ref(null)
const isEditMode = ref(false)

const selectedVehicleId = ref(null)
const vehicleOptions = ref([])
const efficiency = ref(null)
const statistics = ref(null)
const calculatingEfficiency = ref(false)

onMounted(async () => {
  try {
    await Promise.all([fuelStore.fetchRecords(), vehicleStore.fetchVehicles()])

    // Populate vehicle options
    vehicleOptions.value = vehicleStore.activeVehicles.map((v) => ({
      label: `${v.make} ${v.model} (${v.licensePlate})`,
      value: v.vehicleId,
    }))

    // Select first vehicle by default
    if (vehicleOptions.value.length > 0) {
      selectedVehicleId.value = vehicleOptions.value[0].value
      await loadEfficiency()
      await loadStatistics()
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('fuel.errorLoadingRecords'),
    })
  }
})

function openCreateDialog() {
  selectedRecord.value = null
  isEditMode.value = false
  showDialog.value = true
}

function viewRecord(record) {
  selectedRecord.value = record
  showViewDialog.value = true
}

function editRecord(record) {
  selectedRecord.value = record
  isEditMode.value = true
  showDialog.value = true
}

function editFromView() {
  showViewDialog.value = false
  isEditMode.value = true
  showDialog.value = true
}

function confirmDelete(record) {
  selectedRecord.value = record
  showDeleteDialog.value = true
}

async function handleSubmit(data) {
  try {
    if (isEditMode.value) {
      await fuelStore.updateRecord(data.recordId, data)
      $q.notify({
        type: 'positive',
        message: t('fuel.recordUpdated'),
      })
    } else {
      await fuelStore.createRecord(data)
      $q.notify({
        type: 'positive',
        message: t('fuel.recordCreated'),
      })
    }
    closeDialog()

    // Refresh efficiency if relevant vehicle
    if (data.vehicleId === selectedVehicleId.value) {
      await loadEfficiency()
      await loadStatistics()
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('fuel.errorSavingRecord'),
    })
  }
}

async function deleteRecord() {
  try {
    await fuelStore.deleteRecord(selectedRecord.value.recordId)
    $q.notify({
      type: 'positive',
      message: t('fuel.recordDeleted'),
    })
    showDeleteDialog.value = false
    selectedRecord.value = null

    // Refresh efficiency
    await loadEfficiency()
    await loadStatistics()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('fuel.errorDeletingRecord'),
    })
  }
}

function closeDialog() {
  showDialog.value = false
  selectedRecord.value = null
  isEditMode.value = false
}

async function handleFilter(filters) {
  try {
    await fuelStore.fetchRecords(filters)

    // If filtering by vehicle, update efficiency display
    if (filters.vehicleId) {
      selectedVehicleId.value = filters.vehicleId
      await loadEfficiency()
      await loadStatistics()
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('fuel.errorLoadingRecords'),
    })
  }
}

async function loadEfficiency() {
  if (!selectedVehicleId.value) return

  calculatingEfficiency.value = true
  try {
    efficiency.value = await fuelStore.calculateEfficiency(
      selectedVehicleId.value,
      10
    )
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('fuel.errorCalculatingEfficiency'),
    })
  } finally {
    calculatingEfficiency.value = false
  }
}

async function loadStatistics() {
  if (!selectedVehicleId.value) return

  try {
    statistics.value = await fuelStore.getFuelStatistics(selectedVehicleId.value)
  } catch (error) {
    console.error('Error loading fuel statistics:', error)
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD')
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return parseFloat(value).toFixed(2)
}
</script>
