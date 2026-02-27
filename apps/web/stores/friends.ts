import { defineStore } from 'pinia'
import type { Friend, FriendRequest, FriendInviteCodeResponse } from '~/types/friend'

export const useFriendsStore = defineStore('friends', () => {
  const api = useApi()
  const { handleError } = useErrorHandler()

  const friends = ref<Friend[]>([])
  const requests = ref<FriendRequest[]>([])
  const myInviteCode = ref<string | null>(null)
  const myInviteLink = ref<string | null>(null)
  const isLoading = ref<boolean>(false)

  const pendingCount = computed<number>(() => toValue(requests).length)

  const fetchFriends = async (): Promise<void> => {
    isLoading.value = true
    try {
      friends.value = await api.get<Friend[]>('/friends')
    } catch (error) {
      handleError(error, 'errors.fetchFriends')
    } finally {
      isLoading.value = false
    }
  }

  const fetchRequests = async (): Promise<void> => {
    try {
      requests.value = await api.get<FriendRequest[]>('/friends/requests')
    } catch (error) {
      handleError(error, 'errors.fetchFriends')
    }
  }

  const fetchInviteCode = async (): Promise<void> => {
    try {
      const data = await api.get<FriendInviteCodeResponse>('/friends/invite-code')
      myInviteCode.value = data.code
      myInviteLink.value = data.link
    } catch (error) {
      handleError(error, 'errors.fetchFriends')
    }
  }

  const fetchPendingCount = async (): Promise<void> => {
    try {
      const data = await api.get<{ count: number }>('/friends/pending-count')
      // Sync local requests list length if not already loaded
      if (toValue(requests).length === 0 && data.count > 0) {
        await fetchRequests()
      }
    } catch {
      // Silently ignore badge fetch errors
    }
  }

  const requestByCode = async (code: string): Promise<boolean> => {
    try {
      await api.post('/friends/request/' + code, {})
      return true
    } catch (error) {
      handleError(error, 'errors.friendRequest')
      return false
    }
  }

  const acceptRequest = async (id: number): Promise<boolean> => {
    try {
      await api.patch(`/friends/${id}/accept`, {})
      const req = toValue(requests).find((r) => r.id === id)
      if (req) {
        requests.value = toValue(requests).filter((r) => r.id !== id)
        // Add to friends list optimistically
        friends.value = [
          ...toValue(friends),
          {
            friendshipId: id,
            userId: req.requesterId,
            username: req.requesterUsername,
            firstName: req.requesterFirstName,
            photoUrl: req.requesterPhotoUrl,
            level: 1,
            xp: 0,
          },
        ]
      }
      return true
    } catch (error) {
      handleError(error, 'errors.friendRequest')
      return false
    }
  }

  const declineRequest = async (id: number): Promise<boolean> => {
    try {
      await api.patch(`/friends/${id}/decline`, {})
      requests.value = toValue(requests).filter((r) => r.id !== id)
      return true
    } catch (error) {
      handleError(error, 'errors.friendRequest')
      return false
    }
  }

  const removeFriend = async (id: number): Promise<boolean> => {
    try {
      await api.del(`/friends/${id}`)
      friends.value = toValue(friends).filter((f) => f.friendshipId !== id)
      return true
    } catch (error) {
      handleError(error, 'errors.fetchFriends')
      return false
    }
  }

  return {
    friends,
    requests,
    myInviteCode,
    myInviteLink,
    isLoading,
    pendingCount,
    fetchFriends,
    fetchRequests,
    fetchInviteCode,
    fetchPendingCount,
    requestByCode,
    acceptRequest,
    declineRequest,
    removeFriend,
  }
})
