// 위경도 기반 반경 검색에 쓰는 공통 계산. lib/parking-enforcement.ts,
// lib/fixed-cctv.ts, lib/realtime-detection.ts가 함께 쓴다.

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_DEGREE_LATITUDE = 111_000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(
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

export type GeoPoint = { lat: number; lng: number };
export type WithDistance<T> = T & { distanceMeters: number };

// 위경도 전수 haversine 계산 전에, 사각 범위로 먼저 걸러내 계산량을 줄인다.
export function withinRadius<T extends GeoPoint>(
  records: T[],
  lat: number,
  lng: number,
  radiusMeters: number
): WithDistance<T>[] {
  const latDelta = radiusMeters / METERS_PER_DEGREE_LATITUDE;
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE * Math.cos(toRadians(lat));
  const lngDelta =
    radiusMeters / (metersPerDegreeLongitude || METERS_PER_DEGREE_LATITUDE);

  const nearby: WithDistance<T>[] = [];
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
