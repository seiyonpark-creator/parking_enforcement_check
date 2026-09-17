import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_RADIUS_METERS,
  findNearbyEnforcements,
} from "@/lib/parking-enforcement";

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

  try {
    const results = await findNearbyEnforcements(lat, lng, DEFAULT_RADIUS_METERS);
    return NextResponse.json({
      radiusMeters: DEFAULT_RADIUS_METERS,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("[nearby-enforcement] 조회 실패:", error);
    return NextResponse.json(
      {
        error: "LOOKUP_FAILED",
        message: "단속 이력을 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
