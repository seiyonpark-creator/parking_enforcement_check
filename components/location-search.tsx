"use client";

import { useState } from "react";
import { MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 주소·장소 검색 데이터 출처와 후보를 사용자가 직접 고르는 이유는
// docs/decisions/location-search-source.md 참고.

export type GeocodeCandidate = { label: string; lat: number; lng: number };

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "no-results" }
  | { status: "results"; candidates: GeocodeCandidate[] }
  | { status: "error"; message: string };

async function searchLocation(query: string): Promise<SearchState> {
  try {
    const response = await fetch(`/api/geocode-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("요청 실패");
    const data: { candidates?: GeocodeCandidate[] } = await response.json();
    const candidates = data.candidates ?? [];
    return candidates.length === 0
      ? { status: "no-results" }
      : { status: "results", candidates };
  } catch {
    return { status: "error", message: "검색 중 문제가 발생했습니다." };
  }
}

export function LocationSearch({
  isUsingSearch,
  onSelectCandidate,
  onUseCurrentLocation,
}: {
  isUsingSearch: boolean;
  onSelectCandidate: (candidate: GeocodeCandidate) => void;
  onUseCurrentLocation: () => void;
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setState({ status: "loading" });
    setState(await searchLocation(trimmed));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void runSearch();
  };

  const handleSelect = (candidate: GeocodeCandidate) => {
    onSelectCandidate(candidate);
    setState({ status: "idle" });
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <InputGroup className="flex-1">
          <InputGroupInput
            placeholder="주소나 장소명으로 검색 (예: 서울역, 서울특별시 동작구 만양로 105)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // base-ui Input이 폼의 기본 Enter-제출 동작을 항상 넘겨주지는
              // 않아, 직접 처리해 버튼과 동일하게 동작하게 한다. 한글 입력 중
              // 조합을 확정하는 Enter(isComposing)는 검색 제출로 취급하지
              // 않는다.
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void runSearch();
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" aria-label="검색">
              <MagnifyingGlass />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {isUsingSearch && (
          <Button type="button" variant="outline" size="sm" onClick={onUseCurrentLocation}>
            내 위치로 돌아가기
          </Button>
        )}
      </form>

      {state.status === "loading" && (
        <p className="text-sm text-muted-foreground">검색 중...</p>
      )}

      {state.status === "no-results" && (
        <Alert>
          <WarningCircle />
          <AlertDescription>
            검색 결과가 없습니다. 다른 검색어로 시도해 주세요.
          </AlertDescription>
        </Alert>
      )}

      {state.status === "error" && (
        <Alert variant="destructive">
          <WarningCircle />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.status === "results" && (
        <div className="flex flex-col gap-0.5 rounded-md border bg-card p-1">
          {state.candidates.map((candidate, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(candidate)}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {candidate.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
