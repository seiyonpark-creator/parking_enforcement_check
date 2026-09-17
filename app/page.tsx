"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { NavigationArrow, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { NearbyEnforcement } from "@/lib/parking-enforcement";
import type { NearbyFixedCctv } from "@/lib/fixed-cctv";
import type { NearbyRealtimeDetection } from "@/lib/realtime-detection";
import {
  CURRENT_LOCATION_BORDER,
  CURRENT_LOCATION_BORDER_WIDTH_PX,
  CURRENT_LOCATION_FILL,
  CURRENT_LOCATION_SIZE_PX,
} from "@/lib/current-location-marker";
import {
  EnforcementHistoryColumn,
  type EnforcementHistoryColumnState,
} from "@/components/enforcement-history-column";
import {
  FixedCctvColumn,
  type FixedCctvColumnState,
} from "@/components/fixed-cctv-column";
import {
  RealtimeDetectionColumn,
  type RealtimeDetectionColumnState,
} from "@/components/realtime-detection-column";
import { LocationSearch, type GeocodeCandidate } from "@/components/location-search";

// Leaflet은 window/document에 의존하므로 클라이언트에서만 불러온다.
const ParkingMap = dynamic(() => import("@/components/parking-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full sm:h-80" />,
});

type LocationState =
  | { status: "requesting-location" }
  | { status: "ready" }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

type LocationSource = "gps" | "search";

type Coords = { lat: number; lng: number };

type DataSetters = {
  setHistoryState: (state: EnforcementHistoryColumnState) => void;
  setFixedCctvState: (state: FixedCctvColumnState) => void;
  setRealtimeState: (state: RealtimeDetectionColumnState) => void;
};

function formatCoords(coords: Coords): string {
  return `위도 ${coords.lat.toFixed(6)}, 경도 ${coords.lng.toFixed(6)}`;
}

async function fetchAddress(lat: number, lng: number): Promise<string | null> {
  const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
  if (!response.ok) return null;
  const data: { address?: string | null } = await response.json();
  return data.address ?? null;
}

async function fetchEnforcementHistory(
  lat: number,
  lng: number
): Promise<EnforcementHistoryColumnState> {
  try {
    const response = await fetch(`/api/nearby-enforcement?lat=${lat}&lng=${lng}`);
    if (!response.ok) throw new Error("요청 실패");
    const data: { radiusMeters: number; results: NearbyEnforcement[] } =
      await response.json();
    return { status: "success", radiusMeters: data.radiusMeters, results: data.results };
  } catch {
    return { status: "error", message: "단속 이력을 불러오는 중 문제가 생겼습니다." };
  }
}

async function fetchFixedCctv(
  lat: number,
  lng: number
): Promise<FixedCctvColumnState> {
  try {
    const response = await fetch(`/api/fixed-cctv?lat=${lat}&lng=${lng}`);
    const data: {
      available: boolean;
      reason?: string;
      radiusMeters?: number;
      results?: NearbyFixedCctv[];
    } = await response.json();
    if (!data.available) {
      return { status: "unavailable", reason: data.reason ?? "지금은 제공되지 않습니다." };
    }
    return {
      status: "success",
      radiusMeters: data.radiusMeters ?? 300,
      results: data.results ?? [],
    };
  } catch {
    return {
      status: "unavailable",
      reason: "상시 단속 카메라 정보를 가져오지 못했습니다.",
    };
  }
}

async function fetchRealtimeDetection(
  lat: number,
  lng: number
): Promise<RealtimeDetectionColumnState> {
  try {
    const response = await fetch(`/api/realtime-detection?lat=${lat}&lng=${lng}`);
    const data: {
      available: boolean;
      reason?: string;
      radiusMeters?: number;
      results?: NearbyRealtimeDetection[];
    } = await response.json();
    if (!data.available) {
      return { status: "unavailable", reason: data.reason ?? "지금은 제공되지 않습니다." };
    }
    return {
      status: "success",
      radiusMeters: data.radiusMeters ?? 300,
      results: data.results ?? [],
      reason: data.reason,
    };
  } catch {
    return {
      status: "unavailable",
      reason: "실시간 감지 정보를 가져오지 못했습니다.",
    };
  }
}

// 세 데이터 출처는 서로 독립적으로 조회한다. 하나가 실패해도 나머지에는
// 영향을 주지 않는다. GPS 위치든 검색으로 고른 위치든 이 함수 하나로 갱신한다.
function loadDataForCoords(lat: number, lng: number, setters: DataSetters) {
  setters.setHistoryState({ status: "loading" });
  setters.setFixedCctvState({ status: "loading" });
  setters.setRealtimeState({ status: "loading" });

  fetchEnforcementHistory(lat, lng).then(setters.setHistoryState);
  fetchFixedCctv(lat, lng).then(setters.setFixedCctvState);
  fetchRealtimeDetection(lat, lng).then(setters.setRealtimeState);
}

function requestLocation(
  setLocationState: (state: LocationState) => void,
  setCoords: (coords: Coords | null) => void,
  setAddress: (address: string | null) => void,
  setSource: (source: LocationSource) => void,
  dataSetters: DataSetters
) {
  setLocationState({ status: "requesting-location" });
  setCoords(null);
  setAddress(null);
  setSource("gps");
  dataSetters.setHistoryState({ status: "loading" });
  dataSetters.setFixedCctvState({ status: "loading" });
  dataSetters.setRealtimeState({ status: "loading" });

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setLocationState({ status: "unsupported" });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });
      setLocationState({ status: "ready" });
      setSource("gps");

      fetchAddress(latitude, longitude)
        .then((address) => {
          setAddress(address ?? formatCoords({ lat: latitude, lng: longitude }));
        })
        .catch(() => {
          setAddress(formatCoords({ lat: latitude, lng: longitude }));
        });

      loadDataForCoords(latitude, longitude, dataSetters);
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setLocationState({ status: "denied" });
      } else {
        setLocationState({
          status: "error",
          message: "현재 위치를 확인하지 못했습니다.",
        });
      }
    },
    { enableHighAccuracy: true, timeout: 10_000 }
  );
}

