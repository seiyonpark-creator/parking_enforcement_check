import "server-only";
import { withinRadius, type WithDistance } from "@/lib/geo";

// 서울시 불법주정차/전용차로 위반 단속 CCTV 위치정보(OA-20471, TbOpendataFixedcctv).
// 데이터 출처와 키 처리 방식은 docs/decisions/fixed-cctv-source.md 참고.

export type FixedCctvRecord = {
  address: string; // 지번주소
  district: string; // 자치구
  branchName: string; // 단속지점명
  zoneType: string; // 현장구분
  lat: number;
  lng: number;
};

export type NearbyFixedCctv = WithDistance<FixedCctvRecord>;

export const DEFAULT_RADIUS_METERS = 300;

const SEOUL_OPENAPI_BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE_NAME = "TbOpendataFixedcctv";
const PAGE_SIZE = 1000;

type TbOpendataFixedcctvRow = {
  FIX_CCTV_ADDR?: string;
  LAT?: string;
  LOT?: string;
  CGG_CD?: string;
  CRDN_BRNCH_NM?: string;
  GRNDS_SE?: string;
};

type TbOpendataFixedcctvResponse = {
  [SERVICE_NAME]?: {
    list_total_count?: number;
    RESULT?: { CODE?: string; MESSAGE?: string };
    row?: TbOpendataFixedcctvRow[];
  };
};

export function isFixedCctvConfigured(): boolean {
  return Boolean(process.env.SEOUL_OPENAPI_KEY);
}

async function fetchPage(
  key: string,
  start: number,
  end: number
): Promise<TbOpendataFixedcctvResponse> {
  const url = `${SEOUL_OPENAPI_BASE}/${key}/json/${SERVICE_NAME}/${start}/${end}/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`서울 열린데이터광장 HTTP ${response.status}`);
  }
  return response.json();
}

function toRecord(row: TbOpendataFixedcctvRow): FixedCctvRecord | null {
  const lat = Number(row.LAT);
  const lng = Number(row.LOT);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    address: row.FIX_CCTV_ADDR ?? "",
    district: row.CGG_CD ?? "",
    branchName: row.CRDN_BRNCH_NM ?? "",
    zoneType: row.GRNDS_SE ?? "",
    lat,
    lng,
  };
}

async function loadAllRecords(key: string): Promise<FixedCctvRecord[]> {
  const first = await fetchPage(key, 1, PAGE_SIZE);
  const body = first[SERVICE_NAME];
  if (!body || body.RESULT?.CODE !== "INFO-000") {
    throw new Error(body?.RESULT?.MESSAGE ?? "OA-20471 조회에 실패했습니다.");
  }

  const total = body.list_total_count ?? body.row?.length ?? 0;
  const rows: TbOpendataFixedcctvRow[] = [...(body.row ?? [])];

  for (let start = PAGE_SIZE + 1; start <= total; start += PAGE_SIZE) {
    const end = Math.min(start + PAGE_SIZE - 1, total);
    const page = await fetchPage(key, start, end);
    rows.push(...(page[SERVICE_NAME]?.row ?? []));
  }

  const records: FixedCctvRecord[] = [];
  for (const row of rows) {
    const record = toRecord(row);
    if (record) records.push(record);
  }
  return records;
}

// 분기 1회만 갱신되는 데이터라, 서버가 한 번 받아 메모리에 캐시해두고 재사용한다.
const globalForFixedCctv = globalThis as unknown as {
  __fixedCctvRecordsPromise?: Promise<FixedCctvRecord[]>;
};

function getRecords(key: string): Promise<FixedCctvRecord[]> {
  if (!globalForFixedCctv.__fixedCctvRecordsPromise) {
    globalForFixedCctv.__fixedCctvRecordsPromise = loadAllRecords(key).catch(
      (error) => {
        globalForFixedCctv.__fixedCctvRecordsPromise = undefined;
        throw error;
      }
    );
  }
  return globalForFixedCctv.__fixedCctvRecordsPromise;
}

export async function findNearbyFixedCctv(
  lat: number,
  lng: number,
  radiusMeters: number = DEFAULT_RADIUS_METERS
): Promise<NearbyFixedCctv[]> {
  const key = process.env.SEOUL_OPENAPI_KEY;
  if (!key) {
    throw new Error("SEOUL_OPENAPI_KEY가 설정되지 않았습니다.");
  }
  const records = await getRecords(key);
  return withinRadius(records, lat, lng, radiusMeters);
}
