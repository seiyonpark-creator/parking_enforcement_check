// 리스트 배지와 지도 마커가 같은 모양을 쓰도록 스타일을 한 곳에서 관리한다.
// 세 데이터 출처(단속 이력/상시 카메라/실시간 감지)를 색으로 구분한다.
export const NUMBERED_MARKER_SIZE_PX = 22;

export type NumberedMarkerVariant = "history" | "fixed-cctv" | "realtime";

const VARIANT_COLOR_CLASS: Record<NumberedMarkerVariant, string> = {
  history: "bg-primary text-primary-foreground",
  "fixed-cctv": "bg-[#f97316] text-white",
  realtime: "bg-destructive text-white",
};

export function getNumberedMarkerClass(variant: NumberedMarkerVariant): string {
  return `flex items-center justify-center rounded-full text-xs font-semibold ${VARIANT_COLOR_CLASS[variant]}`;
}

// 목록 제목 옆 범례 점에 쓰는 배경색 클래스(배지와 같은 색).
export function getVariantDotClass(variant: NumberedMarkerVariant): string {
  return VARIANT_COLOR_CLASS[variant].split(" ")[0];
}
