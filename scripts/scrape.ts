import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../src/data/predictions.json');

type GameType = 'soccer' | 'basketball';

interface ScrapedMatch {
  id: string;
  matchNumber: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  venue: string;
  gameType: GameType;
  prediction: {
    pick: string;
    score: string;
    reason: string;
    confidence?: number;
  };
  result?: {
    homeScore?: number;
    awayScore?: number;
    outcome: '승' | '무' | '패' | '미정';
  };
  status: 'scheduled' | 'in_progress' | 'finished';
}

interface GameData {
  round: string;
  gmId: string;
  gmTs: string;
  matches: ScrapedMatch[];
}

interface PredictionData {
  lastUpdated: string;
  soccer: GameData;
  basketball: GameData;
}

// 게임 설정
const GAMES = {
  soccer: {
    gmId: 'G011',
    name: '축구토토 승무패',
  },
  basketball: {
    gmId: 'G027',
    name: '농구토토 승5패',
  },
};

// 리그 이름 정규화
function normalizeLeague(leagueText: string): string {
  const league = leagueText.toLowerCase();
  
  // 축구 리그
  if (league.includes('프리미어') || league.includes('epl') || league.includes('잉글랜드')) {
    return '프리미어리그';
  }
  if (league.includes('라리가') || league.includes('스페인')) {
    return '라리가';
  }
  if (league.includes('분데스') || league.includes('독일')) {
    return '분데스리가';
  }
  if (league.includes('세리에') || league.includes('이탈리아')) {
    return '세리에A';
  }
  if (league.includes('리그앙') || league.includes('프랑스')) {
    return '리그앙';
  }
  if (league.includes('k리그') || league.includes('kleague')) {
    return 'K리그';
  }
  if (league.includes('a리그') || league.includes('호주')) {
    return 'A리그';
  }
  if (league.includes('챔피언스') || league.includes('ucl')) {
    return 'UEFA 챔피언스리그';
  }
  if (league.includes('유로파') || league.includes('uel')) {
    return 'UEFA 유로파리그';
  }
  
  // 농구 리그
  if (league.includes('kbl') || league.includes('농구')) {
    return 'KBL';
  }
  if (league.includes('nba')) {
    return 'NBA';
  }
  if (league.includes('wnba')) {
    return 'WNBA';
  }
  
  return leagueText;
}

// 현재 연도 프리픽스 (예: 2026 -> 26)
function getCurrentYearPrefix(): string {
  const year = new Date().getFullYear();
  return String(year).slice(-2);
}

// 특정 게임의 최신 회차 찾기
async function findLatestRound(
  page: puppeteer.Page,
  gmId: string
): Promise<{ gmTs: string; roundName: string } | null> {
  try {
    const url = `https://www.betman.co.kr/main/mainPage/gamebuy/gameScheduleDetlIFR.do?gmId=${gmId}`;
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const roundInfo = await page.evaluate(() => {
      const select = document.querySelector('select') as HTMLSelectElement;
      if (!select) return null;
      
      const options = Array.from(select.options);
      for (const opt of options) {
        const value = opt.value;
        const text = opt.textContent?.trim() || '';
        if (value && text && !text.includes('마감')) {
          return { gmTs: value, roundName: text };
        }
      }
      // 마감되지 않은 게 없으면 첫 번째 옵션
      for (const opt of options) {
        const value = opt.value;
        const text = opt.textContent?.trim() || '';
        if (value && text) {
          return { gmTs: value, roundName: text };
        }
      }
      return null;
    });

    return roundInfo;
  } catch (error) {
    console.error(`회차 조회 실패 (${gmId}):`, error);
    return null;
  }
}

