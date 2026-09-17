# 세 데이터 출처를 한 화면에 나란히 보여주기

이 스펙은 [nearby-enforcement-map](../nearby-enforcement-map/spec.md)과
[realtime-detection-alert](../realtime-detection-alert/spec.md)를 대체한다. 두
스펙이 다루던 지도·목록 배치와 실시간 알림 방식이 이 스펙으로 바뀐다.

## 사용자 결과

사용자는 한 화면에서 세 가지 서로 다른 단속 관련 정보 — 상시 단속 카메라 위치,
최근 분기 단속 이력, 실시간 감지 알림 — 를 각각의 목록과 지도 마커로 구분해
확인할 수 있다. 각 정보의 출처와 한계(갱신 주기, 커버리지)가 화면에서
분명하게 드러난다.

## 승인된 범위

- 화면 최상단에는 현재 위치(도로명 주소)와 지도를 그대로 둔다.
- 지도 아래에 세 개의 목록을 나란히 둔다: 왼쪽 "상시 단속 카메라", 가운데
  "최근 분기 단속 이력", 오른쪽 "실시간 감지".
- 각 목록은 가까운 순으로 번호가 매겨진 항목을 보여주고, 같은 번호의 마커를
  지도 위에 표시한다.
- 세 데이터 출처는 서로 다른 색으로 구분한다: 단속 이력은 기존 초록,
  상시 카메라는 주황, 실시간 감지는 빨강. 각 목록 제목 옆에 그 색상 점을 함께
  표시해 범례 역할을 하게 한다.
- 상시 카메라(OA-20471)와 실시간 감지(t-data.seoul.go.kr)는 각각
  [fixed-cctv-source](../../decisions/fixed-cctv-source.md),
  [realtime-detection-source](../../decisions/realtime-detection-source.md)에
  따라 개인 인증키가 없으면 해당 목록에 안내 문구만 보여주고 나머지 화면은
  그대로 동작한다.
- 실시간 감지 목록은 결과가 없을 때도 "왜 없는지"(좁은 커버리지, 신선도 조건
  등)를 설명하는 문구를 보여준다. 상시 카메라·단속 이력 목록도 결과가 없으면
  기존과 같은 방식(Empty 상태)으로 안내한다.

## 관찰 가능한 수용 기준

1. 위치 조회에 성공하면 지도 아래에 세 목록(상시 카메라/단속 이력/실시간 감지)이
   왼쪽부터 순서대로 나타난다.
2. 각 목록의 항목 번호와 지도 위 같은 색 마커의 번호가 일치한다.
3. 세 목록의 마커 색이 서로 다르며(초록/주황/빨강), 각 목록 제목 옆에 그 색과
   같은 표시가 있다.
4. `SEOUL_OPENAPI_KEY`가 없으면 "상시 카메라" 목록에 인증키가 없다는 안내가
   보이고, 단속 이력·지도·실시간 감지는 영향받지 않는다.
5. `TDATA_API_KEY`가 없으면 "실시간 감지" 목록에 인증키가 없다는 안내가 보이고,
   나머지는 영향받지 않는다.
6. 두 키가 모두 있고 실시간 감지 조건(반경 300m, 최근 5분 이내)에 맞는 감지가
   없으면, "실시간 감지" 목록에 빈 상태가 아니라 "왜 없는지"를 설명하는 문구가
   보인다.
7. 세 목록 중 하나의 외부 API 호출이 실패해도 나머지 두 목록과 지도는 정상
   동작한다.

## 확정된 제약과 이유

- 단속 이력 데이터·표시 방식은 [nearby-enforcement-history](../nearby-enforcement-history/spec.md)의
  수용 기준을 그대로 물려받는다. 반경 300m, 2025 Q4 CSV 등 기존 제약은 바뀌지
  않는다.
