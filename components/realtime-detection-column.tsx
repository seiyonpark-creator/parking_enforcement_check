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
import { Clock, MapPin, WarningCircle } from "@phosphor-icons/react";
import { NumberedBadge, VariantDot } from "@/components/numbered-badge";
import type { NearbyRealtimeDetection } from "@/lib/realtime-detection";

export type RealtimeDetectionColumnState =
  | { status: "loading" }
  | { status: "unavailable"; reason: string }
  | {
      status: "success";
      radiusMeters: number;
      results: NearbyRealtimeDetection[];
      reason?: string;
    };

function formatDetectedTime(detectedAt: string): string {
  return new Date(detectedAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function RealtimeDetectionColumn({
  state,
}: {
  state: RealtimeDetectionColumnState;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <VariantDot variant="realtime" />
        <h2 className="font-heading text-sm font-semibold">실시간 감지</h2>
      </div>

      {state.status === "loading" && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {state.status === "unavailable" && (
        <Alert>
          <WarningCircle />
          <AlertTitle>지금은 제공되지 않습니다</AlertTitle>
          <AlertDescription>{state.reason}</AlertDescription>
        </Alert>
      )}

      {state.status === "success" && state.results.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WarningCircle />
            </EmptyMedia>
            <EmptyTitle>지금은 감지된 정보가 없습니다</EmptyTitle>
            <EmptyDescription>{state.reason}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {state.status === "success" && state.results.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            반경 {state.radiusMeters}m 이내 {state.results.length}건 (최근 5분)
          </p>
          {state.results.map((record, index) => (
            <Card key={record.cameraId} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <NumberedBadge variant="realtime" order={index + 1} />
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  실시간 감지
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-4" />
                  {formatDetectedTime(record.detectedAt)} 감지 ·{" "}
                  {Math.round(record.distanceMeters)}m
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
