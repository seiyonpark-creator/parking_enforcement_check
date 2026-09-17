import { NextRequest, NextResponse } from "next/server";

// 주소·장소명을 좌표로 바꾸는 forward geocoding. 서비스 선택 이유는
// docs/decisions/location-search-source.md 참고.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "parking-enforcement-check-pilot/0.1 (educational project)";
const RESULT_LIMIT = 5;

type NominatimSearchResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: "검색어(q)가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&accept-language=ko&limit=${RESULT_LIMIT}&countrycodes=kr&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = (await response.json()) as NominatimSearchResult[];
    const candidates = data
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!item.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        return { label: item.display_name, lat, lng };
      })
      .filter((candidate): candidate is { label: string; lat: number; lng: number } => candidate !== null);

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("[geocode-search] 조회 실패:", error);
    return NextResponse.json(
      { error: "LOOKUP_FAILED", message: "검색 중 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}
