<template>
  <div class="vehicle-list">
    <!-- Filter toggle -->
    <div v-if="!loading && vehicles.length > 0" class="row items-center justify-between q-mb-md">
      <div class="text-h6">
        {{ $t('vehicle.title') }}
      </div>
      <q-toggle
        v-model="showArchived"
        :label="$t('vehicle.showArchived')"
        color="primary"
        @update:model-value="$emit('toggle-archived', $event)"
      />
    </div>

    <!-- Empty state -->
    <div v-if="!loading && vehicles.length === 0" class="text-center q-pa-xl">
      <q-icon name="directions_car" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">{{ $t('vehicle.empty.title') }}</div>
      <div class="text-body2 text-grey-6 q-mb-md">{{ $t('vehicle.empty.subtitle') }}</div>
      <q-btn
        v-if="canCreate"
        color="primary"
        icon="add"
        :label="$t('vehicle.create')"
        @click="$emit('create')"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- Vehicles grid -->
    <div v-if="!loading && vehicles.length > 0" class="row q-col-gutter-md">
      <div
        v-for="vehicle in vehicles"
        :key="vehicle.vehicleId"
        class="col-12 col-sm-6 col-md-4"
      >
        <VehicleCard
          :vehicle="vehicle"
          :show-actions="true"
          :clickable="true"
          @view="$emit('view', $event)"
          @edit="$emit('edit', $event)"
          @archive="$emit('archive', $event)"
          @click="$emit('click', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * VehicleList.vue
 *
 * Displays a list of vehicles in a responsive grid.
 * Shows empty state when no vehicles exist.
 * Includes toggle for showing archived vehicles.
 *
 * Per constitution: Vue 3 Composition API with <script setup>
 */

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'src/stores/authStore'
import VehicleCard from './VehicleCard.vue'

const { t: $t } = useI18n()
const authStore = useAuthStore()

// Component props
defineProps({
  vehicles: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Component emits
defineEmits(['create', 'view', 'edit', 'archive', 'click', 'toggle-archived'])

// State
const showArchived = ref(false)

// Computed
const canCreate = computed(() => {
  return authStore.user?.role === 'ROLE_ADMIN'
})
</script>

<style scoped>
.vehicle-list {
  min-height: 200px;
}
</style>
