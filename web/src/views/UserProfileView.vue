<template>
  <div class="page-container" v-if="user">
    <div class="card-block profile-head">
      <avatar :name="user.nickname" :size="64" />
      <div class="profile-info">
        <div class="profile-name">
          {{ user.nickname }}
          <el-tag v-if="user.role === 'admin'" type="warning" size="small" effect="light">管理员</el-tag>
        </div>
        <div class="profile-username">@{{ user.username }}</div>
        <div class="profile-joined">加入时间：{{ formatDate(user.created_at ?? "") }}</div>
      </div>
    </div>

    <h3 class="section-label">TA 的公开帖子（{{ user.total }}）</h3>
    <el-empty v-if="user.posts.length === 0" description="还没有公开的帖子" />
    <post-card v-for="post in user.posts" :key="post.id" :post="post" />

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="user.total"
        layout="prev, pager, next"
        background
        hide-on-single-page
        @current-change="load"
      />
    </div>
  </div>
  <div v-else class="page-container">
    <el-skeleton class="card-block" :rows="5" animated />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import { userApi } from "@/api/user";
import type { UserHome } from "@/api/types";
import Avatar from "@/components/Avatar.vue";
import PostCard from "@/components/PostCard.vue";
import { formatDate } from "@/utils/format";

const route = useRoute();
const user = ref<UserHome | null>(null);
const page = ref(1);
const pageSize = 10;

const load = async () => {
  try {
    user.value = (await userApi.home(Number(route.params.id), page.value, pageSize)).data;
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

watch(() => route.params.id, () => {
  if (route.name === "user-home") {
    page.value = 1;
    load();
  }
});

onMounted(load);
</script>

<style scoped>
.profile-head {
  display: flex;
  align-items: center;
  gap: 18px;
}

.profile-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
}

.profile-username {
  color: var(--forum-text-3);
  font-size: 14px;
  margin-top: 2px;
}

.profile-joined {
  color: var(--forum-text-3);
  font-size: 12px;
  margin-top: 6px;
}

.section-label {
  margin: 18px 4px 12px;
  font-size: 15px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
