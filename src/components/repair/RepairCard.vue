<template>
  <q-card class="repair-card" @click="$emit('view', repair)">
    <q-card-section class="row items-center q-pb-none">
      <div class="col">
        <div class="text-overline text-grey-7">
          {{ formatDate(repair.repairDate) }}
        </div>
        <div class="text-h6">{{ repair.description }}</div>
      </div>
      <div class="col-auto">
        <q-chip
          :color="getStatusColor(repair.status)"
          text-color="white"
          :icon="getStatusIcon(repair.status)"
        >
          {{ $t(`repair.statuses.${repair.status}`) }}
        </q-chip>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <div class="text-caption text-grey-7">{{ $t('repair.severity') }}</div>
          <q-chip
            :color="getSeverityColor(repair.severity)"
            text-color="white"
            size="sm"
          >
            {{ $t(`repair.severities.${repair.severity}`) }}
          </q-chip>
        </div>
        <div v-if="repair.cost" class="col-6">
          <div class="text-caption text-grey-7">{{ $t('repair.cost') }}</div>
          <div class="text-h6 text-primary">${{ formatNumber(repair.cost) }}</div>
        </div>
      </div>

      <div v-if="repair.odometerReading" class="q-mt-sm">
        <div class="text-caption text-grey-7">{{ $t('repair.odometerReading') }}</div>
        <div class="text-body2">{{ formatNumber(repair.odometerReading) }} km</div>
      </div>

      <div v-if="repair.repairShop" class="q-mt-sm">
        <div class="text-caption text-grey-7">{{ $t('repair.repairShop') }}</div>
        <div class="text-body2">{{ repair.repairShop }}</div>
      </div>

      <div v-if="repair.hasWarranty" class="q-mt-sm">
        <q-badge color="green" :label="$t('repair.underWarranty')" />
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
        @click.stop="$emit('view', repair)"
      />
      <q-btn
        flat
        dense
        :label="$t('common.edit')"
        color="primary"
        icon="edit"
        @click.stop="$emit('edit', repair)"
      />
      <q-btn
        flat
        dense
        :label="$t('common.delete')"
        color="negative"
        icon="delete"
        @click.stop="$emit('delete', repair)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { date } from 'quasar'

defineProps({
  repair: {
    type: Object,
    required: true,
  },
})

defineEmits(['view', 'edit', 'delete'])

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

<style scoped>
.repair-card {
  cursor: pointer;
  transition: all 0.3s;
}

.repair-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
