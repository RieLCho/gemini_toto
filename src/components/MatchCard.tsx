import { Trophy, MapPin, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { cn, getPredictionBadgeColor } from '@/lib/utils';
import type { Match, GameType } from '@/types';

interface MatchCardProps {
  match: Match;
  index: number;
  gameType: GameType;
}

export function MatchCard({ match, index, gameType }: MatchCardProps) {
  const { prediction, result, status } = match;
  const isPending = prediction.pick === 'Pending' || prediction.pick === '-';
  const isFinished = status === 'finished' && result;
  const isCorrect = isFinished && prediction.pick === result?.outcome;
  
  // 경기 상태 표시
  const getStatusBadge = () => {
    if (status === 'finished') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600/50 text-gray-300">
          종료
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-600/50 text-red-300 animate-pulse">
          진행중
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600/50 text-primary-300">
        예정
      </span>
    );
  };

  // 결과 표시 색상
  const getResultColor = (outcome: string) => {
    if (outcome === '승') return 'text-green-400';
    if (outcome === '패') return 'text-red-400';
    return 'text-yellow-400';
  };
  
  return (
    <div
      className={cn(
        'glass-card rounded-2xl overflow-hidden',
        'transform transition-all duration-300 hover:scale-[1.02] hover:glow',
        'animate-slide-up',
        isFinished && isCorrect && 'ring-2 ring-green-500/30',
        isFinished && !isCorrect && 'ring-2 ring-red-500/30'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-600 to-dark-700 px-5 py-3 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm',
            gameType === 'soccer' 
              ? 'bg-green-500/20 text-green-400'
              : 'bg-orange-500/20 text-orange-400'
          )}>
            {match.matchNumber}
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">
              {match.league || (gameType === 'soccer' ? '축구' : '농구')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} />
            <span>{match.datetime}</span>
          </div>
        </div>
      </div>

      {/* Teams Section */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <h3 className="font-bold text-lg text-white mb-1 truncate">
              {match.homeTeam}
            </h3>
            <span className="text-xs text-gray-500">홈</span>
          </div>

          {/* VS & Score */}
          <div className="flex flex-col items-center px-4">
            {isFinished && result ? (
              <>
                <span className="text-2xl font-bold text-white tracking-widest">
                  {result.homeScore} : {result.awayScore}
                </span>
                <span className={cn('text-sm font-bold mt-1', getResultColor(result.outcome))}>
                  {result.outcome}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-gray-500 mb-1">VS</span>
                {!isPending && (
                  <span className="text-2xl font-bold text-white/80 tracking-widest">
                    {prediction.score}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <h3 className="font-bold text-lg text-white mb-1 truncate">
              {match.awayTeam}
            </h3>
            <span className="text-xs text-gray-500">원정</span>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-500">
          <MapPin size={12} />
          <span>{match.venue}</span>
        </div>

        {/* Prediction Box */}
        <div className={cn(
          'mt-5 rounded-xl p-4 border relative overflow-hidden',
          isFinished && isCorrect 
            ? 'bg-green-900/20 border-green-500/30'
            : isFinished && !isCorrect
            ? 'bg-red-900/20 border-red-500/30'
            : 'bg-dark-800/50 border-white/5'
        )}>
          {/* Accent bar */}
          <div className={cn(
            'absolute top-0 left-0 w-1 h-full',
            isFinished && isCorrect
              ? 'bg-green-500'
              : isFinished && !isCorrect
              ? 'bg-red-500'
              : 'bg-gradient-to-b from-primary-500 via-blue-500 to-cyan-500'
          )} />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary-400" />
              <span className="text-xs font-semibold text-primary-400">AI 예측</span>
              {isFinished && (
                <span className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
                  isCorrect 
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                )}>
                  {isCorrect ? (
                    <>
                      <CheckCircle size={12} />
                      적중
                    </>
                  ) : (
                    <>
                      <XCircle size={12} />
                      실패
                    </>
                  )}
                </span>
              )}
            </div>
            {!isPending && (
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border',
                  getPredictionBadgeColor(prediction.pick)
                )}
              >
                {prediction.pick}
              </span>
            )}
          </div>
          
          {isPending ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                <span className="text-sm">분석 대기중...</span>
              </div>
            </div>
          ) : (
            <>
              {prediction.confidence && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">신뢰도</span>
                    <span className="text-white font-semibold">{prediction.confidence}%</span>
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-1.5">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-500',
                        prediction.confidence >= 70 ? 'bg-green-500' :
                        prediction.confidence >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                      )}
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                {prediction.reason}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
