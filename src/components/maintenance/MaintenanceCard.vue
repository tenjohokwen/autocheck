<template>
  <q-card class="maintenance-card">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h6">{{ task.description }}</div>
          <div class="text-caption text-grey-7">
            {{ $t(`maintenance.taskTypes.${task.taskType}`) }}
          </div>
        </div>
        <div class="col-auto">
          <q-chip
            :color="getStatusColor(task.status)"
            text-color="white"
            size="sm"
          >
            {{ $t(`maintenance.statuses.${task.status}`) }}
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('maintenance.scheduledDate') }}
          </div>
          <div class="text-body2">
            {{ formatDate(task.scheduledDate) }}
          </div>
        </div>

        <div class="col-12 col-sm-6" v-if="task.assignedTechnician">
          <div class="text-caption text-grey-7">
            {{ $t('maintenance.assignedTechnician') }}
          </div>
          <div class="text-body2">{{ task.assignedTechnician }}</div>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('maintenance.priority') }}
          </div>
          <div class="text-body2">
            <q-chip
              :color="getPriorityColor(task.priority)"
              text-color="white"
              size="sm"
            >
              {{ $t(`maintenance.priorities.${task.priority}`) }}
            </q-chip>
          </div>
        </div>

        <div class="col-12 col-sm-6" v-if="task.completedDate">
          <div class="text-caption text-grey-7">
            {{ $t('maintenance.completedDate') }}
          </div>
          <div class="text-body2">
            {{ formatDate(task.completedDate) }}
          </div>
        </div>

        <div class="col-12" v-if="task.notes">
          <div class="text-caption text-grey-7">
            {{ $t('maintenance.notes') }}
          </div>
          <div class="text-body2">{{ task.notes }}</div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn
        flat
        dense
        color="primary"
        :label="$t('common.view')"
        @click="$emit('view', task)"
      />
      <q-btn
        v-if="canEdit"
        flat
        dense
        color="primary"
        :label="$t('common.edit')"
        @click="$emit('edit', task)"
      />
      <q-btn
        v-if="canDelete"
        flat
        dense
        color="negative"
        :label="$t('common.delete')"
        @click="$emit('delete', task)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/authStore'
import { date } from 'quasar'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
})

defineEmits(['view', 'edit', 'delete'])

const authStore = useAuthStore()

const canEdit = computed(() => {
  const isFleetManager = authStore.user?.role === 'ROLE_ADMIN'
  const isTechnician = authStore.user?.role === 'TECHNICIAN'
  const isAssigned = props.task.assignedTechnician === authStore.user?.email

  return isFleetManager || (isTechnician && isAssigned)
})

const canDelete = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

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

<style scoped>
.maintenance-card {
  height: 100%;
}
</style>
