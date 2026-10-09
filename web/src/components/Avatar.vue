<template>
  <span class="avatar" :style="{ background: avatarColor(name), width: size + 'px', height: size + 'px', fontSize: size * 0.45 + 'px' }">
    {{ name.slice(0, 1) }}
  </span>
</template>

<script setup lang="ts">
import { avatarColor } from "@/utils/format";

withDefaults(defineProps<{ name: string; size?: number }>(), { size: 30 });
</script>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
  user-select: none;
}
</style>
