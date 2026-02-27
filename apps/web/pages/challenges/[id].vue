<script setup lang="ts">
import type { Challenge, ChallengeDay, ChallengeParticipant, CreateChallengePayload, LeaderboardEntry } from '~/types/challenge'
import { ArrowLeft, Flame, Calendar, CheckCircle, X, Pencil, Flag, Trash2, Share2, Users, LogOut } from 'lucide-vue-next'

const route = useRoute()
const challengesStore = useChallengesStore()
const authStore = useAuthStore()
const gamificationStore = useGamificationStore()
const { hapticNotification } = useTelegram()
const { showSuccess, showInfo } = useErrorHandler()
const { resolveIcon } = useHabitIcon()
const { t } = useI18n()
const tg = useTelegram()

const challenge = ref<Challenge | null>(null)
const days = ref<ChallengeDay[]>([])
const todayCheckedIn = ref<boolean>(false)
const isCreator = ref<boolean>(true)
const participant = ref<ChallengeParticipant | null>(null)
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
const showAbandonSheet = ref<boolean>(false)
const selectedAbandonReason = ref<string>('')
const activeTab = ref<'progress' | 'leaderboard'>('progress')
const leaderboard = ref<LeaderboardEntry[]>([])
const isLoadingLeaderboard = ref<boolean>(false)
const showInviteSheet = ref<boolean>(false)
const inviteCode = ref<string | null>(null)

const ABANDON_REASONS = [
  'challenges.abandonReasonTooHard',
  'challenges.abandonReasonSchedule',
  'challenges.abandonReasonEarly',
  'challenges.abandonReasonOther',
] as const

const challengeId = computed<number>(() => Number(route.params.id))

const challengeIcon = computed(() =>
  resolveIcon(toValue(challenge)?.icon ?? null),
)

const progressPercent = computed<number>(() => {
  const c = toValue(challenge)
  if (!c || c.durationDays === 0) return 0
  const p = toValue(participant)
  const completed = p ? p.completedDays : c.completedDays
  const missed = p ? p.missedDays : c.missedDays
  const accounted = completed + missed
  return Math.min(Math.round((accounted / c.durationDays) * 100), 100)
})

const currentDay = computed<number>(() => {
  const c = toValue(challenge)
  if (!c) return 0
  const p = toValue(participant)
  return p ? p.completedDays + p.missedDays : c.completedDays + c.missedDays
})

const myCompletedDays = computed<number>(() => {
  const p = toValue(participant)
  return p ? p.completedDays : (toValue(challenge)?.completedDays ?? 0)
})

const myMissedDays = computed<number>(() => {
  const p = toValue(participant)
  return p ? p.missedDays : (toValue(challenge)?.missedDays ?? 0)
})

const myCurrentStreak = computed<number>(() => {
  const p = toValue(participant)
  return p ? p.currentStreak : (toValue(challenge)?.currentStreak ?? 0)
})

const myBestStreak = computed<number>(() => {
  const p = toValue(participant)
  return p ? p.bestStreak : (toValue(challenge)?.bestStreak ?? 0)
})

const isActive = computed<boolean>(() => toValue(challenge)?.status === 'active')

const missesRemaining = computed<number>(() => {
  const c = toValue(challenge)
  if (!c || !toValue(isCreator)) return 0
  return Math.max(0, c.allowedMisses - c.missedDays)
})

const currentUserId = computed<number>(() => authStore.user?.id ?? 0)

