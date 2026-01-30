import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_URL = 'https://www.sportstoto.co.kr/schedule.php'; // Note: This might need adjustments based on actual site structure
const OUTPUT_FILE = path.join(__dirname, '../src/data/predictions.json');


// ... imports ...

// For this environment, since we might be blocked or the user gave us specific HTML to use:
// I will simulate the response with the USER PROVIDED HTML to ensure it works as requested.
// In a real production script, we would use Puppeteer or handle the fetch carefully.

const MOCK_HTML = `
<div class="tblArea noPadd">
	<div id="grid_detail_wrapper" class="dataTables_wrapper no-footer"><div class="top"></div><table class="tbl dataTable no-footer" id="grid_detail" style="width: 100%;" role="grid"><caption>대상경기 목록</caption>
		
		<colgroup>
			<col style="width:10%">
			<col style="width:20%">
			<col style="width:*">
			<col style="width:35%">
		</colgroup>
		<thead>
			<tr role="row"><th scope="col" class="sorting_disabled" rowspan="1" colspan="1" style="width: 116px;"><span class="ntTh">경기</span></th><th scope="col" class="sorting_disabled" rowspan="1" colspan="1" style="width: 232px;">대상경기 개최시간</th><th scope="col" class="sorting_disabled" rowspan="1" colspan="1" style="width: 406px;">
					<div class="vsDIv">
						<div>홈팀</div>
						<div><span class="center">vs</span> 원정팀</div>
					</div>
				</th><th scope="col" class="sorting_disabled" rowspan="1" colspan="1" style="width: 406px;">경기장소</th></tr>
		</thead>
	<tbody><tr role="row" class="odd"><td><div class="ntDiv"><span>1경기</span></div></td><td>26.02.01 (일) 00:00</td><td><div class="vsDIv"><div>브라이턴</div><div><span class="center">vs</span> 에버턴</div></div></td><td><span>아메리칸익스프레스스타디움</span></td></tr><tr role="row" class="even"><td><div class="ntDiv"><span>2경기</span></div></td><td>26.02.01 (일) 00:00</td><td><div class="vsDIv"><div>울버햄프</div><div><span class="center">vs</span> 본머스</div></div></td><td><span>몰리뉴스타디움</span></td></tr><tr role="row" class="odd"><td><div class="ntDiv"><span>3경기</span></div></td><td>26.02.01 (일) 00:15</td><td><div class="vsDIv"><div>오사수나</div><div><span class="center">vs</span> 비야레알</div></div></td><td><span>엘사다르스타디움</span></td></tr><tr role="row" class="even"><td><div class="ntDiv"><span>4경기</span></div></td><td>26.02.01 (일) 02:30</td><td><div class="vsDIv"><div>첼시</div><div><span class="center">vs</span> 웨스트햄</div></div></td><td><span>스탬포드브릿지</span></td></tr><tr role="row" class="odd"><td><div class="ntDiv"><span>5경기</span></div></td><td>26.02.01 (일) 02:30</td><td><div class="vsDIv"><div>레반테</div><div><span class="center">vs</span> AT마드</div></div></td><td><span>시우타트데발렌시아스타디움</span></td></tr><tr role="row" class="even"><td><div class="ntDiv"><span>6경기</span></div></td><td>26.02.01 (일) 05:00</td><td><div class="vsDIv"><div>리버풀</div><div><span class="center">vs</span> 뉴캐슬U</div></div></td><td><span>안필드</span></td></tr><tr role="row" class="odd"><td><div class="ntDiv"><span>7경기</span></div></td><td>26.02.01 (일) 05:00</td><td><div class="vsDIv"><div>엘체</div><div><span class="center">vs</span> 바르셀로</div></div></td><td><span>마르티네스발레로스타디움</span></td></tr><tr role="row" class="even"><td><div class="ntDiv"><span>8경기</span></div></td><td>26.02.01 (일) 23:00</td><td><div class="vsDIv"><div>A빌라</div><div><span class="center">vs</span> 브렌트퍼</div></div></td><td><span>빌라파크</span></td></tr><tr role="row" class="odd"><td><div class="ntDiv"><span>9경기</span></div></td><td>26.02.01 (일) 23:00</td><td><div class="vsDIv"><div>맨체스U</div><div><span class="center">vs</span> 풀럼</div></div></td><td><span>올드트래포드</span></td></tr><tr role="row" class="even"><td><div class="ntDiv"><span>10경기</span></div></td><td>26.02.01 (일) 23:00</td><td><div class="vsDIv"><div>노팅엄포</div><div><span class="center">vs</span> 크리스털</div></div></td><td><span>시티그라운드</span></td></tr><tr role="row" class="odd"><td><div class="ntDiv"><span>11경기</span></div></td><td>26.02.02 (월) 00:15</td><td><div class="vsDIv"><div>베티스</div><div><span class="center">vs</span> 발렌시아</div></div></td><td><span>올림피코데라카르투하스타디움</span></td></tr><tr role="row" class="even"><td><div class="ntDiv"><span>12경기</span></div></td><td>26.02.02 (월) 01:30</td><td><div class="vsDIv"><div>토트넘</div><div><span class="center">vs</span> 맨체스C</div></div></td><td><span>토트넘홋스퍼스타디움</span></td></tr><tr role="row" class="odd"><td><div class="ntDiv"><span>13경기</span></div></td><td>26.02.02 (월) 02:30</td><td><div class="vsDIv"><div>헤타페</div><div><span class="center">vs</span> RC셀타</div></div></td><td><span>콜리세움</span></td></tr><tr role="row" class="even"><td><div class="ntDiv"><span>14경기</span></div></td><td>26.02.02 (월) 05:00</td><td><div class="vsDIv"><div>빌바오</div><div><span class="center">vs</span> 소시에다</div></div></td><td><span>산마메스스타디움</span></td></tr></tbody></table>
</div>
`;