function applySearchedLocation(
  candidate: GeocodeCandidate,
  setLocationState: (state: LocationState) => void,
  setCoords: (coords: Coords | null) => void,
  setAddress: (address: string | null) => void,
  setSource: (source: LocationSource) => void,
  dataSetters: DataSetters
) {
  setCoords({ lat: candidate.lat, lng: candidate.lng });
  // 검색 결과의 표시 이름을 그대로 쓴다. 별도로 리버스 지오코딩을 다시 부를
  // 필요가 없다.
  setAddress(candidate.label);
  setSource("search");
  setLocationState({ status: "ready" });
  loadDataForCoords(candidate.lat, candidate.lng, dataSetters);
}

export default function Home() {
  const [locationState, setLocationState] = useState<LocationState>({
    status: "requesting-location",
  });
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [source, setSource] = useState<LocationSource>("gps");
  const [historyState, setHistoryState] = useState<EnforcementHistoryColumnState>({
    status: "loading",
  });
  const [fixedCctvState, setFixedCctvState] = useState<FixedCctvColumnState>({
    status: "loading",
  });
  const [realtimeState, setRealtimeState] = useState<RealtimeDetectionColumnState>({
    status: "loading",
  });

  const dataSetters: DataSetters = {
    setHistoryState,
    setFixedCctvState,
    setRealtimeState,
  };

  // 최초 진입 시 한 번만 자동으로 위치 확인을 시작한다.
  useEffect(() => {
    requestLocation(setLocationState, setCoords, setAddress, setSource, dataSetters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () =>
    requestLocation(setLocationState, setCoords, setAddress, setSource, dataSetters);

  const handleSelectCandidate = (candidate: GeocodeCandidate) =>
    applySearchedLocation(
      candidate,
      setLocationState,
      setCoords,
      setAddress,
      setSource,
      dataSetters
    );

  return (
    <div className="flex flex-1 flex-col items-center bg-muted/30 px-4 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            내 위치 근처 주정차 단속 정보
          </h1>
          <p className="text-sm text-muted-foreground">
            현재 위치를 기준으로 상시 단속 카메라, 최근 분기 단속 이력, 실시간
            감지 정보를 함께 보여줍니다. 주소나 장소명을 검색해서 다른 위치를
            기준으로도 확인할 수 있습니다.
          </p>
        </header>

        <LocationSearch
          isUsingSearch={source === "search"}
          onSelectCandidate={handleSelectCandidate}
          onUseCurrentLocation={retry}
        />

        {coords && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="inline-block shrink-0 rounded-full"
              style={{
                width: CURRENT_LOCATION_SIZE_PX,
                height: CURRENT_LOCATION_SIZE_PX,
                backgroundColor: CURRENT_LOCATION_FILL,
                border: `${CURRENT_LOCATION_BORDER_WIDTH_PX}px solid ${CURRENT_LOCATION_BORDER}`,
              }}
            />
            {source === "search" ? "검색한 위치" : "현재 위치"}:{" "}
            {address ?? "주소 확인 중..."}
          </div>
        )}

        {locationState.status === "requesting-location" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <NavigationArrow className="size-6 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                위치 정보를 요청하고 있습니다. 브라우저의 위치 권한 요청을
                허용해 주세요.
              </p>
            </CardContent>
          </Card>
        )}

        {locationState.status === "denied" && (
          <Alert variant="destructive">
            <WarningCircle />
            <AlertTitle>위치 권한이 필요합니다</AlertTitle>
            <AlertDescription>
              브라우저 설정에서 이 사이트의 위치 접근을 허용한 뒤 다시
              시도하거나, 위의 검색으로 주소를 입력해 주세요.
            </AlertDescription>
            <div className="col-start-2 mt-2">
              <Button size="sm" onClick={retry}>
                다시 시도
              </Button>
            </div>
          </Alert>
        )}

        {locationState.status === "unsupported" && (
          <Alert variant="destructive">
            <WarningCircle />
            <AlertTitle>위치 조회를 지원하지 않는 브라우저입니다</AlertTitle>
            <AlertDescription>
              위의 검색으로 주소나 장소명을 입력해 주세요.
            </AlertDescription>
          </Alert>
        )}

        {locationState.status === "error" && (
          <Alert variant="destructive">
            <WarningCircle />
            <AlertTitle>문제가 발생했습니다</AlertTitle>
            <AlertDescription>{locationState.message}</AlertDescription>
            <div className="col-start-2 mt-2">
              <Button size="sm" onClick={retry}>
                다시 시도
              </Button>
            </div>
          </Alert>
        )}

        {locationState.status === "ready" && coords && (
          <ParkingMap
            lat={coords.lat}
            lng={coords.lng}
            historyResults={
              historyState.status === "success" ? historyState.results : []
            }
            fixedCctvResults={
              fixedCctvState.status === "success" ? fixedCctvState.results : []
            }
            realtimeResults={
              realtimeState.status === "success" ? realtimeState.results : []
            }
          />
        )}

        {locationState.status === "ready" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FixedCctvColumn state={fixedCctvState} />
            <EnforcementHistoryColumn state={historyState} />
            <RealtimeDetectionColumn state={realtimeState} />
          </div>
        )}
      </div>
    </div>
  );
}
