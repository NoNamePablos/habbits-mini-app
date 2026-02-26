<script setup lang="ts">
import { Search, X, Flame, Target } from 'lucide-vue-next'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const habitsStore = useHabitsStore()
const challengesStore = useChallengesStore()
const { t } = useI18n()

const query = ref<string>('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.open,
  (val) => {
    if (val) {
      query.value = ''
      nextTick(() => toValue(inputRef)?.focus())
    }
  },
)

interface SearchResult {
  type: 'habit' | 'challenge'
  id: number
  name: string
  subtitle: string
  path: string
}

const results = computed<SearchResult[]>(() => {
  const q = toValue(query).trim().toLowerCase()
  if (q.length < 1) return []

  const out: SearchResult[] = []

  for (const h of toValue(habitsStore.habits)) {
    if (h.name.toLowerCase().includes(q) || (h.description ?? '').toLowerCase().includes(q)) {
      out.push({
        type: 'habit',
        id: h.id,
        name: h.name,
        subtitle: t(`timeOfDay.${h.timeOfDay}`),
        path: `/habits/${h.id}`,
      })
    }
  }

  for (const c of toValue(challengesStore.challenges)) {
    if (c.title.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q)) {
      out.push({
        type: 'challenge',
        id: c.id,
        name: c.title,
        subtitle: t(`challenges.status${c.status.charAt(0).toUpperCase() + c.status.slice(1)}`),
        path: `/challenges/${c.id}`,
      })
    }
  }

  return out.slice(0, 10)
})

const onSelect = (path: string): void => {
  emit('update:open', false)
  navigateTo(path)
}

const close = (): void => emit('update:open', false)
</script>

<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex flex-col"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="close" />

        <div class="relative z-10 mt-safe mx-4 mt-16 max-w-120 mx-auto w-full">
          <div class="glass-heavy rounded-2xl overflow-hidden shadow-2xl">
            <!-- Search input -->
            <div class="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search class="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref="inputRef"
                v-model="query"
                type="text"
                :placeholder="$t('search.placeholder')"
                class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                @keydown.escape="close"
              />
              <button
                v-if="query"
                class="text-muted-foreground hover:text-foreground transition-colors"
                @click="query = ''"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Results -->
            <div class="max-h-80 overflow-y-auto">
              <div
                v-if="results.length > 0"
                class="py-1"
              >
                <button
                  v-for="result in results"
                  :key="`${result.type}-${result.id}`"
                  class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/5 transition-colors text-left"
                  @click="onSelect(result.path)"
                >
                  <div
                    class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    :class="result.type === 'habit' ? 'bg-primary/15' : 'bg-orange-500/15'"
                  >
                    <Target v-if="result.type === 'habit'" class="h-3.5 w-3.5 text-primary" />
                    <Flame v-else class="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ result.name }}</div>
                    <div class="text-[10px] text-muted-foreground">{{ result.subtitle }}</div>
                  </div>
                </button>
              </div>

              <div
                v-else-if="query.length >= 1"
                class="py-8 text-center text-sm text-muted-foreground"
              >
                {{ $t('search.noResults') }}
              </div>

              <div
                v-else
                class="py-6 text-center text-xs text-muted-foreground"
              >
                {{ $t('search.hint') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.15s ease;
  .glass-heavy {
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
}
.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
  .glass-heavy {
    transform: translateY(-8px);
    opacity: 0;
  }
}
.mt-safe {
  margin-top: max(4rem, calc(env(safe-area-inset-top) + 3.5rem));
}
</style>
