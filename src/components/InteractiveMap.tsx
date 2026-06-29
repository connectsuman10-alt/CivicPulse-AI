import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Issue, Category, Severity } from "../types";
import { MapPin, Info, Navigation, ShieldAlert, CheckCircle2, AlertTriangle, Droplets, Trash2, Lightbulb } from "lucide-react";

interface InteractiveMapProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  reportMode?: boolean;
  selectedCoords?: { lat: number; lng: number; address: string };
  onSelectCoords?: (coords: { lat: number; lng: number; address: string }) => void;
  predictiveHotspots?: any[];
  showHotspots?: boolean;
}

export default function InteractiveMap({
  issues,
  onSelectIssue,
  reportMode = false,
  selectedCoords,
  onSelectCoords,
  predictiveHotspots = [],
  showHotspots = false
}: InteractiveMapProps) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null);

  // Map limits: Center at (40.7128, -74.0060)
  // Grid size fits 400x400 coordinate canvas
  // X range: -74.0160 to -73.9960 -> 20 millidegrees (200px span)
  // Y range: 40.7028 to 40.7228 -> 20 millidegrees (200px span)
  const mapCenterLat = 40.7128;
  const mapCenterLng = -74.0060;

  const getCoordinates = (lat: number, lng: number) => {
    // Scale longitude to percentage width (0% to 100%)
    const minLng = -74.0160;
    const maxLng = -73.9960;
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;

    // Scale latitude to percentage height (reversed since SVG 0 is top)
    const minLat = 40.7028;
    const maxLat = 40.7228;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;

    return { x: Math.min(95, Math.max(5, x)), y: Math.min(95, Math.max(5, y)) };
  };

  const getCategoryIcon = (category: Category, size = 16) => {
    switch (category) {
      case "POTHOLE": return <AlertTriangle size={size} className="text-amber-500" />;
      case "GARBAGE": return <Trash2 size={size} className="text-emerald-500" />;
      case "WATER_LEAK": return <Droplets size={size} className="text-blue-500" />;
      case "STREETLIGHT": return <Lightbulb size={size} className="text-yellow-500" />;
      case "ROAD_DAMAGE": return <ShieldAlert size={size} className="text-orange-500" />;
      default: return <Info size={size} className="text-slate-500" />;
    }
  };

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case "POTHOLE": return "bg-amber-500 border-amber-600 shadow-amber-500/50";
      case "GARBAGE": return "bg-emerald-500 border-emerald-600 shadow-emerald-500/50";
      case "WATER_LEAK": return "bg-blue-500 border-blue-600 shadow-blue-500/50";
      case "STREETLIGHT": return "bg-yellow-500 border-yellow-600 shadow-yellow-500/50";
      case "ROAD_DAMAGE": return "bg-orange-500 border-orange-600 shadow-orange-500/50";
      default: return "bg-slate-500 border-slate-600 shadow-slate-500/50";
    }
  };

  const getSeverityRingColor = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL": return "ring-red-500/60 animate-ping";
      case "HIGH": return "ring-orange-500/50 animate-pulse";
      case "MEDIUM": return "ring-amber-500/40";
      default: return "ring-slate-400/20";
    }
  };

  const filteredIssues = filterCategory === "ALL" 
    ? issues 
    : issues.filter(i => i.category === filterCategory);

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!reportMode || !onSelectCoords) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Convert back from percentages to Lat/Lng
    const minLng = -74.0160;
    const maxLng = -73.9960;
    const clickLng = minLng + (clickX / 100) * (maxLng - minLng);

    const minLat = 40.7028;
    const maxLat = 40.7228;
    const clickLat = minLat + ((100 - clickY) / 100) * (maxLat - minLat);

    // Mock an address based on close proximity
    const nearestStNames = ["Central Avenue", "Pine Boulevard", "Oak Highway", "Market Square", "Parkway Lane", "River Drive"];
    const blockNum = Math.floor(10 + Math.random() * 250);
    const mockAddress = `${blockNum} ${nearestStNames[Math.floor(Math.random() * nearestStNames.length)]}, Civic Heights`;

    onSelectCoords({ lat: clickLat, lng: clickLng, address: mockAddress });
  };

  const handleSimulateGPS = () => {
    if (!onSelectCoords) return;
    // Put pin near the center of the map
    const randomOffsetLat = (Math.random() - 0.5) * 0.005;
    const randomOffsetLng = (Math.random() - 0.5) * 0.005;
    const lat = mapCenterLat + randomOffsetLat;
    const lng = mapCenterLng + randomOffsetLng;
    const blockNum = Math.floor(10 + Math.random() * 250);
    const stNames = ["Central Avenue", "Pine Boulevard", "Market Square"];
    const address = `${blockNum} ${stNames[Math.floor(Math.random() * stNames.length)]}, Civic Heights`;
    onSelectCoords({ lat, lng, address });
  };

  return (
    <div id="interactive_map_container" className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
      {/* Map Header & Controls */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Navigation size={16} className="text-indigo-600 animate-pulse" />
            Civic Heights Interactive Map
          </h3>
          <p className="text-xs text-slate-500">
            {reportMode 
              ? "Click anywhere on the grid to drop a reporting pin" 
              : "Visualize reported issues, maintenance status, and AI hotspots"}
          </p>
        </div>

        {/* Filters */}
        {!reportMode && (
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Categories</option>
              <option value="POTHOLE">Potholes</option>
              <option value="GARBAGE">Garbage & Litter</option>
              <option value="WATER_LEAK">Water Leakage</option>
              <option value="STREETLIGHT">Streetlights</option>
              <option value="ROAD_DAMAGE">Road Damage</option>
            </select>
          </div>
        )}

        {reportMode && (
          <button
            type="button"
            onClick={handleSimulateGPS}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <MapPin size={14} />
            Simulate My GPS Location
          </button>
        )}
      </div>

      {/* Main Map Visual Canvas */}
      <div className="relative flex-grow bg-slate-50 select-none min-h-[380px] lg:min-h-[420px] overflow-hidden">
        {/* SVG Vector City Background */}
        <svg
          id="vector_map_svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onClick={handleMapClick}
          className={`w-full h-full absolute inset-0 ${reportMode ? "cursor-crosshair" : "cursor-default"}`}
        >
          {/* Grid lines simulating city block zoning */}
          <defs>
            <pattern id="city-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#city-grid)" />

          {/* Parklands - Central Park Area */}
          <rect x="35" y="15" width="30" height="30" rx="3" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="0.2" opacity="0.8" />
          <text x="50" y="30" fontSize="2" fill="#047857" fontWeight="bold" textAnchor="middle" opacity="0.6" className="font-sans">
            Central Park & Playground
          </text>

          {/* Waterway - Flowing River */}
          <path
            d="M -10 90 Q 30 75, 60 85 T 110 70"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M -10 90 Q 30 75, 60 85 T 110 70"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2, 4"
            opacity="0.9"
          />
          <text x="25" y="85" fontSize="2.2" fill="#0369a1" fontWeight="medium" textAnchor="middle" opacity="0.5" className="font-sans italic">
            Civic Canal River
          </text>

          {/* Major Roads / Boulevards */}
          {/* North-South Roads */}
          <line x1="20" y1="0" x2="20" y2="100" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="1, 0.5" opacity="0.7" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="1, 0.5" opacity="0.7" />
          <line x1="80" y1="0" x2="80" y2="100" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="1, 0.5" opacity="0.7" />
          {/* East-West Roads */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="1, 0.5" opacity="0.7" />
          <line x1="0" y1="55" x2="100" y2="55" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="1, 0.5" opacity="0.7" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="1, 0.5" opacity="0.7" />

          {/* Road labels */}
          <text x="22" y="5" fontSize="1.8" fill="#64748b" opacity="0.6">Pine Blvd</text>
          <text x="52" y="98" fontSize="1.8" fill="#64748b" opacity="0.6">Central Ave</text>
          <text x="2" y="54" fontSize="1.8" fill="#64748b" opacity="0.6">Market Sq</text>
          <text x="82" y="79" fontSize="1.8" fill="#64748b" opacity="0.6">Oak Hwy</text>
        </svg>

        {/* --- Predictive AI Hotspots Layer --- */}
        {showHotspots && (
          <AnimatePresence>
            {predictiveHotspots.map((hot, idx) => {
              const pos = getCoordinates(hot.latitude, hot.longitude);
              const isCritical = hot.severity === "CRITICAL" || hot.severity === "HIGH";
              return (
                <div
                  key={`hotspot-${idx}`}
                  className="absolute"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  {/* Glowing Radar Waves */}
                  <motion.div
                    animate={{ scale: [1, 2.8, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: idx * 0.8 }}
                    className={`absolute w-12 h-12 rounded-full -left-6 -top-6 ${
                      isCritical ? "bg-red-500/20 border border-red-500/40" : "bg-amber-500/20 border border-amber-500/40"
                    }`}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: idx * 0.4 }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                      isCritical 
                        ? "bg-red-50/90 border-red-500 text-red-600 shadow-lg shadow-red-500/30" 
                        : "bg-amber-50/90 border-amber-500 text-amber-600 shadow-lg shadow-amber-500/30"
                    }`}
                    title={`AI Predicted Hotspot: ${hot.zoneName}`}
                  >
                    <ShieldAlert size={12} className="animate-bounce" />
                  </motion.div>

                  {/* Hotspot Floating Tooltip Card */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-800 z-30 w-48 text-[11px] pointer-events-none opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                    <p className="font-bold text-xs text-rose-400">{hot.zoneName}</p>
                    <p className="text-slate-300 mt-1 font-semibold">{hot.riskCategory}</p>
                    <p className="text-slate-400 leading-normal mt-0.5">{hot.riskDescription}</p>
                    <div className="mt-1.5 flex justify-between items-center text-[10px]">
                      <span className="bg-rose-500/25 px-1.5 py-0.5 rounded-full text-rose-300 font-bold">{hot.severity} RISK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatePresence>
        )}

        {/* --- Active Issues Markers Layer --- */}
        {!reportMode && (
          <AnimatePresence>
            {filteredIssues.map((issue) => {
              const pos = getCoordinates(issue.latitude, issue.longitude);
              const isActive = hoveredIssue?.id === issue.id;

              return (
                <div
                  key={issue.id}
                  className="absolute group z-20"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                  onMouseEnter={() => setHoveredIssue(issue)}
                  onMouseLeave={() => setHoveredIssue(null)}
                >
                  {/* Severity Pulse Ring */}
                  <div
                    className={`absolute -left-2 -top-2 w-8 h-8 rounded-full ring-4 ${getSeverityRingColor(
                      issue.severity
                    )}`}
                  />

                  {/* Pin Dot */}
                  <button
                    onClick={() => onSelectIssue(issue)}
                    className={`relative w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform ${getCategoryColor(
                      issue.category
                    )} hover:scale-125`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </button>

                  {/* Quick Preview Tooltip */}
                  {(isActive || hoveredIssue?.id === issue.id) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 z-50 pointer-events-none"
                    >
                      <div className="relative">
                        <img
                          src={issue.imageUrl}
                          alt={issue.title}
                          className="w-full h-20 object-cover rounded-xl mb-2"
                          referrerPolicy="no-referrer"
                        />
                        <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 text-[8px] font-bold rounded-full text-white uppercase ${
                          issue.status === "RESOLVED" ? "bg-emerald-500" : "bg-indigo-600"
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs truncate">{issue.title}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                        <MapPin size={10} />
                        {issue.address}
                      </p>
                      <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-50 text-[9px] font-bold">
                        <span className="text-slate-500 uppercase">{issue.category.replace("_", " ")}</span>
                        <span className="text-rose-500 font-extrabold">{issue.severity} Severity</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        )}

        {/* --- Reporting Interactive Marker Pin --- */}
        {reportMode && selectedCoords && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1.2, 1] }}
            className="absolute z-40"
            style={{
              left: `${getCoordinates(selectedCoords.lat, selectedCoords.lng).x}%`,
              top: `${getCoordinates(selectedCoords.lat, selectedCoords.lng).y}%`,
              transform: "translate(-50%, -100%)"
            }}
          >
            {/* Animated Pin Drop Effect */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <div className="bg-indigo-600 text-white p-2.5 rounded-full shadow-lg border-2 border-white ring-4 ring-indigo-500/20">
                <MapPin size={20} className="animate-bounce" />
              </div>
              {/* Pointy tip of the marker */}
              <div className="w-3 h-3 bg-indigo-600 transform rotate-45 -mt-1.5 border-r border-b border-white" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Selected Coordinates Status Banner (Report Mode Only) */}
      {reportMode && selectedCoords && (
        <div id="marker_location_info" className="p-3 bg-indigo-50/50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[8px] text-white">✓</span>
            <div>
              <p className="font-semibold">Pin Dropped: {selectedCoords.address}</p>
              <p className="text-[10px] text-indigo-600 font-mono">
                Lat: {selectedCoords.lat.toFixed(6)}, Lng: {selectedCoords.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
