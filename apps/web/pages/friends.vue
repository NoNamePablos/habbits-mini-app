<script setup lang="ts">
import { Users, UserPlus, Check, X, Trash2, Copy, Share2 } from 'lucide-vue-next'

import { useClipboard } from '@vueuse/core'

const friendsStore = useFriendsStore()
const { showSuccess } = useErrorHandler()
const { t } = useI18n()
const { tg } = useTelegram()
const { copy } = useClipboard({ legacy: true })

const isLoading = ref<boolean>(true)

const getDisplayName = (username: string | null, firstName: string | null): string => {
  return firstName ?? username ?? t('friends.unknownUser')
}

onMounted(async () => {
  await Promise.all([
    friendsStore.fetchFriends(),
    friendsStore.fetchRequests(),
    friendsStore.fetchInviteCode(),
  ])
  isLoading.value = false
})

const onShareInvite = async (): Promise<void> => {
  const link = friendsStore.myInviteLink
  if (!link) return

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t('friends.inviteText'))}`,
    )
  } else {
    await copy(link)
    showSuccess('success.linkCopied')
  }
}

const onCopyCode = async (): Promise<void> => {
  const link = friendsStore.myInviteLink
  if (!link) return
  await copy(link)
  showSuccess('success.linkCopied')
}

const onAccept = async (id: number): Promise<void> => {
  const ok = await friendsStore.acceptRequest(id)
  if (ok) showSuccess('success.friendAccepted')
}

const onDecline = async (id: number): Promise<void> => {
  await friendsStore.declineRequest(id)
}

const onRemove = async (id: number): Promise<void> => {
  await friendsStore.removeFriend(id)
}
</script>

<template>
  <div class="p-4 space-y-5">
    <div class="flex items-center gap-2 animate-fade-in-up">
      <Users class="h-5 w-5 text-primary" />
      <h1 class="text-xl font-bold">{{ $t('friends.title') }}</h1>
    </div>

    <!-- Invite button -->
    <div class="flex gap-2 animate-fade-in-up">
      <Button
        class="flex-1 bg-gradient-primary border-0 text-white hover:opacity-90"
        @click="onShareInvite"
      >
        <Share2 class="h-4 w-4 mr-2" />
        {{ $t('friends.invite') }}
      </Button>
      <Button
        variant="outline"
        class="glass px-3 w-[36px] h-[36px] aspect-square"
        @click="onCopyCode"
      >
        <Copy class="h-4 w-4" />
      </Button>
    </div>

    <!-- Incoming requests -->
    <div v-if="friendsStore.requests.length > 0" class="animate-fade-in-up">
      <h2 class="text-sm font-semibold text-muted-foreground mb-2">
        {{ $t('friends.requests') }} ({{ friendsStore.requests.length }})
      </h2>
      <div class="space-y-2">
        <Card
          v-for="req in friendsStore.requests"
          :key="req.id"
          class="glass"
        >
          <CardContent class="pt-3 pb-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                v-if="req.requesterPhotoUrl"
                :src="req.requesterPhotoUrl"
                :alt="getDisplayName(req.requesterUsername, req.requesterFirstName)"
                class="w-full h-full object-cover"
              />
              <UserPlus v-else class="h-4 w-4 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">
                {{ getDisplayName(req.requesterUsername, req.requesterFirstName) }}
              </p>
              <p v-if="req.requesterUsername" class="text-xs text-muted-foreground">
                @{{ req.requesterUsername }}
              </p>
            </div>
            <div class="flex gap-1.5 shrink-0">
              <Button
                size="icon"
                variant="default"
                class="h-8 w-8 bg-primary/20 hover:bg-primary/30 text-primary border-0"
                @click="onAccept(req.id)"
              >
                <Check class="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                class="h-8 w-8 text-muted-foreground"
                @click="onDecline(req.id)"
              >
                <X class="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Friends list -->
    <div class="animate-fade-in-up">
      <h2 class="text-sm font-semibold text-muted-foreground mb-2">
        {{ $t('friends.myFriends') }} ({{ friendsStore.friends.length }})
      </h2>

      <div v-if="isLoading" class="space-y-2">
        <Skeleton v-for="i in 3" :key="i" class="h-16 rounded-xl" />
      </div>

      <div v-else-if="friendsStore.friends.length === 0" class="text-center py-8 text-muted-foreground">
        <Users class="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p class="text-sm">{{ $t('friends.empty') }}</p>
        <p class="text-xs mt-1">{{ $t('friends.emptyHint') }}</p>
      </div>

      <div v-else class="space-y-2">
        <Card
          v-for="friend in friendsStore.friends"
          :key="friend.friendshipId"
          class="glass"
        >
          <CardContent class="pt-3 pb-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                v-if="friend.photoUrl"
                :src="friend.photoUrl"
                :alt="getDisplayName(friend.username, friend.firstName)"
                class="w-full h-full object-cover"
              />
              <Users v-else class="h-4 w-4 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">
                {{ getDisplayName(friend.username, friend.firstName) }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ $t('xpBar.level', { level: friend.level }) }}
                · {{ friend.xp }} XP
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              class="h-8 w-8 text-muted-foreground shrink-0"
              @click="onRemove(friend.friendshipId)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
