"use client"

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Check, type LucideIcon } from "lucide-react"

interface FloatingInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string
  icon?: LucideIcon
  error?: string
  valid?: boolean
  rightElement?: ReactNode
  shake?: boolean
  /** Use the dashboard's dark-default/day-override surface instead of the plain light surface (login, admin, product pages). */
  dark?: boolean
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput(
  { label, icon: Icon, error, valid, rightElement, shake, dark, className, id, value, defaultValue, onFocus, onBlur, onChange, ...props },
  ref
) {
  const [focused, setFocused] = useState(false)
  const [localFilled, setLocalFilled] = useState(!!defaultValue)
  const [autofilled, setAutofilled] = useState(false)
  const inputId = id || label.replace(/\s+/g, "-").toLowerCase()
  const filled = value !== undefined ? String(value).length > 0 : localFilled
  const floated = focused || filled || autofilled

  const surfaceClass = dark ? "bg-slate-950/40 day:bg-white" : "bg-slate-50"
  const borderClass = dark ? "border-slate-800 day:border-slate-200" : "border-slate-200"
  const labelIdleClass = dark ? "text-slate-500" : "text-slate-400"
  const labelFloatedClass = dark ? "text-sky-500 day:text-sky-600" : "text-sky-600"
  const iconIdleClass = dark ? "text-slate-500" : "text-slate-400"
  const textClass = dark ? "text-white day:text-slate-900" : "text-slate-900"

  return (
    <div className={className}>
      <motion.div
        animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative rounded-xl border ${surfaceClass} transition-colors ${
          error
            ? "border-red-500/60"
            : focused
              ? "border-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,0.15)]"
              : borderClass
        }`}
      >
        {Icon && (
          <Icon
            className={`absolute left-3.5 w-4 h-4 transition-colors ${
              error ? "text-red-400" : focused ? "text-sky-400" : iconIdleClass
            } ${floated ? "top-[1.15rem]" : "top-1/2 -translate-y-1/2"}`}
          />
        )}
        <label
          htmlFor={inputId}
          className={`absolute pointer-events-none transition-all duration-200 ${Icon ? "left-9" : "left-3.5"} ${
            floated ? `top-2 text-[11px] font-medium ${labelFloatedClass}` : `top-1/2 -translate-y-1/2 text-sm ${labelIdleClass}`
          }`}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          onChange={(e) => {
            setLocalFilled(e.target.value.length > 0)
            onChange?.(e)
          }}
          onAnimationStart={(e) => {
            if (e.animationName === "onAutoFillStart") setAutofilled(true)
          }}
          className={`w-full bg-transparent outline-none text-sm ${textClass} pt-5 pb-2 ${
            Icon ? "pl-9" : "pl-3.5"
          } ${rightElement || valid ? "pr-10" : "pr-3.5"}`}
          {...props}
        />
        {valid && !rightElement && (
          <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
        )}
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </motion.p>
      )}
    </div>
  )
})
