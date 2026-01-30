import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, ChevronRight } from 'lucide-react';

const MatchCard = ({ match, index }) => {
  const isWin = match.prediction.pick === match.homeTeam;
  const isLoss = match.prediction.pick === match.awayTeam;
  const isDraw = match.prediction.pick === 'Draw';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-2xl p-0 overflow-hidden group hover:border-primary-500/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="bg-white/5 px-5 py-3 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-accent-purple" />
          <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">{match.league}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock size={12} />
          <span>{match.time}</span>
        </div>
      </div>
      
      {/* Teams */}
      <div className="p-6 relative">
        <div className="flex justify-between items-center z-10 relative">
          {/* Home */}
          <div className="text-center flex-1">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-1 group-hover:text-white transition-colors">
              {match.homeTeam}
            </h3>
            {isWin && (
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/20">
                WINNER
              </span>
            )}
          </div>

          {/* VS */}
          <div className="px-4 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-500 mb-1">VS</span>
            <span className="text-2xl font-display font-bold text-white/10 tracking-widest">
              {match.prediction.score}
            </span>
          </div>

          {/* Away */}
          <div className="text-center flex-1">
            <h3 className="font-display font-bold text-lg text-slate-100 mb-1 group-hover:text-white transition-colors">
              {match.awayTeam}
            </h3>
            {isLoss && (
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/20">
                WINNER
              </span>
            )}
          </div>
        </div>

        {/* Prediction Box */}
        <div className="mt-6 bg-slate-950/30 rounded-xl p-4 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-accent-purple" />
          
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-medium text-primary-400 block mb-0.5">Gemini's Pick</span>
              <span className="text-sm font-bold text-white flex items-center gap-1">
                {match.prediction.pick}
                <ChevronRight size={12} className="text-slate-500" />
              </span>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-2 mt-2">
            {match.prediction.reason}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;
