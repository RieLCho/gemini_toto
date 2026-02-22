import { GoogleGenAI, Type } from '@google/genai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../src/data/predictions.json');

type GameType = 'soccer' | 'basketball';

interface Prediction {
  pick: '승' | '무' | '패';
  score: string;
  reason: string;
  confidence: number;
}

interface Match {
  id: string;
  matchNumber: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  venue: string;
  gameType: GameType;
  prediction: Prediction;
  result?: {
    homeScore?: number;
    awayScore?: number;
    outcome: '승' | '무' | '패' | '미정';
  };
  status?: 'scheduled' | 'in_progress' | 'finished';
}

interface GameData {
  round: string;
  gmId: string;
  gmTs: string;
  matches: Match[];
}

interface PredictionData {
  lastUpdated: string;
  soccer: GameData;
  basketball: GameData;
}

// Gemini AI 초기화
const ai = new GoogleGenAI({});

// 축구 승무패 예측용 프롬프트
function createSoccerPrompt(matches: Match[]): string {
  const matchList = matches.map((m) => 
    `${m.matchNumber}. ${m.homeTeam} vs ${m.awayTeam} (${m.datetime}, ${m.venue})`
  ).join('\n');

  return `당신은 전문 축구 분석가입니다. 아래 축구토토 승무패 경기들에 대해 예측을 해주세요.

**축구토토 승무패**: 홈팀 기준으로 승리(승), 무승부(무), 패배(패)를 예측하는 게임입니다.

각 경기에 대해 다음을 제공해주세요:
- pick: 홈팀 기준 "승", "무", "패" 중 하나
- score: 예상 스코어 (예: "2-1")
- reason: 한국어로 된 간단한 예측 근거 (50자 내외)
- confidence: 예측 신뢰도 (0-100 사이 정수)

분석할 경기 목록:
${matchList}

중요: 실제 팀들의 최근 폼, 상대 전적, 홈/원정 성적 등을 고려해서 합리적인 예측을 해주세요.`;
}

// 농구 승5패 예측용 프롬프트
function createBasketballPrompt(matches: Match[]): string {
  const matchList = matches.map((m) => 
    `${m.matchNumber}. ${m.homeTeam} vs ${m.awayTeam} (${m.datetime}, ${m.venue})`
  ).join('\n');

  return `당신은 전문 농구 분석가입니다. 아래 농구토토 승5패 경기들에 대해 예측을 해주세요.

**농구토토 승5패**: 5개 경기의 홈팀 승패를 예측하는 게임입니다. 농구는 무승부가 없으므로 "승" 또는 "패"만 가능합니다.

각 경기에 대해 다음을 제공해주세요:
- pick: 홈팀 기준 "승" 또는 "패" 중 하나 (무승부 없음!)
- score: 예상 스코어 (예: "105-98")
- reason: 한국어로 된 간단한 예측 근거 (50자 내외)
- confidence: 예측 신뢰도 (0-100 사이 정수)

분석할 경기 목록:
${matchList}

중요: 
- 농구는 무승부가 없습니다. 반드시 "승" 또는 "패"만 선택하세요.
- KBL(한국 프로농구), NBA 등 리그별 특성을 고려해주세요.`;
}

// 공통 응답 스키마
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    predictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          matchNumber: {
            type: Type.INTEGER,
            description: '경기 번호',
          },
          pick: {
            type: Type.STRING,
            description: '예측 결과: 승, 무, 패 중 하나 (농구는 승, 패만)',
          },
          score: {
            type: Type.STRING,
            description: '예상 스코어 (예: 2-1 또는 105-98)',
          },
          reason: {
            type: Type.STRING,
            description: '예측 근거 (한국어, 50자 내외)',
          },
          confidence: {
            type: Type.INTEGER,
            description: '신뢰도 (0-100)',
          },
        },
        propertyOrdering: ['matchNumber', 'pick', 'score', 'reason', 'confidence'],
      },
    },
  },
};

