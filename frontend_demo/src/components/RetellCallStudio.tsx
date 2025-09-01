import React, { useEffect, useState } from "react";

/* ====== Tiny SVG “icons” (no libs) ====== */
const Icon = {
  Phone: (p: any) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.3 22 2 13.7 2 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58.12.35.03.74-.24 1.01l-2.2 2.2z"/></svg>
  ),
  PhoneOff: (p: any) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}><path fill="currentColor" d="M3.27 5L2 6.27l4.51 4.51a14.9 14.9 0 006.71 6.71l4.51 4.51L19.73 22 3.27 5zM21 15a1 1 0 00-1-1 15.6 15.6 0 00-5 .83l2.11 2.11a13.6 13.6 0 012.89-.33 1 1 0 011 1V21a1 1 0 01-1 1h-1.17l2.92 2.92L22 23.59 21 22.59V15zM7 3H4a1 1 0 00-1 1v3a1 1 0 001 1 13.6 13.6 0 012.89.33L9 6.22A15.6 15.6 0 007 5c0-1.1 0-2 0-2z"/></svg>
  ),
  Mic: (p: any) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}><path fill="currentColor" d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19v3h2v-3h-2z"/></svg>
  ),
  MicOff: (p: any) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...p}><path fill="currentColor" d="M19 11a7 7 0 01-1 3l1.46 1.46A8.94 8.94 0 0021 11h-2zM8 11V5a4 4 0 118 0v6a4 4 0 01-.3 1.5l1.48 1.48A6 6 0 006 11H8zm-5.73-8.04L1 4.23 9.77 13A4 4 0 0012 15a4 4 0 003.77-2.23L18 15a6 6 0 01-9.77-7.77L2.27 2.96zM11 19v3h2v-3h-2z"/></svg>
  ),
  Cog: (p: any) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}><path fill="currentColor" d="M12 15.5A3.5 3.5 0 1115.5 12 3.5 3.5 0 0112 15.5zm8.94-2.72a7.9 7.9 0 000-1.56l2-1.55-2-3.46-2.44 1a7.77 7.77 0 00-1.34-.78L16.8 2h-4.6l-.36 3.37a7.77 7.77 0 00-1.34.78l-2.44-1-2 3.46 2 1.55a7.9 7.9 0 000 1.56l-2 1.55 2 3.46 2.44-1c.43.32.88.58 1.34.78L12.2 22h4.6l.36-3.37c.46-.2.9-.46 1.34-.78l2.44 1 2-3.46z"/></svg>
  ),
  Waves: (p: any) => (
    <svg viewBox="0 0 24 24" width="28" height="28" {...p}><path fill="currentColor" d="M4 12a8 8 0 0116 0h-2a6 6 0 00-12 0H4zm2 0a6 6 0 0112 0h-2a4 4 0 00-8 0H6z"/></svg>
  ),
};

function Bubble({ role, text }: { role: "agent" | "user" | "system"; text: string }) {
  const align =
    role === "agent" ? "flex-start" : role === "user" ? "flex-end" : "center";
  const kind =
    role === "system" ? "bubble system" : role === "agent" ? "bubble agent" : "bubble user";
  return (
    <div style={{ display: "flex", justifyContent: align, marginBottom: 10 }}>
      <div className={kind}>
        {role !== "system" && (
          <div className="bubble-label">{role === "agent" ? "Agent" : "You"}</div>
        )}
        <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
      </div>
    </div>
  );
}

