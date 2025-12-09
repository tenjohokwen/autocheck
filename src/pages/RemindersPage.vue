<template>
  <q-page padding>
    <div class="q-mb-md row items-center justify-between">
      <div class="text-h4">
        {{ $t('reminder.title') }}
        <q-badge
          v-if="reminderStore.activeCount > 0"
          color="orange"
          :label="reminderStore.activeCount"
        />
      </div>
      <q-btn
        v-if="canCreate"
        color="primary"
        :label="$t('reminder.createReminder')"
        icon="add"
        @click="openCreateDialog"
      />
    </div>

    <!-- Overdue Reminders Alert -->
    <q-card
      v-if="reminderStore.overdueCount > 0"
      class="q-mb-md bg-negative text-white"
    >
      <q-card-section>
        <div class="text-h6">
          <q-icon name="error" />
          {{ $t('reminder.overdueReminders') }}
        </div>
        <div class="text-body2">
          {{
            $t('reminder.overdueRemindersMessage', {
              count: reminderStore.overdueCount,
            })
          }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div
            v-for="reminder in reminderStore.overdueReminders.slice(0, 3)"
            :key="reminder.reminderId"
            class="col-12"
          >
            <q-item
              clickable
              class="bg-white text-dark rounded-borders"
              @click="viewReminder(reminder)"
            >
              <q-item-section avatar>
                <q-icon name="warning" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ reminder.title }}</q-item-label>
                <q-item-label caption class="text-dark">
                  {{ $t('reminder.overdue', { days: Math.abs(reminder.daysUntilDue) }) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  dense
                  round
                  icon="done"
                  color="positive"
                  @click.stop="completeReminder(reminder.reminderId)"
                />
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Active Reminders Section -->
    <q-card v-if="reminderStore.activeReminders.length > 0" class="q-mb-md">
      <q-card-section class="bg-blue-1">
        <div class="text-h6 text-blue-8">
          <q-icon name="notifications_active" />
          {{ $t('reminder.activeReminders') }}
        </div>
        <div class="text-caption text-blue-7">
          {{ $t('reminder.activeRemindersDescription') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="reminder in reminderStore.activeReminders.slice(0, 6)"
            :key="reminder.reminderId"
            class="col-12 col-sm-6 col-md-4"
          >
            <reminder-card
              :reminder="reminder"
              @view="viewReminder"
              @acknowledge="handleAcknowledge"
              @dismiss="handleDismiss"
              @complete="handleComplete"
              @delete="confirmDelete"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- All Reminders -->
    <reminder-list
      :reminders="reminderStore.reminders"
      :loading="reminderStore.isLoading"
      @view="viewReminder"
      @acknowledge="handleAcknowledge"
      @dismiss="handleDismiss"
      @complete="handleComplete"
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
                ? $t('reminder.editReminder')
                : $t('reminder.createReminder')
            }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <reminder-form
            :reminder="selectedReminder"
            :loading="reminderStore.isLoading"
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
          <div class="text-h6">{{ $t('reminder.reminderDetails') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedReminder">
          <div class="q-gutter-sm">
            <div>
              <div class="text-caption text-grey-7">
                {{ $t('reminder.type') }}
              </div>
              <div class="text-body1">
                {{ $t(`reminder.types.${selectedReminder.type}`) }}
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('reminder.title') }}
              </div>
              <div class="text-body1">{{ selectedReminder.title }}</div>
            </div>

            <div v-if="selectedReminder.description">
              <div class="text-caption text-grey-7">
                {{ $t('reminder.description') }}
              </div>
              <div class="text-body1">{{ selectedReminder.description }}</div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('reminder.status') }}
                </div>
                <q-chip
                  :color="getStatusColor(selectedReminder.status)"
                  text-color="white"
                >
                  {{ $t(`reminder.statuses.${selectedReminder.status}`) }}
                </q-chip>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">
                  {{ $t('reminder.priority') }}
                </div>
                <q-chip
                  :color="getPriorityColor(selectedReminder.priority)"
                  text-color="white"
                >
                  {{ $t(`reminder.priorities.${selectedReminder.priority}`) }}
                </q-chip>
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('reminder.dueDate') }}
              </div>
              <div
                class="text-body1"
                :class="{ 'text-negative': selectedReminder.isOverdue }"
              >
                {{ formatDate(selectedReminder.dueDate) }}
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">
                {{ $t('reminder.daysUntilDue') }}
              </div>
              <div
                class="text-body1"
                :class="{
                  'text-negative': selectedReminder.isOverdue,
                  'text-orange':
                    selectedReminder.daysUntilDue <= 3 && !selectedReminder.isOverdue,
                }"
              >
                {{
                  selectedReminder.isOverdue
                    ? $t('reminder.overdue', {
                        days: Math.abs(selectedReminder.daysUntilDue),
                      })
                    : $t('reminder.daysRemaining', {
                        days: selectedReminder.daysUntilDue,
                      })
                }}
              </div>
            </div>

            <div v-if="selectedReminder.acknowledgedAt">
              <div class="text-caption text-grey-7">
                {{ $t('reminder.acknowledgedAt') }}
              </div>
              <div class="text-body1">
                {{ formatDate(selectedReminder.acknowledgedAt) }}
              </div>
            </div>

            <div v-if="selectedReminder.completedAt">
              <div class="text-caption text-grey-7">
                {{ $t('reminder.completedAt') }}
              </div>
              <div class="text-body1">
                {{ formatDate(selectedReminder.completedAt) }}
              </div>
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
            v-if="
              selectedReminder?.status === 'ACTIVE' ||
              selectedReminder?.status === 'ACKNOWLEDGED'
            "
            flat
            :label="$t('reminder.complete')"
            color="positive"
            @click="handleCompleteFromView"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('reminder.confirmDelete') }}</div>
        </q-card-section>

        <q-card-section>
          {{ $t('reminder.confirmDeleteMessage') }}
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
            @click="deleteReminder"
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
import { useReminderStore } from 'src/stores/reminderStore'
import { useAuthStore } from 'src/stores/authStore'
import ReminderList from 'src/components/reminder/ReminderList.vue'
import ReminderForm from 'src/components/reminder/ReminderForm.vue'
import ReminderCard from 'src/components/reminder/ReminderCard.vue'

