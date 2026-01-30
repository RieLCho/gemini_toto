import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Activity } from 'lucide-react'
import MatchCard from './components/MatchCard'
import data from './data/predictions.json'

function App() {
  const { matches, lastUpdated } = data;

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <header className="relative pt-12 pb-16 px-4 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary-glow mb-6"
          >
            <Sparkles size={14} className="text-accent-teal" />
            <span>AI-Powered Analysis</span>
            <div className="w-1 h-1 rounded-full bg-white/20 mx-1" />
            <span className="text-slate-400">Updated: {lastUpdated}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white via-white to-slate-400 text-transparent bg-clip-text"
          >
            Gemini Sports
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-lg mx-auto"
          >
            Next-generation sports predictions powered by advanced machine learning models.
          </motion.p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-400 mb-6 px-2">
          <Activity size={18} className="text-primary-500" />
          <span>Upcoming Matches</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-4">
          {matches.map((match, index) => (
            <MatchCard key={match.id} match={match} index={index} />
          ))}
        </div>
      </main>
      
      <footer className="mt-20 text-center text-slate-600 text-xs pb-8">
        <p>© 2024 Gemini Sports. For entertainment purposes only.</p>
      </footer>
    </div>
  )
}

export default App
