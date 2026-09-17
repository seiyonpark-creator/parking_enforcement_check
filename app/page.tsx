"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  NavigationArrow,
  WarningCircle,
  Clock,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { NearbyEnforcement } from "@/lib/parking-enforcement";

type State =
  | { status: "requesting-location" }
  | { status: "loading" }
  | { status: "success"; radiusMeters: number; results: NearbyEnforcement[] }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

function formatDateTime(date: string, time: string): string {
  // date: "20251001" -> "2025.10.01"
  const y = date.slice(0, 4);
  const m = date.slice(4, 6);
  const d = date.slice(6, 8);
  return `${y}.${m}.${d} ${time.slice(0, 5)}`;
}

function formatAddress(record: NearbyEnforcement): string {
  return record.roadAddress.trim() || record.jibunAddress.trim() || "주소 정보 없음";
}

function formatDistance(meters: number): string {
  return `${Math.round(meters)}m`;
}

async function fetchNearbyEnforcements(
  lat: number,
  lng: number
): Promise<{ radiusMeters: number; results: NearbyEnforcement[] }> {
  const response = await fetch(
    `/api/nearby-enforcement?lat=${lat}&lng=${lng}`
  );
  if (!response.ok) {
    throw new Error("서버에서 이력을 가져오지 못했습니다.");
  }
  return response.json();
}

type Coords = { lat: number; lng: number };

function formatCoords(coords: Coords): string {
  return `위도 ${coords.lat.toFixed(6)}, 경도 ${coords.lng.toFixed(6)}`;
}

function requestLocation(
  setState: (state: State) => void,
  setCoords: (coords: Coords | null) => void
) {
  setState({ status: "requesting-location" });
  setCoords(null);

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setState({ status: "unsupported" });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });
      setState({ status: "loading" });
      try {
        const data = await fetchNearbyEnforcements(latitude, longitude);
        setState({
          status: "success",
          radiusMeters: data.radiusMeters,
          results: data.results,
        });
      } catch {
        setState({
          status: "error",
          message: "단속 이력을 불러오는 중 문제가 생겼습니다.",
        });
      }
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setState({ status: "denied" });
      } else {
        setState({
          status: "error",
          message: "현재 위치를 확인하지 못했습니다.",
        });
      }
    },
    { enableHighAccuracy: true, timeout: 10_000 }
  );
}

export default function Home() {
  const [state, setState] = useState<State>({ status: "requesting-location" });
  const [coords, setCoords] = useState<Coords | null>(null);

  // 최초 진입 시 한 번만 자동으로 위치 확인을 시작한다.
  useEffect(() => {
    requestLocation(setState, setCoords);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center bg-muted/30 px-4 py-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        {coords && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            현재 위치: {formatCoords(coords)}
          </div>
        )}

        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            내 위치 근처 단속 이력
          </h1>
          <p className="text-sm text-muted-foreground">
            현재 위치를 기준으로 반경 300m 이내, 2025년 4분기 서울시 불법주정차
            단속 이력을 보여줍니다.
          </p>
        </header>

        {state.status === "requesting-location" && (
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

        {state.status === "loading" && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {state.status === "denied" && (
          <Alert variant="destructive">
            <WarningCircle />
            <AlertTitle>위치 권한이 필요합니다</AlertTitle>
            <AlertDescription>
              브라우저 설정에서 이 사이트의 위치 접근을 허용한 뒤 다시
              시도해 주세요.
            </AlertDescription>
            <div className="col-start-2 mt-2">
              <Button size="sm" onClick={() => requestLocation(setState, setCoords)}>
                다시 시도
              </Button>
            </div>
          </Alert>
        )}

        {state.status === "unsupported" && (
          <Alert variant="destructive">
            <WarningCircle />
            <AlertTitle>위치 조회를 지원하지 않는 브라우저입니다</AlertTitle>
            <AlertDescription>
              다른 브라우저에서 다시 시도해 주세요.
            </AlertDescription>
          </Alert>
        )}

        {state.status === "error" && (
          <Alert variant="destructive">
            <WarningCircle />
            <AlertTitle>문제가 발생했습니다</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
            <div className="col-start-2 mt-2">
              <Button size="sm" onClick={() => requestLocation(setState, setCoords)}>
                다시 시도
              </Button>
            </div>
          </Alert>
        )}

        {state.status === "success" && state.results.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPin />
              </EmptyMedia>
              <EmptyTitle>최근 단속 이력이 없습니다</EmptyTitle>
              <EmptyDescription>
                반경 {state.radiusMeters}m 이내, 2025년 4분기 기준으로 기록된
                단속 이력이 없습니다.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {state.status === "success" && state.results.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              반경 {state.radiusMeters}m 이내 이력 {state.results.length}건
              (가까운 순)
            </p>
            {state.results.map((record, index) => (
              <Card key={`${record.date}-${record.time}-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4 text-muted-foreground" />
                      {formatAddress(record)}
                    </span>
                    <Badge variant="secondary">
                      {formatDistance(record.distanceMeters)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {formatDateTime(record.date, record.time)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
