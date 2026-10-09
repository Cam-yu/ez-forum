<template>
  <div class="page-container">
    <div class="card-block">
      <div class="page-head">
        <h2 class="page-title">我的帖子</h2>
        <el-button type="primary" @click="router.push('/post/new')">
          <el-icon><EditPen /></el-icon>&nbsp;发帖
        </el-button>
      </div>

      <el-table v-loading="loading" :data="posts" style="width: 100%">
        <el-table-column label="标题" min-width="220">
          <template #default="{ row }">
            <router-link class="post-link" :to="`/post/${row.id}`">{{ row.title }}</router-link>
          </template>
        </el-table-column>
        <el-table-column label="板块" width="110">
          <template #default="{ row }">{{ row.category_name ?? "未分类" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.review_status)" size="small">{{ statusText(row.review_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="浏览" prop="view_count" width="70" />
        <el-table-column label="点赞" prop="like_count" width="70" />
        <el-table-column label="评论" prop="comment_count" width="70" />
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">{{ timeAgo(row.create_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="router.push(`/post/${row.id}/edit`)">编辑</el-button>
            <el-button text size="small" type="danger" @click="remove(row as MyPost)">删除</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import { postApi } from "@/api/post";
import type { MyPost, ReviewStatus } from "@/api/types";
import { timeAgo } from "@/utils/format";

const router = useRouter();

const posts = ref<MyPost[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);

const statusText = (status: ReviewStatus) =>
  ({ pending: "待审核", approved: "已通过", rejected: "未通过" })[status];

const statusTag = (status: ReviewStatus): "warning" | "success" | "danger" =>
  ({ pending: "warning", approved: "success", rejected: "danger" } as const)[status];

const load = async () => {
  loading.value = true;
  try {
    const result = await postApi.mine(page.value, pageSize);
    posts.value = result.data;
    total.value = result.total;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
};

const remove = async (row: MyPost) => {
  await ElMessageBox.confirm(`确定删除《${row.title}》吗？`, "删除确认", { type: "warning" });
  try {
    await postApi.remove(row.id);
    ElMessage.success("已删除");
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

onMounted(load);
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
}

.post-link {
  color: var(--forum-text);
}

.post-link:hover {
  color: var(--el-color-primary-dark-2);
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
