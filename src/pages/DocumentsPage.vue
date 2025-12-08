<template>
  <q-page padding>
    <div class="q-mb-md row items-center justify-between">
      <div class="text-h4">{{ $t('documents.title') }}</div>
      <div class="row q-gutter-sm">
        <q-input
          v-model="searchQuery"
          :placeholder="$t('documents.searchDocuments')"
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
          color="primary"
          :label="$t('documents.uploadDocument')"
          icon="upload"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Expired Documents Alert -->
    <q-card v-if="documentStore.expiredCount > 0" class="q-mb-md bg-red-1">
      <q-card-section>
        <div class="text-h6 text-red-8">
          <q-icon name="error" />
          {{ $t('documents.expiredDocuments') }}
        </div>
        <div class="text-caption text-red-7">
          {{ documentStore.expiredCount }} {{ $t('documents.documentsExpired') }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Expiring Soon Alert -->
    <q-card v-if="documentStore.expiringCount > 0" class="q-mb-md bg-orange-1">
      <q-card-section>
        <div class="text-h6 text-orange-8">
          <q-icon name="warning" />
          {{ $t('documents.expiringDocuments') }}
        </div>
        <div class="text-caption text-orange-7">
          {{ documentStore.expiringCount }} {{ $t('documents.documentsExpiringSoon') }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.vehicleId"
              :options="vehicleOptions"
              :label="$t('documents.filterByVehicle')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.documentType"
              :options="documentTypeOptions"
              :label="$t('documents.filterByType')"
              emit-value
              map-options
              clearable
              @update:model-value="applyFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Documents Grid -->
    <div v-if="documentStore.isLoading" class="row justify-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
    </div>

    <q-card v-else-if="documentStore.documents.length === 0" class="text-center q-pa-lg">
      <q-icon name="description" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">
        {{ $t('documents.noDocuments') }}
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        {{ $t('documents.noDocumentsDescription') }}
      </div>
    </q-card>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="doc in documentStore.documents"
        :key="doc.documentId"
        class="col-12 col-sm-6 col-md-4"
      >
        <!-- Inline Document Card -->
        <q-card class="document-card" @click="viewDocument(doc)">
          <q-card-section class="row items-center q-pb-none">
            <div class="col">
              <div class="text-overline text-grey-7">
                {{ $t(`documents.types.${doc.documentType}`) }}
              </div>
              <div class="text-h6">{{ doc.title }}</div>
            </div>
            <div class="col-auto">
              <q-icon :name="getDocumentIcon(doc.documentType)" size="md" color="primary" />
            </div>
          </q-card-section>

          <q-card-section>
            <div v-if="doc.description" class="text-body2 text-grey-8 q-mb-sm">
              {{ doc.description }}
            </div>

            <div v-if="doc.expiryDate" class="q-mt-sm">
              <div class="text-caption text-grey-7">{{ $t('documents.expiryDate') }}</div>
              <div :class="{
                'text-red': doc.isExpired,
                'text-orange': doc.isExpiringSoon && !doc.isExpired,
              }">
                {{ formatDate(doc.expiryDate) }}
                <q-badge
                  v-if="doc.isExpired"
                  color="red"
                  :label="$t('documents.expired')"
                />
                <q-badge
                  v-else-if="doc.isExpiringSoon"
                  color="orange"
                  :label="$t('documents.expiringSoon')"
                />
              </div>
            </div>

            <div v-if="doc.documentNumber" class="q-mt-sm">
              <div class="text-caption text-grey-7">{{ $t('documents.documentNumber') }}</div>
              <div class="text-body2">{{ doc.documentNumber }}</div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              flat
              dense
              :label="$t('common.view')"
              color="primary"
              icon="visibility"
              @click.stop="viewDocument(doc)"
            />
            <q-btn
              flat
              dense
              :label="$t('common.edit')"
              color="primary"
              icon="edit"
              @click.stop="editDocument(doc)"
            />
            <q-btn
              flat
              dense
              :label="$t('common.delete')"
              color="negative"
              icon="delete"
              @click.stop="confirmDelete(doc)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 600px; max-width: 900px">
        <q-card-section>
          <div class="text-h6">
            {{ isEditMode ? $t('documents.editDocument') : $t('documents.uploadDocument') }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 70vh" class="scroll">
          <q-form @submit="handleSubmit" class="q-gutter-md">
            <q-select
              v-model="formData.vehicleId"
              :options="vehicleOptions"
              :label="$t('documents.vehicle') + ' *'"
              :rules="[(val) => !!val || $t('validation.required')]"
              emit-value
              map-options
              :disable="isEditMode"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-select
                  v-model="formData.documentType"
                  :options="documentTypeOptions"
                  :label="$t('documents.documentType') + ' *'"
                  :rules="[(val) => !!val || $t('validation.required')]"
                  emit-value
                  map-options
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="formData.title"
                  :label="$t('documents.title') + ' *'"
                  :rules="[(val) => !!val || $t('validation.required')]"
                />
              </div>
            </div>

            <q-input
              v-model="formData.description"
              :label="$t('documents.description')"
              type="textarea"
              rows="2"
            />

            <q-input
              v-model="formData.documentUrl"
              :label="$t('documents.documentUrl') + ' *'"
              :rules="[(val) => !!val || $t('validation.required')]"
              :hint="$t('documents.documentUrlHint')"
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="formData.issueDate"
                  :label="$t('documents.issueDate')"
                  type="date"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="formData.expiryDate"
                  :label="$t('documents.expiryDate')"
                  type="date"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="formData.documentNumber"
                  :label="$t('documents.documentNumber')"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="formData.issuedBy"
                  :label="$t('documents.issuedBy')"
                />
              </div>
            </div>

            <q-input
              v-model="formData.tags"
              :label="$t('documents.tags')"
              :hint="$t('documents.tagsHint')"
            />

            <q-input
              v-model="formData.notes"
              :label="$t('documents.notes')"
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
                :loading="documentStore.isLoading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- View Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 600px; max-width: 900px">
        <q-card-section>
          <div class="text-h6">{{ selectedDocument?.title }}</div>
          <div class="text-caption text-grey-7">
            {{ $t(`documents.types.${selectedDocument?.documentType}`) }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedDocument" style="max-height: 70vh" class="scroll">
          <div class="q-gutter-sm">
            <div v-if="selectedDocument.description">
              <div class="text-caption text-grey-7">{{ $t('documents.description') }}</div>
              <div class="text-body1">{{ selectedDocument.description }}</div>
            </div>

            <div>
              <div class="text-caption text-grey-7">{{ $t('documents.documentUrl') }}</div>
              <q-btn
                flat
                dense
                color="primary"
                :label="$t('documents.openDocument')"
                icon="open_in_new"
                :href="selectedDocument.documentUrl"
                target="_blank"
              />
            </div>

            <div class="row q-col-gutter-sm">
              <div v-if="selectedDocument.issueDate" class="col-6">
                <div class="text-caption text-grey-7">{{ $t('documents.issueDate') }}</div>
                <div class="text-body1">{{ formatDate(selectedDocument.issueDate) }}</div>
              </div>
              <div v-if="selectedDocument.expiryDate" class="col-6">
                <div class="text-caption text-grey-7">{{ $t('documents.expiryDate') }}</div>
                <div class="text-body1" :class="{
                  'text-red': selectedDocument.isExpired,
                  'text-orange': selectedDocument.isExpiringSoon && !selectedDocument.isExpired,
                }">
                  {{ formatDate(selectedDocument.expiryDate) }}
                </div>
              </div>
            </div>

            <div v-if="selectedDocument.documentNumber">
              <div class="text-caption text-grey-7">{{ $t('documents.documentNumber') }}</div>
              <div class="text-body1">{{ selectedDocument.documentNumber }}</div>
            </div>

            <div v-if="selectedDocument.issuedBy">
              <div class="text-caption text-grey-7">{{ $t('documents.issuedBy') }}</div>
              <div class="text-body1">{{ selectedDocument.issuedBy }}</div>
            </div>

            <div v-if="selectedDocument.tags">
              <div class="text-caption text-grey-7">{{ $t('documents.tags') }}</div>
              <div class="text-body1">{{ selectedDocument.tags }}</div>
            </div>

            <div v-if="selectedDocument.notes">
              <div class="text-caption text-grey-7">{{ $t('documents.notes') }}</div>
              <div class="text-body1">{{ selectedDocument.notes }}</div>
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
          <div class="text-h6">{{ $t('documents.confirmDelete') }}</div>
        </q-card-section>

        <q-card-section>
          {{ $t('documents.confirmDeleteMessage') }}
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
            @click="deleteDocument"
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
import { useDocumentStore } from 'src/stores/documentStore'
import { useVehicleStore } from 'src/stores/vehicleStore'

const $q = useQuasar()
const { t } = useI18n()
const documentStore = useDocumentStore()
const vehicleStore = useVehicleStore()

const showDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedDocument = ref(null)
const isEditMode = ref(false)
const searchQuery = ref('')

const filters = ref({
  vehicleId: null,
  documentType: null,
})

const formData = ref({
  vehicleId: '',
  documentType: '',
  title: '',
  description: '',
  documentUrl: '',
  issueDate: '',
  expiryDate: '',
  documentNumber: '',
  issuedBy: '',
  tags: '',
  notes: '',
})

const vehicleOptions = ref([])

const documentTypeOptions = [
  { label: t('documents.types.REGISTRATION'), value: 'REGISTRATION' },
  { label: t('documents.types.INSURANCE'), value: 'INSURANCE' },
  { label: t('documents.types.INSPECTION'), value: 'INSPECTION' },
  { label: t('documents.types.MAINTENANCE'), value: 'MAINTENANCE' },
  { label: t('documents.types.REPAIR'), value: 'REPAIR' },
  { label: t('documents.types.MANUAL'), value: 'MANUAL' },
  { label: t('documents.types.WARRANTY'), value: 'WARRANTY' },
  { label: t('documents.types.INVOICE'), value: 'INVOICE' },
  { label: t('documents.types.PHOTO'), value: 'PHOTO' },
  { label: t('documents.types.OTHER'), value: 'OTHER' },
]

onMounted(async () => {
  try {
    await vehicleStore.fetchVehicles()
    vehicleOptions.value = vehicleStore.vehicles.map((v) => ({
      label: `${v.make} ${v.model} (${v.licensePlate})`,
      value: v.vehicleId,
    }))

    await documentStore.fetchDocuments()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('documents.errorLoadingDocuments'),
    })
  }
})

