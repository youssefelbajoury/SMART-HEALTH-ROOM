// Synthesized notification tone via Web Audio — there is no mp3/audio asset
// pipeline in this project, so this is "the existing notification sound"
// (originally private to EmergencyCountdown, extracted for reuse).
export function playNotificationSound() {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextCtor()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.2)
    oscillator.onended = () => ctx.close()
  } catch {
    // Web Audio unavailable — visual-only fallback
  }
}
