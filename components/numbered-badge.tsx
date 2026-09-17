import { cn } from "@/lib/utils";
import {
  getNumberedMarkerClass,
  getVariantDotClass,
  NUMBERED_MARKER_SIZE_PX,
  type NumberedMarkerVariant,
} from "@/lib/numbered-marker";

// 목록 항목의 순번 배지. 지도 마커(components/parking-map.tsx)와 같은 색·모양을
// getNumberedMarkerClass로 공유한다.
export function NumberedBadge({
  variant,
  order,
}: {
  variant: NumberedMarkerVariant;
  order: number;
}) {
  return (
    <span
      className={cn(getNumberedMarkerClass(variant), "shrink-0")}
      style={{ width: NUMBERED_MARKER_SIZE_PX, height: NUMBERED_MARKER_SIZE_PX }}
    >
      {order}
    </span>
  );
}

// 목록 제목 옆에 붙는 범례 점. 그 목록의 마커 색과 같다.
export function VariantDot({ variant }: { variant: NumberedMarkerVariant }) {
  return (
    <span
      className={cn("inline-block size-2.5 rounded-full", getVariantDotClass(variant))}
    />
  );
}
