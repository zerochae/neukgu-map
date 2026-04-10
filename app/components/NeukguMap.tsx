"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  events,
  keyPlaces,
  predictionZones,
  type TimelineEvent,
} from "../data/events";
import { useTheme } from "../hooks/useTheme";

const hasCoords = (ev: TimelineEvent) => ev.lat != null && ev.lng != null;

const TYPE_LABELS: Record<string, string> = {
  escape: "탈출",
  sighting: "확인",
  thermal: "열화상",
  unconfirmed: "미확인",
  alert: "알림",
  search: "수색",
};

export default function NeukguMap() {
  const { colors, isDark, getTypeColor } = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ marker: L.CircleMarker; ev: TimelineEvent }[]>([]);
  const layersRef = useRef<Record<string, L.LayerGroup>>({});
  const tileRef = useRef<L.TileLayer | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const touchStartY = useRef(0);
  const [activeTab, setActiveTab] = useState<"timeline" | "info" | "predict">("timeline");
  const [activeEvent, setActiveEvent] = useState<number | null>(null);
  const [layerState, setLayerState] = useState({
    markers: true,
    path: true,
    prediction: true,
    search: true,
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainer.current, {
      center: [36.291, 127.393],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    tileRef.current = L.tileLayer(colors.tiles, {
      attribution: "&copy; CARTO &copy; OSM",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    const pathGroup = L.layerGroup().addTo(map);
    const predictionGroup = L.layerGroup().addTo(map);
    const searchGroup = L.layerGroup().addTo(map);

    layersRef.current = { markers: markerGroup, path: pathGroup, prediction: predictionGroup, search: searchGroup };

    const mapEvents = events.filter((e) => e.onMap);
    const refs: { marker: L.CircleMarker; ev: TimelineEvent }[] = [];
    const markerBorderColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)";
    const numBg = isDark ? colors.bg : "#fff";

    mapEvents.forEach((ev, idx) => {
      const col = getTypeColor(ev.type);
      const size = ev.type === "escape" ? 26 : 22;
      const half = size / 2;

      const marker = L.marker([ev.lat!, ev.lng!], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            background:${col};color:${numBg};
            width:${size}px;height:${size}px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:700;
            font-family:'Space Mono',monospace;
            border:2px solid ${markerBorderColor};
            cursor:pointer;
          ">${idx + 1}</div>`,
          iconSize: [size, size],
          iconAnchor: [half, half],
        }),
      });

      marker.bindPopup(
        `<div style="font-weight:700;color:${col};font-size:14px;margin-bottom:2px">${ev.title}</div>` +
          `<div style="color:${colors.comment};font-size:12px;margin-bottom:6px">${ev.day} ${ev.time}</div>` +
          `<div style="font-size:13px">${ev.desc}</div>`,
        { maxWidth: 260 }
      );

      markerGroup.addLayer(marker);
      refs.push({ marker: marker as unknown as L.CircleMarker, ev });
    });

    markersRef.current = refs;

    const lastConfirmed = mapEvents.filter((e) => e.type === "sighting" || e.type === "thermal");
    const lastEv = lastConfirmed[lastConfirmed.length - 1];

    if (lastEv) {
      L.circleMarker([lastEv.lat!, lastEv.lng!], {
        radius: 14, fillColor: "transparent",
        color: colors.magenta, weight: 2,
        fillOpacity: 0, opacity: 0.5, dashArray: "4,4",
      }).addTo(markerGroup);

      L.marker([lastEv.lat!, lastEv.lng!], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            color:${colors.magenta};font-size:11px;
            font-family:'Space Mono',monospace;
            white-space:nowrap;transform:translate(14px,-8px);
            font-weight:700;
            text-shadow:0 0 4px ${colors.bg},0 0 8px ${colors.bg};
          ">마지막 확인</div>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(markerGroup);
    }

    const allCoords = mapEvents.map((e) => [e.lat!, e.lng!] as [number, number]);
    L.polyline(allCoords, { color: colors.orange, weight: 2, opacity: 0.5, dashArray: "8,6" }).addTo(pathGroup);

    const confirmedCoords = mapEvents
      .filter((e) => e.type !== "unconfirmed")
      .map((e) => [e.lat!, e.lng!] as [number, number]);
    L.polyline(confirmedCoords, { color: colors.orange, weight: 3, opacity: 0.9 }).addTo(pathGroup);

    if (lastEv) {
      L.polyline(
        [[lastEv.lat!, lastEv.lng!], [36.292, 127.3935], [36.294, 127.3945], [36.296, 127.394], [36.298, 127.3935]],
        { color: colors.green, weight: 2, opacity: 0.4, dashArray: "4,8" }
      ).addTo(pathGroup);

      L.marker([36.298, 127.3935], {
        icon: L.divIcon({
          className: "",
          html: `<div style="color:${colors.green};font-size:11px;
            font-family:'Space Mono',monospace;
            white-space:nowrap;transform:translate(-30px,-18px);
            font-weight:600;opacity:0.6;
            text-shadow:0 0 4px ${colors.bg};">예측 방향</div>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(pathGroup);
    }

    const searchCenter: [number, number] = [36.287, 127.3945];
    L.circle(searchCenter, { radius: 6000, color: colors.blue, fillColor: colors.blue, fillOpacity: 0.01, weight: 1, dashArray: "10,6", opacity: 0.3 }).addTo(searchGroup);
    L.circle(searchCenter, { radius: 3000, color: colors.blue, fillColor: colors.blue, fillOpacity: 0.02, weight: 1, dashArray: "6,4", opacity: 0.5 }).addTo(searchGroup);

    [
      { pos: [searchCenter[0] + 0.027, searchCenter[1] - 0.002] as [number, number], label: "6km" },
      { pos: [searchCenter[0] + 0.014, searchCenter[1] + 0.015] as [number, number], label: "3km" },
    ].forEach(({ pos, label }) => {
      L.marker(pos, {
        icon: L.divIcon({
          className: "",
          html: `<div style="color:${colors.blue};font-size:11px;font-family:'Space Mono',monospace;opacity:0.5;transform:translate(-10px,0)">${label}</div>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(searchGroup);
    });

    const predFillDark = isDark ? 1 : 1.5;
    L.polygon(predictionZones.low, { color: colors.yellow, fillColor: colors.yellow, fillOpacity: 0.03 * predFillDark, weight: 1, dashArray: "6,6", opacity: 0.3 }).addTo(predictionGroup);
    L.polygon(predictionZones.medium, { color: colors.orange, fillColor: colors.orange, fillOpacity: 0.06 * predFillDark, weight: 1, dashArray: "4,4", opacity: 0.5 }).addTo(predictionGroup);
    L.polygon(predictionZones.high, { color: colors.red, fillColor: colors.red, fillOpacity: 0.12 * predFillDark, weight: 1.5, opacity: 0.6 }).addTo(predictionGroup);

    keyPlaces.forEach((p) => {
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            color:${colors.comment};font-size:11px;
            font-family:'Space Mono',monospace;
            white-space:nowrap;transform:translate(-4px,2px);
            text-shadow:0 0 3px ${colors.bg},0 0 6px ${colors.bg},0 1px 2px ${colors.bg};
          ">${p.name}</div>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(markerGroup);
    });

    Object.entries(layerState).forEach(([key, on]) => {
      const layer = layersRef.current[key];
      if (layer && !on) map.removeLayer(layer);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, isDark]);

  const flyTo = (ev: TimelineEvent) => {
    if (!mapRef.current || !hasCoords(ev)) return;
    mapRef.current.flyTo([ev.lat!, ev.lng!], 16, { duration: 0.5 });
    markersRef.current.forEach((ref) => {
      if (ref.ev.id === ev.id) ref.marker.openPopup();
    });
    setActiveEvent(ev.id);
    if (window.innerWidth < 768) setPanelOpen(false);
  };

  const toggleLayer = (key: keyof typeof layerState) => {
    const map = mapRef.current;
    const layer = layersRef.current[key];
    if (!map || !layer) return;
    setLayerState((prev) => {
      const next = !prev[key];
      if (next) map.addLayer(layer);
      else map.removeLayer(layer);
      return { ...prev, [key]: next };
    });
  };

  let currentDay = "";

  return (
    <div className="h-full w-full flex flex-col md:flex-row">
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0 z-0" />

        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50
            bg-bg2/95 backdrop-blur-md border border-border rounded-full
            px-5 py-3 flex items-center gap-2.5
            text-base font-bold text-t active:scale-95 transition-transform
            shadow-[0_4px_16px_rgba(0,0,0,0.2)]
            md:hidden"
        >
          <span className="text-o">늑구맵</span>
          <span className="text-r text-xs animate-pulse">MISSING</span>
          <svg
            className={`w-4 h-4 text-comment transition-transform ${panelOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div
        className={`
          fixed inset-x-0 bottom-0 z-40
          bg-bg/[.97] backdrop-blur-sm border-t border-border
          transition-transform duration-300 ease-out
          rounded-t-2xl
          max-h-[85vh] overflow-hidden flex flex-col
          md:static md:translate-y-0 md:w-[420px] md:max-h-full
          md:border-t-0 md:border-l md:rounded-none
          ${panelOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}
        `}
      >
        <div
          className="md:hidden cursor-grab"
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            if (dy > 40) setPanelOpen(false);
          }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-comment/40" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3">
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-o">늑구맵</span>
              </h1>
              <p className="text-xs text-comment mt-0.5">대전 오월드 탈출 늑대 추적</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-r/15 text-r border border-r/30 font-bold animate-pulse">
              MISSING
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="text-o">늑구맵</span>
            </h1>
            <p className="text-xs md:text-sm text-comment mt-0.5">
              대전 오월드 탈출 늑대 추적
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-r/15 text-r border border-r/30 font-bold animate-pulse">
            MISSING
          </span>
        </div>

        <div className="px-5 pb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm md:text-base border-b border-border">
          <div><span className="text-comment">이름 </span><span className="font-bold">늑구</span></div>
          <div><span className="text-comment">종 </span><span>유라시아늑대</span></div>
          <div><span className="text-comment">나이 </span><span>2세 (수컷, 30kg)</span></div>
          <div><span className="text-comment">탈출 </span><span>2026.04.08</span></div>
        </div>

        <div className="flex border-b border-border">
          {([["timeline", "타임라인"], ["info", "수색현황"], ["predict", "예측분석"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-sm md:text-base font-bold transition-colors
                ${activeTab === key ? "text-b border-b-2 border-b" : "text-comment"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeTab === "timeline" && (
            <div className="py-2">
              {events.map((ev) => {
                let dayHeader = null;
                if (ev.day !== currentDay) {
                  currentDay = ev.day;
                  dayHeader = (
                    <div key={`day-${ev.day}`} className="px-5 pt-3 pb-1 text-sm font-bold text-b">
                      {ev.day}
                    </div>
                  );
                }
                const col = getTypeColor(ev.type);

                return (
                  <div key={ev.id}>
                    {dayHeader}
                    <div
                      onClick={() => hasCoords(ev) && flyTo(ev)}
                      className={`
                        flex gap-3 px-5 py-3 border-l-2 transition-colors
                        ${hasCoords(ev) ? "cursor-pointer active:bg-bg3" : ""}
                        ${activeEvent === ev.id ? "bg-bg3 border-l-b" : "border-l-transparent"}
                      `}
                    >
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          background: col,
                          boxShadow: ev.type === "escape" ? `0 0 8px ${col}` : "none",
                          opacity: ev.type === "alert" || ev.type === "search" ? 0.5 : 1,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs md:text-sm text-comment font-bold">{ev.time}</span>
                          <span
                            className="text-[10px] md:text-xs px-1.5 py-0.5 rounded font-bold"
                            style={{ color: col, background: `${col}15` }}
                          >
                            {TYPE_LABELS[ev.type]}
                          </span>
                        </div>
                        <div className="text-sm md:text-base font-bold mt-0.5">{ev.title}</div>
                        <div className="text-xs md:text-sm text-comment leading-relaxed mt-0.5">{ev.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "info" && (
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-sm md:text-base font-bold text-b mb-3">수색 현황 (4/10 기준)</h3>
                <div className="space-y-2.5 text-sm md:text-base">
                  {[
                    ["수색 반경", "3km -> 6km 확대"],
                    ["투입 인력", "250여 명 (경찰, 소방, 군, 엽사)"],
                    ["장비", "열화상 드론 9대, 포획 트랩 20+"],
                    ["전략", "먹이 유인 + 암컷 투입"],
                    ["원칙", "마취 후 생포 (사살 최후수단)"],
                    ["마지막 포착", "04/09 01:30 썰매장 부근"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-comment flex-shrink-0 w-20">{label}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm md:text-base font-bold text-c mb-3">늑대 행동 특성</h3>
                <div className="space-y-2 text-sm md:text-base">
                  {[
                    ["활동 패턴", "야행성 (낮에는 은신)"],
                    ["선호 지형", "산림, 덤불 등 은폐 가능 지역"],
                    ["이동 속도", "최대 55km/h (단거리)"],
                    ["행동반경", "20~70km/day 가능"],
                    ["귀소본능", "24~48시간 내 최고조"],
                    ["생존 가능", "물만으로 약 2주"],
                    ["은신 습성", "땅굴을 파서 숨을 수 있음"],
                    ["특이사항", "인공포육, 야생 경험 부족"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-comment flex-shrink-0 w-20">{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-bold text-comment mb-3">레이어 토글</h3>
                <div className="flex flex-wrap gap-2">
                  {([["markers", "목격 지점"], ["path", "이동 경로"], ["prediction", "예측 구역"], ["search", "수색 범위"]] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleLayer(key)}
                      className={`text-sm px-4 py-2 rounded-full border transition-colors font-bold
                        ${layerState[key] ? "border-b/30 text-b bg-b/10" : "border-border text-comment"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "predict" && (
            <div className="p-5 space-y-4">
              <h3 className="text-sm md:text-base font-bold text-g">늑구 위치 예측 분석</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-r/5 border border-r/20">
                  <div className="text-sm md:text-base font-bold text-r mb-1">높은 확률</div>
                  <div className="text-sm md:text-base leading-relaxed">
                    보문산 남쪽 사면, 무수동 치유의 숲 일대.
                    밀림 지대로 은폐 용이, 수원 접근 가능.
                    낮에는 굴/덤불에 은신 중일 가능성 높음.
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-o/5 border border-o/20">
                  <div className="text-sm md:text-base font-bold text-o mb-1">중간 확률</div>
                  <div className="text-sm md:text-base leading-relaxed">
                    보문산 전체 능선, 오월드 후면 산림.
                    야간 능선 따라 행동 범위 확장 가능.
                    귀소본능으로 오월드 방면 회귀 시도 가능.
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-y/5 border border-y/20">
                  <div className="text-sm md:text-base font-bold text-y mb-1">낮은 확률</div>
                  <div className="text-sm md:text-base leading-relaxed">
                    안영동 야산, 서쪽 복수동 방면.
                    상당한 교란 시에만 이동.
                    도심 개활지는 회피하는 경향.
                  </div>
                </div>
              </div>
              <div className="text-xs md:text-sm text-comment leading-relaxed border-t border-border pt-3">
                인공포육 개체로 야생 생존 경험 없음.
                보문산 산림 벨트 내 체류 패턴.
                시민 제보 90%+ 오인 신고.
                전문가 인내 기반 포획 전략 권고 중.
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border bg-bg2/60 hidden md:block">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-comment">
            <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: colors.red, boxShadow: `0 0 4px ${colors.red}` }} />탈출</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: colors.orange }} />확인</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ background: colors.magenta }} />열화상</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1 opacity-50" style={{ background: colors.yellow }} />미확인</span>
            <span><span className="inline-block w-3 h-0 border-t-2 border-dashed mr-1 align-middle" style={{ borderColor: colors.orange }} />경로</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 opacity-40" style={{ background: colors.red }} />높음</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 opacity-30" style={{ background: colors.orange }} />중간</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 opacity-20" style={{ background: colors.yellow }} />낮음</span>
          </div>
        </div>
      </div>
    </div>
  );
}
