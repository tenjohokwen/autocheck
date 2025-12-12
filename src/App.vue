<template>
  <router-view />
</template>

<script setup>
// DEBUG: Log to verify Vue app is loading
console.log('=== Vue App.vue loaded ===')
console.log('Environment:', import.meta.env.MODE)
console.log('Platform:', navigator.userAgent)

// Add visible debugging element
import { onMounted } from 'vue'

onMounted(() => {
  console.log('=== Vue App.vue mounted ===')
  // Create a visible debug indicator
  const debugDiv = document.createElement('div')
  debugDiv.style.position = 'fixed'
  debugDiv.style.top = '0'
  debugDiv.style.left = '0'
  debugDiv.style.background = 'red'
  debugDiv.style.color = 'white'
  debugDiv.style.padding = '10px'
  debugDiv.style.zIndex = '99999'
  debugDiv.textContent = 'Vue App Loaded!'
  document.body.appendChild(debugDiv)

  // Remove after 3 seconds
  setTimeout(() => debugDiv.remove(), 3000)
})
</script>