onMounted(async () => {
  const detail = await challengesStore.fetchChallenge(toValue(challengeId))
  if (detail) {
    challenge.value = detail.challenge
    days.value = detail.days
    todayCheckedIn.value = detail.todayCheckedIn
    isCreator.value = detail.isCreator
    participant.value = detail.participant
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

    // Update participant stats if applicable
    if (!toValue(isCreator) && toValue(participant)) {
      participant.value = {
        ...toValue(participant)!,
        completedDays: (toValue(participant)!.completedDays) + 1,
      }
    }

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
  const detail = await challengesStore.fetchChallenge(c.id)
  if (detail) {
    challenge.value = detail.challenge
    participant.value = detail.participant
  }
}

const onAbandon = async (): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return
  const reason = toValue(selectedAbandonReason) || undefined
  const updated = await challengesStore.abandonChallenge(c.id, reason)
  if (updated) {
    challenge.value = updated
    showAbandonSheet.value = false
    selectedAbandonReason.value = ''
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

const onLeave = async (): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return
  const ok = await challengesStore.leaveChallenge(c.id)
  if (ok) {
    navigateTo('/challenges')
  }
}

const onShowLeaderboard = async (): Promise<void> => {
  activeTab.value = 'leaderboard'
  if (leaderboard.value.length > 0) return
  const c = toValue(challenge)
  if (!c) return
  isLoadingLeaderboard.value = true
  leaderboard.value = await challengesStore.getLeaderboard(c.id)
  isLoadingLeaderboard.value = false
}

const onGenerateInvite = async (): Promise<void> => {
  const c = toValue(challenge)
  if (!c) return
  const code = await challengesStore.generateInviteCode(c.id)
  if (code) {
    inviteCode.value = code
    challenge.value = { ...c, inviteCode: code }
    showInviteSheet.value = true
    showSuccess('success.inviteGenerated')
  }
}

const onShareInvite = (): void => {
  const code = toValue(inviteCode) ?? toValue(challenge)?.inviteCode
  if (!code) return
  const shareText = `${t('challenges.shareInviteText')} ${code}`
  if (tg.webApp) {
    tg.webApp.openTelegramLink(
      `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`,
    )
  } else {
    navigator.clipboard.writeText(code).catch(() => {})
    showSuccess('success.linkCopied')
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

        <div class="flex gap-2 flex-wrap justify-center">
          <Badge v-if="!isCreator" variant="secondary">
            {{ $t('challenges.joined') }}
          </Badge>
          <Badge
            v-if="challenge.status !== 'active'"
            :variant="challenge.status === 'completed' ? 'default' : 'destructive'"
          >
            {{ challenge.status === 'completed' ? $t('challenges.statusCompleted')
              : challenge.status === 'failed' ? $t('challenges.statusFailed')
              : $t('challenges.statusAbandoned') }}
          </Badge>
        </div>
      </div>

      <!-- Tab switcher -->
      <div class="flex rounded-xl overflow-hidden border border-border glass animate-fade-in-up">
        <button
          class="flex-1 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'progress' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'"
          @click="activeTab = 'progress'"
        >
          {{ $t('challenges.progress') }}
        </button>
        <button
          class="flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          :class="activeTab === 'leaderboard' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'"
          @click="onShowLeaderboard"
        >
          <Users class="h-3.5 w-3.5" />
          {{ $t('challenges.leaderboard') }}
        </button>
      </div>

      <!-- Progress tab -->
      <template v-if="activeTab === 'progress'">
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
          v-if="isCreator && challenge.allowedMisses > 0 && isActive"
          class="text-center text-xs text-muted-foreground"
        >
          {{ $t('challenges.missesLeft', { count: missesRemaining }) }}
        </div>
        <div
          v-else-if="isCreator && challenge.allowedMisses === 0 && isActive"
          class="text-center text-xs text-muted-foreground"
        >
          {{ $t('challenges.noMissesAllowed') }}
        </div>

        <Card class="glass animate-fade-in-up">
          <CardContent class="pt-4 pb-4">
            <div class="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Calendar class="h-3.5 w-3.5" />
              {{ $t('challenges.recentDays') }}
            </div>
            <ChallengesChallengeMiniCalendar
              :days="days"
              :start-date="challenge.startDate"
              :duration-days="challenge.durationDays"
            />
          </CardContent>
        </Card>

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
              <div class="text-2xl font-bold">{{ myCurrentStreak }}</div>
              <div class="text-[10px] text-muted-foreground">{{ $t('challenges.currentStreak') }}</div>
            </CardContent>
          </Card>
          <Card class="glass stagger-item" :style="{ '--stagger': 1 }">
            <CardContent class="pt-4 pb-4 flex flex-col items-center text-center">
              <Flame class="h-4 w-4 text-primary mb-1" />
              <div class="text-2xl font-bold">{{ myBestStreak }}</div>
              <div class="text-[10px] text-muted-foreground">{{ $t('challenges.bestStreak') }}</div>
            </CardContent>
          </Card>
          <Card class="glass stagger-item" :style="{ '--stagger': 2 }">
            <CardContent class="pt-4 pb-4 flex flex-col items-center text-center">
              <CheckCircle class="h-4 w-4 text-green-500 mb-1" />
              <div class="text-2xl font-bold">{{ myCompletedDays }}</div>
              <div class="text-[10px] text-muted-foreground">{{ $t('challenges.completedDays') }}</div>
            </CardContent>
          </Card>
          <Card class="glass stagger-item" :style="{ '--stagger': 3 }">
            <CardContent class="pt-4 pb-4 flex flex-col items-center text-center">
              <X class="h-4 w-4 text-destructive mb-1" />
              <div class="text-2xl font-bold">{{ myMissedDays }}</div>
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

          <div v-if="todayCheckedIn && isCreator" class="flex justify-center">
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
          {{ $t('challenges.failedMessage', { days: myCompletedDays }) }}
        </div>

        <!-- Creator actions -->
        <div v-if="isActive && isCreator" class="space-y-2 animate-fade-in-up">
          <Button
            class="w-full glass"
            variant="outline"
            @click="onGenerateInvite"
          >
            <Share2 class="h-4 w-4 mr-2" />
            {{ challenge.inviteCode ? $t('challenges.shareInvite') : $t('challenges.inviteCode') }}
          </Button>

          <div class="flex gap-2">
            <Button
              variant="outline"
              class="flex-1 glass"
              @click="showEditForm = true"
            >
              <Pencil class="h-4 w-4 mr-2" />
              {{ $t('challenges.edit') }}
            </Button>

            <Button variant="outline" class="glass" @click="showAbandonSheet = true">
              <Flag class="h-4 w-4" />
            </Button>

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
        </div>

        <!-- Participant leave -->
        <div v-if="!isCreator && isActive" class="flex justify-center animate-fade-in-up">
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="ghost" size="sm" class="text-muted-foreground text-xs">
                <LogOut class="h-3.5 w-3.5 mr-1.5" />
                {{ $t('challenges.leave') }}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent class="glass-heavy">
              <AlertDialogHeader>
                <AlertDialogTitle>{{ $t('challenges.leaveConfirmTitle') }}</AlertDialogTitle>
                <AlertDialogDescription>{{ $t('challenges.leaveConfirmDescription') }}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ $t('challenges.cancel') }}</AlertDialogCancel>
                <AlertDialogAction class="bg-destructive text-destructive-foreground" @click="onLeave">
                  {{ $t('challenges.leave') }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div v-if="!isActive && isCreator" class="flex justify-center animate-fade-in-up">
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
      </template>

      <!-- Leaderboard tab -->
      <template v-else-if="activeTab === 'leaderboard'">
        <div v-if="isLoadingLeaderboard" class="space-y-2">
          <Skeleton v-for="i in 3" :key="i" class="h-14 rounded-xl" />
        </div>
        <div v-else-if="leaderboard.length === 0" class="text-center py-8 text-muted-foreground text-sm">
          {{ $t('challenges.leaderboardEmpty') }}
        </div>
        <ChallengesChallengeLeaderboard
          v-else
          :entries="leaderboard"
          :current-user-id="currentUserId"
        />
      </template>

      <!-- Sheets and overlays -->
      <Sheet :open="showAbandonSheet" @update:open="showAbandonSheet = $event">
        <SheetContent side="bottom" class="glass-heavy rounded-t-2xl pb-8">
          <SheetHeader class="mb-4">
            <SheetTitle>{{ $t('challenges.abandonConfirmTitle') }}</SheetTitle>
            <SheetDescription>
              {{ $t('challenges.abandonConfirmDescription', { days: myCompletedDays }) }}
            </SheetDescription>
          </SheetHeader>
          <div class="space-y-2 mb-6">
            <button
              v-for="reasonKey in ABANDON_REASONS"
              :key="reasonKey"
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-sm"
              :class="selectedAbandonReason === reasonKey
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border bg-transparent text-foreground'"
              @click="selectedAbandonReason = reasonKey"
            >
              <span>{{ $t(reasonKey) }}</span>
              <div
                class="w-4 h-4 rounded-full border-2 transition-colors shrink-0"
                :class="selectedAbandonReason === reasonKey ? 'border-primary bg-primary' : 'border-muted-foreground/30'"
              />
            </button>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" @click="showAbandonSheet = false">
              {{ $t('challenges.cancel') }}
            </Button>
            <Button
              variant="destructive"
              class="flex-1"
              :disabled="!selectedAbandonReason"
              @click="onAbandon"
            >
              {{ $t('challenges.abandon') }}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet :open="showInviteSheet" @update:open="showInviteSheet = $event">
        <SheetContent side="bottom" class="glass-heavy rounded-t-2xl pb-8">
          <SheetHeader class="mb-4">
            <SheetTitle>{{ $t('challenges.shareInvite') }}</SheetTitle>
            <SheetDescription>{{ $t('challenges.inviteDescription') }}</SheetDescription>
          </SheetHeader>
          <div class="bg-muted rounded-xl px-4 py-3 text-center font-mono text-lg font-bold tracking-widest mb-4">
            {{ inviteCode ?? challenge.inviteCode }}
          </div>
          <Button class="w-full bg-gradient-primary border-0 text-white" @click="onShareInvite">
            <Share2 class="h-4 w-4 mr-2" />
            {{ $t('challenges.shareInvite') }}
          </Button>
        </SheetContent>
      </Sheet>

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
