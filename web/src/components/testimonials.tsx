"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const reviews = [
  { name: "Mohammed A.", avatar: "MA", rating: 5, date: "June 15, 2026", text: "Excellent system! Real-time monitoring is impressive." },
  { name: "Youssef K.", avatar: "YK", rating: 5, date: "June 12, 2026", text: "Easy setup and a very intuitive interface. The alerts are super useful." },
  { name: "Sarah L.", avatar: "SL", rating: 4, date: "June 10, 2026", text: "Very satisfied with the product. The dashboard looks great and the data is accurate." },
  { name: "Ahmed B.", avatar: "AB", rating: 5, date: "June 8, 2026", text: "The best IoT health solution I've tested. Professional and reliable." },
  { name: "Fatima Z.", avatar: "FZ", rating: 5, date: "June 5, 2026", text: "I love the design and the animations. My space is now perfectly monitored." },
  { name: "Karim D.", avatar: "KD", rating: 4, date: "June 2, 2026", text: "Great value for money. Technical support is very responsive." },
]

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        ))}
      </div>
      <div className="flex items-start gap-3 mb-4">
        <Quote className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" />
        <p className="text-slate-600 text-sm leading-relaxed">{review.text}</p>
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {review.avatar}
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{review.name}</p>
          <p className="text-xs text-slate-400">{review.date}</p>
        </div>
      </div>
    </div>
  )
}

export function Testimonials() {
  const doubled = [...reviews, ...reviews]

  return (
    <section className="py-20 bg-slate-50/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">What Our Users Say</h2>
          <p className="text-slate-500">What the community thinks of Smart Health Room</p>
        </motion.div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
        <motion.div animate={{ x: [0, -50 * reviews.length * 4] }} transition={{ x: { duration: 40, repeat: Infinity, ease: "linear" } }}
          className="flex gap-6 w-max hover:[animation-play-state:paused]">
          {doubled.map((review, i) => (
            <div key={i} className="w-[350px] flex-shrink-0">
              <ReviewCard review={review} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}