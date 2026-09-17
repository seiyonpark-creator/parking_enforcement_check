# 상시 단속 카메라 데이터 출처

## Decisions

- 서울시 불법주정차/전용차로 위반 단속 CCTV 위치정보(OA-20471, 서울 열린데이터광장
  Open API, 서비스명 `TbOpendataFixedcctv`)를 상시 단속 카메라 위치의 데이터
  출처로 쓴다.
- 인증키(`SEOUL_OPENAPI_KEY`)는 서버 환경변수로만 두고, 없으면 이 기능만 조용히
  끈다. [realtime-detection-source](realtime-detection-source.md)와 같은 이유다.
- 전체 데이터(약 4,667건, 분기 1회 갱신)를 서버에서 한 번 받아 메모리에 캐시하고,
  사용자 위치 기준 반경 필터링은 그 캐시에서 처리한다. 매 요청마다 외부 API를
  다시 부르지 않는다.

## Boundaries

- 이 결정은 "상시 단속 카메라 위치 표시" 기능에만 적용된다. 실시간 감지는
  [realtime-detection-source](realtime-detection-source.md), 단속 이력은
  [parking-data-source](parking-data-source.md)를 따른다.

## Why

이 데이터셋은 [parking-data-source](parking-data-source.md) 조사 과정에서 처음엔
"다운로드 가능한 파일 없음"으로 잘못 판단했으나, 실제로는 표준 Open API가
정상 동작함을 확인했다(2026-09-17, 샘플키로 4,667건 정상 응답). 이 데이터는
"상시 단속 카메라가 있는 구역"이라는, 단속 이력이나 실시간 감지와는 또 다른
유용한 정보라 별도 데이터 출처로 채택한다.

인증키는 서울 열린데이터광장 계정에 연결된 것이라, 다른 사람이 이 저장소를
내려받아 실행할 때 같은 키를 쓸 수 없다. 이 데이터는 분기 1회만 갱신되므로,
매 요청마다 API를 부르지 않고 서버가 한 번 받아 캐시해 두는 편이 API 호출
횟수도 아끼고 응답도 빠르다.

## Reconsider when

- OA-20471의 갱신 주기가 분기보다 짧아지거나, 캐시 후 갱신이 필요한 시점을
  자동으로 감지해야 할 필요가 생길 때

## Still-rejected alternatives

- 매 요청마다 실시간으로 API를 호출해 반경 필터링 — 데이터가 분기에 한 번만
  바뀌는데 매번 4,667건을 다시 받아오는 건 불필요한 낭비다.

## Evidence worth preserving

- [parking-data-source](parking-data-source.md)의 "Evidence worth preserving"에
  기록된 `TbOpendataFixedcctv` 샘플 호출 결과를 그대로 참고한다.