- 지도 라이브러리는 계속 Leaflet + react-leaflet([map-library](../../decisions/map-library.md)).
- 상시 카메라는 [fixed-cctv-source](../../decisions/fixed-cctv-source.md),
  실시간 감지는 [realtime-detection-source](../../decisions/realtime-detection-source.md)의
  데이터 출처·키 처리 방식을 따른다.
- 세 데이터셋을 시각적으로 구분하기 위해 마커 색상을 달리한다. 같은 번호가
  다른 의미로 겹쳐 보이는 걸 막기 위함이다([ui-composition](../../decisions/ui-composition.md)의
  "커스텀 UI가 허용되는 표면" 범위 안에서 처리한다).

## 가정

- 세 목록의 레이아웃은 넓은 화면에서 3열, 좁은 화면(모바일)에서는 세로로
  쌓는다([ui-composition](../../decisions/ui-composition.md)의 반응형 원칙).
- 상시 카메라 목록도 반경 300m, 가까운 순 정렬로 단속 이력과 같은 방식을
  따른다.
- 색상 배정(이력=초록, 상시카메라=주황, 실시간=빨강)은 재검토 가능한 선택이며,
  프로젝트의 semantic color token 체계 안에서 가장 가까운 색을 쓴다.
- 상시 카메라 API(`TbOpendataFixedcctv`)는 서버가 전체 데이터(약 4,667건)를
  한 번 받아 메모리에 캐시하고, 매 사용자 요청은 이 캐시에서 반경 필터링만
  한다.

## 범위 밖 (이유)

- 마커 클러스터링 — [nearby-enforcement-map](../nearby-enforcement-map/spec.md)에서
  이미 범위 밖으로 정했고, 이번에도 유지한다.
- 실시간 감지의 폴링/자동 새로고침 — 1회 조회 결과를 기준으로 하는 기존 원칙을
  유지한다.
- 카메라 인증키 발급 대행이나 공용 키 제공 — 각자 자기 계정으로 발급받아야
  한다.
- 세 목록 중 특정 목록만 켜고 끄는 사용자 설정 — 이번 범위에서는 항상 세
  목록을 함께 보여준다.

## 유보된 결정

- 세 데이터셋의 정확한 색상 값(브랜드 토큰 매핑)은 구현 시 확정한다.
- 실시간 감지 커버리지가 넓어지면 이 레이아웃을 다시 검토할지는
  [realtime-detection-source](../../decisions/realtime-detection-source.md)의
  재검토 조건을 따른다.

## 남은 위험

- 좁은 화면에서 목록 3개 + 지도를 한 화면에 배치하면 스크롤이 길어질 수 있다.
  실제 화면에서 확인이 필요하다.
- 상시 카메라 API를 서버가 전체 캐시하는 방식은 서버 재시작 전까지 갱신되지
  않는다. 분기 1회 갱신되는 데이터라 이번 범위에서는 허용 가능한 트레이드오프로
  본다.

## 연결된 소스

- [nearby-enforcement-history spec](../nearby-enforcement-history/spec.md) — 단속
  이력 목록의 수용 기준(변경 없음).
- [nearby-enforcement-map spec](../nearby-enforcement-map/spec.md) — 이 스펙이
  대체하는 이전 지도 배치 스펙(참고용, 더는 단독으로 적용되지 않음).
- [realtime-detection-alert spec](../realtime-detection-alert/spec.md) — 이
  스펙이 대체하는 이전 실시간 알림 스펙(참고용, 더는 단독으로 적용되지 않음).
- [map-library](../../decisions/map-library.md), [fixed-cctv-source](../../decisions/fixed-cctv-source.md),
  [realtime-detection-source](../../decisions/realtime-detection-source.md),
  [ui-composition](../../decisions/ui-composition.md) — 각 데이터 출처와 UI
  구성의 근거.

이 스펙에 없는 세부 규칙은 위 소스가 갖고 있으므로, 구현 시 함께 참고한다.
