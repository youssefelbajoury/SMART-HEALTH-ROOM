"use client"

import Link from "next/link"
import { ShieldOff } from "lucide-react"

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8">
          You do not have the necessary permissions to access this page.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-medium shadow-lg hover:shadow-xl hover:bg-sky-600 transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
