export const HAPTIC_IMPACT_STYLES = ['light', 'medium', 'heavy', 'rigid', 'soft'] as const
export type HapticImpactStyle = typeof HAPTIC_IMPACT_STYLES[number]

export const HAPTIC_NOTIFICATION_TYPES = ['success', 'error', 'warning'] as const
export type HapticNotificationType = typeof HAPTIC_NOTIFICATION_TYPES[number]
