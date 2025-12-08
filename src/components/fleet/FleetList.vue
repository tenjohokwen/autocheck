<template>
  <div class="fleet-list">
    <!-- Empty state -->
    <div v-if="!loading && fleets.length === 0" class="text-center q-pa-xl">
      <q-icon name="airport_shuttle" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">{{ $t('fleet.empty.title') }}</div>
      <div class="text-body2 text-grey-6 q-mb-md">{{ $t('fleet.empty.subtitle') }}</div>
      <q-btn
        v-if="canCreate"
        color="primary"
        icon="add"
        :label="$t('fleet.create')"
        @click="$emit('create')"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- Fleets grid -->
    <div v-if="!loading && fleets.length > 0" class="row q-col-gutter-md">
      <div
        v-for="fleet in fleets"
        :key="fleet.fleetId"
        class="col-12 col-sm-6 col-md-4"
      >
        <FleetCard
          :fleet="fleet"
          :show-actions="true"
          :clickable="true"
          @view="$emit('view', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @click="$emit('click', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * FleetList.vue
 *
 * Displays a list of fleets in a responsive grid.
 * Shows empty state when no fleets exist.
 *
 * Per constitution: Vue 3 Composition API with <script setup>
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'src/stores/authStore'
import FleetCard from './FleetCard.vue'

const { t: $t } = useI18n()
const authStore = useAuthStore()

// Component props
defineProps({
  fleets: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Component emits
defineEmits(['create', 'view', 'edit', 'delete', 'click'])

// Computed
const canCreate = computed(() => {
  return authStore.user?.role === 'FLEET_MANAGER'
})
</script>

<style scoped>
.fleet-list {
  min-height: 200px;
}
</style>
