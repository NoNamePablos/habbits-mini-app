<script setup lang="ts">
type SortMode = 'default' | 'closest'

defineProps<{
  modelValue: SortMode
}>()

defineEmits<{
  'update:modelValue': [value: SortMode]
}>()
</script>

<template>
  <div class="flex items-center justify-end">
    <Select :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event as SortMode)">
      <SelectTrigger class="h-8 w-44 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">{{ $t('achievements.sortDefault') }}</SelectItem>
        <SelectItem value="closest">{{ $t('achievements.sortClosest') }}</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
