components/fixed-cctv-column.tsx, enforcement-history-column.tsx, realtime-detection-column.tsx 세 컴포넌트가 같은 헤더(VariantDot+제목)와 로딩 Skeleton 구조를 각자 반복한다. 공유 "컬럼 셸" 컴포넌트로 추출할 수 있다.
