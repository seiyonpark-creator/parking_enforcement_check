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
import { MapPin, WarningCircle } from "@phosphor-icons/react";
import { NumberedBadge, VariantDot } from "@/components/numbered-badge";
import type { NearbyFixedCctv } from "@/lib/fixed-cctv";

export type FixedCctvColumnState =
  | { status: "loading" }
  | { status: "unavailable"; reason: string }
  | { status: "success"; radiusMeters: number; results: NearbyFixedCctv[] };

export function FixedCctvColumn({ state }: { state: FixedCctvColumnState }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <VariantDot variant="fixed-cctv" />
        <h2 className="font-heading text-sm font-semibold">
          상시 단속 카메라
        </h2>
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
              <MapPin />
            </EmptyMedia>
            <EmptyTitle>근처에 상시 단속 카메라가 없습니다</EmptyTitle>
            <EmptyDescription>
              반경 {state.radiusMeters}m 이내에 등록된 카메라가 없습니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {state.status === "success" && state.results.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            반경 {state.radiusMeters}m 이내 {state.results.length}곳
          </p>
          {state.results.map((record, index) => (
            <Card key={`${record.lat}-${record.lng}-${index}`} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <NumberedBadge variant="fixed-cctv" order={index + 1} />
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  {record.branchName || record.address}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">
                  {record.zoneType} · {record.district}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
