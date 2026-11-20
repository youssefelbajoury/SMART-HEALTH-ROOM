import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DemoStage =
  | "welcome"
  | "normal"
  | "sensor-updates"
  | "warning"
  | "emergency"
  | "notifications"
  | "recommendation"
  | "analytics"
  | "health-report"
  | "recovery"
  | "finished"

export const DEMO_STAGE_ORDER: DemoStage[] = [
  "welcome",
  "normal",
  "sensor-updates",
  "warning",
  "emergency",
  "notifications",
  "recommendation",
  "analytics",
  "health-report",
  "recovery",
  "finished",
]

interface DemoState {
  enabled: boolean
  toggle: () => void
  setEnabled: (enabled: boolean) => void

  // Guided sequence — a deterministic, scripted walkthrough layered on top of
  // the same `enabled` flag/mutation mechanisms DemoSimulator already uses,
  // instead of DemoSimulator's random noise. Intentionally left out of the
  // persisted snapshot (see `partialize` below): a guided run should always
  // start fresh, only the `enabled` toggle itself is a real user preference.
  sequenceActive: boolean
  isPaused: boolean
  stageIndex: number
  stage: DemoStage
  startSequence: () => void
  pauseSequence: () => void
  resumeSequence: () => void
  restartSequence: () => void
  stopSequence: () => void
  advanceStage: () => void
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      enabled: false,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      setEnabled: (enabled) => set({ enabled }),

      sequenceActive: false,
      isPaused: false,
      stageIndex: 0,
      stage: "welcome",

      startSequence: () => set({ enabled: true, sequenceActive: true, isPaused: false, stageIndex: 0, stage: DEMO_STAGE_ORDER[0] }),

      pauseSequence: () => set({ isPaused: true }),

      resumeSequence: () => set({ isPaused: false }),

      restartSequence: () => set({ sequenceActive: true, isPaused: false, stageIndex: 0, stage: DEMO_STAGE_ORDER[0] }),

      stopSequence: () => set({ sequenceActive: false, isPaused: false, stageIndex: 0, stage: DEMO_STAGE_ORDER[0] }),

      advanceStage: () => {
        const { stageIndex } = get()
        const nextIndex = stageIndex + 1
        if (nextIndex >= DEMO_STAGE_ORDER.length) {
          set({ stageIndex: DEMO_STAGE_ORDER.length - 1, stage: "finished", isPaused: true })
          return
        }
        set({ stageIndex: nextIndex, stage: DEMO_STAGE_ORDER[nextIndex] })
      },
    }),
    {
      name: 'demo-mode-storage',
      partialize: (state) => ({ enabled: state.enabled }),
    }
  )
)