function openCreateDialog() {
  selectedDocument.value = null
  isEditMode.value = false
  formData.value = {
    vehicleId: '',
    documentType: '',
    title: '',
    description: '',
    documentUrl: '',
    issueDate: '',
    expiryDate: '',
    documentNumber: '',
    issuedBy: '',
    tags: '',
    notes: '',
  }
  showDialog.value = true
}

function viewDocument(doc) {
  selectedDocument.value = doc
  showViewDialog.value = true
}

function editDocument(doc) {
  selectedDocument.value = doc
  isEditMode.value = true
  formData.value = { ...doc }
  showDialog.value = true
}

function editFromView() {
  showViewDialog.value = false
  isEditMode.value = true
  formData.value = { ...selectedDocument.value }
  showDialog.value = true
}

function confirmDelete(doc) {
  selectedDocument.value = doc
  showDeleteDialog.value = true
}

async function handleSubmit() {
  try {
    if (isEditMode.value) {
      await documentStore.updateDocument(selectedDocument.value.documentId, formData.value)
      $q.notify({
        type: 'positive',
        message: t('documents.documentUpdated'),
      })
    } else {
      await documentStore.createDocument(formData.value)
      $q.notify({
        type: 'positive',
        message: t('documents.documentCreated'),
      })
    }
    closeDialog()
    await documentStore.fetchDocuments()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('documents.errorSavingDocument'),
    })
  }
}

