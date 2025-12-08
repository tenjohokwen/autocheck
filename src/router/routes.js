/**
 * Application Routes
 *
 * Defines all routes with lazy loading and metadata for guards.
 * Per constitution: Lazy load all route components for performance.
 */

const routes = [
  // Public routes - No authentication required (EmptyLayout for auth pages)
  {
    path: '/',
    component: () => import('layouts/EmptyLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/HomePage.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'signup',
        name: 'signup',
        component: () => import('pages/auth/SignUpPage.vue'),
        meta: { requiresAuth: false, hideForAuth: true },
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('pages/auth/LoginPage.vue'),
        meta: { requiresAuth: false, hideForAuth: true },
      },
      {
        path: 'verify-email',
        name: 'verify-email',
        component: () => import('pages/auth/EmailVerificationPage.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'verify-token',
        name: 'verify-token',
        component: () => import('pages/auth/VerifyTokenPage.vue'),
        meta: { requiresAuth: false },
      },
    ],
  },

  // Authenticated routes - Requires login (MainLayout for app pages)
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('pages/ProfilePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'fleets',
        name: 'fleets',
        component: () => import('pages/FleetManagementPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'vehicles',
        name: 'vehicles',
        component: () => import('pages/VehicleManagementPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'maintenance',
        name: 'maintenance',
        component: () => import('pages/MaintenanceManagementPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'fuel',
        name: 'fuel',
        component: () => import('pages/FuelManagementPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'reminders',
        name: 'reminders',
        component: () => import('pages/RemindersPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'expenses',
        name: 'expenses',
        component: () => import('pages/ExpensePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'repairs',
        name: 'repairs',
        component: () => import('pages/RepairPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'parts',
        name: 'parts',
        component: () => import('pages/PartsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'documents',
        name: 'documents',
        component: () => import('pages/DocumentsPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
