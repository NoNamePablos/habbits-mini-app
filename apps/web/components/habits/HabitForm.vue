<script setup lang="ts">
import type { CreateHabitPayload } from '~/types/habit'
import { TIMES_OF_DAY, TIME_OF_DAY_ICONS, HABIT_ICON_OPTIONS } from '~/types/habit'

interface Props {
  open: boolean
  initialData?: Partial<CreateHabitPayload>
  editMode?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'submit', data: CreateHabitPayload): void
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  editMode: false,
})
const emit = defineEmits<Emits>()

const { resolveIcon } = useHabitIcon()

const form = useHabitForm({ initialData: props.initialData })

const onIconChange = (val: string | undefined): void => {
  if (val) form.icon.value = val
}

const onTimeOfDayChange = (val: string | undefined): void => {
  if (val) form.timeOfDay.value = val as typeof form.timeOfDay.value
}

const onSubmit = (): void => {
  if (!form.validate()) return

  emit('submit', form.getPayload())
  form.reset()
  emit('update:open', false)
}

watch(() => props.open, (val) => {
  if (val && props.initialData) {
    form.reset(props.initialData)
  }
})
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-2xl glass-heavy">
      <SheetHeader>
        <SheetTitle>{{ editMode ? $t('habitForm.editTitle') : $t('habitForm.createTitle') }}</SheetTitle>
        <SheetDescription>
          {{ editMode ? $t('habitForm.editDescription') : $t('habitForm.createDescription') }}
        </SheetDescription>
      </SheetHeader>

      <div class="space-y-5 py-4">
        <div class="space-y-2">
          <Label for="habit-name">{{ $t('habitForm.nameLabel') }}</Label>
          <Input
            id="habit-name"
            v-model="form.name.value"
            :placeholder="$t('habitForm.namePlaceholder')"
          />
          <p v-if="form.errors.value.name" class="text-xs text-destructive">
            {{ form.errors.value.name }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>{{ $t('habitForm.iconLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="form.icon.value"
            class="flex flex-wrap justify-start gap-1"
            @update:model-value="onIconChange"
          >
            <ToggleGroupItem
              v-for="ic in HABIT_ICON_OPTIONS"
              :key="ic"
              :value="ic"
              size="sm"
              class="w-10 h-10"
            >
              <component :is="resolveIcon(ic)" class="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div class="space-y-2">
          <Label>{{ $t('habitForm.timeOfDayLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="form.timeOfDay.value"
            class="grid grid-cols-2 gap-2"
            @update:model-value="onTimeOfDayChange"
          >
            <ToggleGroupItem
              v-for="tod in TIMES_OF_DAY"
              :key="tod"
              :value="tod"
              class="flex items-center gap-2"
            >
              <component :is="TIME_OF_DAY_ICONS[tod]" class="h-4 w-4" />
              <span>{{ $t(`timeOfDay.${tod}`) }}</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button
          class="w-full bg-gradient-primary border-0 text-white hover:opacity-90"
          :disabled="!form.isValid.value"
          @click="onSubmit"
        >
          {{ editMode ? $t('habitForm.submitEdit') : $t('habitForm.submitCreate') }}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
