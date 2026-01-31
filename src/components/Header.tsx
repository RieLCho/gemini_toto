import { Sparkles, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { GameType } from '@/types';

interface HeaderProps {
  lastUpdated: string;
  soccerRound: string;
  basketballRound: string;
  activeTab: GameType;
}

export function Header({ lastUpdated, soccerRound, basketballRound, activeTab }: HeaderProps) {
  const currentRound = activeTab === 'soccer' ? soccerRound : basketballRound;
  
  return (
    <header className="relative pt-12 pb-16 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-32 right-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-200" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-700/80 border border-white/10 text-sm font-medium mb-6 animate-fade-in">
          <Sparkles size={14} className="text-primary-400" />
          <span className="text-gray-300">Gemini AI 기반 분석</span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <Calendar size={12} className="text-gray-400" />
          <span className="text-gray-400">{formatDate(lastUpdated)}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in animation-delay-100">
          <span className="gradient-text">스포츠토토</span>
          <br />
          <span className="text-white">AI 예측</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg text-gray-400 max-w-lg mx-auto animate-fade-in animation-delay-200">
          Google Gemini AI가 분석한 이번 주 경기 예측입니다.
        </p>
        
        {/* Round info */}
        {currentRound && (
          <div className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 animate-fade-in animation-delay-300">
            <span className={activeTab === 'soccer' ? 'mr-2' : 'mr-2'}>
              {activeTab === 'soccer' ? '⚽' : '🏀'}
            </span>
            <span className="text-primary-400 font-semibold">{currentRound}</span>
          </div>
        )}
      </div>
    </header>
  );
}
