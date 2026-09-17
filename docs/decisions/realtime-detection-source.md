# 실시간 감지 보조 알림의 데이터 출처

## Decisions

- t-data.seoul.go.kr의 V2X 불법주정차 위치정보알림(`itisCd=4120`)을 실시간 보조
  알림의 데이터 출처로 쓴다. 주 데이터 출처([parking-data-source](parking-data-source.md))를
  대체하지 않는다.
- 인증키(`TDATA_API_KEY`)는 서버 환경변수로만 두고, 없으면 이 보조 기능 자체를
  조용히 끈다(에러 노출 없이 요청을 생략). 나머지 기능(이력 조회, 지도)은 키
  유무와 무관하게 항상 정상 동작한다.

## Boundaries

- 이 결정은 "실시간 감지 보조 알림" 기능에만 적용된다. 단속 이력 조회·지도
  표시는 [parking-data-source](parking-data-source.md), [map-library](map-library.md)를
  그대로 따른다.

## Why

t-data.seoul.go.kr 키를 실제로 발급받아 호출한 결과(2026-09-17,
[parking-data-source](parking-data-source.md)의 근거 참고), 실시간성은 진짜였지만
시스템 전체에 카메라 5대·좌표 5곳뿐이라 커버리지가 서비스 전체를 대표하지
못했다. 그래서 주 데이터 출처를 이걸로 바꾸지 않고, "이 감지 지점 근처일 때만
추가로 보여주는" 좁은 보조 기능으로 범위를 좁혔다.

인증키는 사용자 개인 계정(서울시 통합로그인)에 연결된 것이라, 다른 사람이 이
저장소를 내려받아 실행할 때 같은 키를 쓸 수 없다. 키가 없어도 앱 전체가
정상 동작해야 하므로, 이 기능만 조건부로 동작하게 한다.

## Reconsider when

- V2X 센서 배치가 확대돼 감지 지점이 서비스 지역을 의미 있게 커버하게 될 때
  (그때는 이 보조 알림을 지도 상시 표시 등 더 큰 기능으로 승격할지 재검토)

## Still-rejected alternatives

- 인증키를 저장소나 배포 환경 기본값으로 내장 — 사용자 개인 계정에 묶인 키를
  공유하는 것은 부적절하고, 키가 없는 환경에서 앱 전체가 깨질 위험도 있음.

## Evidence worth preserving

- [parking-data-source](parking-data-source.md)의 "Evidence worth preserving"에
  기록된 실제 호출 결과(카메라 5대, 3,328건, 최신 `regDt`가 요청 시각과 초 단위로
  일치)를 그대로 참고한다.
