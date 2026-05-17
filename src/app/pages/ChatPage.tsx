import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Send, Loader2, MessageCircle, MapPin, Car } from "lucide-react";
import { chat as chatApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getSocket, joinRideRoom, leaveRideRoom } from "../services/socket";

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  sender: { id: string; name: string; avatar: string; role: string };
}

export function ChatPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [ride, setRide] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load conversation on mount
  useEffect(() => {
    if (!rideId) return;
    setLoading(true);
    chatApi.getConversation(rideId)
      .then(res => {
        setMessages(res.data.conversation.messages || []);
        setRide(res.data.ride);
      })
      .catch(() => setError("Failed to load conversation."))
      .finally(() => setLoading(false));
  }, [rideId]);

  // Socket.io — join room and listen for new messages
  useEffect(() => {
    if (!rideId) return;
    joinRideRoom(rideId);
    const socket = getSocket();

    const handleMessage = (msg: Message) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("chat:message", handleMessage);
    return () => {
      socket.off("chat:message", handleMessage);
      leaveRideRoom(rideId);
    };
  }, [rideId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!inputText.trim() || !rideId || sending) return;
    const body = inputText.trim();
    setInputText("");
    setSending(true);
    try {
      await chatApi.sendMessage(rideId, body);
      // The real message will arrive via socket; no need to manually push
    } catch {
      setError("Failed to send message.");
      setInputText(body); // restore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Determine the other party's name
  const otherParty = user?.role === "driver"
    ? ride?.creator?.name || "Passenger"
    : ride?.driver?.name || "Driver";

  const otherAvatar = user?.role === "driver"
    ? ride?.creator?.avatar || "P"
    : ride?.driver?.avatar || "D";

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {otherAvatar}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold text-sm truncate">{otherParty}</p>
            {ride && (
              <p className="text-gray-400 text-xs truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {ride.pickupLocation} → {ride.dropoffLocation}
              </p>
            )}
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            ride?.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" :
            ride?.status === "CONFIRMED" ? "bg-green-50 text-green-600" :
            ride?.status === "COMPLETED" ? "bg-gray-100 text-gray-500" :
            "bg-yellow-50 text-yellow-600"
          }`}>
            {ride?.status || "—"}
          </div>
        </div>

        {/* Ride summary bar */}
        {ride && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs text-gray-500">
              <Car className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {ride.vehicle
                  ? `${ride.vehicle.make} ${ride.vehicle.model} · ${ride.vehicle.plate}`
                  : "Vehicle pending"}
              </span>
              {ride.rideCode && (
                <span className="ml-auto font-mono font-semibold text-gray-700 flex-shrink-0">
                  #{ride.rideCode}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold text-sm mb-1">Start the conversation</p>
              <p className="text-gray-400 text-xs">
                Say hello to your {user?.role === "driver" ? "passenger" : "driver"}!
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0 mt-0.5">
                    {msg.sender.avatar}
                  </div>
                )}

                <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!isMe && (
                    <span className="text-gray-400 text-xs px-1">{msg.sender.name}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-gray-900 text-white rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.body}
                  </div>
                  <span className="text-gray-300 text-xs px-1">
                    {new Date(msg.createdAt).toLocaleTimeString("en-BD", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherParty}…`}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
