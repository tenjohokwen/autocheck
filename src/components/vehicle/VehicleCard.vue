<template>
  <q-card
    class="vehicle-card"
    :class="{ 'cursor-pointer': clickable, 'archived': vehicle.archived }"
    @click="handleClick"
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center">
          <q-icon name="directions_car" size="md" color="primary" class="q-mr-sm" />
          <div class="text-h6">{{ vehicle.make }} {{ vehicle.model }}</div>
        </div>
        <q-badge v-if="vehicle.archived" color="grey-6" :label="$t('vehicle.archived')" />
      </div>

      <div class="text-subtitle2 text-grey-7 q-mb-sm">
        {{ vehicle.licensePlate }}
      </div>

      <div class="row items-center q-gutter-sm q-mb-sm">
        <q-chip size="sm" color="blue-grey-3" text-color="dark">
          {{ vehicle.year }}
        </q-chip>
        <q-chip size="sm" color="blue-grey-3" text-color="dark" icon="event_seat">
          {{ vehicle.seats }} {{ $t('vehicle.seats') }}
        </q-chip>
        <q-chip size="sm" color="blue-grey-3" text-color="dark">
          {{ vehicle.vehicleType }}
        </q-chip>
      </div>

      <div v-if="vehicle.currentOdometer" class="text-caption text-grey-6">
        {{ $t('vehicle.odometer') }}: {{ formatOdometer(vehicle.currentOdometer) }} km
      </div>

      <div v-if="vehicle.archived && vehicle.archivedDate" class="text-caption text-negative q-mt-sm">
        {{ $t('vehicle.archivedOn') }}: {{ formatDate(vehicle.archivedDate) }}
      </div>
    </q-card-section>

    <q-separator v-if="showActions" />

    <q-card-actions v-if="showActions" align="right">
      <q-btn
        flat
        dense
        color="primary"
        icon="visibility"
        :label="$t('common.view')"
        @click.stop="$emit('view', vehicle)"
      />
      <q-btn
        v-if="canEdit && !vehicle.archived"
        flat
        dense
        color="primary"
        icon="edit"
        :label="$t('common.edit')"
        @click.stop="$emit('edit', vehicle)"
      />
      <q-btn
        v-if="canArchive && !vehicle.archived"
        flat
        dense
        color="warning"
        icon="archive"
        :label="$t('common.archive')"
        @click.stop="$emit('archive', vehicle)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
/**
 * VehicleCard.vue
 *
 * Displays a single vehicle in card format with actions.
 * Shows vehicle details and archive status.
 *
 * Per constitution: Vue 3 Composition API with <script setup>
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'src/stores/authStore'

const { t: $t } = useI18n()
const authStore = useAuthStore()

// Component props
const props = defineProps({
  vehicle: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

// Component emits
const emit = defineEmits(['view', 'edit', 'archive', 'click'])

// Computed
const canEdit = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

const canArchive = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})

// Methods
function handleClick() {
  if (props.clickable) {
    emit('click', props.vehicle)
  }
}

function formatOdometer(value) {
  return new Intl.NumberFormat().format(value)
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>

<style scoped>
.vehicle-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.vehicle-card.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.vehicle-card.archived {
  opacity: 0.7;
}
</style>
