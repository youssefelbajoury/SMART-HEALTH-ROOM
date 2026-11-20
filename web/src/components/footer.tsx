"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Github, Linkedin, Instagram, Facebook, Mail, MessageCircle, ArrowUp } from "lucide-react"

const footerLinks = {
  product: [
    { label: "Features", href: "/product" },
    { label: "Pricing", href: "#" },
    { label: "Documentation", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
  ],
}

const socialLinks = [
  { icon: Github, href: "https://github.com/Joseeeeeeph", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/youssef-el-bajoury-192451375/?locale=en", label: "LinkedIn" },
  { icon: Instagram, href: "https://www.instagram.com/__joseeeeeeph/", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100072865947560", label: "Facebook" },
  { icon: Mail, href: "mailto:youssefelbajoury321@gmail.com", label: "Email" },
  { icon: MessageCircle, href: "https://wa.me/212688039822", label: "WhatsApp" },
]

export function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400)
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <footer className="relative bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <img src="/images/logo.png" alt="Smart Health Room logo" className="h-9 w-auto object-contain" />
              <span className="font-bold text-lg text-slate-900">
                Smart<span className="text-sky-500">Health</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-2">
              The intelligent IoT platform for real-time health monitoring.
              Security, reliability and modern design.
            </p>
            <p className="text-slate-400 text-xs mb-6">Developed by Youssef El Bajoury</p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  whileHover={{ y: -3, scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-200 hover:shadow-md transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) =>
                  link.href === "#" ? (
                    <li key={link.label}>
                      <span className="text-slate-400 text-sm cursor-default">{link.label}</span>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link href={link.href} className="text-slate-500 text-sm hover:text-sky-600 transition-colors">{link.label}</Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">© 2026 Smart Health Room. All rights reserved.</p>
          <p className="text-slate-400 text-xs">Designed with precision for connected healthcare.</p>
        </div>
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 flex items-center justify-center transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  )
}
