<template>
  <span class="category-badge" :style="{ '--dot': color }">
    <span class="dot"></span>{{ name }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { categoryColor } from "@/utils/format";

const props = defineProps<{ id: number | null | undefined; name: string }>();
const color = computed(() => categoryColor(props.id));
</script>

<style scoped>
.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--forum-text-2);
  font-weight: 500;
  white-space: nowrap;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--dot);
  flex-shrink: 0;
}
</style>
