// 서울시 불법주정차 단속 정보(OA-22190, 서울 열린데이터광장)의 2025년 4분기 CSV를 내려받는다.
// 데이터 출처와 이력 데이터를 쓰는 이유는 docs/decisions/parking-data-source.md 참고.
//
// 실행: node scripts/fetch-parking-data.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DOWNLOAD_URL =
  "https://datafile.seoul.go.kr/bigfile/iot/inf/nio_download.do?&useCache=false";
const REFERER_URL = "https://data.seoul.go.kr/dataList/OA-22190/F/1/datasetView.do";

// seq=15 는 2025년 10~12월(4분기) 파일을 가리킨다. 다음 분기가 열리면 이 값을 갱신한다.
const FORM_BODY = "infId=OA-22190&seq=15&infSeq=1";

const OUTPUT_DIR = path.join(process.cwd(), "data", "parking-enforcement");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "2025-q4.csv");

async function main() {
  console.log("서울시 불법주정차 단속 정보(2025 Q4)를 내려받는 중...");

  const response = await fetch(DOWNLOAD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: REFERER_URL,
    },
    body: FORM_BODY,
  });

  if (!response.ok) {
    throw new Error(`다운로드 실패: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, buffer);

  console.log(`저장 완료: ${OUTPUT_FILE} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