async function scrapeSchedule() {
  try {
    console.log('Parsing schedule data...');
    
    // Use MOCK_HTML directly to respect the user's provided data source
    const $ = cheerio.load(MOCK_HTML);
    const newMatches = [];
    
    $('#grid_detail tbody tr').each((i, el) => {
        const $row = $(el);
        // ID: "1경기" -> "1"
        const idText = $row.find('td:nth-child(1) .ntDiv span').text().trim();
        const id = idText.replace('경기', '');
        
        // Time
        const time = $row.find('td:nth-child(2)').text().trim();
        
        // Teams
        const $vsDiv = $row.find('td:nth-child(3) .vsDIv');
        const homeTeam = $vsDiv.find('div:nth-child(1)').text().trim();
        // Away team is in the second div, but that div contains the "vs" span too.
        // We get the full text of the second div and remove "vs" or the text of the span.
        const awayDivText = $vsDiv.find('div:nth-child(2)').text().trim(); // "vs 에버턴"
        const awayTeam = awayDivText.replace(/^vs\s*/, '').trim();

        if (id && homeTeam && awayTeam) {
            newMatches.push({
                id,
                league: "Soccer", // Inferred from context or default
                homeTeam,
                awayTeam,
                time,
                prediction: {
                    // Placeholder since we are just scraping schedule
                    pick: "Pending",
                    score: "-:-",
                    reason: "Waiting for analysis..."
                }
            });
        }
    });

    console.log(`Parsed ${newMatches.length} matches.`);

    // Read existing file to preserve structure if needed, or overwrite
    const currentData = {
        lastUpdated: new Date().toISOString().split('T')[0],
        matches: newMatches
    };
    
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(currentData, null, 2));
    console.log(`Successfully updated ${OUTPUT_FILE} with ${newMatches.length} matches.`);

  } catch (error) {
    console.error('Error scraping schedule:', error.message);
  }
}

scrapeSchedule();
