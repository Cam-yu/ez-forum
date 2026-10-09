<template>
  <div class="page-container">
    <div class="edit-card card-block">
      <h2 class="edit-title">{{ isEdit ? "编辑帖子" : "发布帖子" }}</h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large">
        <el-form-item label="板块" prop="category_id">
          <el-select v-model="form.category_id" placeholder="选择板块（可选）" clearable style="width: 240px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="120" show-word-limit placeholder="一句话说清主题" />
        </el-form-item>
        <el-form-item label="内容" prop="context">
          <el-input
            v-model="form.context"
            type="textarea"
            :rows="18"
            maxlength="20000"
            show-word-limit
            placeholder="支持换行的纯文本内容…"
          />
        </el-form-item>

        <div class="edit-actions">
          <el-button text @click="router.back()">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submit">
            {{ isEdit ? "保存修改" : "发布" }}
          </el-button>
        </div>
        <el-alert
          class="edit-tip"
          type="info"
          :closable="false"
          show-icon
          title="发布后需要管理员审核，审核通过前仅自己可见；编辑已通过的帖子会重新进入审核"
        />
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { postApi } from "@/api/post";
import { categoryApi } from "@/api/category";
import type { Category } from "@/api/types";

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const postId = computed(() => Number(route.params.id));

const formRef = ref<FormInstance>();
const submitting = ref(false);
const categories = ref<Category[]>([]);
const form = reactive({ title: "", context: "", category_id: undefined as number | undefined });

const rules: FormRules = {
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    { max: 120, message: "标题最长 120 字", trigger: "blur" },
  ],
  context: [{ required: true, message: "请输入内容", trigger: "blur" }],
};

onMounted(async () => {
  try {
    categories.value = (await categoryApi.list()).data;
  } catch (e) {
    ElMessage.error((e as Error).message);
  }

  if (isEdit.value) {
    try {
      const detail = (await postApi.detail(postId.value)).data;
      form.title = detail.title;
      form.context = detail.context;
      form.category_id = detail.category_id ?? undefined;
    } catch (e) {
      ElMessage.error((e as Error).message);
      router.replace("/my");
    }
  }
});

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  const body = {
    title: form.title,
    context: form.context,
    category_id: form.category_id,
  };
  try {
    if (isEdit.value) {
      await postApi.update(postId.value, body);
      ElMessage.success("修改成功，帖子重新进入审核");
      await router.push(`/post/${postId.value}`);
    } else {
      await postApi.create(body);
      ElMessage.success("发布成功，等待管理员审核");
      await router.push("/my");
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.edit-card {
  max-width: 1560px;
  margin: 0 auto;
}

.edit-title {
  margin: 0 0 20px;
  font-size: 20px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.edit-tip {
  margin-top: 12px;
}
</style>
