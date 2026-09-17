import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_RADIUS_METERS,
  findNearbyFixedCctv,
  isFixedCctvConfigured,
} from "@/lib/fixed-cctv";

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

  if (!isFixedCctvConfigured()) {
    return NextResponse.json({
      available: false,
      reason: "이 기능을 쓰려면 서울 열린데이터광장 인증키(SEOUL_OPENAPI_KEY)가 필요합니다.",
    });
  }

  try {
    const results = await findNearbyFixedCctv(lat, lng);
    return NextResponse.json({
      available: true,
      radiusMeters: DEFAULT_RADIUS_METERS,
      results,
    });
  } catch (error) {
    console.error("[fixed-cctv] 조회 실패:", error);
    return NextResponse.json({
      available: false,
      reason: "상시 단속 카메라 정보를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    });
  }
}
