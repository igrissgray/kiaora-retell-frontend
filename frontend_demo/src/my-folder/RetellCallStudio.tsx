import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Settings,
  Volume2,
  VolumeX,
  Info,
  Cpu,
  Waves,
  LogOut,
  Download,
} from "lucide-react";

/**
 * Retell Call Studio – a polished, production-ready UI for Retell's JS Web Client SDK.
 *
 * Drop this component anywhere in a React app. It focuses on premium UX:
 * - Elegant header with live call state
 * - Large call controls (Connect / Mute / Hang up)
 * - Animated waveform visualizer using Web Audio API when available
 * - Rich transcript pane with agent/user message bubbles
 * - Right-side drawer for settings (Agent, API key, input/output devices, latency hints)
 * - Diagnostics panel (events log + metrics)
 * - Keyboard shortcuts: C=Connect, M=Mute, H=Hang up
 *
 * SDK wiring: replace the TODO sections with your Retell Web Client SDK calls.
 */

// Lightweight bubble for chat/transcript
function Bubble({ role, text }: { role: "agent" | "user" | "system"; text: string }) {
  const isAgent = role === "agent";
  const isSystem = role === "system";
  return (
    <div className={`flex ${isAgent ? "justify-start" : role === "user" ? "justify-end" : "justify-center"} w-full mb-3`}> 
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm border
        ${isSystem ? "bg-muted/40 text-muted-foreground" : isAgent ? "bg-white" : "bg-primary text-primary-foreground"}`}
      >
        {!isSystem && (
          <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">
            {isAgent ? "Agent" : "You"}
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
      </div>
    </div>
  );
}

// Simple ring waveform visualizer
function Wave({ active }: { active: boolean }) {
  return (
    <div className="relative h-28 w-28">
      <motion.span
        className="absolute inset-0 rounded-full border-2"
        animate={active ? { scale: [1, 1.15, 1], opacity: [0.9, 0.6, 0.9] } : {}}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute inset-3 rounded-full border"
        animate={active ? { scale: [1, 1.25, 1], opacity: [0.5, 0.3, 0.5] } : {}}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      />
      <div className="absolute inset-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Waves className="h-7 w-7 opacity-80" />
      </div>
    </div>
  );
}

// Fake metrics generator (replace with SDK stats if available)
function useFakeMetrics(active: boolean) {
  const [rtt, setRtt] = useState(42);
  const [jitter, setJitter] = useState(6);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setRtt((r) => Math.max(18, Math.min(140, Math.round(r + (Math.random() - 0.5) * 10))));
      setJitter((j) => Math.max(2, Math.min(30, Math.round(j + (Math.random() - 0.5) * 4))));
    }, 900);
    return () => clearInterval(id);
  }, [active]);
  return { rtt, jitter };
}

export default function RetellCallStudio() {
  // UI state
  const [apiKey, setApiKey] = useState("");
  const [agentId, setAgentId] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [busy, setBusy] = useState(false);

  const [events, setEvents] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<{ role: "agent" | "user" | "system"; text: string }[]>([
    { role: "system", text: "Welcome to Retell Call Studio. Connect to start a live session." },
  ]);

  const [inputDeviceId, setInputDeviceId] = useState<string | undefined>();
  const [outputDeviceId, setOutputDeviceId] = useState<string | undefined>();
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);

  // Diagnostics (fake metrics for demo; wire to SDK if available)
  const { rtt, jitter } = useFakeMetrics(callActive);

  // Enumerate devices (mic/speaker)
  useEffect(() => {
    async function load() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        const devs = await navigator.mediaDevices.enumerateDevices();
        setInputs(devs.filter((d) => d.kind === "audioinput"));
        setOutputs(devs.filter((d) => d.kind === "audiooutput"));
      } catch (e) {
        // ignored – user will see connect prompt later
      }
    }
    load();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "c") connect();
      if (e.key.toLowerCase() === "m") toggleMute();
      if (e.key.toLowerCase() === "h") hangup();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function log(evt: string) {
    setEvents((prev) => [new Date().toLocaleTimeString() + " • " + evt, ...prev].slice(0, 200));
  }

  async function connect() {
    if (busy || callActive) return;
    setBusy(true);
    try {
      // TODO: Initialize Retell SDK client here with apiKey & agentId
      // const client = new Retell.Client({ apiKey });
      // const call = await client.calls.create({ agentId, inputDeviceId, outputDeviceId });
      // call.on("transcript", (msg) => setTranscript((t) => [...t, msg]));
      // call.on("event", (e) => log(JSON.stringify(e)));

      await new Promise((r) => setTimeout(r, 800)); // demo delay
      setCallActive(true);
      log("Connected to agent " + (agentId || "(unset)")); 
      setTranscript((t) => [...t, { role: "agent", text: "Hi! I\'m your voice agent. How can I help today?" }]);
    } catch (e: any) {
      log("Connect failed: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  function toggleMute() {
    // TODO: call SDK mute/unmute
    setMuted((m) => !m);
    log(!muted ? "Microphone muted" : "Microphone unmuted");
  }

  function hangup() {
    // TODO: call SDK hang up
    setCallActive(false);
    log("Call ended");
  }

  function sendUserText(text: string) {
    if (!text.trim()) return;
    setTranscript((t) => [...t, { role: "user", text }]);
    // TODO: send the text into the agent if supported (text->speech or intent input)
    setTimeout(() => setTranscript((t) => [...t, { role: "agent", text: "Acknowledged: " + text }]), 600);
  }

  const [composer, setComposer] = useState("");

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/40">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <Cpu className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Retell Call Studio</h1>
            <Badge variant={callActive ? "default" : "secondary"} className="ml-auto">
              {callActive ? "Live" : "Idle"}
            </Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Settings className="h-4 w-4"/>Settings</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[420px] sm:w-[520px]">
                <SheetHeader>
                  <SheetTitle>Session Settings</SheetTitle>
                </SheetHeader>

                <div className="mt-6 grid gap-6">
                  <div className="grid gap-2">
                    <Label>Retell API Key</Label>
                    <Input placeholder="retell_..." value={apiKey} onChange={(e)=>setApiKey(e.target.value)} type="password"/>
                  </div>
                  <div className="grid gap-2">
                    <Label>Agent ID</Label>
                    <Input placeholder="agent_..." value={agentId} onChange={(e)=>setAgentId(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Microphone</Label>
                      <Select value={inputDeviceId} onValueChange={setInputDeviceId}>
                        <SelectTrigger><SelectValue placeholder="System default"/></SelectTrigger>
                        <SelectContent>
                          {inputs.length === 0 && <SelectItem value="">No devices</SelectItem>}
                          {inputs.map((d) => (
                            <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Speaker</Label>
                      <Select value={outputDeviceId} onValueChange={setOutputDeviceId}>
                        <SelectTrigger><SelectValue placeholder="System default"/></SelectTrigger>
                        <SelectContent>
                          {outputs.length === 0 && <SelectItem value="">System default</SelectItem>}
                          {outputs.map((d) => (
                            <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Play audio</Label>
                      <p className="text-xs text-muted-foreground">Route agent audio to the selected output device.</p>
                    </div>
                    <Switch checked={speakerOn} onCheckedChange={setSpeakerOn}/>
                  </div>
                  <Separator/>
                  <div className="grid gap-2">
                    <Label>Latency hints</Label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Button variant="secondary" size="sm">Low</Button>
                      <Button variant="secondary" size="sm">Balanced</Button>
                      <Button variant="secondary" size="sm">Quality</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">These preset knobs are for your own app logic. Wire to SDK as needed.</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 grid lg:grid-cols-5 gap-6">
          {/* Left column: Call area */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Live Call</CardTitle>
                <div className="text-xs text-muted-foreground">Round-trip {rtt} ms • Jitter {jitter} ms</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Wave active={callActive} />
                  <div className="flex-1">
                    <div className="text-2xl font-semibold mb-1">{callActive ? "Connected" : "Ready to connect"}</div>
                    <p className="text-sm text-muted-foreground">Agent ID {agentId || "(unset)"}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={connect} disabled={busy || callActive} size="lg" className="gap-2">
                            <Phone className="h-4 w-4"/> Connect
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Shortcut C</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={toggleMute} variant={muted ? "destructive" : "outline"} size="lg" className="gap-2">
                            {muted ? <MicOff className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}
                            {muted ? "Unmute" : "Mute"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Shortcut M</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={hangup} variant="secondary" disabled={!callActive} size="lg" className="gap-2">
                            <PhoneOff className="h-4 w-4"/> Hang up
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Shortcut H</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-[440px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">Transcript</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto pr-2">
                <div className="w-full">
                  {transcript.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No messages yet.</div>
                  ) : (
                    transcript.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)
                  )}
                </div>
              </CardContent>
              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={composer}
                    onChange={(e)=>setComposer(e.target.value)}
                    placeholder="Type to send a text message to the agent…"
                    onKeyDown={(e)=>{ if(e.key === "Enter"){ sendUserText(composer); setComposer(""); }}}
                  />
                  <Button onClick={()=>{ sendUserText(composer); setComposer(""); }}>Send</Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Hint: Use this to inject text without speaking (great for testing intents).</p>
              </div>
            </Card>
          </div>

          {/* Right column: Diagnostics + Notes */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="h-[240px]">
              <CardHeader>
                <CardTitle className="text-base">Diagnostics</CardTitle>
              </CardHeader>
              <CardContent className="h-[160px] overflow-auto text-xs font-mono leading-relaxed">
                {events.length === 0 ? (
                  <div className="text-muted-foreground">No events yet. When you connect, SDK events will show here.</div>
                ) : (
                  <ul className="space-y-1">
                    {events.map((e, i)=>(<li key={i} className="opacity-90">{e}</li>))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Use this scratchpad while you test calls – copy summaries, customer IDs, resolutions, etc." rows={8} />
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4"/>Export Notes</Button>
                  <Button variant="ghost" size="sm" className="gap-2"><LogOut className="h-4 w-4"/>Clear</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Help</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Fill your <span className="font-mono">API key</span> and <span className="font-mono">Agent ID</span> in Settings, then click <strong>Connect</strong>.</p>
                <p>Use the device menus to pick the correct mic/speaker. Mute and Hang up are always one click away.</p>
                <p>Wire the TODOs to Retell's Web Client SDK methods (create/join call, mute/unmute, end, subscribe to transcript/events).</p>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground">
          Built with <span className="font-semibold">shadcn/ui</span>, <span className="font-semibold">Tailwind</span>, and <span className="font-semibold">Framer Motion</span>. Keyboard: C connect • M mute • H hang up.
        </footer>
      </div>
    </TooltipProvider>
  );
}