async function deleteDocument() {
  try {
    await documentStore.deleteDocument(selectedDocument.value.documentId)
    $q.notify({
      type: 'positive',
      message: t('documents.documentDeleted'),
    })
    showDeleteDialog.value = false
    selectedDocument.value = null
    await documentStore.fetchDocuments()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('documents.errorDeletingDocument'),
    })
  }
}

function closeDialog() {
  showDialog.value = false
  selectedDocument.value = null
  isEditMode.value = false
}

async function applyFilters() {
  try {
    const cleanFilters = {}
    if (filters.value.vehicleId) {
      cleanFilters.vehicleId = filters.value.vehicleId
    }
    if (filters.value.documentType) {
      cleanFilters.documentType = filters.value.documentType
    }
    await documentStore.fetchDocuments(cleanFilters)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('documents.errorLoadingDocuments'),
    })
  }
}

async function handleSearch() {
  if (searchQuery.value && searchQuery.value.length >= 2) {
    try {
      await documentStore.searchDocuments(searchQuery.value)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('documents.errorSearching'),
      })
    }
  } else if (!searchQuery.value) {
    await documentStore.fetchDocuments()
  }
}

function getDocumentIcon(type) {
  const icons = {
    REGISTRATION: 'article',
    INSURANCE: 'security',
    INSPECTION: 'fact_check',
    MAINTENANCE: 'build',
    REPAIR: 'handyman',
    MANUAL: 'menu_book',
    WARRANTY: 'verified',
    INVOICE: 'receipt',
    PHOTO: 'photo',
    OTHER: 'description',
  }
  return icons[type] || 'description'
}

function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD')
}
</script>

<style scoped>
.document-card {
  cursor: pointer;
  transition: all 0.3s;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
