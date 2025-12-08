<template>
  <q-page padding>
    <div class="q-mb-md row items-center justify-between">
      <div class="text-h4">{{ $t('parts.title') }}</div>
      <div class="row q-gutter-sm">
        <q-input
          v-model="searchQuery"
          :placeholder="$t('parts.searchParts')"
          dense
          outlined
          clearable
          @update:model-value="handleSearch"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          v-if="canCreate"
          color="primary"
          :label="$t('parts.createPart')"
          icon="add"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Inventory Summary -->
    <q-card v-if="partsStore.summary" class="q-mb-md">
      <q-card-section class="bg-primary text-white">
        <div class="row q-col-gutter-md">
          <div class="col-3">
            <div class="text-h3">${{ formatNumber(partsStore.summary.totalValue) }}</div>
            <div class="text-caption">{{ $t('parts.totalInventoryValue') }}</div>
          </div>
          <div class="col-3">
            <div class="text-h3">{{ partsStore.summary.totalParts }}</div>
            <div class="text-caption">{{ $t('parts.totalParts') }}</div>
          </div>
          <div class="col-3">
            <div class="text-h3 text-orange">{{ partsStore.summary.lowStockCount }}</div>
            <div class="text-caption">{{ $t('parts.lowStockItems') }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Low Stock Alert -->
    <q-card v-if="partsStore.lowStockCount > 0" class="q-mb-md bg-orange-1">
      <q-card-section>
        <div class="text-h6 text-orange-8">
          <q-icon name="warning" />
          {{ $t('parts.lowStockAlert') }}
        </div>
        <div class="text-caption text-orange-7">
          {{ partsStore.lowStockCount }} {{ $t('parts.itemsNeedReorder') }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="filters.category"
              :options="categoryOptions"
              :label="$t('parts.filterByCategory')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-checkbox
              v-model="filters.lowStock"
              :label="$t('parts.showLowStockOnly')"
              @update:model-value="applyFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Parts Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="partsStore.parts"
          :columns="columns"
          row-key="partId"
          :loading="partsStore.isLoading"
          :pagination="{ rowsPerPage: 20 }"
          flat
        >
          <template #body-cell-partNumber="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.partNumber }}</div>
            </q-td>
          </template>

          <template #body-cell-name="props">
            <q-td :props="props">
              <div>{{ props.row.name }}</div>
              <div v-if="props.row.description" class="text-caption text-grey-7">
                {{ props.row.description }}
              </div>
            </q-td>
          </template>

          <template #body-cell-category="props">
            <q-td :props="props">
              <q-chip dense size="sm" color="blue" text-color="white">
                {{ $t(`parts.categories.${props.row.category}`) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-quantityInStock="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.isLowStock ? 'orange' : 'green'"
                :label="props.row.quantityInStock"
              />
              <div class="text-caption text-grey-7">
                {{ $t('parts.reorder') }}: {{ props.row.reorderLevel }}
              </div>
            </q-td>
          </template>

          <template #body-cell-unitPrice="props">
            <q-td :props="props">
              ${{ formatNumber(props.row.unitPrice) }}
            </q-td>
          </template>

          <template #body-cell-totalValue="props">
            <q-td :props="props">
              <div class="text-weight-bold text-primary">
                ${{ formatNumber(props.row.totalValue) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                round
                icon="visibility"
                color="primary"
                @click="viewPart(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                @click="editPart(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="add_circle"
                color="positive"
                @click="adjustStock(props.row, 'add')"
              />
              <q-btn
                flat
                dense
                round
                icon="remove_circle"
                color="negative"
                @click="adjustStock(props.row, 'remove')"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 600px; max-width: 900px">
        <q-card-section>
          <div class="text-h6">
            {{ isEditMode ? $t('parts.editPart') : $t('parts.createPart') }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 70vh" class="scroll">
          <q-form @submit="handleSubmit" class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="formData.partNumber"
                  :label="$t('parts.partNumber') + ' *'"
                  :rules="[(val) => !!val || $t('validation.required')]"
                  :disable="isEditMode"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="formData.category"
                  :options="categoryOptions"
                  :label="$t('parts.category') + ' *'"
                  :rules="[(val) => !!val || $t('validation.required')]"
                  emit-value
                  map-options
                />
              </div>
            </div>

            <q-input
              v-model="formData.name"
              :label="$t('parts.name') + ' *'"
              :rules="[(val) => !!val || $t('validation.required')]"
            />

            <q-input
              v-model="formData.description"
              :label="$t('parts.description')"
              type="textarea"
              rows="2"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="formData.manufacturer"
                  :label="$t('parts.manufacturer')"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="formData.location"
                  :label="$t('parts.location')"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-4">
                <q-input
                  v-model.number="formData.quantityInStock"
                  :label="$t('parts.quantityInStock') + ' *'"
                  type="number"
                  min="0"
                  :rules="[(val) => val >= 0 || $t('validation.mustBePositive')]"
                />
              </div>
              <div class="col-4">
                <q-input
                  v-model.number="formData.reorderLevel"
                  :label="$t('parts.reorderLevel') + ' *'"
                  type="number"
                  min="0"
                  :rules="[(val) => val >= 0 || $t('validation.mustBePositive')]"
                />
              </div>
              <div class="col-4">
                <q-input
                  v-model.number="formData.unitPrice"
                  :label="$t('parts.unitPrice') + ' *'"
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="$"
                  :rules="[(val) => val > 0 || $t('validation.mustBePositive')]"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="formData.supplier"
                  :label="$t('parts.supplier')"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="formData.supplierPartNumber"
                  :label="$t('parts.supplierPartNumber')"
                />
              </div>
            </div>

            <q-input
              v-model="formData.notes"
              :label="$t('parts.notes')"
              type="textarea"
              rows="2"
            />

            <div class="row q-gutter-sm justify-end">
              <q-btn
                flat
                :label="$t('common.cancel')"
                color="primary"
                @click="closeDialog"
              />
              <q-btn
                type="submit"
                :label="isEditMode ? $t('common.update') : $t('common.create')"
                color="primary"
                :loading="partsStore.isLoading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Adjust Stock Dialog -->
    <q-dialog v-model="showAdjustDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ adjustMode === 'add' ? $t('parts.addStock') : $t('parts.removeStock') }}
          </div>
          <div class="text-caption">{{ selectedPart?.name }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="handleAdjustStock" class="q-gutter-md">
            <q-input
              v-model.number="adjustQuantity"
              :label="$t('parts.quantity')"
              type="number"
              min="1"
              :rules="[(val) => val > 0 || $t('validation.mustBePositive')]"
            />

            <q-input
              v-model="adjustReason"
              :label="$t('parts.reason')"
              type="textarea"
              rows="2"
            />

            <div class="row q-gutter-sm justify-end">
              <q-btn
                flat
                :label="$t('common.cancel')"
                color="primary"
                @click="showAdjustDialog = false"
              />
              <q-btn
                type="submit"
                :label="$t('common.submit')"
                :color="adjustMode === 'add' ? 'positive' : 'negative'"
                :loading="partsStore.isLoading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { usePartsStore } from 'src/stores/partsStore'
import { useAuthStore } from 'src/stores/authStore'

const $q = useQuasar()
const { t } = useI18n()
const partsStore = usePartsStore()
const authStore = useAuthStore()

const showDialog = ref(false)
const showAdjustDialog = ref(false)
const selectedPart = ref(null)
const isEditMode = ref(false)
const searchQuery = ref('')
const adjustMode = ref('add')
const adjustQuantity = ref(1)
const adjustReason = ref('')

const filters = ref({
  category: null,
  lowStock: false,
})

const formData = ref({
  partNumber: '',
  name: '',
  category: '',
  description: '',
  manufacturer: '',
  quantityInStock: 0,
  reorderLevel: 10,
  unitPrice: 0,
  location: '',
  supplier: '',
  supplierPartNumber: '',
  notes: '',
})

const canCreate = computed(() => {
  return authStore.user?.role === 'FLEET_MANAGER'
})

const categoryOptions = [
  { label: t('parts.categories.ENGINE'), value: 'ENGINE' },
  { label: t('parts.categories.TRANSMISSION'), value: 'TRANSMISSION' },
  { label: t('parts.categories.BRAKES'), value: 'BRAKES' },
  { label: t('parts.categories.SUSPENSION'), value: 'SUSPENSION' },
  { label: t('parts.categories.ELECTRICAL'), value: 'ELECTRICAL' },
  { label: t('parts.categories.BODY'), value: 'BODY' },
  { label: t('parts.categories.INTERIOR'), value: 'INTERIOR' },
  { label: t('parts.categories.FILTERS'), value: 'FILTERS' },
  { label: t('parts.categories.FLUIDS'), value: 'FLUIDS' },
  { label: t('parts.categories.TIRES'), value: 'TIRES' },
  { label: t('parts.categories.OTHER'), value: 'OTHER' },
]

const columns = [
  { name: 'partNumber', label: t('parts.partNumber'), field: 'partNumber', align: 'left', sortable: true },
  { name: 'name', label: t('parts.name'), field: 'name', align: 'left', sortable: true },
  { name: 'category', label: t('parts.category'), field: 'category', align: 'left', sortable: true },
  { name: 'quantityInStock', label: t('parts.stock'), field: 'quantityInStock', align: 'center', sortable: true },
  { name: 'unitPrice', label: t('parts.unitPrice'), field: 'unitPrice', align: 'right', sortable: true },
  { name: 'totalValue', label: t('parts.totalValue'), field: 'totalValue', align: 'right', sortable: true },
  { name: 'actions', label: t('common.actions'), field: 'actions', align: 'center' },
]

onMounted(async () => {
  try {
    await Promise.all([
      partsStore.fetchParts(),
      partsStore.fetchSummary(),
    ])
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('parts.errorLoadingParts'),
    })
  }
})

function openCreateDialog() {
  selectedPart.value = null
  isEditMode.value = false
  formData.value = {
    partNumber: '',
    name: '',
    category: '',
    description: '',
    manufacturer: '',
    quantityInStock: 0,
    reorderLevel: 10,
    unitPrice: 0,
    location: '',
    supplier: '',
    supplierPartNumber: '',
    notes: '',
  }
  showDialog.value = true
}

function viewPart(part) {
  selectedPart.value = part
  // Could implement view dialog
}

function editPart(part) {
  selectedPart.value = part
  isEditMode.value = true
  formData.value = { ...part }
  showDialog.value = true
}

function adjustStock(part, mode) {
  selectedPart.value = part
  adjustMode.value = mode
  adjustQuantity.value = 1
  adjustReason.value = ''
  showAdjustDialog.value = true
}

async function handleSubmit() {
  try {
    if (isEditMode.value) {
      await partsStore.updatePart(selectedPart.value.partId, formData.value)
      $q.notify({
        type: 'positive',
        message: t('parts.partUpdated'),
      })
    } else {
      await partsStore.createPart(formData.value)
      $q.notify({
        type: 'positive',
        message: t('parts.partCreated'),
      })
    }
    closeDialog()
    await Promise.all([
      partsStore.fetchParts(),
      partsStore.fetchSummary(),
    ])
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('parts.errorSavingPart'),
    })
  }
}

async function handleAdjustStock() {
  try {
    const quantity = adjustMode.value === 'add' ? adjustQuantity.value : -adjustQuantity.value
    await partsStore.adjustQuantity(selectedPart.value.partId, quantity, adjustReason.value)
    $q.notify({
      type: 'positive',
      message: t('parts.stockAdjusted'),
    })
    showAdjustDialog.value = false
    await Promise.all([
      partsStore.fetchParts(),
      partsStore.fetchSummary(),
    ])
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('parts.errorAdjustingStock'),
    })
  }
}

function closeDialog() {
  showDialog.value = false
  selectedPart.value = null
  isEditMode.value = false
}

async function applyFilters() {
  try {
    const cleanFilters = {}
    if (filters.value.category) {
      cleanFilters.category = filters.value.category
    }
    if (filters.value.lowStock) {
      cleanFilters.lowStock = true
    }
    await partsStore.fetchParts(cleanFilters)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('parts.errorLoadingParts'),
    })
  }
}

async function handleSearch() {
  if (searchQuery.value && searchQuery.value.length >= 2) {
    try {
      await partsStore.searchParts(searchQuery.value)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('parts.errorSearching'),
      })
    }
  } else if (!searchQuery.value) {
    await partsStore.fetchParts()
  }
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0.00'
  return parseFloat(value).toFixed(2)
}
</script>
