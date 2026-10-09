<template>
  <div class="page-container">
    <div class="home-layout">
      <!-- 左侧边栏 -->
      <aside class="side-nav">
        <nav class="side-group">
          <router-link to="/" class="side-item" exact-active-class="active">
            <el-icon><ChatDotRound /></el-icon>
            <span>话题</span>
          </router-link>
          <router-link v-if="store.isSignedIn" to="/my" class="side-item" active-class="active">
            <el-icon><Document /></el-icon>
            <span>我的帖子</span>
          </router-link>
          <router-link v-if="store.isAdmin" to="/admin" class="side-item" active-class="active">
            <el-icon><Setting /></el-icon>
            <span>管理后台</span>
          </router-link>
        </nav>

        <div class="side-label">类别</div>
        <nav class="side-group">
          <button
            class="side-item"
            :class="{ active: categoryId === 0 }"
            @click="pickCategory(0)"
          >
            <span class="side-dot all-dot"></span>
            <span class="side-name">全部话题</span>
            <span class="side-count">{{ total }}</span>
          </button>
          <button
            v-for="c in categories"
            :key="c.id"
            class="side-item"
            :class="{ active: categoryId === c.id }"
            @click="pickCategory(c.id)"
          >
            <span class="side-dot" :style="{ background: categoryColor(c.id) }"></span>
            <span class="side-name">{{ c.name }}</span>
            <span class="side-count">{{ c.post_count }}</span>
          </button>
        </nav>

        <div class="side-label">热门话题</div>
        <nav class="side-group">
          <div v-if="hotPosts.length === 0" class="side-empty">暂无数据</div>
          <router-link
            v-for="(p, index) in hotPosts"
            :key="p.id"
            :to="`/post/${p.id}`"
            class="hot-item"
          >
            <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            <span class="hot-title">{{ p.title }}</span>
          </router-link>
        </nav>
      </aside>

      <!-- 主内容 -->
      <main class="home-main">
        <!-- 工具条：排序 Tab + 搜索 -->
        <div class="toolbar">
          <nav class="sort-tabs">
            <button class="sort-tab" :class="{ active: sort === 'new' }" @click="setSort('new')">最新</button>
            <button class="sort-tab" :class="{ active: sort === 'hot' }" @click="setSort('hot')">热门</button>
          </nav>
          <el-input
            v-model="keyword"
            class="search-input"
            placeholder="搜索话题…"
            clearable
            :prefix-icon="Search"
            @keyup.enter="search"
            @clear="search"
          />
        </div>

        <!-- 话题列表 -->
        <div class="topic-list">
          <div class="list-header">
            <span class="header-topic">话题</span>
            <span class="header-col">回复</span>
            <span class="header-col">浏览量</span>
            <span class="header-col">活动</span>
          </div>

          <div v-if="loading" class="loading-block">
            <el-skeleton :rows="5" animated />
          </div>
          <el-empty v-else-if="posts.length === 0" description="暂无话题" />
          <post-card v-for="post in posts" v-else :key="post.id" :post="post" />
        </div>

        <el-pagination
          v-model:current-page="page"
          class="pager"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          background
          hide-on-single-page
          @current-change="load"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Search, ChatDotRound, Document, Setting } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import { postApi } from "@/api/post";
import { categoryApi } from "@/api/category";
import type { Category, PostSummary } from "@/api/types";
import { useUserStore } from "@/stores/user";
import { categoryColor } from "@/utils/format";
import PostCard from "@/components/PostCard.vue";

const route = useRoute();
const store = useUserStore();

const posts = ref<PostSummary[]>([]);
const categories = ref<Category[]>([]);
const hotPosts = ref<PostSummary[]>([]);
const total = ref(0);
const loading = ref(true);

const page = ref(1);
const pageSize = 15;
const categoryId = ref(0);
const keyword = ref("");
const sort = ref<"new" | "hot">("new");

const load = async () => {
  loading.value = true;
  try {
    const result = await postApi.list({
      page: page.value,
      pageSize,
      category_id: categoryId.value || undefined,
      keyword: keyword.value.trim() || undefined,
      sort: sort.value,
    });
    posts.value = result.data;
    total.value = result.total;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
};

const reload = () => {
  page.value = 1;
  load();
};

const search = reload;

const setSort = (value: "new" | "hot") => {
  sort.value = value;
  reload();
};

const pickCategory = (id: number) => {
  categoryId.value = id;
  reload();
};

const loadSide = async () => {
  try {
    const [categoryResult, hotResult] = await Promise.all([
      categoryApi.list(),
      postApi.list({ page: 1, pageSize: 5, sort: "hot" }),
    ]);
    categories.value = categoryResult.data;
    hotPosts.value = hotResult.data;
  } catch {
    /* 侧栏加载失败不阻塞主列表 */
  }
};

onMounted(() => {
  keyword.value = String(route.query.keyword ?? "");
  load();
  loadSide();
});
</script>

<style scoped>
.home-layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.home-main {
  flex: 1;
  min-width: 0;
}

/* ===== 左侧边栏 ===== */
.side-nav {
  width: 250px;
  flex-shrink: 0;
  position: sticky;
  top: 84px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.side-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--forum-text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 18px 12px 8px;
}

.side-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: none;
  background: none;
  border-radius: 2px;
  font-size: 15px;
  color: var(--forum-text-2);
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.side-item:hover {
  background: var(--forum-hover);
  color: var(--forum-text);
}

.side-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

html.dark .side-item.active {
  background: var(--el-color-primary-light-9);
}

.side-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.all-dot {
  background: linear-gradient(135deg, #1f7bf6, #7e57c2);
}

.side-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-count {
  color: var(--forum-text-3);
  font-size: 12px;
}

.side-empty {
  color: var(--forum-text-3);
  font-size: 13px;
  padding: 4px 10px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 2px;
}

.hot-item:hover {
  background: var(--forum-hover);
}

.hot-item:hover .hot-title {
  color: var(--el-color-primary);
}

.hot-rank {
  width: 17px;
  height: 17px;
  border-radius: 2px;
  background: var(--forum-hover);
  color: var(--forum-text-3);
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hot-rank.top {
  background: var(--el-color-primary);
  color: #fff;
  font-weight: 700;
}

.hot-title {
  font-size: 13px;
  color: var(--forum-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 工具条 ===== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.sort-tabs {
  display: flex;
  gap: 24px;
}

.sort-tab {
  border: none;
  background: none;
  padding: 8px 2px;
  font-size: 16px;
  color: var(--forum-text-2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.12s;
}

.sort-tab:hover {
  color: var(--forum-text);
}

.sort-tab.active {
  color: var(--el-color-primary);
  font-weight: 600;
  border-bottom-color: var(--el-color-primary);
}

.search-input {
  width: 280px;
}

/* ===== 话题列表 ===== */
.topic-list {
  background: var(--forum-card);
  border: 1px solid var(--forum-border);
  border-radius: var(--forum-radius);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 14px 24px 12px;
  border-bottom: 1px solid var(--forum-border);
}

.header-topic {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--forum-text-2);
}

.header-col {
  width: 84px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--forum-text-3);
}

.loading-block {
  padding: 32px 24px;
  min-height: 200px;
}

@media (max-width: 860px) {
  .home-layout {
    flex-direction: column;
  }
  .side-nav {
    width: 100%;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .side-label {
    display: none;
  }
  .side-group {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }
  .side-item {
    width: auto;
  }
  .hot-item,
  .side-count {
    display: none;
  }
  .search-input {
    width: 160px;
  }
}
</style>
