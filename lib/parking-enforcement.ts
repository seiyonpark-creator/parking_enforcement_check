import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

// 서울시 불법주정차 단속 정보(OA-22190, 2025 Q4)를 읽어 반경 검색을 제공한다.
// 데이터 출처와 "이력 데이터를 쓰는 이유"는 docs/decisions/parking-data-source.md 참고.

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

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "parking-enforcement",
  "2025-q4.csv"
);

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_DEGREE_LATITUDE = 111_000;

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
  const raw = await fs.readFile(DATA_FILE, "utf-8");
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

// next dev의 Fast Refresh로 모듈이 다시 평가돼도 파싱을 반복하지 않도록 globalThis에 캐시한다.
const globalForParkingData = globalThis as unknown as {
  __parkingRecordsPromise?: Promise<EnforcementRecord[]>;
};

function getRecords(): Promise<EnforcementRecord[]> {
  if (!globalForParkingData.__parkingRecordsPromise) {
    globalForParkingData.__parkingRecordsPromise = loadRecords().catch((error) => {
      // 실패한 캐시를 남겨두면 파일을 나중에 채워 넣어도 재시도할 수 없으므로 비운다.
      globalForParkingData.__parkingRecordsPromise = undefined;
      throw error;
    });
  }
  return globalForParkingData.__parkingRecordsPromise;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export async function findNearbyEnforcements(
  lat: number,
  lng: number,
  radiusMeters: number = DEFAULT_RADIUS_METERS
): Promise<NearbyEnforcement[]> {
  const records = await getRecords();

  // 위경도 전수 haversine 계산 전에, 사각 범위로 먼저 걸러내 계산량을 줄인다.
  const latDelta = radiusMeters / METERS_PER_DEGREE_LATITUDE;
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE * Math.cos(toRadians(lat));
  const lngDelta =
    radiusMeters / (metersPerDegreeLongitude || METERS_PER_DEGREE_LATITUDE);

  const nearby: NearbyEnforcement[] = [];
  for (const record of records) {
    if (Math.abs(record.lat - lat) > latDelta) continue;
    if (Math.abs(record.lng - lng) > lngDelta) continue;

    const distanceMeters = haversineDistanceMeters(
      lat,
      lng,
      record.lat,
      record.lng
    );
    if (distanceMeters <= radiusMeters) {
      nearby.push({ ...record, distanceMeters });
    }
  }

  nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return nearby;
}
