import { defineStore } from 'pinia'
import type {
  Challenge,
  ChallengeListItem,
  ChallengesListResponse,
  ChallengeDetailResponse,
  CheckInResponse,
  CreateChallengePayload,
  LeaderboardEntry,
  ChallengeInviteResponse,
} from '~/types/challenge'

export const useChallengesStore = defineStore('challenges', () => {
  const api = useApi()
  const { handleError } = useErrorHandler()

  const challenges = ref<ChallengeListItem[]>([])
  const isLoading = ref<boolean>(true)

  const activeChallenges = computed<ChallengeListItem[]>(() =>
    toValue(challenges).filter((c) => c.status === 'active'),
  )

  const historyChallenges = computed<ChallengeListItem[]>(() =>
    toValue(challenges).filter((c) => c.status !== 'active'),
  )

  const fetchChallenges = async (): Promise<void> => {
    isLoading.value = true
    try {
      const data = await api.get<ChallengesListResponse>('/challenges')
      challenges.value = data.challenges
    } catch (error) {
      handleError(error, 'errors.fetchChallenges')
    } finally {
      isLoading.value = false
    }
  }

  const fetchChallenge = async (id: number): Promise<ChallengeDetailResponse | null> => {
    try {
      return await api.get<ChallengeDetailResponse>(`/challenges/${id}`)
    } catch (error) {
      handleError(error, 'errors.fetchChallenge')
      return null
    }
  }

  const createChallenge = async (payload: CreateChallengePayload): Promise<Challenge | null> => {
    try {
      const challenge = await api.post<Challenge>('/challenges', payload)
      challenges.value = [...toValue(challenges), { ...challenge, todayCheckedIn: false }]
      return challenge
    } catch (error) {
      handleError(error, 'errors.createChallenge')
      return null
    }
  }

  const updateChallenge = async (id: number, payload: Partial<CreateChallengePayload>): Promise<Challenge | null> => {
    try {
      const updated = await api.patch<Challenge>(`/challenges/${id}`, payload)
      const idx = toValue(challenges).findIndex((c) => c.id === id)
      if (idx !== -1) {
        challenges.value[idx] = { ...updated, todayCheckedIn: challenges.value[idx].todayCheckedIn }
      }
      return updated
    } catch (error) {
      handleError(error, 'errors.updateChallenge')
      return null
    }
  }

  const deleteChallenge = async (id: number): Promise<boolean> => {
    try {
      await api.del(`/challenges/${id}`)
      challenges.value = toValue(challenges).filter((c) => c.id !== id)
      return true
    } catch (error) {
      handleError(error, 'errors.deleteChallenge')
      return false
    }
  }

  const checkIn = async (id: number, note?: string): Promise<CheckInResponse | null> => {
    try {
      const result = await api.post<CheckInResponse>(`/challenges/${id}/check-in`, { note })
      const idx = toValue(challenges).findIndex((c) => c.id === id)
      if (idx !== -1) {
        challenges.value[idx] = { ...result.challenge, todayCheckedIn: true }
      }
      return result
    } catch (error) {
      handleError(error, 'errors.checkInChallenge')
      return null
    }
  }

  const undoCheckIn = async (id: number, date: string): Promise<void> => {
    try {
      const updated = await api.del<Challenge>(`/challenges/${id}/check-in/${date}`)
      const idx = toValue(challenges).findIndex((c) => c.id === id)
      if (idx !== -1) {
        challenges.value[idx] = { ...updated, todayCheckedIn: false }
      }
    } catch (error) {
      handleError(error, 'errors.undoCheckIn')
    }
  }

  const abandonChallenge = async (id: number, reason?: string): Promise<Challenge | null> => {
    try {
      const updated = await api.post<Challenge>(`/challenges/${id}/abandon`, reason ? { reason } : {})
      const idx = toValue(challenges).findIndex((c) => c.id === id)
      if (idx !== -1) {
        challenges.value[idx] = { ...updated, todayCheckedIn: false, isCreator: true, participantStatus: null }
      }
      return updated
    } catch (error) {
      handleError(error, 'errors.abandonChallenge')
      return null
    }
  }

  const generateInviteCode = async (id: number): Promise<string | null> => {
    try {
      const result = await api.post<ChallengeInviteResponse>(`/challenges/${id}/invite`, {})
      return result.inviteCode
    } catch (error) {
      handleError(error, 'errors.generateInvite')
      return null
    }
  }

  const revokeInviteCode = async (id: number): Promise<boolean> => {
    try {
      await api.del(`/challenges/${id}/invite`)
      return true
    } catch (error) {
      handleError(error, 'errors.generateInvite')
      return false
    }
  }

  const joinByCode = async (code: string): Promise<ChallengeDetailResponse | null> => {
    try {
      return await api.post<ChallengeDetailResponse>(`/challenges/join/${code}`, {})
    } catch (error) {
      handleError(error, 'errors.joinChallenge')
      return null
    }
  }

  const getLeaderboard = async (id: number): Promise<LeaderboardEntry[]> => {
    try {
      return await api.get<LeaderboardEntry[]>(`/challenges/${id}/leaderboard`)
    } catch (error) {
      handleError(error, 'errors.fetchChallenges')
      return []
    }
  }

  const leaveChallenge = async (id: number): Promise<boolean> => {
    try {
      await api.del(`/challenges/${id}/participants/me`)
      challenges.value = toValue(challenges).filter((c) => c.id !== id)
      return true
    } catch (error) {
      handleError(error, 'errors.abandonChallenge')
      return false
    }
  }

  return {
    challenges,
    isLoading,
    activeChallenges,
    historyChallenges,
    fetchChallenges,
    fetchChallenge,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    checkIn,
    undoCheckIn,
    abandonChallenge,
    generateInviteCode,
    revokeInviteCode,
    joinByCode,
    getLeaderboard,
    leaveChallenge,
  }
})
