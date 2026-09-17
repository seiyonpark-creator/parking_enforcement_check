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
import {
  NUMBERED_MARKER_CLASS,
  NUMBERED_MARKER_SIZE_PX,
} from "@/lib/numbered-marker";
import {
  CURRENT_LOCATION_BORDER,
  CURRENT_LOCATION_BORDER_WIDTH_PX,
  CURRENT_LOCATION_FILL,
  CURRENT_LOCATION_SIZE_PX,
} from "@/lib/current-location-marker";

// 목록의 순번 배지와 지도 마커가 정확히 같은 모양(원형 + 중앙 정렬 숫자)을 쓰도록
// NUMBERED_MARKER_CLASS를 그대로 재사용한 divIcon을 그린다.
const numberedIconCache = new Map<number, L.DivIcon>();

function getNumberedIcon(order: number): L.DivIcon {
  const cached = numberedIconCache.get(order);
  if (cached) return cached;

  const size = NUMBERED_MARKER_SIZE_PX;
  const icon = L.divIcon({
    className: "",
    html: `<div class="${NUMBERED_MARKER_CLASS}" style="width:${size}px;height:${size}px;">${order}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  numberedIconCache.set(order, icon);
  return icon;
}

function formatDateTime(date: string, time: string): string {
  const y = date.slice(0, 4);
  const m = date.slice(4, 6);
  const d = date.slice(6, 8);
  return `${y}.${m}.${d} ${time.slice(0, 5)}`;
}

function formatAddress(record: NearbyEnforcement): string {
  return (
    record.roadAddress.trim() || record.jibunAddress.trim() || "주소 정보 없음"
  );
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
  results: NearbyEnforcement[];
};

export default function ParkingMap({ lat, lng, results }: ParkingMapProps) {
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
        {results.map((record, index) => (
          <Marker
            key={`${record.date}-${record.time}-${index}`}
            position={[record.lat, record.lng]}
            icon={getNumberedIcon(index + 1)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">
                  {index + 1}. {formatAddress(record)}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(record.date, record.time)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
