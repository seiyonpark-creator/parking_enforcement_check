"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import type { NearbyEnforcement } from "@/lib/parking-enforcement";
import type { NearbyFixedCctv } from "@/lib/fixed-cctv";
import type { NearbyRealtimeDetection } from "@/lib/realtime-detection";
import {
  getNumberedMarkerClass,
  NUMBERED_MARKER_SIZE_PX,
  type NumberedMarkerVariant,
} from "@/lib/numbered-marker";
import {
  CURRENT_LOCATION_BORDER,
  CURRENT_LOCATION_BORDER_WIDTH_PX,
  CURRENT_LOCATION_FILL,
  CURRENT_LOCATION_SIZE_PX,
} from "@/lib/current-location-marker";

// 목록 배지와 지도 마커가 정확히 같은 모양(원형 + 중앙 정렬 숫자)을 쓰도록
// getNumberedMarkerClass를 그대로 재사용한 divIcon을 그린다. 데이터 출처별로
// 색이 달라 variant별로 따로 캐시한다.
const numberedIconCache = new Map<string, L.DivIcon>();

function getNumberedIcon(
  variant: NumberedMarkerVariant,
  order: number
): L.DivIcon {
  const key = `${variant}-${order}`;
  const cached = numberedIconCache.get(key);
  if (cached) return cached;

  const size = NUMBERED_MARKER_SIZE_PX;
  const icon = L.divIcon({
    className: "",
    html: `<div class="${getNumberedMarkerClass(variant)}" style="width:${size}px;height:${size}px;">${order}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  numberedIconCache.set(key, icon);
  return icon;
}

function formatDateTime(date: string, time: string): string {
  const y = date.slice(0, 4);
  const m = date.slice(4, 6);
  const d = date.slice(6, 8);
  return `${y}.${m}.${d} ${time.slice(0, 5)}`;
}

function formatEnforcementAddress(record: NearbyEnforcement): string {
  return (
    record.roadAddress.trim() || record.jibunAddress.trim() || "주소 정보 없음"
  );
}

function formatRealtimeTime(detectedAt: string): string {
  return new Date(detectedAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// coords가 바뀔 때(재시도 등) 지도 중심을 다시 맞춘다.
function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

type ParkingMapProps = {
  lat: number;
  lng: number;
  historyResults: NearbyEnforcement[];
  fixedCctvResults: NearbyFixedCctv[];
  realtimeResults: NearbyRealtimeDetection[];
};

export default function ParkingMap({
  lat,
  lng,
  historyResults,
  fixedCctvResults,
  realtimeResults,
}: ParkingMapProps) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-lg ring-1 ring-foreground/10 sm:h-80">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom
        className="h-full w-full"
      >
        <RecenterOnChange lat={lat} lng={lng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[lat, lng]}
          radius={CURRENT_LOCATION_SIZE_PX / 2}
          pathOptions={{
            color: CURRENT_LOCATION_BORDER,
            weight: CURRENT_LOCATION_BORDER_WIDTH_PX,
            fillColor: CURRENT_LOCATION_FILL,
            fillOpacity: 1,
          }}
        />

        {/* 수가 훨씬 많은 데이터셋을 먼저 그려서, 수가 적은 마커가 겹칠 때 아래
            깔리지 않고 위에 보이게 한다(그리는 순서 = 쌓이는 순서). */}
        {historyResults.map((record, index) => (
          <Marker
            key={`history-${record.date}-${record.time}-${index}`}
            position={[record.lat, record.lng]}
            icon={getNumberedIcon("history", index + 1)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">
                  {index + 1}. {formatEnforcementAddress(record)}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(record.date, record.time)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {fixedCctvResults.map((record, index) => (
          <Marker
            key={`fixed-cctv-${index}`}
            position={[record.lat, record.lng]}
            icon={getNumberedIcon("fixed-cctv", index + 1)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">
                  {index + 1}. {record.branchName || record.address}
                </p>
                <p className="text-muted-foreground">{record.zoneType}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {realtimeResults.map((record, index) => (
          <Marker
            key={`realtime-${record.cameraId}`}
            position={[record.lat, record.lng]}
            icon={getNumberedIcon("realtime", index + 1)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">{index + 1}. 실시간 감지</p>
                <p className="text-muted-foreground">
                  {formatRealtimeTime(record.detectedAt)} 감지
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
