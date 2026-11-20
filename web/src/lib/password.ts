export interface PasswordRequirement {
  label: string
  met: boolean
}

export interface PasswordStrength {
  score: number // 0-5
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong"
  color: string
  requirements: PasswordRequirement[]
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ]

  const score = password.length === 0 ? 0 : requirements.filter((r) => r.met).length

  const levels: { label: PasswordStrength["label"]; color: string }[] = [
    { label: "Very weak", color: "#ef4444" },
    { label: "Very weak", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#22c55e" },
    { label: "Strong", color: "#10b981" },
  ]

  return { score, ...levels[score], requirements }
}
