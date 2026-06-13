import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, MapPin, Clock, Users, Car, Star,
  CheckCircle2, XCircle, Loader2, MessageSquare,
  Navigation, DollarSign, AlertCircle, RefreshCw,
  UserCheck, UserX, ChevronRight,
} from "lucide-react";
import { MapComponent, ParticipantMarker } from "../components/MapComponent";
import { rides as ridesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getSocket, joinRideRoom, leaveRideRoom } from "../services/socket";

// ── Helpers ───────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:     { label: "Pending",     cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    CONFIRMED:   { label: "Confirmed",   cls: "bg-green-50 text-green-700 border-green-200" },
    IN_PROGRESS: { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    COMPLETED:   { label: "Completed",   cls: "bg-gray-50 text-gray-600 border-gray-200" },
    CANCELLED:   { label: "Cancelled",   cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-50 text-gray-500 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function reqStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: "Pending",   cls: "bg-yellow-50 text-yellow-700" },
    APPROVED:  { label: "Approved",  cls: "bg-green-50 text-green-700" },
    REJECTED:  { label: "Rejected",  cls: "bg-red-50 text-red-600" },
    CANCELLED: { label: "Cancelled", cls: "bg-gray-50 text-gray-500" },
    COMPLETED: { label: "Completed", cls: "bg-gray-50 text-gray-500" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-50 text-gray-500" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function avatarFallback(name: string) {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

// ── Main Component ────────────────────────────────────────────────────
export function RideDetailPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // ── Load ride data ────────────────────────────────────────────────
  const loadRide = useCallback(async () => {
    if (!rideId) return;
    try {
      const res = await ridesApi.getById(rideId);
      setRide(res.data);
      setError("");
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Could not load ride.");
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => { loadRide(); }, [loadRide]);

  // ── Socket.io real-time events ────────────────────────────────────
  useEffect(() => {
    if (!rideId) return;
    const socket = getSocket();
    joinRideRoom(rideId);

    socket.on("driver:location", (loc: { lat: number; lng: number }) => {
      setDriverLoc(loc);
    });

    socket.on("ride:status_update", (data: { status: string; driver?: any }) => {
      setRide((prev: any) => prev
        ? { ...prev, status: data.status, ...(data.driver ? { driver: data.driver } : {}) }
        : prev
      );
    });

    socket.on("ride:seat_update", (data: {
      availableSeats: number; totalSeats: number; requestId?: string; status?: string;
    }) => {
      setRide((prev: any) => {
        if (!prev) return prev;
        const updatedRequests = prev.shareRequests?.map((r: any) =>
          r.id === data.requestId ? { ...r, status: data.status } : r
        );
        return {
          ...prev,
          availableSeats: data.availableSeats ?? prev.availableSeats,
          shareRequests: updatedRequests || prev.shareRequests,
        };
      });
    });

    socket.on("ride:passenger_joined", () => {
      // Reload to get updated requests list
      loadRide();
    });

    return () => {
      leaveRideRoom(rideId);
      socket.off("driver:location");
      socket.off("ride:status_update");
      socket.off("ride:seat_update");
      socket.off("ride:passenger_joined");
    };
  }, [rideId, loadRide]);

  // ── Driver: approve request ───────────────────────────────────────
  async function handleApprove(requestId: string) {
    if (!rideId) return;
    setActionLoading(requestId);
    setActionError("");
    try {
      await ridesApi.approveRequest(rideId, requestId);
      await loadRide();
    } catch (err: any) {
      setActionError(err?.data?.message || "Failed to approve.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Driver: reject request ────────────────────────────────────────
  async function handleReject(requestId: string) {
    if (!rideId) return;
    setActionLoading(requestId + "-reject");
    setActionError("");
    try {
      await ridesApi.rejectRequest(rideId, requestId);
      await loadRide();
    } catch (err: any) {
      setActionError(err?.data?.message || "Failed to reject.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Driver: start ride ────────────────────────────────────────────
  async function handleStart() {
    if (!rideId) return;
    setActionLoading("start");
    try {
      await ridesApi.start(rideId);
      await loadRide();
    } catch (err: any) {
      setActionError(err?.data?.message || "Failed to start.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Driver: complete ride ─────────────────────────────────────────
  async function handleComplete() {
    if (!rideId) return;
    setActionLoading("complete");
    try {
      await ridesApi.complete(rideId);
      await loadRide();
    } catch (err: any) {
      setActionError(err?.data?.message || "Failed to complete.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Cancel ride ───────────────────────────────────────────────────
  async function handleCancel() {
    if (!rideId || !window.confirm("Cancel this ride?")) return;
    setActionLoading("cancel");
    try {
      await ridesApi.cancel(rideId);
      await loadRide();
    } catch (err: any) {
      setActionError(err?.data?.message || "Failed to cancel.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Derive roles ──────────────────────────────────────────────────
  const isDriver = ride?.driverId === user?.id || ride?.creatorId === user?.id && ride?.type === "DRIVER_CREATED_SHARED";
  const isPassenger = !isDriver && ride?.participants?.some((p: any) => p.userId === user?.id);

  // ── Build participant markers for map ─────────────────────────────
  const participantMarkers: ParticipantMarker[] = [
    ...(ride?.participants || []).map((p: any) => ({
      id: p.id,
      name: p.user?.name || "Passenger",
      pickupLat: p.pickupLat,
      pickupLng: p.pickupLng,
      pickupLocation: p.pickupLocation,
      dropoffLat: p.dropoffLat,
      dropoffLng: p.dropoffLng,
      dropoffLocation: p.dropoffLocation,
      status: p.status,
    })),
    ...(ride?.shareRequests || [])
      .filter((r: any) => r.status === "PENDING")
      .map((r: any) => ({
        id: r.id,
        name: r.user?.name || "Requesting",
        pickupLat: r.pickupLat,
        pickupLng: r.pickupLng,
        pickupLocation: r.pickupLocation,
        dropoffLat: r.dropoffLat,
        dropoffLng: r.dropoffLng,
        dropoffLocation: r.dropoffLocation,
        status: "PENDING" as const,
      })),
  ];

  const pendingRequests = (ride?.shareRequests || []).filter((r: any) => r.status === "PENDING");
  const approvedParticipants = (ride?.participants || []).filter((p: any) => p.status === "APPROVED" || p.status === "COMPLETED");

  // ── Loading / error states ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading ride details…</p>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="text-center max-w-sm px-6">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold mb-1">Ride not found</p>
          <p className="text-gray-500 text-sm mb-5">{error}</p>
          <button onClick={() => navigate(-1)} className="text-green-600 hover:text-green-700 text-sm font-semibold">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const totalEarned = ride.pricePerSeat
    ? ride.pricePerSeat * (approvedParticipants.reduce((sum: number, p: any) => sum + (p.seatsBooked || 1), 0))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-gray-900 font-bold" style={{ fontSize: "1rem" }}>
                {ride.type === "DRIVER_CREATED_SHARED" ? "Shared Ride" : "Ride Details"}
              </h1>
              <span className="text-gray-300 font-mono text-xs hidden sm:inline">{ride.rideCode}</span>
              {statusBadge(ride.status)}
            </div>
            <p className="text-gray-500" style={{ fontSize: "0.78rem" }}>
              {ride.pickupLocation} → {ride.dropoffLocation}
            </p>
          </div>
          <button
            onClick={loadRide}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        <div className="grid lg:grid-cols-[1fr,360px] gap-6">

          {/* ── Left: Map + Route ──────────────────────────────────── */}
          <div className="space-y-5">

            {/* Interactive Map */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  {isDriver ? "Your Route & Passenger Pickups" : "Route Map"}
                </p>
                {driverLoc && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <Navigation className="w-3 h-3" />
                    Driver live
                  </span>
                )}
              </div>

              <MapComponent
                pickupText={ride.pickupLocation}
                dropoffText={ride.dropoffLocation}
                height="340px"
                driverLocation={driverLoc}
                showGeolocationButton={false}
                participants={isDriver ? participantMarkers : []}
              />

              {/* Map legend for driver */}
              {isDriver && participantMarkers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold" style={{ fontSize: "9px" }}>1</div>
                    <span>Approved pickup</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold" style={{ fontSize: "9px" }}>1</div>
                    <span>Pending pickup</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-gray-800 border-2 border-white shadow-sm" />
                    <span>Drop-off</span>
                  </div>
                </div>
              )}
            </div>

            {/* Route details strip */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center mt-1 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white ring-2 ring-green-200" />
                  <div className="w-0.5 h-8 bg-gray-200 my-1" />
                  <div className="w-3 h-3 rounded-full bg-gray-800 border-2 border-white ring-2 ring-gray-200" />
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <p className="text-gray-400 text-xs font-medium mb-0.5">PICKUP</p>
                    <p className="text-gray-900 font-semibold text-sm">{ride.pickupLocation}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium mb-0.5">DROP-OFF</p>
                    <p className="text-gray-900 font-semibold text-sm">{ride.dropoffLocation}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ride.departureTime && (
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-0.5">Departure</p>
                    <p className="text-gray-900 text-sm font-semibold">
                      {new Date(ride.departureTime).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(ride.departureTime).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-0.5">Seats</p>
                  <p className="text-gray-900 text-sm font-semibold">
                    {ride.availableSeats} left / {ride.totalSeats}
                  </p>
                </div>
                {ride.pricePerSeat && (
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-0.5">Price</p>
                    <p className="text-green-700 text-sm font-bold">BDT {ride.pricePerSeat}/seat</p>
                  </div>
                )}
                {ride.paymentMethod && (
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-0.5">Payment</p>
                    <p className="text-gray-900 text-sm font-semibold">{ride.paymentMethod}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {ride.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-blue-800 text-xs font-semibold mb-1 uppercase tracking-wide">Driver's Notes</p>
                <p className="text-blue-700 text-sm leading-relaxed">{ride.notes}</p>
              </div>
            )}

            {/* ── Approved Participants ─────────────────────────── */}
            {approvedParticipants.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-gray-400" />
                  <h3 className="text-gray-900 font-bold text-sm">
                    Passengers ({approvedParticipants.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {approvedParticipants.map((p: any, i: number) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-semibold">{p.user?.name || "Passenger"}</p>
                        {p.pickupLocation && (
                          <p className="text-gray-500 text-xs truncate">
                            📍 {p.pickupLocation}
                            {p.dropoffLocation ? ` → 🏁 ${p.dropoffLocation}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {p.fareAmount && (
                          <p className="text-green-700 text-xs font-bold">BDT {p.fareAmount}</p>
                        )}
                        <p className="text-gray-400 text-xs">{p.seatsBooked} seat{p.seatsBooked > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Pending Requests (driver only) ────────────────── */}
            {isDriver && pendingRequests.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-gray-900 font-bold text-sm">
                    Pending Requests ({pendingRequests.length})
                  </h3>
                </div>
                <p className="text-gray-400 text-xs mb-4">Review and approve passengers to join your ride.</p>

                {actionError && (
                  <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-600 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {actionError}
                  </div>
                )}

                <div className="space-y-3">
                  {pendingRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="border border-amber-100 bg-amber-50 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-sm font-bold flex-shrink-0">
                          {avatarFallback(req.user?.name || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-semibold">{req.user?.name || "Passenger"}</p>
                          <p className="text-gray-500 text-xs">{req.seatsRequested} seat{req.seatsRequested > 1 ? "s" : ""} requested</p>
                          {req.pickupLocation && (
                            <p className="text-gray-500 text-xs mt-1 truncate">
                              📍 {req.pickupLocation}
                            </p>
                          )}
                          {req.dropoffLocation && (
                            <p className="text-gray-500 text-xs truncate">
                              🏁 {req.dropoffLocation}
                            </p>
                          )}
                          {req.message && (
                            <p className="text-gray-600 text-xs mt-1 italic">"{req.message}"</p>
                          )}
                        </div>
                        {ride.pricePerSeat && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-green-700 text-sm font-bold">
                              BDT {ride.pricePerSeat * req.seatsRequested}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                        >
                          {actionLoading === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id + "-reject"}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-600 text-xs font-semibold py-2 rounded-lg transition-colors"
                        >
                          {actionLoading === req.id + "-reject" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Driver info + Actions ─────────────────────── */}
          <div className="space-y-5">

            {/* Driver info */}
            {ride.driver && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Driver</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {avatarFallback(ride.driver.name)}
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold">{ride.driver.name}</p>
                    {ride.driver.driverProfile?.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-600 text-sm font-semibold">
                          {ride.driver.driverProfile.rating.toFixed(1)}
                        </span>
                        {ride.driver.driverProfile.totalRides > 0 && (
                          <span className="text-gray-400 text-xs">
                            · {ride.driver.driverProfile.totalRides} trips
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle info */}
                {ride.vehicle && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                    <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">
                        {ride.vehicle.make} {ride.vehicle.model}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {ride.vehicle.color} · {ride.vehicle.plate}
                      </p>
                    </div>
                  </div>
                )}

                {/* Chat button */}
                {(isPassenger || isDriver) && ["CONFIRMED", "IN_PROGRESS"].includes(ride.status) && (
                  <button
                    onClick={() => navigate(`/chat/${rideId}`)}
                    className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Chat
                  </button>
                )}
              </div>
            )}

            {/* Seat availability widget */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Seat Availability</p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${ride.availableSeats > 0 ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
                  <span className={`text-xs font-medium ${ride.availableSeats > 0 ? "text-green-600" : "text-red-500"}`}>
                    {ride.availableSeats > 0 ? "Available" : "Full"}
                  </span>
                </div>
              </div>

              {/* Seat visual */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.from({ length: ride.totalSeats }, (_, i) => {
                  const occupied = i >= ride.availableSeats;
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 ${
                        occupied
                          ? "bg-gray-900 border-gray-900 text-white"
                          : "bg-green-50 border-green-200 text-green-700"
                      }`}
                      title={occupied ? "Taken" : "Available"}
                    >
                      {occupied ? "✓" : i + 1}
                    </div>
                  );
                })}
              </div>
              <p className="text-gray-500 text-xs text-center">
                {ride.availableSeats} of {ride.totalSeats} seats open
              </p>
            </div>

            {/* Earnings card (driver only) */}
            {isDriver && ride.pricePerSeat && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900 font-bold text-sm">Earnings</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved passengers</span>
                    <span className="text-gray-900 font-semibold">{approvedParticipants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rate</span>
                    <span className="text-gray-900 font-semibold">BDT {ride.pricePerSeat}/seat</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-bold">Total earned</span>
                    <span className="text-green-600 font-bold text-base">BDT {totalEarned}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Driver action buttons ─────────────────────────── */}
            {isDriver && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Manage Ride</p>

                {ride.status === "CONFIRMED" && (
                  <button
                    onClick={handleStart}
                    disabled={actionLoading === "start"}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {actionLoading === "start" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    Start Ride
                  </button>
                )}

                {ride.status === "IN_PROGRESS" && (
                  <button
                    onClick={handleComplete}
                    disabled={actionLoading === "complete"}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {actionLoading === "complete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Complete Ride
                  </button>
                )}

                {["PENDING", "CONFIRMED"].includes(ride.status) && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel"}
                    className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {actionLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Cancel Ride
                  </button>
                )}

                {ride.status === "COMPLETED" && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-green-700 text-sm font-semibold">Ride completed!</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Passenger: request status ─────────────────────── */}
            {!isDriver && user && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Your Status</p>
                {(() => {
                  const myReq = ride.shareRequests?.find((r: any) => r.userId === user.id);
                  const myPart = ride.participants?.find((p: any) => p.userId === user.id);
                  if (myPart) {
                    return (
                      <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-green-700 font-semibold text-sm">You're on this ride!</p>
                          <p className="text-green-600 text-xs">{myPart.seatsBooked} seat{myPart.seatsBooked > 1 ? "s" : ""} confirmed</p>
                        </div>
                      </div>
                    );
                  }
                  if (myReq) {
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-gray-700 text-sm font-semibold">Join request sent</p>
                          {reqStatusBadge(myReq.status)}
                        </div>
                        {myReq.status === "PENDING" && (
                          <p className="text-gray-500 text-xs">Waiting for driver to approve your request.</p>
                        )}
                        {myReq.status === "REJECTED" && (
                          <p className="text-red-500 text-xs">Your request was declined. You can try booking another ride.</p>
                        )}
                      </div>
                    );
                  }
                  // Show book button if available
                  if (ride.status === "CONFIRMED" && ride.availableSeats > 0) {
                    return (
                      <button
                        onClick={() => navigate(`/find-ride`)}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                        Book a seat on this ride
                      </button>
                    );
                  }
                  return (
                    <p className="text-gray-500 text-sm">
                      {ride.availableSeats === 0 ? "This ride is full." : "Ride is not accepting bookings right now."}
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Share ride code */}
            <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-xs font-medium mb-1">Ride Code</p>
              <p className="text-gray-900 font-mono font-bold text-xl tracking-widest">{ride.rideCode}</p>
              <p className="text-gray-400 text-xs mt-1">Share this code with passengers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
