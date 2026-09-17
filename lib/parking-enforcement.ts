import "server-only";
import { withinRadius } from "@/lib/geo";

// 서울시 불법주정차 단속 정보(OA-22190, 2025 Q4)를 읽어 반경 검색을 제공한다.
// 데이터 출처와 "이력 데이터를 쓰는 이유"는 docs/decisions/parking-data-source.md 참고.
//
// 로컬에 미리 받아둔 파일이 아니라, 서버가 첫 요청 때 원본 CSV를 직접 내려받아
// 메모리에 캐시한다(배포 환경에 파일을 별도로 올릴 필요가 없다). 그 이유는
// docs/decisions/parking-data-source.md의 "배포 시 로컬 파일 대신 런타임 fetch" 참고.

export type EnforcementRecord = {
  date: string; // "20251001" 형태의 단속일
  time: string; // "00:03:09" 형태의 단속시간
  jibunAddress: string; // 구주소(지번)
  roadAddress: string; // 도로명 주소
  lat: number;
  lng: number;
};

export type NearbyEnforcement = EnforcementRecord & {
  distanceMeters: number;
};

export const DEFAULT_RADIUS_METERS = 300;

const DOWNLOAD_URL =
  "https://datafile.seoul.go.kr/bigfile/iot/inf/nio_download.do?&useCache=false";
const REFERER_URL = "https://data.seoul.go.kr/dataList/OA-22190/F/1/datasetView.do";
// seq=15 는 2025년 10~12월(4분기) 파일을 가리킨다. 다음 분기가 열리면 이 값을 갱신한다.
const FORM_BODY = "infId=OA-22190&seq=15&infSeq=1";

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

async function loadRecords(): Promise<EnforcementRecord[]> {
  const response = await fetch(DOWNLOAD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: REFERER_URL,
    },
    body: FORM_BODY,
  });

  if (!response.ok) {
    throw new Error(`서울시 불법주정차 단속 정보 다운로드 실패: HTTP ${response.status}`);
  }

  const raw = await response.text();
  const lines = raw.split("\n");
  const records: EnforcementRecord[] = [];

  // lines[0]은 헤더("단속일","단속시간","구주소","도로명","경도","위도")이므로 건너뛴다.
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCsvLine(line);
    if (cols.length < 6) continue;

    const [date, time, jibunAddress, roadAddress, lngRaw, latRaw] = cols;
    const lng = Number(lngRaw);
    const lat = Number(latRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    records.push({ date, time, jibunAddress, roadAddress, lat, lng });
  }

  return records;
}

// 분기 1회만 갱신되는 데이터라, 서버가 한 번 받아 메모리에 캐시해두고 재사용한다.
// (next dev의 Fast Refresh로 모듈이 다시 평가돼도 다운로드를 반복하지 않는다.)
const globalForParkingData = globalThis as unknown as {
  __parkingRecordsPromise?: Promise<EnforcementRecord[]>;
};

function getRecords(): Promise<EnforcementRecord[]> {
  if (!globalForParkingData.__parkingRecordsPromise) {
    globalForParkingData.__parkingRecordsPromise = loadRecords().catch((error) => {
      // 실패한 캐시를 남겨두면 다음 요청도 재시도할 수 없으므로 비운다.
      globalForParkingData.__parkingRecordsPromise = undefined;
      throw error;
    });
  }
  return globalForParkingData.__parkingRecordsPromise;
}

export async function findNearbyEnforcements(
  lat: number,
  lng: number,
  radiusMeters: number = DEFAULT_RADIUS_METERS
): Promise<NearbyEnforcement[]> {
  const records = await getRecords();
  return withinRadius(records, lat, lng, radiusMeters);
}
