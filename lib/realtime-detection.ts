import "server-only";
import { withinRadius, type WithDistance } from "@/lib/geo";

// t-data.seoul.go.kr의 불법 주정차 위치 정보 서비스(V2X, itisCd=4120).
// 데이터 출처와 키 처리 방식은 docs/decisions/realtime-detection-source.md 참고.

export type RealtimeDetectionRecord = {
  cameraId: string;
  detectedAt: string; // ISO 8601 (regDt)
  lat: number;
  lng: number;
};

export type NearbyRealtimeDetection = WithDistance<RealtimeDetectionRecord>;

export const DEFAULT_RADIUS_METERS = 300;
export const FRESHNESS_MS = 5 * 60 * 1000; // 5분

const TDATA_URL =
  "https://t-data.seoul.go.kr/apig/apiman-gateway/tapi/v2xIllegalParkingPositionInformation/1.0";
const ILLEGAL_PARKING_ITIS_CODE = "4120";
const REQUEST_ROWS = 5000;
// t-data.seoul.go.kr은 10초 반복 호출을 제한하므로, 그보다 넉넉하게 캐시한다.
const CACHE_MS = 15_000;

type V2xRow = {
  cameraId?: string;
  itisCd?: string;
  detcLat?: number;
  detcLot?: number;
  regDt?: string;
};

export function isRealtimeDetectionConfigured(): boolean {
  return Boolean(process.env.TDATA_API_KEY);
}

async function fetchRawRows(key: string): Promise<V2xRow[]> {
  const url = `${TDATA_URL}?apiKey=${encodeURIComponent(key)}&type=json&pageNo=1&numOfRows=${REQUEST_ROWS}`;
  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok || !Array.isArray(body)) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : null) ?? `t-data.seoul.go.kr HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as V2xRow[];
}

// 같은 카메라가 1초 간격으로 반복 전송하므로, 카메라별 가장 최근 감지만 남긴다.
function toLatestPerCamera(rows: V2xRow[]): RealtimeDetectionRecord[] {
  const latestByCamera = new Map<string, V2xRow>();
  for (const row of rows) {
    if (row.itisCd !== ILLEGAL_PARKING_ITIS_CODE) continue;
    if (!row.cameraId || !row.regDt) continue;

    const current = latestByCamera.get(row.cameraId);
    if (!current || row.regDt > (current.regDt ?? "")) {
      latestByCamera.set(row.cameraId, row);
    }
  }

  const records: RealtimeDetectionRecord[] = [];
  for (const row of latestByCamera.values()) {
    const lat = row.detcLat;
    const lng = row.detcLot;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    records.push({ cameraId: row.cameraId!, detectedAt: row.regDt!, lat, lng });
  }
  return records;
}

type CacheEntry = { at: number; promise: Promise<RealtimeDetectionRecord[]> };
const globalForRealtime = globalThis as unknown as {
  __realtimeDetectionCache?: CacheEntry;
};

function getCachedRecords(key: string): Promise<RealtimeDetectionRecord[]> {
  const now = Date.now();
  const existing = globalForRealtime.__realtimeDetectionCache;
  if (existing && now - existing.at < CACHE_MS) {
    return existing.promise;
  }

  const promise = fetchRawRows(key).then(toLatestPerCamera);
  globalForRealtime.__realtimeDetectionCache = { at: now, promise };

  promise.catch(() => {
    // 실패한 응답을 캐시로 남기지 않아, 다음 호출이 바로 재시도할 수 있게 한다.
    if (globalForRealtime.__realtimeDetectionCache?.promise === promise) {
      globalForRealtime.__realtimeDetectionCache = undefined;
    }
  });

  return promise;
}

export async function findNearbyRealtimeDetections(
  lat: number,
  lng: number,
  radiusMeters: number = DEFAULT_RADIUS_METERS
): Promise<NearbyRealtimeDetection[]> {
  const key = process.env.TDATA_API_KEY;
  if (!key) {
    throw new Error("TDATA_API_KEY가 설정되지 않았습니다.");
  }

  const records = await getCachedRecords(key);
  const now = Date.now();
  const fresh = records.filter(
    (record) => now - new Date(record.detectedAt).getTime() <= FRESHNESS_MS
  );
  return withinRadius(fresh, lat, lng, radiusMeters);
}
