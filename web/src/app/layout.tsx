import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SocketProvider } from "@/components/providers/SocketProvider"
import { SessionGuard } from "@/components/providers/SessionGuard"
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Health Room",
  description: "IoT Health Monitoring Platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: { title: "SmartHealth", statusBarStyle: "black-translucent" },
}

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionGuard />
        <ServiceWorkerRegister />
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  )
}