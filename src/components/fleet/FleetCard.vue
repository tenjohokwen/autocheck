<template>
  <q-card
    class="fleet-card"
    :class="{ 'cursor-pointer': clickable }"
    @click="handleClick"
  >
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <q-icon name="airport_shuttle" size="md" color="primary" class="q-mr-sm" />
        <div class="text-h6">{{ fleet.name }}</div>
      </div>

      <div v-if="fleet.description" class="text-body2 text-grey-7 q-mb-md">
        {{ fleet.description }}
      </div>

      <div class="row items-center q-gutter-sm">
        <q-chip color="primary" text-color="white" icon="directions_car">
          {{ fleet.vehicleCount || 0 }} {{ $t('fleet.vehicles') }}
        </q-chip>
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
        @click.stop="$emit('view', fleet)"
      />
      <q-btn
        v-if="canEdit"
        flat
        dense
        color="primary"
        icon="edit"
        :label="$t('common.edit')"
        @click.stop="$emit('edit', fleet)"
      />
      <q-btn
        v-if="canDelete"
        flat
        dense
        color="negative"
        icon="delete"
        :label="$t('common.delete')"
        @click.stop="$emit('delete', fleet)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
/**
 * FleetCard.vue
 *
 * Displays a single fleet in card format with actions.
 * Includes vehicle count and optional edit/delete actions.
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
  fleet: {
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
const emit = defineEmits(['view', 'edit', 'delete', 'click'])

// Computed
const canEdit = computed(() => {
  return authStore.user?.role === 'FLEET_MANAGER'
})

const canDelete = computed(() => {
  return authStore.user?.role === 'FLEET_MANAGER'
})

// Methods
function handleClick() {
  if (props.clickable) {
    emit('click', props.fleet)
  }
}
</script>

<style scoped>
.fleet-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.fleet-card.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
