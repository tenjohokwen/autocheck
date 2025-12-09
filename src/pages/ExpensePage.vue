<template>
  <q-page padding>
    <div class="q-mb-md row items-center justify-between">
      <div class="text-h4">{{ $t('expense.title') }}</div>
      <div class="row q-gutter-sm">
        <q-btn
          color="secondary"
          :label="$t('expense.generateReport')"
          icon="description"
          @click="handleGenerateReport"
        />
        <q-btn
          v-if="canCreate"
          color="primary"
          :label="$t('expense.createExpense')"
          icon="add"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Dashboard Section -->
    <expense-dashboard
      :dashboard-data="expenseStore.dashboard"
      :loading="expenseStore.isLoading"
      @filter="handleDashboardFilter"
    />

    <!-- Running Costs by Vehicle -->
    <q-card v-if="expenseStore.runningCosts.length > 0" class="q-mb-md">
      <q-card-section class="bg-blue-1">
        <div class="text-h6 text-blue-8">
          <q-icon name="analytics" />
          {{ $t('expense.runningCostsByVehicle') }}
        </div>
        <div class="text-caption text-blue-7">
          {{ $t('expense.runningCostsDescription') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-table
          :rows="expenseStore.runningCosts"
          :columns="runningCostsColumns"
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

          <template #body-cell-breakdown="props">
            <q-td :props="props">
              <div class="row q-gutter-xs">
                <q-chip
                  v-for="(amount, category) in props.row.byCategory"
                  :key="category"
                  v-show="amount > 0"
                  dense
                  size="sm"
                  :color="getCategoryColor(category)"
                  text-color="white"
                >
                  {{ $t(`expense.categories.${category}`) }}: FCFA {{
                    formatNumber(amount)
                  }}
                </q-chip>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- All Expenses -->
    <expense-list
      :expenses="expenseStore.expenses"
      :loading="expenseStore.isLoading"
      @view="viewExpense"
      @edit="editExpense"
      @delete="confirmDelete"
      @filter="handleListFilter"
    />

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">
            {{
              isEditMode
                ? $t('expense.editExpense')
                : $t('expense.createExpense')
            }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <expense-form
            :expense="selectedExpense"
            :loading="expenseStore.isLoading"
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
          <div class="text-h6">{{ $t('expense.expenseDetails') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedExpense">
          <div class="q-gutter-sm">
            <div>
              <div class="text-caption text-grey-7">
                {{ $t('expense.category') }}
              </div>
              <q-chip
                :color="getCategoryColor(selectedExpense.category)"
                text-color="white"
                :icon="getCategoryIcon(selectedExpense.category)"
              >
                {{ $t(`expense.categories.${selectedExpense.category}`) }}
              </q-chip>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('expense.description') }}
              </div>
              <div class="text-body1">{{ selectedExpense.description }}</div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('expense.amount') }}
                </div>
                <div class="text-h5 text-primary">
                  FCFA {{ formatNumber(selectedExpense.amount) }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('expense.date') }}
                </div>
                <div class="text-body1">
                  {{ formatDate(selectedExpense.expenseDate) }}
                </div>
              </div>
            </div>

            <div v-if="selectedExpense.vendor">
              <div class="text-caption text-grey-7">
                {{ $t('expense.vendor') }}
              </div>
              <div class="text-body1">{{ selectedExpense.vendor }}</div>
            </div>

            <div v-if="selectedExpense.receiptNumber">
              <div class="text-caption text-grey-7">
                {{ $t('expense.receiptNumber') }}
              </div>
              <div class="text-body1">{{ selectedExpense.receiptNumber }}</div>
            </div>

            <div v-if="selectedExpense.notes">
              <div class="text-caption text-grey-7">
                {{ $t('expense.notes') }}
              </div>
              <div class="text-body1">{{ selectedExpense.notes }}</div>
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
            v-if="canCreate"
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
          <div class="text-h6">{{ $t('expense.confirmDelete') }}</div>
        </q-card-section>

        <q-card-section>
          {{ $t('expense.confirmDeleteMessage') }}
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
            @click="deleteExpense"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar, date } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useExpenseStore } from 'src/stores/expenseStore'
import { useAuthStore } from 'src/stores/authStore'
import ExpenseDashboard from 'src/components/expense/ExpenseDashboard.vue'
import ExpenseList from 'src/components/expense/ExpenseList.vue'
import ExpenseForm from 'src/components/expense/ExpenseForm.vue'

const $q = useQuasar()
const { t } = useI18n()
const expenseStore = useExpenseStore()
const authStore = useAuthStore()

const showDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedExpense = ref(null)
const isEditMode = ref(false)

const canCreate = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

const runningCostsColumns = [
  {
    name: 'vehicle',
    label: t('expense.vehicle'),
    field: 'vehicleId',
    align: 'left',
    sortable: true,
  },
  {
    name: 'totalCost',
    label: t('expense.totalCost'),
    field: 'totalCost',
    align: 'right',
    sortable: true,
    sort: (a, b) => b - a,
  },
  {
    name: 'breakdown',
    label: t('expense.categoryBreakdown'),
    field: 'byCategory',
    align: 'left',
  },
]

onMounted(async () => {
  try {
    await Promise.all([
      expenseStore.fetchExpenses(),
      expenseStore.fetchDashboard(),
      expenseStore.fetchRunningCosts(),
    ])
  } catch (error) {
    console.error('Error loading expense data:', error)
    $q.notify({
      type: 'negative',
      message: t('expense.errorLoadingExpenses'),
    })
  }
})

function openCreateDialog() {
  selectedExpense.value = null
  isEditMode.value = false
  showDialog.value = true
}

function viewExpense(expense) {
  selectedExpense.value = expense
  showViewDialog.value = true
}

function editExpense(expense) {
  selectedExpense.value = expense
  isEditMode.value = true
  showDialog.value = true
}

function editFromView() {
  showViewDialog.value = false
  isEditMode.value = true
  showDialog.value = true
}

function confirmDelete(expense) {
  selectedExpense.value = expense
  showDeleteDialog.value = true
}

async function handleSubmit(data) {
  try {
    if (isEditMode.value) {
      await expenseStore.updateExpense(data.expenseId, data)
      $q.notify({
        type: 'positive',
        message: t('expense.expenseUpdated'),
      })
    } else {
      await expenseStore.createExpense(data)
      $q.notify({
        type: 'positive',
        message: t('expense.expenseCreated'),
      })
    }
    closeDialog()
    // Refresh data
    await Promise.all([
      expenseStore.fetchExpenses(),
      expenseStore.fetchDashboard(),
      expenseStore.fetchRunningCosts(),
    ])
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('expense.errorSavingExpense'),
    })
  }
}

async function deleteExpense() {
  try {
    await expenseStore.deleteExpense(selectedExpense.value.expenseId)
    $q.notify({
      type: 'positive',
      message: t('expense.expenseDeleted'),
    })
    showDeleteDialog.value = false
    selectedExpense.value = null
    // Refresh data
    await Promise.all([
      expenseStore.fetchExpenses(),
      expenseStore.fetchDashboard(),
      expenseStore.fetchRunningCosts(),
    ])
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('expense.errorDeletingExpense'),
    })
  }
}

function closeDialog() {
  showDialog.value = false
  selectedExpense.value = null
  isEditMode.value = false
}

async function handleDashboardFilter(filters) {
  try {
    await Promise.all([
      expenseStore.fetchDashboard(filters),
      expenseStore.fetchRunningCosts(filters),
    ])
  } catch (error) {
    console.error('Error applying dashboard filters:', error)
    $q.notify({
      type: 'negative',
      message: t('expense.errorLoadingDashboard'),
    })
  }
}

async function handleListFilter(filters) {
  try {
    await expenseStore.fetchExpenses(filters)
  } catch (error) {
    console.error('Error applying list filters:', error)
    $q.notify({
      type: 'negative',
      message: t('expense.errorLoadingExpenses'),
    })
  }
}

async function handleGenerateReport() {
  try {
    const filters = {}
    const report = await expenseStore.generateReport(filters)
    $q.notify({
      type: 'positive',
      message: t('expense.reportGenerated'),
    })
    // TODO: Display or download the report
    console.log('Generated report:', report)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('expense.errorGeneratingReport'),
    })
  }
}

function getCategoryColor(category) {
  const colors = {
    FUEL: 'orange',
    MAINTENANCE: 'blue',
    INSURANCE: 'purple',
    FINES: 'red',
    TOLLS: 'teal',
    FEES: 'indigo',
    FINANCING: 'pink',
    OTHER: 'grey',
  }
  return colors[category] || 'grey'
}

function getCategoryIcon(category) {
  const icons = {
    FUEL: 'local_gas_station',
    MAINTENANCE: 'build',
    INSURANCE: 'security',
    FINES: 'gavel',
    TOLLS: 'toll',
    FEES: 'payment',
    FINANCING: 'account_balance',
    OTHER: 'receipt',
  }
  return icons[category] || 'receipt'
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0.00'
  return parseFloat(value).toFixed(2)
}

function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD')
}
</script>
