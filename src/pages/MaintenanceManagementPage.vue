<template>
  <q-page padding>
    <div class="q-mb-md row items-center justify-between">
      <div class="text-h4">{{ $t('maintenance.title') }}</div>
      <q-btn
        v-if="canCreate"
        color="primary"
        :label="$t('maintenance.createTask')"
        icon="add"
        @click="openCreateDialog"
      />
    </div>

    <!-- Upcoming Tasks Section -->
    <q-card v-if="maintenanceStore.upcomingTasks.length > 0" class="q-mb-md">
      <q-card-section class="bg-orange-1">
        <div class="text-h6 text-orange-8">
          <q-icon name="warning" />
          {{ $t('maintenance.upcomingTasks') }}
        </div>
        <div class="text-caption text-orange-7">
          {{ $t('maintenance.upcomingTasksDescription') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div
            v-for="task in maintenanceStore.upcomingTasks.slice(0, 3)"
            :key="task.taskId"
            class="col-12"
          >
            <q-item clickable @click="viewTask(task)">
              <q-item-section avatar>
                <q-icon name="event" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ task.description }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(task.scheduledDate) }} -
                  {{ $t(`maintenance.priorities.${task.priority?.toUpperCase()}`) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Task List -->
    <maintenance-list
      :tasks="maintenanceStore.tasks"
      :loading="maintenanceStore.isLoading"
      @view="viewTask"
      @edit="editTask"
      @delete="confirmDelete"
      @filter="handleFilter"
    />

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">
            {{
              isEditMode
                ? $t('maintenance.editTask')
                : $t('maintenance.createTask')
            }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <maintenance-form
            :task="selectedTask"
            :loading="maintenanceStore.isLoading"
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
          <div class="text-h6">{{ $t('maintenance.taskDetails') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedTask">
          <div class="q-gutter-sm">
            <div>
              <div class="text-caption text-grey-7">
                {{ $t('maintenance.taskType') }}
              </div>
              <div class="text-body1">
                {{ $t(`maintenance.taskTypes.${(selectedTask.taskType || 'UNDEFINED')?.toUpperCase()}`) }}
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('maintenance.description') }}
              </div>
              <div class="text-body1">{{ selectedTask.description }}</div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('maintenance.status') }}
                </div>
                <q-chip
                  :color="getStatusColor(selectedTask.status)"
                  text-color="white"
                >
                  {{ $t(`maintenance.statuses.${selectedTask.status?.toUpperCase()}`) }}
                </q-chip>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('maintenance.priority') }}
                </div>
                <q-chip
                  :color="getPriorityColor(selectedTask.priority)"
                  text-color="white"
                >
                  {{ $t(`maintenance.priorities.${selectedTask.priority?.toUpperCase()}`) }}
                </q-chip>
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('maintenance.scheduledDate') }}
              </div>
              <div class="text-body1">
                {{ formatDate(selectedTask.scheduledDate) }}
              </div>
            </div>

            <div v-if="selectedTask.assignedTechnician">
              <div class="text-caption text-grey-7">
                {{ $t('maintenance.assignedTechnician') }}
              </div>
              <div class="text-body1">{{ selectedTask.assignedTechnician }}</div>
            </div>

            <div v-if="selectedTask.completedDate">
              <div class="text-caption text-grey-7">
                {{ $t('maintenance.completedDate') }}
              </div>
              <div class="text-body1">
                {{ formatDate(selectedTask.completedDate) }}
              </div>
            </div>

            <div v-if="selectedTask.laborHours">
              <div class="text-caption text-grey-7">
                {{ $t('maintenance.laborHours') }}
              </div>
              <div class="text-body1">{{ selectedTask.laborHours }}</div>
            </div>

            <div v-if="selectedTask.notes">
              <div class="text-caption text-grey-7">
                {{ $t('maintenance.notes') }}
              </div>
              <div class="text-body1">{{ selectedTask.notes }}</div>
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
            v-if="canEdit(selectedTask)"
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
          <div class="text-h6">{{ $t('maintenance.confirmDelete') }}</div>
        </q-card-section>

        <q-card-section>
          {{ $t('maintenance.confirmDeleteMessage') }}
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
            @click="deleteTask"
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
import { useMaintenanceStore } from 'src/stores/maintenanceStore'
import { useAuthStore } from 'src/stores/authStore'
import MaintenanceList from 'src/components/maintenance/MaintenanceList.vue'
import MaintenanceForm from 'src/components/maintenance/MaintenanceForm.vue'

const $q = useQuasar()
const { t } = useI18n()
const maintenanceStore = useMaintenanceStore()
const authStore = useAuthStore()

const showDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedTask = ref(null)
const isEditMode = ref(false)

const canCreate = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

onMounted(async () => {
  try {
    await maintenanceStore.fetchTasks()
  } catch (error) {
    console.error('Error loading maintenance tasks:', error)
    $q.notify({
      type: 'negative',
      message: t('maintenance.errorLoadingTasks'),
    })
  }
})

function openCreateDialog() {
  selectedTask.value = null
  isEditMode.value = false
  showDialog.value = true
}

function viewTask(task) {
  selectedTask.value = task
  showViewDialog.value = true
}

function editTask(task) {
  selectedTask.value = task
  isEditMode.value = true
  showDialog.value = true
}

function editFromView() {
  showViewDialog.value = false
  isEditMode.value = true
  showDialog.value = true
}

function confirmDelete(task) {
  selectedTask.value = task
  showDeleteDialog.value = true
}

async function handleSubmit(data) {
  try {
    if (isEditMode.value) {
      await maintenanceStore.updateTask(data.taskId, data)
      $q.notify({
        type: 'positive',
        message: t('maintenance.taskUpdated'),
      })
    } else {
      await maintenanceStore.createTask(data)
      $q.notify({
        type: 'positive',
        message: t('maintenance.taskCreated'),
      })
    }
    closeDialog()
  } catch (error) {
    console.error('Error saving maintenance task:', error)
    $q.notify({
      type: 'negative',
      message: error.message || t('maintenance.errorSavingTask'),
    })
  }
}

async function deleteTask() {
  try {
    await maintenanceStore.deleteTask(selectedTask.value.taskId)
    $q.notify({
      type: 'positive',
      message: t('maintenance.taskDeleted'),
    })
    showDeleteDialog.value = false
    selectedTask.value = null
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('maintenance.errorDeletingTask'),
    })
  }
}

function closeDialog() {
  showDialog.value = false
  selectedTask.value = null
  isEditMode.value = false
}

async function handleFilter(filters) {
  try {
    await maintenanceStore.fetchTasks(filters)
  } catch (error) {
    console.error('Error applying filters:', error)
    $q.notify({
      type: 'negative',
      message: t('maintenance.errorLoadingTasks'),
    })
  }
}

function canEdit(task) {
  if (!task) return false
  const isFleetManager = authStore.user?.role === 'ROLE_ADMIN'
  const isTechnician = authStore.user?.role === 'TECHNICIAN'
  const isAssigned = task.assignedTechnician === authStore.user?.email

  return isFleetManager || (isTechnician && isAssigned)
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

function getPriorityColor(priority) {
  const colors = {
    LOW: 'blue-grey',
    MEDIUM: 'orange',
    HIGH: 'red',
  }
  return colors[priority] || 'grey'
}

function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD')
}
</script>
