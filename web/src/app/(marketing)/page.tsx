"use client"

import { motion, useReducedMotion } from "framer-motion"
import { RevealText } from "@/components/ui/reveal-text"
import { fadeUp, staggerContainer } from "@/lib/motion"
import {
  Wifi,
  Shield,
  Smartphone,
  Moon,
  ArrowRight,
  Play,
  Star,
  Thermometer,
  Droplets,
  Wind,
  Volume2,
  Sun,
  Bell,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Testimonials } from "@/components/testimonials"

const features = [
  {
    icon: Thermometer,
    title: "Temperature",
    desc: "Precise real-time monitoring with intelligent alerts.",
    color: "bg-orange-50 text-orange-500",
  },
  {
    icon: Droplets,
    title: "Humidity",
    desc: "Optimal air control for a healthy environment.",
    color: "bg-blue-50 text-blue-500",
  },
  {
    icon: Wind,
    title: "Air Quality",
    desc: "Gas and pollutant detection for your safety.",
    color: "bg-emerald-50 text-emerald-500",
  },
  {
    icon: Volume2,
    title: "Sound Level",
    desc: "Acoustic analysis for optimal rest.",
    color: "bg-violet-50 text-violet-500",
  },
  {
    icon: Sun,
    title: "Light Level",
    desc: "Automatic adaptation to ambient light.",
    color: "bg-amber-50 text-amber-500",
  },
  {
    icon: Bell,
    title: "AI Alerts",
    desc: "Intelligent notifications based on your data.",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: Wifi,
    title: "Real-Time IoT",
    desc: "Instant transmission via ESP32 & Arduino.",
    color: "bg-cyan-50 text-cyan-500",
  },
  {
    icon: Shield,
    title: "Security",
    desc: "Encryption and protection for your health data.",
    color: "bg-indigo-50 text-indigo-500",
  },
]

const stats = [
  { value: "+5000", label: "Sensors analyzed", icon: TrendingUp },
  { value: "99.9%", label: "System reliability", icon: Shield },
  { value: "+12K", label: "Active users", icon: Users },
  { value: "<50ms", label: "Average latency", icon: Clock },
]

const highlights = [
  {
    icon: Wifi,
    title: "Connected",
    description: "ESP32 with WiFi for real-time data",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "JWT authentication and data encryption",
  },
  {
    icon: Smartphone,
    title: "Cross-Platform",
    description: "Available on Web, iOS and Android",
  },
  {
    icon: Moon,
    title: "Sleep Score",
    description: "Intelligent sleep quality algorithm",
  },
]

export default function HomePage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-sky-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-sm font-medium mb-6"
              >
                <Star className="w-4 h-4 fill-sky-500" />
                Next-generation IoT
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                <RevealText text="SMART" as="span" className="block" delay={0.35} />
                <RevealText
                  text="HEALTH ROOM"
                  as="span"
                  className="block"
                  wordClassName="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600"
                  delay={0.5}
                />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
                className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg"
              >
                The intelligent platform that monitors your environment in real time.
                Sensors, analytics and alerts for an optimal living space.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer(0.12, 1.05)}
                className="flex flex-wrap gap-4"
              >
                <motion.div variants={fadeUp}>
                  <Link
                    href="/product"
                    className="group inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-sky-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    Discover
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Link
                    href="/product"
                    className="group inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    View Product
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50 transition-colors"
              >
                <Image
                  src="/images/home-hero.webp"
                  alt="Smart Health Room dashboard showing real-time temperature, humidity, air quality and sleep score monitoring in a connected bedroom"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-contain"
                />
              </motion.div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center"
              >
                <Thermometer className="w-8 h-8 text-orange-500" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center"
              >
                <Droplets className="w-8 h-8 text-blue-500" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Highlights (from your original) */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Smart Health Room?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              A complete solution designed for intelligent monitoring of your environment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Intelligent Sensors
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              A complete suite of sensors to monitor every aspect of your environment.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sky-50 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-sky-500" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 p-10 lg:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to transform your space?
              </h2>
              <p className="text-sky-100 mb-8 max-w-xl mx-auto">
                Join thousands of users monitoring their environment in real time.
              </p>
              <Link
                href="/product"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-sky-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Discover the Product
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}