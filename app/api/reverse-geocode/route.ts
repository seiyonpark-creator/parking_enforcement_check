import { NextRequest, NextResponse } from "next/server";

// OpenStreetMap Nominatim으로 좌표를 도로명 주소에 가까운 형태로 바꾼다.
// API 키가 필요 없어 map-library 결정과 같은 이유로 선택했다.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "parking-enforcement-check-pilot/0.1 (educational project)";

type NominatimAddress = {
  road?: string;
  house_number?: string;
  borough?: string;
  city?: string;
  county?: string;
};

function formatRoadAddress(address: NominatimAddress): string | null {
  const city = address.city ?? address.county;
  const parts = [city, address.borough, address.road].filter(
    (part): part is string => Boolean(part)
  );
  if (parts.length === 0) return null;

  const withNumber = address.house_number
    ? `${parts.join(" ")} ${address.house_number}`
    : parts.join(" ");
  return withNumber;
}

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
    const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko&zoom=18`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = (await response.json()) as { address?: NominatimAddress };
    const address = data.address ? formatRoadAddress(data.address) : null;

    return NextResponse.json({ address });
  } catch (error) {
    console.error("[reverse-geocode] 조회 실패:", error);
    return NextResponse.json(
      { error: "LOOKUP_FAILED", message: "주소를 확인하지 못했습니다." },
      { status: 500 }
    );
  }
}
