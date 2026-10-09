import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/stores/user";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: DefaultLayout,
      children: [
        { path: "", name: "home", component: () => import("@/views/HomeView.vue") },
        { path: "post/:id(\\d+)", name: "post-detail", component: () => import("@/views/PostDetailView.vue") },
        { path: "post/new", name: "post-new", component: () => import("@/views/PostEditView.vue"), meta: { requiresAuth: true } },
        { path: "post/:id(\\d+)/edit", name: "post-edit", component: () => import("@/views/PostEditView.vue"), meta: { requiresAuth: true } },
        { path: "my", name: "my-posts", component: () => import("@/views/MyPostsView.vue"), meta: { requiresAuth: true } },
        { path: "user/:id(\\d+)", name: "user-home", component: () => import("@/views/UserProfileView.vue") },
        { path: "settings", name: "settings", component: () => import("@/views/SettingsView.vue"), meta: { requiresAuth: true } },
        {
          path: "admin",
          component: () => import("@/layouts/AdminLayout.vue"),
          meta: { requiresAuth: true, requiresAdmin: true },
          children: [
            { path: "", name: "admin-dashboard", component: () => import("@/views/admin/AdminDashboardView.vue") },
            { path: "posts", name: "admin-posts", component: () => import("@/views/admin/AdminPostsView.vue") },
            { path: "comments", name: "admin-comments", component: () => import("@/views/admin/AdminCommentsView.vue") },
            { path: "users", name: "admin-users", component: () => import("@/views/admin/AdminUsersView.vue") },
            { path: "categories", name: "admin-categories", component: () => import("@/views/admin/AdminCategoriesView.vue") },
          ],
        },
      ],
    },
    { path: "/login", name: "login", component: () => import("@/views/LoginView.vue") },
    { path: "/register", name: "register", component: () => import("@/views/RegisterView.vue") },
    { path: "/:pathMatch(.*)*", name: "not-found", component: () => import("@/views/NotFoundView.vue") },
  ],

  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const store = useUserStore();
  if (!store.ready) await store.restore();

  if (to.meta.requiresAuth && !store.isSignedIn) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && !store.isAdmin) {
    return { name: "home" };
  }
  return true;
});

export default router;
