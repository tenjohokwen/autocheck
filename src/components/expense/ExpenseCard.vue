<template>
  <q-card class="expense-card">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h6">${{ formatNumber(expense.amount) }}</div>
          <div class="text-caption text-grey-7">
            {{ expense.description }}
          </div>
        </div>
        <div class="col-auto">
          <q-chip
            :color="getCategoryColor(expense.category)"
            text-color="white"
            :icon="getCategoryIcon(expense.category)"
            size="sm"
          >
            {{ $t(`expense.categories.${expense.category}`) }}
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7">
            {{ $t('expense.date') }}
          </div>
          <div class="text-body2">
            {{ formatDate(expense.expenseDate) }}
          </div>
        </div>

        <div class="col-12 col-sm-6" v-if="expense.vendor">
          <div class="text-caption text-grey-7">
            {{ $t('expense.vendor') }}
          </div>
          <div class="text-body2">{{ expense.vendor }}</div>
        </div>

        <div class="col-12 col-sm-6" v-if="expense.receiptNumber">
          <div class="text-caption text-grey-7">
            {{ $t('expense.receiptNumber') }}
          </div>
          <div class="text-body2">{{ expense.receiptNumber }}</div>
        </div>

        <div class="col-12" v-if="expense.notes">
          <div class="text-caption text-grey-7">
            {{ $t('expense.notes') }}
          </div>
          <div class="text-body2">{{ expense.notes }}</div>
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
        @click="$emit('view', expense)"
      />
      <q-btn
        flat
        dense
        color="primary"
        :label="$t('common.edit')"
        @click="$emit('edit', expense)"
      />
      <q-btn
        flat
        dense
        color="negative"
        :label="$t('common.delete')"
        @click="$emit('delete', expense)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { date } from 'quasar'

defineProps({
  expense: {
    type: Object,
    required: true,
  },
})

defineEmits(['view', 'edit', 'delete'])

function formatNumber(value) {
  if (value === null || value === undefined) return '0.00'
  return parseFloat(value).toFixed(2)
}

function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD')
}

function getCategoryIcon(category) {
  const icons = {
    FUEL: 'local_gas_station',
    MAINTENANCE: 'build',
    INSURANCE: 'shield',
    FINES: 'gavel',
    TOLLS: 'toll',
    FEES: 'receipt',
    FINANCING: 'account_balance',
    OTHER: 'more_horiz',
  }
  return icons[category] || 'attach_money'
}

function getCategoryColor(category) {
  const colors = {
    FUEL: 'blue',
    MAINTENANCE: 'orange',
    INSURANCE: 'purple',
    FINES: 'red',
    TOLLS: 'teal',
    FEES: 'brown',
    FINANCING: 'indigo',
    OTHER: 'grey',
  }
  return colors[category] || 'grey'
}
</script>

<style scoped>
.expense-card {
  height: 100%;
}
</style>
