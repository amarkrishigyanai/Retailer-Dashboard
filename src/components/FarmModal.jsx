import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getFarmsByUserId, getFarmByFarmId } from "../store/thunks/farmThunk";
import { clearFarms, clearSelectedFarm } from "../store/slices/farmSlice";
import { X, MapPin, Layers, Droplets, ArrowLeft } from "lucide-react";

const MAP_STYLES = [
  {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Source: Esri, USGS, NOAA",
  },
  {
    label: "Dark",
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
  },
  {
    label: "Minimal",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const toLatLng = (coords) => coords.map(([lng, lat]) => [lat, lng]);

const getCenter = (coords) => {
  const lats = coords.map(([, lat]) => lat);
  const lngs = coords.map(([lng]) => lng);
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
};

function FarmModal({ member, onClose }) {
  const dispatch = useDispatch();
  const { farms, selectedFarm, loading, detailLoading } = useSelector((s) => s.farm);
  const [mapStyle, setMapStyle] = useState(0);

  useEffect(() => {
    dispatch(getFarmsByUserId(member._id));
    return () => dispatch(clearFarms());
  }, [dispatch, member._id]);

  const handleViewDetail = (farmId) => dispatch(getFarmByFarmId(farmId));
  const handleBack = () => dispatch(clearSelectedFarm());

  const farm = selectedFarm;
  const rawCoords = farm?.geojson?.geometry?.coordinates?.[0];
  const polygonPositions = rawCoords ? toLatLng(rawCoords) : null;
  const mapCenter = rawCoords ? getCenter(rawCoords) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(58,46,34,0.4)" }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#ffffff", borderRadius: "20px" }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="flex items-center gap-2">
            {farm && (
              <button
                onClick={handleBack}
                className="p-1 rounded-xl transition-all duration-150"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fae0d8")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <ArrowLeft size={18} style={{ color: "#5a4535" }} />
              </button>
            )}
            <div>
              <h2 className="text-lg" style={{ fontWeight: 800, color: "#3b2e22" }}>
                {farm
                  ? farm.farmName || "Farm Details"
                  : `${member.firstName} ${member.lastName}'s Farms`}
              </h2>
              <p className="text-xs" style={{ color: "#7a6558" }}>
                {farm
                  ? `${farm.farmArea} ${farm.unit || "acre"}`
                  : `${farms.length} farm(s) found`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl transition-all duration-150"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fae0d8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={20} style={{ color: "#5a4535" }} />
          </button>
        </div>

        <div className="p-5">
          {/* FARM LIST VIEW */}
          {!farm && (
            <>
              {loading && (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full animate-spin" style={{ borderBottom: "2px solid #e8907a" }} />
                </div>
              )}

              {!loading && farms.length === 0 && (
                <p className="py-10 text-center" style={{ color: "#7a6558" }}>
                  No farms registered for this member.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {farms.map((f) => {
                  const coords = f.geojson?.geometry?.coordinates?.[0];
                  const center = coords ? getCenter(coords) : null;
                  return (
                    <div
                      key={f._id}
                      className="p-4 transition-all duration-150 cursor-pointer"
                      style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.08)", backgroundColor: "rgba(250,243,220,0.6)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fae0d8")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(250,243,220,0.6)")}
                      onClick={() => handleViewDetail(f._id)}
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold" style={{ color: "#3b2e22" }}>
                          {f.farmName || "Unnamed Farm"}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#fae0d8", color: "#c4674f" }}
                        >
                          {f.farmArea} {f.unit || "acre"}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm" style={{ color: "#7a6558" }}>
                        <p className="flex items-center gap-1">
                          <MapPin size={13} />
                          {center
                            ? `${center[0].toFixed(4)}°N, ${center[1].toFixed(4)}°E`
                            : "Location N/A"}
                        </p>
                        <p className="flex items-center gap-1">
                          <Layers size={13} /> Soil: {f.soilType || "N/A"}
                        </p>
                        <p className="flex items-center gap-1">
                          <Droplets size={13} /> Irrigation: {f.irrigationType || "N/A"}
                        </p>
                      </div>
                      <button className="mt-3 text-xs font-semibold" style={{ color: "#e8907a" }}>
                        View Details & Map →
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* FARM DETAIL + MAP VIEW */}
          {farm && (
            <>
              {detailLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full animate-spin" style={{ borderBottom: "2px solid #e8907a" }} />
                </div>
              )}

              {!detailLoading && (
                <div className="space-y-5">
                  {/* INFO GRID */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Farm Name", value: farm.farmName },
                      { label: "Area", value: `${farm.farmArea} ${farm.unit || "acre"}` },
                      { label: "Soil Type", value: farm.soilType },
                      { label: "Irrigation", value: farm.irrigationType },
                      { label: "Village", value: farm.village },
                      { label: "District", value: farm.district },
                      { label: "State", value: farm.state },
                      { label: "Pincode", value: farm.pincode },
                    ].map(
                      (item) =>
                        item.value && (
                          <div key={item.label} className="p-3" style={{ borderRadius: "12px", backgroundColor: "#fae0d8" }}>
                            <p className="text-xs" style={{ color: "#7a6558" }}>{item.label}</p>
                            <p className="text-sm font-semibold mt-0.5" style={{ color: "#3b2e22" }}>{item.value}</p>
                          </div>
                        ),
                    )}
                  </div>

                  {/* CROPS */}
                  {farm.crops?.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold" style={{ color: "#5a4535" }}>Crops Grown</p>
                      <div className="flex flex-wrap gap-2">
                        {farm.crops.map((c, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs font-semibold rounded-full"
                            style={{ backgroundColor: "#dff0d8", color: "#3e6030" }}
                          >
                            {c.cropName || c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MAP */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold" style={{ color: "#5a4535" }}>Farm Boundary</p>
                      {polygonPositions && (
                        <div className="flex gap-1">
                          {MAP_STYLES.map((s, i) => (
                            <button
                              key={s.label}
                              onClick={() => setMapStyle(i)}
                              className="px-3 py-1 text-xs rounded-full transition-all duration-150"
                              style={
                                mapStyle === i
                                  ? { backgroundColor: "#e8907a", color: "#ffffff", border: "1px solid #e8907a" }
                                  : { color: "#7a6558", border: "1px solid rgba(0,0,0,0.15)", backgroundColor: "transparent" }
                              }
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {polygonPositions && mapCenter ? (
                      <div className="overflow-hidden h-72" style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.08)" }}>
                        <MapContainer center={mapCenter} zoom={16} style={{ height: "100%", width: "100%" }}>
                          <TileLayer
                            key={mapStyle}
                            url={MAP_STYLES[mapStyle].url}
                            attribution={MAP_STYLES[mapStyle].attribution}
                          />
                          <Polygon
                            positions={polygonPositions}
                            pathOptions={{ color: "#8db87a", fillColor: "#8db87a", fillOpacity: 0.3, weight: 2 }}
                          >
                            <Popup>
                              {farm.farmName || "Farm Boundary"} — {farm.farmArea} {farm.unit || "acre"}
                            </Popup>
                          </Polygon>
                        </MapContainer>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center h-40 rounded-2xl"
                        style={{ backgroundColor: "#fae0d8", color: "#7a6558" }}
                      >
                        <MapPin size={28} className="mb-1 opacity-40" />
                        <p className="text-sm">No location data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmModal;