// 특정 게임의 경기 목록 스크래핑
async function scrapeGame(
  page: puppeteer.Page,
  gmId: string,
  gmTs: string,
  gameType: GameType,
  gameName: string
): Promise<{ round: string; matches: ScrapedMatch[] }> {
  const url = `https://www.betman.co.kr/main/mainPage/gamebuy/gameScheduleDetlIFR.do?gmId=${gmId}&gmTs=${gmTs}`;
  
  console.log(`📄 ${gameName} 페이지 로딩 중...`);
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  await new Promise(resolve => setTimeout(resolve, 4000));

  // 회차 정보 추출
  const round = await page.evaluate((name) => {
    const selectEl = document.querySelector('select') as HTMLSelectElement;
    if (selectEl && selectEl.selectedOptions.length > 0) {
      return `${name} ${selectEl.selectedOptions[0].textContent?.trim() || ''}`;
    }
    return name;
  }, gameName);

  // 경기 데이터 추출
  const matches = await page.evaluate((gType: GameType) => {
    const rows = document.querySelectorAll('table tbody tr, [role="grid"] tbody tr');
    const results: Array<{
      id: string;
      matchNumber: number;
      league: string;
      homeTeam: string;
      awayTeam: string;
      datetime: string;
      venue: string;
      gameType: GameType;
    }> = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        // 경기 번호
        const matchNumText = cells[0]?.textContent?.trim() || '';
        const matchNumber = parseInt(matchNumText.replace(/[^0-9]/g, '')) || 0;
        
        if (matchNumber === 0) return;
        
        // 경기 시간
        const datetime = cells[1]?.textContent?.trim() || '';
        
        // 팀 정보
        const teamsText = cells[2]?.textContent?.trim() || '';
        
        // 경기장
        const venue = cells[3]?.textContent?.trim() || '미정';

        // 팀 파싱
        let homeTeam = '';
        let awayTeam = '';
        
        const teamsParts = teamsText.split(/vs/i);
        if (teamsParts.length >= 2) {
          homeTeam = teamsParts[0].trim();
          awayTeam = teamsParts[1].trim();
        }
        
        if (homeTeam && awayTeam && matchNumber > 0) {
          results.push({
            id: String(matchNumber),
            matchNumber,
            league: '', // 축구토토/농구토토는 리그 정보가 별도로 없음
            homeTeam,
            awayTeam,
            datetime,
            venue,
            gameType: gType,
          });
        }
      }
    });

    return results;
  }, gameType);

  console.log(`✅ ${gameName}: ${matches.length}개의 경기를 찾았습니다.`);

  // 예측 초기화
  const processedMatches: ScrapedMatch[] = matches.map((match) => ({
    ...match,
    league: normalizeLeague(match.league || match.venue),
    prediction: {
      pick: '-',
      score: '-',
      reason: 'AI 분석 대기중...',
    },
    status: 'scheduled' as const,
  }));

  return { round, matches: processedMatches };
}

// 경기 결과 스크래핑
async function scrapeResults(
  page: puppeteer.Page,
  gmId: string,
  gmTs: string,
  gameName: string
): Promise<Map<number, { homeScore: number; awayScore: number; outcome: '승' | '무' | '패' }>> {
  const results = new Map<number, { homeScore: number; awayScore: number; outcome: '승' | '무' | '패' }>();
  
  try {
    // 결과 상세 페이지로 이동 (베트맨 사이트)
    const url = `https://www.betman.co.kr/main/mainPage/gamebuy/winrstDetlIFR.do?gmId=${gmId}&gmTs=${gmTs}`;
    console.log(`📊 ${gameName} 결과 조회 중...`);
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 결과 데이터 추출
    const resultData = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const data: Array<{
        matchNumber: number;
        homeScore: number;
        awayScore: number;
        result: string;
      }> = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          const matchNumText = cells[0]?.textContent?.trim() || '';
          const matchNumber = parseInt(matchNumText.replace(/[^0-9]/g, '')) || 0;
          
          if (matchNumber === 0) return;
          
          // 결과 열 찾기 (승/무/패 또는 점수)
          const resultCell = cells[cells.length - 1]?.textContent?.trim() || '';
          const scoreCell = cells[cells.length - 2]?.textContent?.trim() || '';
          
          // 점수 파싱 (예: "2:1" 또는 "102:98")
          const scoreMatch = scoreCell.match(/(\d+)\s*[:\-]\s*(\d+)/);
          if (scoreMatch) {
            const homeScore = parseInt(scoreMatch[1]);
            const awayScore = parseInt(scoreMatch[2]);
            
            data.push({
              matchNumber,
              homeScore,
              awayScore,
              result: resultCell,
            });
          }
        }
      });

      return data;
    });

    // 결과 맵에 저장
    for (const r of resultData) {
      let outcome: '승' | '무' | '패';
      if (r.homeScore > r.awayScore) {
        outcome = '승';
      } else if (r.homeScore < r.awayScore) {
        outcome = '패';
      } else {
        outcome = '무';
      }
      
      results.set(r.matchNumber, {
        homeScore: r.homeScore,
        awayScore: r.awayScore,
        outcome,
      });
    }

    console.log(`✅ ${gameName}: ${results.size}개의 결과를 찾았습니다.`);
  } catch (error) {
    console.log(`⚠️ ${gameName} 결과 조회 실패 (아직 결과가 없을 수 있음)`);
  }

  return results;
}

