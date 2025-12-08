<template>
  <q-card class="fuel-card">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h6">{{ formatDate(record.date) }}</div>
          <div class="text-caption text-grey-7">
            {{ record.vehicleId }}
          </div>
        </div>
        <div class="col-auto">
          <q-chip color="primary" text-color="white" size="sm">
            {{ record.liters }} L
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('fuel.odometer') }}
          </div>
          <div class="text-body2">{{ formatNumber(record.odometer) }} km</div>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('fuel.cost') }}
          </div>
          <div class="text-body2">${{ formatNumber(record.cost) }}</div>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('fuel.costPerLiter') }}
          </div>
          <div class="text-body2">
            ${{ formatNumber(record.cost / record.liters) }}/L
          </div>
        </div>

        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('fuel.fuelType') }}
          </div>
          <div class="text-body2">
            {{ $t(`fuel.fuelTypes.${record.fuelType}`) }}
          </div>
        </div>

        <div class="col-12" v-if="record.fullTank">
          <q-chip color="green" text-color="white" size="sm" icon="check">
            {{ $t('fuel.fullTank') }}
          </q-chip>
        </div>

        <div class="col-12" v-if="record.notes">
          <div class="text-caption text-grey-7">
            {{ $t('fuel.notes') }}
          </div>
          <div class="text-body2">{{ record.notes }}</div>
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
        @click="$emit('view', record)"
      />
      <q-btn
        flat
        dense
        color="primary"
        :label="$t('common.edit')"
        @click="$emit('edit', record)"
      />
      <q-btn
        v-if="canDelete"
        flat
        dense
        color="negative"
        :label="$t('common.delete')"
        @click="$emit('delete', record)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/authStore'
import { date } from 'quasar'

defineProps({
  record: {
    type: Object,
    required: true,
  },
})

defineEmits(['view', 'edit', 'delete'])

const authStore = useAuthStore()

const canDelete = computed(() => {
  return authStore.user?.role === 'FLEET_MANAGER'
})

function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD')
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return parseFloat(value).toFixed(2)
}
</script>

<style scoped>
.fuel-card {
  height: 100%;
}
</style>
