# 지도 라이브러리 선택

## Decisions

- 지도 표시에는 Leaflet + react-leaflet(OpenStreetMap 타일)을 쓴다. API 키 발급이나
  외부 개발자 계정 승인이 필요 없는 선택지를 우선한다.

## Boundaries

- 이 결정은 이 프로젝트에서 지도를 그리는 모든 화면에 적용된다.
- 카카오맵·네이버지도 수준의 한국 현지화(정확한 한글 도로명·POI 라벨링 등)가 제품
  경험에 명백히 필요해지면 이 결정을 다시 연다.

## Why

[parking-data-source](parking-data-source.md) 결정과 같은 이유로, 외부 계정 승인이나
API 키 발급 절차에 의존하지 않는 선택지를 우선했다. 카카오맵·네이버 지도는 한국
사용자에게 익숙하지만 개발자 계정 가입, 앱키 발급, 도메인 등록이 필요해 즉시 구현하고
검증하는 흐름을 막을 위험이 있다. Leaflet + OpenStreetMap은 그런 승인 절차 없이 바로
쓸 수 있다.

`skills.sh`에서 Leaflet·지도 관련 스킬을 검색했으나 Leaflet나 react-leaflet의 공식
조직이 소유한 벤더 스킬은 없었고, 커뮤니티 스킬은 설치 수가 모두 낮아(최고 211건)
신뢰 기준을 넘지 못해 설치하지 않았다. 대신 공식 문서(leafletjs.com,
react-leaflet.js.org)를 가리키는 안내를 `AGENTS.md`에 추가했다.

`react-leaflet@5.0.0`의 peerDependencies는 `react`/`react-dom` `^19.0.0`을 요구하며,
이 프로젝트의 `react@19.2.8`과 호환된다.

## Reconsider when

- 한국 현지화된 지도(정확한 도로명, 건물명, POI 표기)가 제품 경험에 필수적이라고
  확인될 때
- OpenStreetMap 공개 타일 서버(tile.openstreetmap.org)의 사용량 제한이 실제 서비스
  규모에서 병목으로 확인될 때

## Still-rejected alternatives

- 카카오맵 JavaScript SDK — API 키 발급과 도메인 등록이 필요해 즉시 구현을 막을 위험;
  한국 현지화가 꼭 필요해지면 재검토.
- 네이버 지도 API — 카카오맵과 같은 이유로 보류.
- Google Maps — API 키 발급과 결제 정보 등록이 필요해 보류.

## Evidence worth preserving

- `npm view react-leaflet peerDependencies` → `{ leaflet: '^1.9.0', react: '^19.0.0',
  'react-dom': '^19.0.0' }` (2026-09-17 확인, 프로젝트의 react 19.2.8과 호환).
- `npx skills find leaflet map` 결과, 공식 벤더 스킬 없음 확인.
