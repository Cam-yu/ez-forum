<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="brand">
        <span class="brand-logo">🦊</span>
        <span class="brand-name">FoxDo 论坛</span>
      </router-link>

      <nav class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link v-if="store.isSignedIn" to="/my" class="nav-link">我的帖子</router-link>
        <router-link v-if="store.isAdmin" to="/admin" class="nav-link">管理后台</router-link>
      </nav>

      <div class="nav-actions">
        <el-button
          class="theme-toggle"
          
          :icon="theme.mode === 'dark' ? Sunny : Moon"
          @click="theme.toggle()"
        />

        <el-button v-if="store.isSignedIn" type="primary" @click="router.push('/post/new')">
          <el-icon><EditPen /></el-icon>&nbsp;发帖
        </el-button>

        <template v-if="store.isSignedIn && store.user">
          <el-dropdown trigger="click" @command="onCommand">
            <span class="user-chip">
              <avatar :name="store.user.nickname" :size="30" />
              <span class="user-nickname">{{ store.user.nickname }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="'user:' + store.user.id">我的主页</el-dropdown-item>
                <el-dropdown-item command="settings">账号设置</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <el-button text @click="router.push('/login')">登录</el-button>
          <el-button type="primary" @click="router.push('/register')">注册</el-button>
        </template>
      </div>
    </div>
  </header>

  <router-view />

  <footer class="footer">FoxDo · Bun + Elysia + Prisma + Vue3</footer>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { Sunny, Moon } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";
import { useThemeStore } from "@/stores/theme";
import Avatar from "@/components/Avatar.vue";

const router = useRouter();
const store = useUserStore();
const theme = useThemeStore();

const onCommand = async (command: string) => {
  if (command === "logout") {
    store.logout();
    return;
  }
  if (command === "settings") {
    await router.push("/settings");
    return;
  }
  if (command.startsWith("user:")) {
    await router.push(`/user/${command.slice(5)}`);
  }
};
</script>

<style scoped>
.navbar {
  background: var(--forum-card);
  border-bottom: 1px solid var(--forum-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.theme-toggle {
  color: var(--forum-text-2);
}

.navbar-inner {
  max-width: 1840px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 0 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: 0.2px;
}

.brand-logo {
  font-size: 26px;
}

.nav-links {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 7px 16px;
  border-radius: 6px;
  color: var(--forum-text-2);
  font-size: 15px;
  transition: all 0.12s;
}

.nav-link:hover {
  background: var(--forum-hover);
  color: var(--forum-text);
}

.nav-link.router-link-active {
  color: var(--el-color-primary);
  font-weight: 600;
  background: var(--el-color-primary-light-9);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.user-chip:hover {
  background: var(--forum-hover);
}

.user-nickname {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.footer {
  text-align: center;
  color: var(--forum-text-3);
  font-size: 13px;
  padding: 24px 0;
}
</style>