export default function RetellCallStudio() {
  const [apiKey, setApiKey] = useState("");
  const [agentId, setAgentId] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [composer, setComposer] = useState("");
  const [transcript, setTranscript] = useState<
    { role: "agent" | "user" | "system"; text: string }[]
  >([{ role: "system", text: "Welcome to Retell Call Studio. Connect to start a live session." }]);

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "c") connect();
      if (e.key.toLowerCase() === "m") toggleMute();
      if (e.key.toLowerCase() === "h") hangup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function log(s: string) {
    setEvents((prev) => [new Date().toLocaleTimeString() + " • " + s, ...prev].slice(0, 200));
  }

  async function connect() {
    if (callActive) return;
    // TODO: Wire to Retell Web Client SDK (create/join call with apiKey + agentId)
    setCallActive(true);
    log("Connected to agent " + (agentId || "(unset)"));
    setTranscript((t) => [...t, { role: "agent", text: "Hi! I’m your voice agent. How can I help?" }]);
  }

  function toggleMute() {
    // TODO: call SDK mute/unmute
    setMuted((m) => !m);
    log(muted ? "Microphone unmuted" : "Microphone muted");
  }

  function hangup() {
    // TODO: call SDK end
    if (!callActive) return;
    setCallActive(false);
    log("Call ended");
  }

  function sendText() {
    if (!composer.trim()) return;
    setTranscript((t) => [...t, { role: "user", text: composer }]);
    setComposer("");
    setTimeout(
      () => setTranscript((t) => [...t, { role: "agent", text: "Acknowledged: " + composer }]),
      500
    );
  }

  return (
    <div className="studio-root">
      {/* Header */}
      <div className="studio-topbar">
        <div className="brand">
          <span className="logo"><Icon.Waves /></span>
          <span className="title">Retell Call Studio</span>
          <span className={`status ${callActive ? "live" : "idle"}`}>{callActive ? "Live" : "Idle"}</span>
        </div>
        <button className="ghost" onClick={() => setShowSettings(true)}>
          <Icon.Cog /> <span>Settings</span>
        </button>
      </div>

      {/* Main grid */}
      <div className="studio-grid">
        {/* Call card */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Live Call</div>
            <div className="meta">Keyboard: C connect • M mute • H hang up</div>
          </div>
          <div className="call-area">
            <div className={`pulse ${callActive ? "on" : ""}`}>
              <Icon.Waves />
            </div>
            <div className="call-copy">
              <div className="big">{callActive ? "Connected" : "Ready to connect"}</div>
              <div className="sub">Agent ID {agentId || "(unset)"}</div>
              <div className="controls">
                <button className="primary" onClick={connect} disabled={callActive}>
                  <Icon.Phone /> Connect
                </button>
                <button className={muted ? "danger outline" : "outline"} onClick={toggleMute}>
                  {muted ? <Icon.MicOff /> : <Icon.Mic />} {muted ? "Unmute" : "Mute"}
                </button>
                <button className="secondary" onClick={hangup} disabled={!callActive}>
                  <Icon.PhoneOff /> Hang up
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="card tall">
          <div className="card-head"><div className="card-title">Transcript</div></div>
          <div className="scroll">
            {transcript.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} />
            ))}
          </div>
          <div className="composer">
            <input
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type to send a text message to the agent…"
            />
            <button className="primary" onClick={sendText}>Send</button>
          </div>
        </div>

        {/* Diagnostics */}
        <div className="card">
          <div className="card-head"><div className="card-title">Diagnostics</div></div>
          <div className="scroll mono small">
            {events.length === 0 ? (
              <div className="muted">No events yet. When connected, SDK events will appear here.</div>
            ) : (
              events.map((e, i) => <div key={i}>{e}</div>)
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-head"><div className="card-title">Session Notes</div></div>
          <textarea className="notes" rows={8} placeholder="Scratchpad for your testing notes…" />
          <div className="row">
            <button className="outline">Export</button>
            <button className="ghost">Clear</button>
          </div>
        </div>
      </div>

      {/* Settings sheet */}
      {showSettings && (
        <div className="sheet-backdrop" onClick={() => setShowSettings(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <div className="card-title">Session Settings</div>
              <button className="ghost" onClick={() => setShowSettings(false)}>Close</button>
            </div>
            <div className="form">
              <label>Retell API Key</label>
              <input type="password" placeholder="retell_..." value={apiKey} onChange={(e)=>setApiKey(e.target.value)} />
              <label>Agent ID</label>
              <input placeholder="agent_..." value={agentId} onChange={(e)=>setAgentId(e.target.value)} />
              <div className="muted small">These values only live in the page for testing. For production, fetch a short-lived token from your backend.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
