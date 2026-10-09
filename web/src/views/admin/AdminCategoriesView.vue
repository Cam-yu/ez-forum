<template>
  <div class="card-block">
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;新建板块
      </el-button>
    </div>

    <el-table v-loading="loading" :data="categories" style="width: 100%">
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="板块名" prop="name" min-width="140" />
      <el-table-column label="简介" prop="description" min-width="220" />
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="帖子数" prop="post_count" width="90" />
      <el-table-column label="操作" width="170" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row as Category)">编辑</el-button>
          <el-button type="danger" plain size="small" @click="remove(row as Category)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑板块' : '新建板块'" width="440px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="板块名" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit placeholder="如：前端开发" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" maxlength="100" show-word-limit placeholder="一句话介绍该板块" />
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
          <span class="sort-hint">越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { categoryApi } from "@/api/category";
import type { Category } from "@/api/types";

const categories = ref<Category[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const editing = ref<Category | null>(null);
const saving = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({ name: "", description: "", sort: 0 });

const rules: FormRules = {
  name: [
    { required: true, message: "请输入板块名", trigger: "blur" },
    { max: 20, message: "板块名最长 20 字", trigger: "blur" },
  ],
};

const load = async () => {
  loading.value = true;
  try {
    categories.value = (await categoryApi.list()).data;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  form.name = "";
  form.description = "";
  form.sort = 0;
  dialogVisible.value = true;
};

const openEdit = (row: Category) => {
  editing.value = row;
  form.name = row.name;
  form.description = row.description;
  form.sort = row.sort;
  dialogVisible.value = true;
};

const save = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (editing.value) {
      await categoryApi.update(editing.value.id, { ...form });
      ElMessage.success("板块已更新");
    } else {
      await categoryApi.create({ ...form });
      ElMessage.success("板块创建成功");
    }
    dialogVisible.value = false;
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    saving.value = false;
  }
};

const remove = async (row: Category) => {
  await ElMessageBox.confirm(
    `确定删除板块「${row.name}」吗？该板块下的帖子将变为未分类。`,
    "删除确认",
    { type: "warning" }
  );
  try {
    await categoryApi.remove(row.id);
    ElMessage.success("板块已删除");
    load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
};

onMounted(load);
</script>

<style scoped>
.toolbar {
  margin-bottom: 14px;
}

.sort-hint {
  margin-left: 10px;
  color: var(--forum-text-3);
  font-size: 12px;
}
</style>
