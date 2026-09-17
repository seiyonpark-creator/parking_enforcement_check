# 좌표 → 주소 변환(리버스 지오코딩)

## Decisions

- 현재 위치 좌표를 사람이 읽는 주소로 바꿀 때는 OpenStreetMap Nominatim의 reverse
  엔드포인트를 쓴다. API 키나 계정 승인이 필요 없다.
- 서버 사이드 라우트(`app/api/reverse-geocode`)를 통해 호출한다. Nominatim 이용
  정책이 요구하는 식별 가능한 `User-Agent`를 지정하기 위함이며, 브라우저에서 직접
  호출하면 이 헤더를 설정할 수 없다.
- 응답의 `address.city`(또는 `county`) + `borough` + `road` (+ `house_number`)를
  이어붙여 도로명 주소 형태 문자열을 만든다.
- 주소를 가져오지 못하면(응답에 필드가 없거나 요청이 실패하면) 좌표 문자열로
  대체해서 보여준다. 화면이 빈 채로 남지 않도록 하기 위함이다.

## Boundaries

- 이 결정은 사용자에게 "현재 위치"를 보여주는 화면에 적용된다. 서울시 단속 이력의
  주소(원본 CSV의 도로명/구주소)는 이미 완성된 데이터이므로 이 결정과 무관하다.

## Why

[map-library](map-library.md) 결정과 같은 이유로, 계정 가입이나 API 키 발급 승인에
막히지 않는 선택지를 우선했다. 카카오 로컬 API의 좌표-주소 변환은 한국 주소를 더
정확하게 표준 형식으로 반환하지만 앱키 발급이 필요하다.

Nominatim의 응답을 실제로 확인한 결과(2026-09-17), `address.city`/`borough`/`road`/
`house_number` 필드 조합이 이 프로젝트가 이미 다루는 CSV의 `roadAddress` 형식과
동일한 "서울특별시 동작구 만양로 105" 형태를 만들 수 있음을 검증했다.

## Reconsider when

- Nominatim의 공개 서버 사용량 정책(무거운 트래픽 금지)이 실제 서비스 규모에서
  병목이 될 때
- 정확한 한국 표준 도로명주소 표기(예: 공동주택 동/호, 정확한 지번 병기)가 제품
  경험에 필수적이라고 확인될 때

## Still-rejected alternatives

- 카카오 로컬 API(좌표→주소) — 더 정확한 한국 주소를 반환하지만 앱키 발급이
  필요해 보류. 정확도가 명백히 필요해지면 재검토.
- 브라우저에서 Nominatim을 직접 호출 — `User-Agent`를 지정할 수 없어 이용 정책을
  지키기 어려움.

## Evidence worth preserving

- `curl "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=37.5128549427149&lon=126.944007081257&accept-language=ko&zoom=18"` →
  `address.road="만양로", house_number="105", borough="동작구", city="서울특별시"`
  (2026-09-17 확인).
