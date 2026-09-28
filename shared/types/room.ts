export type CallMode = 'video' | 'audio'
export type Role = 'host' | 'guest'
export interface IceCandidate { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null; usernameFragment?: string | null }
export interface SessionDescription { type: 'offer' | 'answer'; sdp: string }
export interface Participant {
  id: string
  name: string
  role: Role
  approved: boolean
  online: boolean
}
export interface RoomSnapshot {
  id: string
  title: string
  mode: CallMode
  expiresAt: number
  selfId: string
  participants: Participant[]
}
export type ClientSignal =
  | { type: 'approve'; participantId: string }
  | { type: 'reject'; participantId: string }
  | { type: 'ready' }
  | { type: 'signal'; description?: SessionDescription; candidate?: IceCandidate }
  | { type: 'media'; audio: boolean; video: boolean }
  | { type: 'leave' }
  | { type: 'end' }
  | { type: 'ping' }
export type ServerSignal =
  | { type: 'state'; room: RoomSnapshot }
  | { type: 'start' }
  | { type: 'signal'; description?: SessionDescription; candidate?: IceCandidate }
  | { type: 'media'; audio: boolean; video: boolean }
  | { type: 'peer-left' }
  | { type: 'ended'; reason: string }
  | { type: 'error'; message: string }
  | { type: 'pong' }
