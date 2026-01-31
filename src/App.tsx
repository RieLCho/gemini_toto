import { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { Header, MatchCard, Footer } from '@/components';
import predictionsData from '@/data/predictions.json';
import type { PredictionData, GameType } from '@/types';

function App() {
  const data = predictionsData as PredictionData;
  const { soccer, basketball, lastUpdated } = data;
  
  const [activeTab, setActiveTab] = useState<GameType>('soccer');

  const currentGame = activeTab === 'soccer' ? soccer : basketball;
  const hasMatches = currentGame?.matches && currentGame.matches.length > 0;

  // 적중률 계산
  const calculateAccuracy = () => {
    if (!currentGame?.matches) return null;
    
    const finishedMatches = currentGame.matches.filter(m => m.status === 'finished' && m.result);
    if (finishedMatches.length === 0) return null;
    
    const correctPredictions = finishedMatches.filter(m => 
      m.prediction.pick === m.result?.outcome
    ).length;
    
    return {
      correct: correctPredictions,
      total: finishedMatches.length,
      percentage: Math.round((correctPredictions / finishedMatches.length) * 100),
    };
  };

  const accuracy = calculateAccuracy();

  return (
    <div className="min-h-screen bg-dark-900">
      <Header 
        lastUpdated={lastUpdated} 
        soccerRound={soccer?.round || ''} 
        basketballRound={basketball?.round || ''} 
        activeTab={activeTab}
      />

      <main className="max-w-xl mx-auto px-4 pb-12">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('soccer')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'soccer'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600/50'
            }`}
          >
            <span className="mr-2">⚽</span>
            축구토토 승무패
          </button>
          <button
            onClick={() => setActiveTab('basketball')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'basketball'
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600/50'
            }`}
          >
            <span className="mr-2">🏀</span>
            농구토토 승5패
          </button>
        </div>

        {/* Accuracy Stats (if available) */}
        {accuracy && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">현재 회차 적중률</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary-400">
                  {accuracy.percentage}%
                </span>
                <span className="text-sm text-gray-500">
                  ({accuracy.correct}/{accuracy.total})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <Activity size={18} className="text-primary-500" />
          <span className="text-sm font-semibold text-gray-400">
            {activeTab === 'soccer' ? '축구 경기 목록' : '농구 경기 목록'}
          </span>
          <div className="h-px flex-1 bg-white/10" />
          {hasMatches && (
            <span className="text-xs text-gray-500">
              총 {currentGame.matches.length}경기
            </span>
          )}
        </div>

        {/* Match List */}
        {hasMatches ? (
          <div className="space-y-4">
            {currentGame.matches.map((match, index) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                index={index} 
                gameType={activeTab}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <RefreshCw size={48} className="mx-auto text-gray-600 mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              경기 데이터를 불러오는 중...
            </h3>
            <p className="text-sm text-gray-500">
              잠시 후 다시 확인해 주세요.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
