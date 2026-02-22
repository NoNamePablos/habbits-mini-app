import type { Component } from 'vue'
import {
  Dumbbell, BookOpen, PersonStanding, Heart,
  Droplets, Target, Pencil, Music,
  Sprout, BedDouble, Apple, Brain, Sparkles,
} from 'lucide-vue-next'

const ICON_MAP: Record<string, Component> = {
  Dumbbell,
  BookOpen,
  PersonStanding,
  Heart,
  Droplets,
  Target,
  Pencil,
  Music,
  Sprout,
  BedDouble,
  Apple,
  Brain,
  Sparkles,
}

interface UseHabitIconReturn {
  resolveIcon: (name: string | null) => Component
  ICON_MAP: Record<string, Component>
}

export const useHabitIcon = (): UseHabitIconReturn => {
  const resolveIcon = (name: string | null): Component => {
    if (!name) return Sparkles
    return ICON_MAP[name] ?? Sparkles
  }

  return { resolveIcon, ICON_MAP }
}
