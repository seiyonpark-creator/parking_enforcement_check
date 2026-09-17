"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, WarningCircle } from "@phosphor-icons/react";
import { NumberedBadge, VariantDot } from "@/components/numbered-badge";
import type { NearbyEnforcement } from "@/lib/parking-enforcement";

export type EnforcementHistoryColumnState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; radiusMeters: number; results: NearbyEnforcement[] };

function formatDateTime(date: string, time: string): string {
  const y = date.slice(0, 4);
  const m = date.slice(4, 6);
  const d = date.slice(6, 8);
  return `${y}.${m}.${d} ${time.slice(0, 5)}`;
}

function formatAddress(record: NearbyEnforcement): string {
  return (
    record.roadAddress.trim() || record.jibunAddress.trim() || "주소 정보 없음"
  );
}

function formatDistance(meters: number): string {
  return `${Math.round(meters)}m`;
}

export function EnforcementHistoryColumn({
  state,
}: {
  state: EnforcementHistoryColumnState;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <VariantDot variant="history" />
        <h2 className="font-heading text-sm font-semibold">
          최근 분기 단속 이력
        </h2>
      </div>

      {state.status === "loading" && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {state.status === "error" && (
        <Alert variant="destructive">
          <WarningCircle />
          <AlertTitle>불러오지 못했습니다</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
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
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            반경 {state.radiusMeters}m 이내 {state.results.length}건
          </p>
          {state.results.map((record, index) => (
            <Card key={`${record.date}-${record.time}-${index}`} size="sm">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    <NumberedBadge variant="history" order={index + 1} />
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    {formatAddress(record)}
                  </span>
                  <Badge variant="secondary">
                    {formatDistance(record.distanceMeters)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-4" />
                  {formatDateTime(record.date, record.time)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
