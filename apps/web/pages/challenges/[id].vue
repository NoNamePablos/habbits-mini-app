<script setup lang="ts">
import type { Challenge, ChallengeDay, CreateChallengePayload } from '~/types/challenge'
import { ArrowLeft, Flame, Calendar, CheckCircle, X, Pencil, Flag, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const challengesStore = useChallengesStore()
const gamificationStore = useGamificationStore()
const { hapticNotification } = useTelegram()
const { showSuccess, showInfo } = useErrorHandler()
const { resolveIcon } = useHabitIcon()

const challenge = ref<Challenge | null>(null)
const days = ref<ChallengeDay[]>([])
const todayCheckedIn = ref<boolean>(false)
const isLoading = ref<boolean>(true)
const noteInput = ref<string>('')
const showNoteField = ref<boolean>(false)
const showEditForm = ref<boolean>(false)
const showLevelUp = ref<boolean>(false)
const levelUpLevel = ref<number>(1)
const showAchievementPopup = ref<boolean>(false)
const pendingAchievement = ref<{ name: string; icon: string | null; xpReward: number } | null>(null)
const showChallengeComplete = ref<boolean>(false)
const completionXpBonus = ref<number>(0)

const challengeId = computed<number>(() => Number(route.params.id))

const challengeIcon = computed(() =>
  resolveIcon(toValue(challenge)?.icon ?? null),
)

const progressPercent = computed<number>(() => {
  const c = toValue(challenge)
  if (!c || c.durationDays === 0) return 0
  const accounted = c.completedDays + c.missedDays
  return Math.min(Math.round((accounted / c.durationDays) * 100), 100)
})

const currentDay = computed<number>(() => {
  const c = toValue(challenge)
  if (!c) return 0
  return c.completedDays + c.missedDays
})

const isActive = computed<boolean>(() => toValue(challenge)?.status === 'active')

const missesRemaining = computed<number>(() => {
  const c = toValue(challenge)
  if (!c) return 0
  return Math.max(0, c.allowedMisses - c.missedDays)
})

onMounted(async () => {
  const detail = await challengesStore.fetchChallenge(toValue(challengeId))
  if (detail) {
    challenge.value = detail.challenge
    days.value = detail.days
    todayCheckedIn.value = detail.todayCheckedIn
  } else {
    navigateTo('/challenges')
  }
  isLoading.value = false
})

const onCheckIn = async (): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return

  const note = toValue(noteInput).trim() || undefined
  const result = await challengesStore.checkIn(c.id, note)
  if (result) {
    hapticNotification('success')
    showSuccess('success.challengeCheckedIn')
    challenge.value = result.challenge
    days.value = [...toValue(days), result.day]
    todayCheckedIn.value = true
    noteInput.value = ''
    showNoteField.value = false

    await gamificationStore.refreshAfterCompletion()

    if (result.challengeCompleted) {
      completionXpBonus.value = result.completionBonusXp
      showChallengeComplete.value = true
    }

    if (result.leveledUp) {
      levelUpLevel.value = result.newLevel
      showLevelUp.value = true
    }

    if (result.unlockedAchievements.length > 0) {
      const first = result.unlockedAchievements[0]
      pendingAchievement.value = {
        name: first.achievement.name,
        icon: first.achievement.icon,
        xpReward: first.xpAwarded,
      }
      showAchievementPopup.value = true
    }
  }
}

const onUndoCheckIn = async (): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return
  const today = new Intl.DateTimeFormat('en-CA').format(new Date())
  await challengesStore.undoCheckIn(c.id, today)
  todayCheckedIn.value = false
  days.value = toValue(days).filter((d) => d.dayDate !== today)
  // Re-fetch to get updated challenge
  const detail = await challengesStore.fetchChallenge(c.id)
  if (detail) {
    challenge.value = detail.challenge
  }
}

const onAbandon = async (): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return
  const updated = await challengesStore.abandonChallenge(c.id)
  if (updated) {
    challenge.value = updated
    showSuccess('success.challengeAbandoned')
  }
}

const onDelete = async (): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return
  const deleted = await challengesStore.deleteChallenge(c.id)
  if (deleted) {
    showSuccess('success.challengeDeleted')
    navigateTo('/challenges')
  }
}

