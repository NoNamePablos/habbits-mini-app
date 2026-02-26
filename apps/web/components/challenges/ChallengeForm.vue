<script setup lang="ts">
import type { CreateChallengePayload } from '~/types/challenge'
import { CHALLENGE_ICON_OPTIONS, DURATION_PRESETS, ALLOWED_MISSES_OPTIONS } from '~/types/challenge'
import { CHALLENGE_TEMPLATES } from '~/constants'
import type { ChallengeTemplate } from '~/constants'

interface Props {
  open: boolean
  editMode?: boolean
  initialData?: Partial<CreateChallengePayload>
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'submit', data: CreateChallengePayload): void
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
  initialData: undefined,
})
const emit = defineEmits<Emits>()

const { resolveIcon } = useHabitIcon()
const { t } = useI18n()

const form = useChallengeForm({ initialData: props.initialData })

const isCustomDuration = ref<boolean>(false)

const getTodayDate = (): string => new Intl.DateTimeFormat('en-CA').format(new Date())
const getTomorrowDate = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const startDateOption = ref<'today' | 'tomorrow'>('today')

watch(startDateOption, (val) => {
  form.startDate.value = val === 'today' ? getTodayDate() : getTomorrowDate()
})

const onDurationSelect = (val: string): void => {
  const num = Number(val)
  if (num === 0) {
    isCustomDuration.value = true
  } else {
    isCustomDuration.value = false
    form.durationDays.value = num
  }
}

const applyTemplate = (tmpl: ChallengeTemplate): void => {
  form.title.value = t(tmpl.titleKey)
  form.durationDays.value = tmpl.targetDays
  form.allowedMisses.value = tmpl.allowedMisses
  form.icon.value = tmpl.icon
  isCustomDuration.value = false
}

const onSubmit = (): void => {
  if (!form.validate()) return
  emit('submit', form.getPayload())
  form.reset()
  emit('update:open', false)
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      form.reset(props.initialData)
      isCustomDuration.value = false
      startDateOption.value = 'today'
    }
  },
)
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="bottom" class="rounded-t-2xl glass-heavy max-h-[85vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>
          {{ editMode ? $t('challengeForm.editTitle') : $t('challengeForm.createTitle') }}
        </SheetTitle>
        <SheetDescription>
          {{ editMode ? $t('challengeForm.editDescription') : $t('challengeForm.createDescription') }}
        </SheetDescription>
      </SheetHeader>

      <div class="space-y-5 py-4">
        <div v-if="!editMode" class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            v-for="tmpl in CHALLENGE_TEMPLATES"
            :key="tmpl.titleKey"
            type="button"
            class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/10 text-xs font-medium hover:bg-foreground/5 transition-colors"
            @click="applyTemplate(tmpl)"
          >
            <component :is="resolveIcon(tmpl.icon)" class="h-3 w-3" />
            {{ $t(tmpl.titleKey) }}
          </button>
        </div>

        <div class="space-y-2">
          <Label>{{ $t('challengeForm.titleLabel') }}</Label>
          <Input
            v-model="form.title.value"
            :placeholder="$t('challengeForm.titlePlaceholder')"
          />
          <p v-if="form.errors.value.title" class="text-xs text-destructive">
            {{ form.errors.value.title }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>{{ $t('challengeForm.iconLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="form.icon.value"
            class="flex flex-wrap justify-start gap-1"
            @update:model-value="(val: string) => { if (val) form.icon.value = val }"
          >
            <ToggleGroupItem
              v-for="iconName in CHALLENGE_ICON_OPTIONS"
              :key="iconName"
              :value="iconName"
              class="w-10 h-10"
            >
              <component :is="resolveIcon(iconName)" class="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div v-if="!editMode" class="space-y-2">
          <Label>{{ $t('challengeForm.durationLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="isCustomDuration ? '0' : String(form.durationDays.value)"
            class="flex flex-wrap justify-start gap-2"
            @update:model-value="onDurationSelect"
          >
            <ToggleGroupItem
              v-for="preset in DURATION_PRESETS"
              :key="preset"
              :value="String(preset)"
              class="px-3 h-9"
            >
              {{ $t('challengeForm.durationDays', { count: preset }) }}
            </ToggleGroupItem>
            <ToggleGroupItem value="0" class="px-3 h-9">
              {{ $t('challengeForm.durationCustom') }}
            </ToggleGroupItem>
          </ToggleGroup>
          <Input
            v-if="isCustomDuration"
            v-model.number="form.durationDays.value"
            type="number"
            min="1"
            max="365"
            class="w-32"
          />
        </div>

        <div v-if="!editMode" class="space-y-2">
          <Label>{{ $t('challengeForm.allowedMissesLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="String(form.allowedMisses.value)"
            class="flex flex-wrap justify-start gap-2"
            @update:model-value="(val: string) => { form.allowedMisses.value = Number(val) }"
          >
            <ToggleGroupItem
              v-for="opt in ALLOWED_MISSES_OPTIONS"
              :key="opt"
              :value="String(opt)"
              class="px-3 h-9"
            >
              {{ opt === 0 ? $t('challengeForm.missesStrict') : String(opt) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div v-if="!editMode" class="space-y-2">
          <Label>{{ $t('challengeForm.startDateLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="startDateOption"
            class="flex flex-wrap justify-start gap-2"
            @update:model-value="(val: string) => { if (val) startDateOption = val as 'today' | 'tomorrow' }"
          >
            <ToggleGroupItem value="today" class="px-3 h-9">
              {{ $t('challengeForm.startToday') }}
            </ToggleGroupItem>
            <ToggleGroupItem value="tomorrow" class="px-3 h-9">
              {{ $t('challengeForm.startTomorrow') }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div class="space-y-2">
          <Label>{{ $t('challengeForm.descriptionLabel') }}</Label>
          <Input
            v-model="form.description.value"
            :placeholder="$t('challengeForm.descriptionPlaceholder')"
          />
        </div>

        <Button
          :disabled="!form.isValid.value"
          class="w-full bg-gradient-primary border-0 text-white hover:opacity-90"
          @click="onSubmit"
        >
          {{ editMode ? $t('challengeForm.submitEdit') : $t('challengeForm.submitCreate') }}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
