import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_RADIUS_METERS,
  findNearbyRealtimeDetections,
  isRealtimeDetectionConfigured,
} from "@/lib/realtime-detection";

const NO_KEY_REASON =
  "이 기능을 쓰려면 t-data.seoul.go.kr 인증키(TDATA_API_KEY)가 필요합니다.";
const NO_NEARBY_REASON =
  "실시간 감지는 서울 일부 지점에서만 시범 제공됩니다. 지금 위치 근처에는 최근 5분 이내 감지된 정보가 없습니다.";
const LOOKUP_FAILED_REASON =
  "실시간 감지 정보를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = latParam === null ? NaN : Number(latParam);
  const lng = lngParam === null ? NaN : Number(lngParam);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      {
        error: "INVALID_COORDINATES",
        message: "lat, lng 쿼리 파라미터가 필요합니다.",
      },
      { status: 400 }
    );
  }

  if (!isRealtimeDetectionConfigured()) {
    return NextResponse.json({ available: false, reason: NO_KEY_REASON });
  }

  try {
    const results = await findNearbyRealtimeDetections(lat, lng);
    return NextResponse.json({
      available: true,
      radiusMeters: DEFAULT_RADIUS_METERS,
      results,
      reason: results.length === 0 ? NO_NEARBY_REASON : undefined,
    });
  } catch (error) {
    console.error("[realtime-detection] 조회 실패:", error);
    return NextResponse.json({
      available: false,
      reason: LOOKUP_FAILED_REASON,
    });
  }
}
