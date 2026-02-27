export interface Friend {
  friendshipId: number
  userId: number
  username: string | null
  firstName: string | null
  photoUrl: string | null
  level: number
  xp: number
}

export interface FriendRequest {
  id: number
  requesterId: number
  requesterUsername: string | null
  requesterFirstName: string | null
  requesterPhotoUrl: string | null
  createdAt: string
}

export interface FriendInviteCodeResponse {
  code: string
  link: string
}
