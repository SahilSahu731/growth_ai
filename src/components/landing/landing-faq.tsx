"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function LandingFAQ() {
  const faqs = [
    {
      question: "What can I compare with PickAI?",
      answer: "Anything. Try comparing laptops, smartphones, apartments, job offers, mortgages, cars, courses, subscriptions, insurance plans, credit cards, travel packages, schools, or custom categories. The AI adapts to any decision type.",
    },
    {
      question: "How does the scoring work?",
      answer: "You set criteria (price, battery, warranty, etc.) and assign weights to show what matters most. PickAI scores each option 1-10 per criterion, then calculates a weighted average. You can adjust weights anytime and see results update instantly.",
    },
    {
      question: "What does 'hidden costs' mean?",
      answer: "We look beyond the sticker price. We flag taxes, subscription fees, maintenance, commute costs, cancellation penalties, setup fees, renewal pricing, interest, and other gotchas that add real cost over time.",
    },
    {
      question: "Can I share my comparison with others?",
      answer: "Yes. You can download a PDF report or share a link (shareable reports coming soon). Perfect for involving family, partners, or colleagues in the decision.",
    },
    {
      question: "Is there a free plan?",
      answer: "Yes. Guests can try one temporary comparison. Signed-in free users get 3 saved comparisons/month with limited uploads and research. Pro plans unlock unlimited everything.",
    },
    {
      question: "Can I upload files or paste URLs?",
      answer: "Yes. Upload receipts, quotes, job letters, or screenshots. Paste product links. PickAI pull data, extracts text from images and PDFs, and uses it in your comparison analysis.",
    },
    {
      question: "How does live web research work?",
      answer: "When you want current data, PickAI searches the web and attaches sources. Every research finding is linked to its source card with a fetched date, so you know where the info came from.",
    },
    {
      question: "What's the 'questions to ask' feature?",
      answer: "AI generates must-ask, good-to-ask, and negotiation-leverage questions for sellers, landlords, employers, or providers. Example: For apartments, we ask about lease flexibility, utilities included, and move-in costs.",
    },
    {
      question: "Can I edit my comparison after creating it?",
      answer: "Absolutely. Change options, add criteria, adjust weights, upload new evidence—everything updates live. Your comparison is a living document until you decide.",
    },
    {
      question: "Do you store my data?",
      answer: "Yes, securely. Only if you sign in. Guest comparisons are temporary and deleted after logout. Signed-in users can save, archive, and revisit comparisons anytime.",
    },
  ]

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <div className="text-center mb-12">
        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-widest">
          Questions
        </p>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Frequently asked</h2>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, idx) => (
          <AccordionItem
            key={idx}
            value={`item-${idx}`}
            className="rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] px-6 data-[state=open]:border-blue-500/50 data-[state=open]:bg-white/10 transition-all duration-300"
          >
            <AccordionTrigger className="text-left text-sm font-semibold text-white hover:text-blue-300 transition-colors py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-zinc-400 pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Still have questions? CTA */}
      <div className="mt-12 text-center">
        <p className="text-zinc-400 mb-4">Can&apos;t find what you&apos;re looking for?</p>
        <a href="mailto:support@pickai.app" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium">
          Contact our support →
        </a>
      </div>
    </section>
  )
}