const onEdit = async (data: Partial<CreateChallengePayload>): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return
  const updated = await challengesStore.updateChallenge(c.id, data)
  if (updated) {
    challenge.value = updated
    showSuccess('success.challengeUpdated')
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <ChallengesChallengeDetailSkeleton v-if="isLoading" />

    <template v-else-if="challenge">
      <div class="flex items-center gap-2 animate-fade-in-up">
        <Button variant="ghost" size="icon-sm" @click="navigateTo('/challenges')">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm text-muted-foreground">{{ $t('challenges.back') }}</span>
      </div>

      <div class="flex flex-col items-center text-center space-y-3 animate-fade-in-up">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center"
          :style="{ backgroundColor: `${challenge.color}20` }"
        >
          <component
            :is="challengeIcon"
            class="h-8 w-8"
            :style="{ color: challenge.color }"
          />
        </div>
        <h1 class="text-xl font-bold">{{ challenge.title }}</h1>

        <Badge
          v-if="challenge.status !== 'active'"
          :variant="challenge.status === 'completed' ? 'default' : 'destructive'"
        >
          {{ challenge.status === 'completed' ? $t('challenges.statusCompleted')
            : challenge.status === 'failed' ? $t('challenges.statusFailed')
            : $t('challenges.statusAbandoned') }}
        </Badge>
      </div>

      <div class="flex justify-center animate-fade-in-up">
        <ChallengesChallengeProgress
          :percent="progressPercent"
          :size="140"
          :stroke-width="10"
          :color="challenge.color"
        >
          <div class="text-center">
            <div class="text-2xl font-bold">{{ progressPercent }}%</div>
            <div class="text-[10px] text-muted-foreground">
              {{ $t('challenges.dayOf', { current: currentDay, total: challenge.durationDays }) }}
            </div>
          </div>
        </ChallengesChallengeProgress>
      </div>

      <div
        v-if="challenge.allowedMisses > 0 && isActive"
        class="text-center text-xs text-muted-foreground"
      >
        {{ $t('challenges.missesLeft', { count: missesRemaining }) }}
      </div>
      <div
        v-else-if="challenge.allowedMisses === 0 && isActive"
        class="text-center text-xs text-muted-foreground"
      >
        {{ $t('challenges.noMissesAllowed') }}
      </div>

      <Card class="glass">
        <CardContent class="pt-4 pb-4">
          <ChallengesChallengeDayGrid
            :start-date="challenge.startDate"
            :duration-days="challenge.durationDays"
            :days="days"
            :color="challenge.color"
          />
        </CardContent>
      </Card>

      <div class="grid grid-cols-2 gap-3">
        <Card class="glass stagger-item" :style="{ '--stagger': 0 }">
          <CardContent class="pt-4 pb-4 flex flex-col items-center text-center">
            <Flame class="h-4 w-4 text-orange-500 mb-1" />
            <div class="text-2xl font-bold">{{ challenge.currentStreak }}</div>
            <div class="text-[10px] text-muted-foreground">{{ $t('challenges.currentStreak') }}</div>
          </CardContent>
        </Card>
        <Card class="glass stagger-item" :style="{ '--stagger': 1 }">
          <CardContent class="pt-4 pb-4 flex flex-col items-center text-center">
            <Flame class="h-4 w-4 text-primary mb-1" />
            <div class="text-2xl font-bold">{{ challenge.bestStreak }}</div>
            <div class="text-[10px] text-muted-foreground">{{ $t('challenges.bestStreak') }}</div>
          </CardContent>
        </Card>
        <Card class="glass stagger-item" :style="{ '--stagger': 2 }">
          <CardContent class="pt-4 pb-4 flex flex-col items-center text-center">
            <CheckCircle class="h-4 w-4 text-green-500 mb-1" />
            <div class="text-2xl font-bold">{{ challenge.completedDays }}</div>
            <div class="text-[10px] text-muted-foreground">{{ $t('challenges.completedDays') }}</div>
          </CardContent>
        </Card>
        <Card class="glass stagger-item" :style="{ '--stagger': 3 }">
          <CardContent class="pt-4 pb-4 flex flex-col items-center text-center">
            <X class="h-4 w-4 text-destructive mb-1" />
            <div class="text-2xl font-bold">{{ challenge.missedDays }}</div>
            <div class="text-[10px] text-muted-foreground">{{ $t('challenges.missedDays') }}</div>
          </CardContent>
        </Card>
      </div>

      <div v-if="challenge.description" class="animate-fade-in-up">
        <Card class="glass">
          <CardContent class="pt-4 pb-4">
            <p class="text-sm text-muted-foreground">{{ challenge.description }}</p>
          </CardContent>
        </Card>
      </div>

      <div v-if="isActive" class="space-y-3 animate-fade-in-up">
        <div v-if="showNoteField" class="space-y-2">
          <Input
            v-model="noteInput"
            :placeholder="$t('challenges.notePlaceholder')"
          />
        </div>

        <div class="flex gap-2">
          <Button
            v-if="!todayCheckedIn"
            class="flex-1 bg-gradient-primary border-0 text-white hover:opacity-90 h-12"
            @click="onCheckIn"
          >
            {{ $t('challenges.checkIn') }}
          </Button>
          <Button
            v-else
            variant="outline"
            class="flex-1 h-12"
            disabled
          >
            {{ $t('challenges.checked') }}
          </Button>

          <Button
            v-if="!todayCheckedIn"
            variant="outline"
            size="icon"
            class="h-12 w-12 shrink-0"
            @click="showNoteField = !showNoteField"
          >
            <Pencil class="h-4 w-4" />
          </Button>
        </div>

        <div v-if="todayCheckedIn" class="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            class="text-xs text-muted-foreground"
            @click="onUndoCheckIn"
          >
            {{ $t('habit.cancel') }}
          </Button>
        </div>
      </div>

      <div
        v-if="challenge.status === 'failed'"
        class="text-center text-sm text-muted-foreground animate-fade-in-up"
      >
        {{ $t('challenges.failedMessage', { days: challenge.completedDays }) }}
      </div>

      <div v-if="isActive" class="flex gap-2 animate-fade-in-up">
        <Button
          variant="outline"
          class="flex-1 glass"
          @click="showEditForm = true"
        >
          <Pencil class="h-4 w-4 mr-2" />
          {{ $t('challenges.edit') }}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" class="glass">
              <Flag class="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent class="glass-heavy">
            <AlertDialogHeader>
              <AlertDialogTitle>{{ $t('challenges.abandonConfirmTitle') }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ $t('challenges.abandonConfirmDescription', { days: challenge.completedDays }) }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ $t('challenges.cancel') }}</AlertDialogCancel>
              <AlertDialogAction @click="onAbandon">
                {{ $t('challenges.abandon') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" class="glass text-destructive">
              <Trash2 class="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent class="glass-heavy">
            <AlertDialogHeader>
              <AlertDialogTitle>{{ $t('challenges.deleteConfirmTitle') }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ $t('challenges.deleteConfirmDescription') }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ $t('challenges.cancel') }}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground" @click="onDelete">
                {{ $t('challenges.delete') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div v-if="!isActive" class="flex justify-center animate-fade-in-up">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" class="glass text-destructive">
              <Trash2 class="h-4 w-4 mr-2" />
              {{ $t('challenges.delete') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent class="glass-heavy">
            <AlertDialogHeader>
              <AlertDialogTitle>{{ $t('challenges.deleteConfirmTitle') }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ $t('challenges.deleteConfirmDescription') }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ $t('challenges.cancel') }}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground" @click="onDelete">
                {{ $t('challenges.delete') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ChallengesChallengeForm
        :open="showEditForm"
        edit-mode
        :initial-data="{ title: challenge.title, description: challenge.description ?? undefined, icon: challenge.icon, color: challenge.color }"
        @update:open="showEditForm = $event"
        @submit="onEdit"
      />

      <ChallengesChallengeCompleteOverlay
        :show="showChallengeComplete"
        :title="challenge.title"
        :duration-days="challenge.durationDays"
        :xp-bonus="completionXpBonus"
        @close="showChallengeComplete = false"
      />

      <GamificationLevelUpOverlay
        :show="showLevelUp"
        :level="levelUpLevel"
        @close="showLevelUp = false"
      />

      <GamificationAchievementPopup
        :show="showAchievementPopup"
        :achievement="pendingAchievement"
        @close="showAchievementPopup = false"
      />
    </template>
  </div>
</template>