const $q = useQuasar()
const { t } = useI18n()
const reminderStore = useReminderStore()
const authStore = useAuthStore()

const showDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedReminder = ref(null)
const isEditMode = ref(false)

const canCreate = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

onMounted(async () => {
  try {
    await reminderStore.fetchActiveReminders()
  } catch (error) {
    console.error('Error loading reminders:', error)
    $q.notify({
      type: 'negative',
      message: t('reminder.errorLoadingReminders'),
    })
  }
})

function openCreateDialog() {
  selectedReminder.value = null
  isEditMode.value = false
  showDialog.value = true
}

function viewReminder(reminder) {
  selectedReminder.value = reminder
  showViewDialog.value = true
}

function confirmDelete(reminder) {
  selectedReminder.value = reminder
  showDeleteDialog.value = true
}

async function handleSubmit(data) {
  try {
    if (isEditMode.value) {
      await reminderStore.updateReminder(data.reminderId, data)
      $q.notify({
        type: 'positive',
        message: t('reminder.reminderUpdated'),
      })
    } else {
      await reminderStore.createReminder(data)
      $q.notify({
        type: 'positive',
        message: t('reminder.reminderCreated'),
      })
    }
    closeDialog()
  } catch (error) {
    console.error('Error saving reminder:', error)
    $q.notify({
      type: 'negative',
      message: error.message || t('reminder.errorSavingReminder'),
    })
  }
}

async function handleAcknowledge(reminder) {
  try {
    await reminderStore.acknowledgeReminder(reminder.reminderId)
    $q.notify({
      type: 'positive',
      message: t('reminder.reminderAcknowledged'),
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('reminder.errorAcknowledging'),
    })
  }
}

async function handleDismiss(reminder) {
  try {
    await reminderStore.dismissReminder(reminder.reminderId)
    $q.notify({
      type: 'info',
      message: t('reminder.reminderDismissed'),
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('reminder.errorDismissing'),
    })
  }
}

async function handleComplete(reminder) {
  try {
    await reminderStore.completeReminder(reminder.reminderId)
    $q.notify({
      type: 'positive',
      message: t('reminder.reminderCompleted'),
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('reminder.errorCompleting'),
    })
  }
}

async function handleCompleteFromView() {
  showViewDialog.value = false
  await handleComplete(selectedReminder.value)
}

async function deleteReminder() {
  try {
    await reminderStore.deleteReminder(selectedReminder.value.reminderId)
    $q.notify({
      type: 'positive',
      message: t('reminder.reminderDeleted'),
    })
    showDeleteDialog.value = false
    selectedReminder.value = null
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('reminder.errorDeletingReminder'),
    })
  }
}

function closeDialog() {
  showDialog.value = false
  selectedReminder.value = null
  isEditMode.value = false
}

async function handleFilter(filters) {
  try {
    await reminderStore.fetchReminders(filters)
  } catch (error) {
    console.error('Error applying filters:', error)
    $q.notify({
      type: 'negative',
      message: t('reminder.errorLoadingReminders'),
    })
  }
}

function getStatusColor(status) {
  const colors = {
    ACTIVE: 'blue',
    ACKNOWLEDGED: 'orange',
    COMPLETED: 'green',
    DISMISSED: 'grey',
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
