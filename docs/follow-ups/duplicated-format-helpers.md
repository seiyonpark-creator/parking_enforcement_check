app/page.tsx와 components/parking-map.tsx에 formatDateTime/formatAddress가 각각 정의되어 있어 중복된다. 공유 유틸(예: lib/parking-enforcement.ts)로 추출할 수 있다.
