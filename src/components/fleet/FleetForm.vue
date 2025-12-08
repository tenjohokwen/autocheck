<template>
  <q-form
    @submit.prevent="handleSubmit"
    class="fleet-form"
  >
    <!-- Fleet name -->
    <q-input
      v-model="formData.name"
      :label="$t('fleet.form.name')"
      outlined
      :rules="[
        val => !!val || $t('validation.required', { field: $t('fleet.form.name') }),
        val => val.length >= 2 || $t('validation.minLength', { field: $t('fleet.form.name'), length: 2 })
      ]"
      lazy-rules
      class="q-mb-md"
    >
      <template #prepend>
        <q-icon name="airport_shuttle" />
      </template>
    </q-input>

    <!-- Description -->
    <q-input
      v-model="formData.description"
      :label="$t('fleet.form.description')"
      type="textarea"
      outlined
      rows="3"
      class="q-mb-md"
    >
      <template #prepend>
        <q-icon name="description" />
      </template>
    </q-input>

    <!-- Form actions -->
    <div class="row q-gutter-sm justify-end">
      <q-btn
        flat
        :label="$t('common.cancel')"
        color="grey-7"
        @click="$emit('cancel')"
      />
      <q-btn
        type="submit"
        :label="editMode ? $t('common.update') : $t('common.create')"
        color="primary"
        :loading="loading"
        :disable="loading"
      />
    </div>
  </q-form>
</template>

<script setup>
/**
 * FleetForm.vue
 *
 * Form for creating and editing fleets.
 * Includes name and description fields.
 *
 * Per constitution: Vue 3 Composition API with <script setup>
 */

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

// Component props
const props = defineProps({
  fleet: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Component emits
const emit = defineEmits(['submit', 'cancel'])

// State
const formData = ref({
  name: '',
  description: ''
})

const editMode = ref(false)

// Watch for fleet prop changes
watch(() => props.fleet, (newFleet) => {
  if (newFleet) {
    formData.value = {
      name: newFleet.name || '',
      description: newFleet.description || ''
    }
    editMode.value = true
  } else {
    formData.value = {
      name: '',
      description: ''
    }
    editMode.value = false
  }
}, { immediate: true })

// Methods
function handleSubmit() {
  emit('submit', {
    ...formData.value
  })
}
</script>

<style scoped>
.fleet-form {
  min-width: 300px;
}
</style>
