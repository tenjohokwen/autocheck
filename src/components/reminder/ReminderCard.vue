<template>
  <q-card class="reminder-card" :class="{ 'overdue-card': reminder.isOverdue }">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h6">{{ reminder.title }}</div>
          <div class="text-caption text-grey-7">
            {{ $t(`reminder.types.${reminder.type}`) }}
          </div>
        </div>
        <div class="col-auto">
          <q-chip
            :color="getStatusColor(reminder.status)"
            text-color="white"
            size="sm"
          >
            {{ $t(`reminder.statuses.${reminder.status}`) }}
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('reminder.dueDate') }}
          </div>
          <div class="text-body2" :class="{ 'text-negative': reminder.isOverdue }">
            {{ formatDate(reminder.dueDate) }}
          </div>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('reminder.daysUntilDue') }}
          </div>
          <div
            class="text-body2"
            :class="{
              'text-negative': reminder.isOverdue,
              'text-orange': reminder.daysUntilDue <= 3 && !reminder.isOverdue,
            }"
          >
            <q-icon
              v-if="reminder.isOverdue"
              name="warning"
              color="negative"
              size="sm"
            />
            {{
              reminder.isOverdue
                ? $t('reminder.overdue', { days: Math.abs(reminder.daysUntilDue) })
                : $t('reminder.daysRemaining', { days: reminder.daysUntilDue })
            }}
          </div>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('reminder.priority') }}
          </div>
          <div class="text-body2">
            <q-chip
              :color="getPriorityColor(reminder.priority)"
              text-color="white"
              size="sm"
            >
              {{ $t(`reminder.priorities.${reminder.priority}`) }}
            </q-chip>
          </div>
        </div>

        <div class="col-12 col-sm-6" v-if="reminder.acknowledgedAt">
          <div class="text-caption text-grey-7">
            {{ $t('reminder.acknowledgedAt') }}
          </div>
          <div class="text-body2">
            {{ formatDate(reminder.acknowledgedAt) }}
          </div>
        </div>

        <div class="col-12" v-if="reminder.description">
          <div class="text-caption text-grey-7">
            {{ $t('reminder.description') }}
          </div>
          <div class="text-body2">{{ reminder.description }}</div>
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
        @click="$emit('view', reminder)"
      />
      <q-btn
        v-if="reminder.status === 'ACTIVE' && !reminder.isOverdue"
        flat
        dense
        color="primary"
        :label="$t('reminder.acknowledge')"
        icon="check"
        @click="$emit('acknowledge', reminder)"
      />
      <q-btn
        v-if="reminder.status === 'ACTIVE' || reminder.status === 'ACKNOWLEDGED'"
        flat
        dense
        color="positive"
        :label="$t('reminder.complete')"
        icon="done_all"
        @click="$emit('complete', reminder)"
      />
      <q-btn
        v-if="reminder.status === 'ACTIVE'"
        flat
        dense
        color="grey"
        :label="$t('reminder.dismiss')"
        @click="$emit('dismiss', reminder)"
      />
      <q-btn
        v-if="canDelete"
        flat
        dense
        color="negative"
        :label="$t('common.delete')"
        @click="$emit('delete', reminder)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/authStore'
import { date } from 'quasar'

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  reminder: {
    type: Object,
    required: true,
  },
})

defineEmits(['view', 'acknowledge', 'dismiss', 'complete', 'delete'])

const authStore = useAuthStore()

const canDelete = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

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

<style scoped>
.reminder-card {
  height: 100%;
}

.overdue-card {
  border-left: 4px solid #c10015;
}
</style>
