import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50/30 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-6">
          <WifiOff className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re offline</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Smart Health Room needs a connection for live sensor data, alerts and the AI Assistant.
          Reconnect to the internet and reopen the app to resume monitoring.
        </p>
      </div>
    </div>
  )
}