async function scrapeSchedule(): Promise<void> {
  console.log('🚀 스포츠토토 경기 일정 크롤링 시작...');
  console.log('📌 축구토토 승무패 + 농구토토 승5패');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const yearPrefix = getCurrentYearPrefix();

    // 축구토토 승무패 스크래핑
    console.log('\n⚽ 축구토토 승무패 조회 중...');
    const soccerRoundInfo = await findLatestRound(page, GAMES.soccer.gmId);
    let soccerGmTs = soccerRoundInfo?.gmTs || `${yearPrefix}0008`;
    const soccerData = await scrapeGame(
      page,
      GAMES.soccer.gmId,
      soccerGmTs,
      'soccer',
      GAMES.soccer.name
    );

    // 축구 결과 조회 (이전 회차가 있다면)
    const soccerResults = await scrapeResults(page, GAMES.soccer.gmId, soccerGmTs, GAMES.soccer.name);
    
    // 결과 적용
    for (const match of soccerData.matches) {
      const result = soccerResults.get(match.matchNumber);
      if (result) {
        match.result = result;
        match.status = 'finished';
      }
    }

    // 농구토토 승5패 스크래핑
    console.log('\n🏀 농구토토 승5패 조회 중...');
    const basketballRoundInfo = await findLatestRound(page, GAMES.basketball.gmId);
    let basketballGmTs = basketballRoundInfo?.gmTs || `${yearPrefix}0009`;
    const basketballData = await scrapeGame(
      page,
      GAMES.basketball.gmId,
      basketballGmTs,
      'basketball',
      GAMES.basketball.name
    );

    // 농구 결과 조회
    const basketballResults = await scrapeResults(page, GAMES.basketball.gmId, basketballGmTs, GAMES.basketball.name);
    
    // 결과 적용
    for (const match of basketballData.matches) {
      const result = basketballResults.get(match.matchNumber);
      if (result) {
        match.result = result;
        match.status = 'finished';
      }
    }

    // 결과 저장
    const data: PredictionData = {
      lastUpdated: new Date().toISOString().split('T')[0],
      soccer: {
        round: soccerData.round,
        gmId: GAMES.soccer.gmId,
        gmTs: soccerGmTs,
        matches: soccerData.matches,
      },
      basketball: {
        round: basketballData.round,
        gmId: GAMES.basketball.gmId,
        gmTs: basketballGmTs,
        matches: basketballData.matches,
      },
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 ${OUTPUT_FILE}에 저장 완료`);
    console.log(`📊 축구: ${soccerData.matches.length}경기, 농구: ${basketballData.matches.length}경기`);

  } catch (error) {
    console.error('❌ 크롤링 중 오류 발생:', error);
    
    try {
      await fs.access(OUTPUT_FILE);
      console.log('⚠️ 기존 데이터 파일을 유지합니다.');
    } catch {
      // 파일이 없으면 빈 데이터 생성
      const emptyData: PredictionData = {
        lastUpdated: new Date().toISOString().split('T')[0],
        soccer: {
          round: '데이터 없음',
          gmId: GAMES.soccer.gmId,
          gmTs: '',
          matches: [],
        },
        basketball: {
          round: '데이터 없음',
          gmId: GAMES.basketball.gmId,
          gmTs: '',
          matches: [],
        },
      };
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(emptyData, null, 2), 'utf-8');
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

scrapeSchedule();