// API 호출 함수
async function callGeminiAPI(prompt: string): Promise<Array<{
  matchNumber: number;
  pick: string;
  score: string;
  reason: string;
  confidence: number;
}>> {
  const maxRetries = 3;
  let response;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 API 호출 시도 ${attempt + 1}/${maxRetries}...`);
      
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });
      
      break;
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 429 || error.message?.includes('429')) {
        const waitTime = (attempt + 1) * 5000;
        console.log(`⏳ Rate limit 도달. ${waitTime / 1000}초 후 재시도...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw err;
      }
    }
  }

  if (!response) {
    throw new Error('API 호출 실패');
  }

  const result = JSON.parse(response.text);
  return result.predictions;
}

// 경기 목록에 예측 적용
function applyPredictions(
  matches: Match[],
  predictions: Array<{
    matchNumber: number;
    pick: string;
    score: string;
    reason: string;
    confidence: number;
  }>,
  gameType: GameType
): Match[] {
  return matches.map((match) => {
    const prediction = predictions.find((p) => p.matchNumber === match.matchNumber);
    
    if (prediction) {
      // 농구는 무승부 불가
      let pick = prediction.pick as '승' | '무' | '패';
      if (gameType === 'basketball' && pick === '무') {
        pick = '승'; // 무승부가 나오면 승으로 변환
      }
      
      return {
        ...match,
        prediction: {
          pick,
          score: prediction.score,
          reason: prediction.reason,
          confidence: Math.min(100, Math.max(0, prediction.confidence)),
        },
      };
    }
    
    return match;
  });
}

async function generatePredictions(): Promise<void> {
  console.log('🤖 Gemini AI 예측 시작...');
  
  try {
    // 1. 기존 데이터 읽기
    let existingData: PredictionData;
    
    try {
      const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
      existingData = JSON.parse(fileContent);
    } catch {
      console.error('❌ 데이터 파일을 찾을 수 없습니다:', DATA_FILE);
      process.exit(1);
    }

    const { soccer, basketball } = existingData;

    // 2. 축구토토 승무패 예측
    if (soccer.matches && soccer.matches.length > 0) {
      console.log(`\n⚽ 축구토토 승무패 ${soccer.matches.length}개 경기 분석 중...`);
      const soccerPrompt = createSoccerPrompt(soccer.matches);
      const soccerPredictions = await callGeminiAPI(soccerPrompt);
      console.log(`✅ 축구 ${soccerPredictions.length}개 예측 수신 완료`);
      soccer.matches = applyPredictions(soccer.matches, soccerPredictions, 'soccer');
    } else {
      console.log('⚠️ 분석할 축구 경기가 없습니다.');
    }

    // 잠시 대기 (Rate limit 방지)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. 농구토토 승5패 예측
    if (basketball.matches && basketball.matches.length > 0) {
      console.log(`\n🏀 농구토토 승5패 ${basketball.matches.length}개 경기 분석 중...`);
      const basketballPrompt = createBasketballPrompt(basketball.matches);
      const basketballPredictions = await callGeminiAPI(basketballPrompt);
      console.log(`✅ 농구 ${basketballPredictions.length}개 예측 수신 완료`);
      basketball.matches = applyPredictions(basketball.matches, basketballPredictions, 'basketball');
    } else {
      console.log('⚠️ 분석할 농구 경기가 없습니다.');
    }

    // 4. 업데이트된 데이터 저장
    const updatedData: PredictionData = {
      ...existingData,
      lastUpdated: new Date().toISOString().split('T')[0],
      soccer,
      basketball,
    };

    await fs.writeFile(DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf-8');
    console.log(`\n💾 예측 결과가 ${DATA_FILE}에 저장되었습니다.`);

    // 5. 결과 요약 출력
    console.log('\n📋 축구토토 승무패 예측 요약:');
    soccer.matches.forEach((m) => {
      console.log(
        `  ${m.matchNumber}. ${m.homeTeam} vs ${m.awayTeam}: ${m.prediction.pick} (${m.prediction.score}) - 신뢰도 ${m.prediction.confidence}%`
      );
    });

    console.log('\n🏀 농구토토 승5패 예측 요약:');
    basketball.matches.forEach((m) => {
      console.log(
        `  ${m.matchNumber}. ${m.homeTeam} vs ${m.awayTeam}: ${m.prediction.pick} (${m.prediction.score}) - 신뢰도 ${m.prediction.confidence}%`
      );
    });

  } catch (error) {
    console.error('❌ 예측 생성 중 오류:', error);
    process.exit(1);
  }
}

generatePredictions();
