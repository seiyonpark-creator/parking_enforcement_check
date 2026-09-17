import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import Home from "@/app/page";

const originalGeolocation = navigator.geolocation;

afterEach(() => {
  Object.defineProperty(navigator, "geolocation", {
    value: originalGeolocation,
    configurable: true,
  });
  vi.unstubAllGlobals();
});

test("위치 정보를 지원하지 않으면 안내 메시지를 보여준다", async () => {
  Object.defineProperty(navigator, "geolocation", {
    value: undefined,
    configurable: true,
  });

  render(<Home />);

  expect(
    await screen.findByText(/위치 조회를 지원하지 않는 브라우저입니다/)
  ).toBeInTheDocument();
});

test("위치를 확인하면 반경 이내 단속 이력을 목록으로 보여준다", async () => {
  Object.defineProperty(navigator, "geolocation", {
    value: {
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: 37.5665, longitude: 126.978 },
        } as GeolocationPosition);
      },
    },
    configurable: true,
  });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        radiusMeters: 300,
        count: 1,
        results: [
          {
            date: "20251001",
            time: "00:03:09",
            jibunAddress: "서울특별시 동작구 노량진동 116-2",
            roadAddress: "서울특별시 동작구 만양로 105 (노량진동)",
            lat: 37.5128549427149,
            lng: 126.944007081257,
            distanceMeters: 12.3,
          },
        ],
      }),
    })
  );

  render(<Home />);

  await waitFor(() =>
    expect(
      screen.getByText(/서울특별시 동작구 만양로 105/)
    ).toBeInTheDocument()
  );
  expect(screen.getByText("12m")).toBeInTheDocument();
});

test("반경 이내 이력이 없으면 이력 없음 안내를 보여준다", async () => {
  Object.defineProperty(navigator, "geolocation", {
    value: {
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: 37.6584, longitude: 126.977 },
        } as GeolocationPosition);
      },
    },
    configurable: true,
  });

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ radiusMeters: 300, count: 0, results: [] }),
    })
  );

  render(<Home />);

  expect(
    await screen.findByText(/최근 단속 이력이 없습니다/)
  ).toBeInTheDocument();
});
