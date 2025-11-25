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
        path: 'profile',
        name: 'profile',
        component: () => import('pages/ProfilePage.vue'),
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
