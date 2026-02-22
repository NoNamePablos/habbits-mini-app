import confetti from 'canvas-confetti'
import type { Options as ConfettiOptions } from 'canvas-confetti'

type ConfettiPreset = 'celebration' | 'burst' | 'rain'

const PRESETS: Record<ConfettiPreset, ConfettiOptions> = {
  celebration: {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  },
  burst: {
    particleCount: 60,
    spread: 100,
    startVelocity: 30,
    origin: { y: 0.5 },
  },
  rain: {
    particleCount: 150,
    spread: 180,
    startVelocity: 10,
    gravity: 0.6,
    origin: { y: 0 },
  },
}

interface UseConfettiReturn {
  fire: (preset?: ConfettiPreset, overrides?: ConfettiOptions) => void
}

export const useConfetti = (): UseConfettiReturn => {
  const fire = (preset: ConfettiPreset = 'celebration', overrides?: ConfettiOptions): void => {
    void confetti({
      ...PRESETS[preset],
      ...overrides,
    })
  }

  return { fire }
}
