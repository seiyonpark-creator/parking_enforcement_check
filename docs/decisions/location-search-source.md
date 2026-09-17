# 주소·장소 검색의 데이터 출처

## Decisions

- 사용자가 입력한 주소·장소명을 좌표로 바꿀 때는 OpenStreetMap Nominatim의
  search 엔드포인트를 쓴다. [reverse-geocoding](reverse-geocoding.md)과 같은
  이유(API 키·계정 승인 불필요)로 같은 제공자를 그대로 쓴다.
- 검색은 대한민국(`countrycodes=kr`) 범위로 한정해서 요청한다.
- 서버 라우트를 통해 호출한다. Nominatim 이용 정책이 요구하는 `User-Agent`를
  지정하기 위함이며, 브라우저에서 직접 호출하면 이 헤더를 설정할 수 없다
  ([reverse-geocoding](reverse-geocoding.md)과 동일한 제약).
- 검색 결과가 여러 개면 그대로 후보 목록(최대 5개)으로 반환하고, 어느 것을
  고를지는 사용자가 결정한다. 서버가 임의로 하나를 골라 반환하지 않는다.

## Boundaries

- 이 결정은 "주소·장소 검색으로 기준 위치 정하기" 기능에만 적용된다. 좌표를
  주소로 바꾸는 반대 방향은 [reverse-geocoding](reverse-geocoding.md)을 따른다.

## Why

이미 리버스 지오코딩에 Nominatim을 쓰고 있어([reverse-geocoding](reverse-geocoding.md)),
같은 제공자의 forward search(`/search`)를 추가로 쓰는 것이 새 계정이나 키 없이
가장 빠르게 구현·검증할 수 있는 선택이다.

실제 호출로 확인한 결과(2026-09-17), "서울역" 같은 장소명과 "서울특별시 동작구
만양로 105" 같은 도로명 주소 모두 정상적으로 좌표를 반환했다. 다만 흔한
장소명은 여러 후보가 나오므로(예: "서울역" 검색 시 서로 다른 출입구·플랫폼 5개),
서버가 임의로 첫 결과를 고르면 사용자가 원하지 않는 위치를 기준으로 조회하게
될 위험이 있어 후보를 그대로 사용자에게 보여주기로 했다.

## Reconsider when

- 후보 선택 UI가 실제 사용에서 번거롭다는 근거가 쌓일 때(그때 "가장 관련도
  높은 1개 자동 선택"으로 다시 열 수 있다)

## Still-rejected alternatives

- 검색어와 가장 관련도 높은 결과 1개를 자동으로 선택 — 동명이인·동명 장소가
  흔해 사용자가 원치 않는 위치를 기준으로 조회할 위험이 있어 보류.

## Evidence worth preserving

- `curl "https://nominatim.openstreetmap.org/search?q=서울역&format=jsonv2&accept-language=ko&limit=5&countrycodes=kr"` →
  서로 다른 5개 후보(다른 출입구/역사) 정상 응답 (2026-09-17 확인).
- 같은 방식으로 "서울특별시 동작구 만양로 105" 검색 → 기존 파일럿에서 쓰던
  좌표(37.5128549, 126.9440071)와 일치하는 결과 확인.
