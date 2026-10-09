<template>
  <div class="card-block">
    <!-- 筛选工具条 -->
    <div class="toolbar">
      <el-radio-group v-model="status" @change="reload">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="pending">待审核</el-radio-button>
        <el-radio-button value="approved">已通过</el-radio-button>
        <el-radio-button value="rejected">未通过</el-radio-button>
      </el-radio-group>
      <el-input
        v-model="keyword"
        class="toolbar-search"
        placeholder="按标题搜索"
        clearable
        :prefix-icon="Search"
        @keyup.enter="reload"
        @clear="reload"
      />
    </div>

    <el-table v-loading="loading" :data="posts" style="width: 100%">
      <!-- 话题：标题 + 作者/板块/时间元信息 -->
      <el-table-column label="话题" min-width="300">
        <template #default="{ row }">
          <router-link class="topic-link" :to="`/post/${row.id}`">{{ row.title }}</router-link>
          <div class="topic-meta">
            <span class="meta-author">{{ row.nickname }}</span>
            <span>·</span>
            <span>{{ row.category_name ?? "未分类" }}</span>
            <span>·</span>
            <span>{{ timeAgo(row.create_at) }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- 状态 -->
      <el-table-column label="状态" width="96" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.review_status)" size="small" effect="light">
            {{ statusText(row.review_status) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 数据统计 -->
      <el-table-column label="数据" width="160" align="center">
        <template #default="{ row }">
          <span class="stat" title="浏览"><el-icon><View /></el-icon>{{ row.view_count }}</span>
          <span class="stat" title="点赞"><el-icon><Star /></el-icon>{{ row.like_count }}</span>
          <span class="stat" title="评论"><el-icon><ChatDotRound /></el-icon>{{ row.comment_count }}</span>
        </template>
      </el-table-column>

      <!-- 操作：胶囊按钮，与概览待审列表同款 -->
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.review_status !== 'approved'"
            type="primary"
            size="small"
            @click="review(row as AdminPost, 'approved')"
          >
            通过
          </el-button>
          <el-button
            v-if="row.review_status !== 'rejected'"
            type="danger"
            plain
            size="small"
            @click="review(row as AdminPost, 'rejected')"
          >
            驳回
          </el-button>
          <el-button size="small" @click="remove(row as AdminPost)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        hide-on-single-page
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { adminApi } from "@/api/admin";
import type { AdminPost, ReviewStatus } from "@/api/types";
import { timeAgo } from "@/utils/format";

const posts = ref<AdminPost[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const status = ref("");
const keyword = ref("");
const loading = ref(false);

const statusText = (s: ReviewStatus) => ({ pending: "待审核", approved: "已通过", rejected: "未通过" })[s];
const statusTag = (s: ReviewStatus): "warning" | "success" | "danger" =>
  ({ pending: "warning", approved: "success", rejected: "danger" } as const)[s];

const load = async () => {
  loading.value = true;
  try {
    const result = await adminApi.posts({
      page: page.value,
      pageSize,
      status: status.value || undefined,
      keyword: keyword.value.trim() || undefined,
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

const review = async (row: AdminPost, next: "approved" | "rejected") => {
  try {
    await adminApi.reviewPost(row.id, next);
    ElMessage.success(next === "approved" ? "已通过审核" : "已驳回");
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

const remove = async (row: AdminPost) => {
  await ElMessageBox.confirm(`确定删除《${row.title}》吗？删除后无法恢复。`, "删除确认", { type: "warning" });
  try {
    await adminApi.removePost(row.id);
    ElMessage.success("已删除");
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.toolbar-search {
  width: 240px;
}

.topic-link {
  color: var(--forum-text);
  font-weight: 500;
}

.topic-link:hover {
  color: var(--el-color-primary);
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--forum-text-3);
}

.meta-author {
  color: var(--forum-text-2);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin: 0 6px;
  font-size: 13px;
  color: var(--forum-text-2);
}

.stat .el-icon {
  color: var(--forum-text-3);
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
