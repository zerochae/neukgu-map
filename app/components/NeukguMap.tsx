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
import { useLocale } from "../hooks/useLocale";
import { ui } from "../data/i18n";

const hasCoords = (ev: TimelineEvent) => ev.lat != null && ev.lng != null;

const TYPE_LABELS_KO: Record<string, string> = {
  escape: "탈출",
  sighting: "확인",
  thermal: "열화상",
  unconfirmed: "미확인",
  alert: "알림",
  search: "수색",
};
const TYPE_LABELS_EN: Record<string, string> = {
  escape: "Escape",
  sighting: "Confirmed",
  thermal: "Thermal",
  unconfirmed: "Unconfirmed",
  alert: "Alert",
  search: "Search",
};

export default function NeukguMap() {
  const { colors, isDark, getTypeColor } = useTheme();
  const { locale, toggle: toggleLocale } = useLocale();
  const L10n = ui[locale];
  const isEn = locale === "en";

  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ marker: L.CircleMarker; ev: TimelineEvent }[]>(
    [],
  );
  const layersRef = useRef<Record<string, L.LayerGroup>>({});
  const tileRef = useRef<L.TileLayer | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const touchStartY = useRef(0);
  const [activeTab, setActiveTab] = useState<"timeline" | "info" | "predict">(
    "timeline",
  );
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

    layersRef.current = {
      markers: markerGroup,
      path: pathGroup,
      prediction: predictionGroup,
      search: searchGroup,
    };

    const mapEvents = events.filter((e) => e.onMap);
    const refs: { marker: L.CircleMarker; ev: TimelineEvent }[] = [];
    const markerBorderColor = isDark
      ? "rgba(255,255,255,0.3)"
      : "rgba(0,0,0,0.15)";
    const numBg = isDark ? colors.bg : "#fff";

    mapEvents.forEach((ev, idx) => {
      const col = getTypeColor(ev.type);
      const size = ev.type === "escape" ? 26 : 22;
      const half = size / 2;
      const title = isEn ? ev.titleEn : ev.title;
      const day = isEn ? ev.dayEn : ev.day;
      const desc = isEn ? ev.descEn : ev.desc;

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
        `<div style="font-weight:700;color:${col};font-size:14px;margin-bottom:2px">${title}</div>` +
          `<div style="color:${colors.comment};font-size:12px;margin-bottom:6px">${day} ${ev.time}</div>` +
          `<div style="font-size:13px">${desc}</div>`,
        { maxWidth: 260 },
      );

      markerGroup.addLayer(marker);
      refs.push({ marker: marker as unknown as L.CircleMarker, ev });
    });

    markersRef.current = refs;

    const lastConfirmed = mapEvents.filter(
      (e) => e.type === "sighting" || e.type === "thermal",
    );
    const lastEv = lastConfirmed[lastConfirmed.length - 1];

    if (lastEv) {
      L.circleMarker([lastEv.lat!, lastEv.lng!], {
        radius: 14,
        fillColor: "transparent",
        color: colors.magenta,
        weight: 2,
        fillOpacity: 0,
        opacity: 0.5,
        dashArray: "4,4",
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
          ">${isEn ? "LAST KNOWN" : "마지막 확인"}</div>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(markerGroup);
    }

    const allCoords = mapEvents.map(
      (e) => [e.lat!, e.lng!] as [number, number],
    );
    L.polyline(allCoords, {
      color: colors.orange,
      weight: 2,
      opacity: 0.5,
      dashArray: "8,6",
    }).addTo(pathGroup);

    const confirmedCoords = mapEvents
      .filter((e) => e.type !== "unconfirmed")
      .map((e) => [e.lat!, e.lng!] as [number, number]);
    L.polyline(confirmedCoords, {
      color: colors.orange,
      weight: 3,
      opacity: 0.9,
    }).addTo(pathGroup);

    if (lastEv) {
      L.polyline(
        [
          [lastEv.lat!, lastEv.lng!],
          [36.292, 127.3935],
          [36.294, 127.3945],
          [36.296, 127.394],
          [36.298, 127.3935],
        ],
        { color: colors.green, weight: 2, opacity: 0.4, dashArray: "4,8" },
      ).addTo(pathGroup);

      L.marker([36.298, 127.3935], {
        icon: L.divIcon({
          className: "",
          html: `<div style="color:${colors.green};font-size:11px;
            font-family:'Space Mono',monospace;
            white-space:nowrap;transform:translate(-30px,-18px);
            font-weight:600;opacity:0.6;
            text-shadow:0 0 4px ${colors.bg};">${isEn ? "predicted" : "예측 방향"}</div>`,
          iconSize: [0, 0],
        }),
        interactive: false,
      }).addTo(pathGroup);
    }

    const searchCenter: [number, number] = [36.287, 127.3945];
    L.circle(searchCenter, {
      radius: 6000,
      color: colors.blue,
      fillColor: colors.blue,
      fillOpacity: 0.01,
      weight: 1,
      dashArray: "10,6",
      opacity: 0.3,
    }).addTo(searchGroup);
    L.circle(searchCenter, {
      radius: 3000,
      color: colors.blue,
      fillColor: colors.blue,
      fillOpacity: 0.02,
      weight: 1,
      dashArray: "6,4",
      opacity: 0.5,
    }).addTo(searchGroup);

    [
      {
        pos: [searchCenter[0] + 0.027, searchCenter[1] - 0.002] as [
          number,
          number,
        ],
        label: "6km",
      },
      {
        pos: [searchCenter[0] + 0.014, searchCenter[1] + 0.015] as [
          number,
          number,
        ],
        label: "3km",
      },
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
    L.polygon(predictionZones.low, {
      color: colors.yellow,
      fillColor: colors.yellow,
      fillOpacity: 0.03 * predFillDark,
      weight: 1,
      dashArray: "6,6",
      opacity: 0.3,
    }).addTo(predictionGroup);
    L.polygon(predictionZones.medium, {
      color: colors.orange,
      fillColor: colors.orange,
      fillOpacity: 0.06 * predFillDark,
      weight: 1,
      dashArray: "4,4",
      opacity: 0.5,
    }).addTo(predictionGroup);
    L.polygon(predictionZones.high, {
      color: colors.red,
      fillColor: colors.red,
      fillOpacity: 0.12 * predFillDark,
      weight: 1.5,
      opacity: 0.6,
    }).addTo(predictionGroup);

    keyPlaces.forEach((p) => {
      const label = isEn ? p.nameEn : p.name;
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            color:${colors.comment};font-size:11px;
            font-family:'Space Mono',monospace;
            white-space:nowrap;transform:translate(-4px,2px);
            text-shadow:0 0 3px ${colors.bg},0 0 6px ${colors.bg},0 1px 2px ${colors.bg};
          ">${label}</div>`,
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
  }, [colors, isDark, locale]);

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

  const typeLabels = isEn ? TYPE_LABELS_EN : TYPE_LABELS_KO;
  let currentDay = "";

  return (
    <div className="h-full w-full flex flex-col md:flex-row">
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0 z-0" />

        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50
            bg-bg2/95 backdrop-blur-md border border-border! rounded-full
            px-5 py-3 flex items-center gap-2.5
            text-base font-bold text-t active:scale-95 transition-transform
            shadow-[0_4px_16px_rgba(0,0,0,0.2)]
            md:hidden"
        >
          <span className="text-o">{L10n.title}</span>
          <span className="text-r text-xs animate-pulse">{L10n.missing}</span>
          <svg
            className={`w-4 h-4 text-comment transition-transform ${panelOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>

      <div
        className={`
          fixed inset-x-0 bottom-0 z-40
          bg-bg/[.97] backdrop-blur-sm border-t border-t-border
          transition-transform duration-300 ease-out
          rounded-t-2xl
          max-h-[85vh] overflow-hidden flex flex-col
          md:static md:translate-y-0 md:w-[420px] md:max-h-full
          md:border-t-0 md:border-l md:border-l-border md:rounded-none
          ${panelOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}
        `}
      >
        <div
          className="md:hidden cursor-grab"
          onTouchStart={(e) => {
            touchStartY.current = e.touches[0].clientY;
          }}
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
                <span className="text-o">{L10n.title}</span>
              </h1>
              <p className="text-xs text-comment mt-0.5">{L10n.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLocale}
                className="text-[10px] px-2 py-1 rounded border border-b/30 text-b font-bold"
              >
                {isEn ? "KO" : "EN"}
              </button>
              <span className="text-xs px-2.5 py-1 rounded-md bg-r/15 text-r border border-r/30 font-bold animate-pulse">
                {L10n.missing}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="text-o">{L10n.title}</span>
            </h1>
            <p className="text-xs md:text-sm text-comment mt-0.5">
              {L10n.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLocale}
              className="text-xs px-2.5 py-1 rounded border border-b/30 text-b font-bold hover:bg-b/10 transition-colors"
            >
              {isEn ? "KO" : "EN"}
            </button>
            <span className="text-xs px-2.5 py-1 rounded-md bg-r/15 text-r border border-r/30 font-bold animate-pulse">
              {L10n.missing}
            </span>
          </div>
        </div>

        <div className="px-5 pb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm md:text-base border-b border-b-border">
          <div>
            <span className="text-comment">{L10n.name} </span>
            <span className="font-bold">{isEn ? "Neukgu" : "늑구"}</span>
          </div>
          <div>
            <span className="text-comment">{L10n.species} </span>
            <span>{L10n.speciesVal}</span>
          </div>
          <div>
            <span className="text-comment">{L10n.age} </span>
            <span>{L10n.ageVal}</span>
          </div>
          <div>
            <span className="text-comment">{L10n.escape} </span>
            <span>{L10n.escapeVal}</span>
          </div>
        </div>

        <div className="flex border-b border-b-border">
          {(
            [
              ["timeline", L10n.tabs.timeline],
              ["info", L10n.tabs.info],
              ["predict", L10n.tabs.predict],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex-1 py-3 text-sm md:text-base font-bold transition-colors
                ${activeTab === key ? "text-b border-b-2 border-b-b" : "text-comment"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeTab === "timeline" && (
            <div className="py-2">
              {events.map((ev) => {
                const day = isEn ? ev.dayEn : ev.day;
                let dayHeader = null;
                if (day !== currentDay) {
                  currentDay = day;
                  dayHeader = (
                    <div
                      key={`day-${day}`}
                      className="px-5 pt-3 pb-1 text-sm font-bold text-b"
                    >
                      {day}
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
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{
                          background: col,
                          boxShadow:
                            ev.type === "escape" ? `0 0 8px ${col}` : "none",
                          opacity:
                            ev.type === "alert" || ev.type === "search"
                              ? 0.5
                              : 1,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs md:text-sm text-comment font-bold">
                            {ev.time}
                          </span>
                          <span
                            className="text-[10px] md:text-xs px-1.5 py-0.5 rounded font-bold"
                            style={{ color: col, background: `${col}15` }}
                          >
                            {typeLabels[ev.type]}
                          </span>
                        </div>
                        <div className="text-sm md:text-base font-bold mt-0.5">
                          {isEn ? ev.titleEn : ev.title}
                        </div>
                        <div className="text-xs md:text-sm text-comment leading-relaxed mt-0.5">
                          {isEn ? ev.descEn : ev.desc}
                        </div>
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
                <h3 className="text-sm md:text-base font-bold text-b mb-3">
                  {L10n.search.title}
                </h3>
                <div className="space-y-2.5 text-sm md:text-base">
                  {[
                    L10n.search.radius,
                    L10n.search.personnel,
                    L10n.search.equipment,
                    L10n.search.strategy,
                    L10n.search.policy,
                    L10n.search.lastDetection,
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-comment shrink-0 w-24">
                        {label}
                      </span>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-t-border pt-4">
                <h3 className="text-sm md:text-base font-bold text-c mb-3">
                  {L10n.behavior.title}
                </h3>
                <div className="space-y-2 text-sm md:text-base">
                  {L10n.behavior.items.map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-comment shrink-0 w-24">
                        {label}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-t-border pt-4">
                <h3 className="text-sm font-bold text-comment mb-3">
                  {L10n.layers}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(["markers", "path", "prediction", "search"] as const).map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => toggleLayer(key)}
                        className={`text-sm px-4 py-2 rounded-full border transition-colors font-bold
                        ${layerState[key] ? "border-b/30 text-b bg-b/10" : "border-border text-comment"}`}
                      >
                        {L10n.layerLabels[key]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "predict" && (
            <div className="p-5 space-y-4">
              <h3 className="text-sm md:text-base font-bold text-g">
                {L10n.predict.title}
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-r/5 border border-r/20">
                  <div className="text-sm md:text-base font-bold text-r mb-1">
                    {L10n.predict.high}
                  </div>
                  <div className="text-sm md:text-base leading-relaxed">
                    {L10n.predict.highDesc}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-o/5 border border-o/20">
                  <div className="text-sm md:text-base font-bold text-o mb-1">
                    {L10n.predict.mid}
                  </div>
                  <div className="text-sm md:text-base leading-relaxed">
                    {L10n.predict.midDesc}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-y/5 border border-y/20">
                  <div className="text-sm md:text-base font-bold text-y mb-1">
                    {L10n.predict.low}
                  </div>
                  <div className="text-sm md:text-base leading-relaxed">
                    {L10n.predict.lowDesc}
                  </div>
                </div>
              </div>
              <div className="text-xs md:text-sm text-comment leading-relaxed border-t border-t-border pt-3">
                {L10n.predict.note}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-t-border bg-bg2/60 hidden md:block">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-comment">
            <span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                style={{
                  background: colors.red,
                  boxShadow: `0 0 4px ${colors.red}`,
                }}
              />
              {L10n.legend.escape}
            </span>
            <span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                style={{ background: colors.orange }}
              />
              {L10n.legend.confirmed}
            </span>
            <span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                style={{ background: colors.magenta }}
              />
              {L10n.legend.thermal}
            </span>
            <span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1 opacity-50"
                style={{ background: colors.yellow }}
              />
              {L10n.legend.unconfirmed}
            </span>
            <span>
              <span
                className="inline-block w-3 h-0 border-t-2 border-dashed mr-1 align-middle"
                style={{ borderColor: colors.orange }}
              />
              {L10n.legend.path}
            </span>
            <span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm mr-1 opacity-40"
                style={{ background: colors.red }}
              />
              {L10n.legend.high}
            </span>
            <span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm mr-1 opacity-30"
                style={{ background: colors.orange }}
              />
              {L10n.legend.mid}
            </span>
            <span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm mr-1 opacity-20"
                style={{ background: colors.yellow }}
              />
              {L10n.legend.low}
            </span>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-t-border text-[10px] md:text-xs text-comment/60 flex items-center justify-end gap-1.5">
          {L10n.credit} gray(권영채)
          <a
            href="https://github.com/zerochae"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-comment transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 md:w-4 md:h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
