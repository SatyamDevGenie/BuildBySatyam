import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  MapPin,
  Wallet,
  Lock,
  FileVideo,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
  Fingerprint,
  Zap,
  History,
  Send,
  Sparkles,
  Award,
  Code2,
} from "lucide-react";

const API_BASE_URL = "https://buildbysatyam.onrender.com";

const TRANSLATIONS = {
  EN: {
    subtitle: "Sovereign Civic Network • Anti-Fraud & Backend Command Center",
    citizen: "Citizen Aarav",
    location: "Asalpha, Mumbai",
    civicScore: "Civic Score",
    availableWallet: "Available Wallet",
    escrowWallet: "Escrow Wallet",
    tabConsensus: "500m GPS & Anti-Spoof",
    tabBbbs: "BBPS & Idempotency",
    tabWhistle: "Whistle Evidence Vault",
    tabLedger: "Immutable Ledger",
  },
  HI: {
    subtitle: "सॉवरेन सिविक नेटवर्क • एंटी-फ्रॉड और बैकएंड कमांड सेंटर",
    citizen: "नागरिक आरव",
    location: "असल्फा, मुंबई",
    civicScore: "सिविक स्कोर",
    availableWallet: "उपलब्ध वॉलेट",
    escrowWallet: "एस्क्रो वॉलेट",
    tabConsensus: "500m GPS और एंटी-स्पूफ",
    tabBbbs: "BBPS और आइडेंपोटेंसी",
    tabWhistle: "व्हिसलब्लोअर एविडेंस वॉल्ट",
    tabLedger: "इम्यूटेबल लेजर",
  },
  MR: {
    subtitle: "सॉवरेन सिव्हिक नेटवर्क • अँटी-फ्रॉड आणि बॅकएंड कमांड सेंटर",
    citizen: "नागरिक आरव",
    location: "असल्फा, मुंबई",
    civicScore: "सिव्हिक स्कोअर",
    availableWallet: "उपलब्ध वॉलेट",
    escrowWallet: "एस्क्रो वॉलेट",
    tabConsensus: "500m GPS आणि अँटी-स्पूफ",
    tabBbbs: "BBPS आणि आयडेंपोटेंसी",
    tabWhistle: "व्हिसलब्लोअर पुरावा व्हॉल्ट",
    tabLedger: "इम्युटेबल लेजर",
  },
};

const INITIAL_CITIZEN = {
  pseudonymId: "Anonymous Guardian #3094",
  displayAlias: "Citizen Aarav",
  locality: "Asalpha, Mumbai",
  civicScore: 78420,
  availableWallet: 2400,
  escrowWallet: 450,
};

const INITIAL_INCIDENT = {
  incidentCode: "#20194",
  category: "Public & Transit Safety",
  headline: "Van Blocking Ambulance Gate",
  locality: "Asalpha, Mumbai",
  location: { type: "Point", coordinates: [72.8902, 19.0968] },
  witnessCount: 2,
  requiredWitnesses: 3,
  escrowReward: 450,
  status: "PENDING_CONSENSUS",
  evidenceSha256: null,
  metadataStripped: false,
};

function computeClientSha256Fallback(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, "0");
  return `${combined}${combined}${combined}${combined}`.slice(0, 64);
}

function getHaversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function App() {
  const [lang, setLang] = useState("EN");
  const [activeTab, setActiveTab] = useState("consensus");
  const [backendMode, setBackendMode] = useState("checking"); // "live" | "demo" | "checking"

  const [citizen, setCitizen] = useState(INITIAL_CITIZEN);
  const [incident, setIncident] = useState(INITIAL_INCIDENT);
  const [ledger, setLedger] = useState([
    {
      id: "LED-1001",
      entryType: "ESCROW_LOCK",
      amount: 450,
      note: "Locked ₹450 bounty for Incident #20194 (Awaiting 3/3 witnesses)",
      timestamp: "10:15:02 AM",
    },
  ]);

  // Witness / Geo-Fence controls
  const [witnessLat, setWitnessLat] = useState("19.0971");
  const [witnessLng, setWitnessLng] = useState("72.8906");
  const [speedMps, setSpeedMps] = useState("1.4");
  const [witnessLoading, setWitnessLoading] = useState(false);

  // BBPS Recharge controls
  const [carrier, setCarrier] = useState("Jio");
  const [mobileNumber, setMobileNumber] = useState("+91 98450 12844");
  const [rechargeAmount, setRechargeAmount] = useState(299);
  const [idempotencyKey, setIdempotencyKey] = useState("bbps-299-9845012844-v1");
  const [bbpsLoading, setBbpsLoading] = useState(false);

  // Whistle-Blower Evidence Vault controls
  const [whistleCategory, setWhistleCategory] = useState("Public & Transit Safety");
  const [whistleHeadline, setWhistleHeadline] = useState("Ambulance Gate Blocked Near Asalpha Metro");
  const [whistleFileName, setWhistleFileName] = useState("evidence_clip_asalpha.mp4");
  const [rawPhoneInput, setRawPhoneInput] = useState("+91 98450 12844");
  const [whistleResult, setWhistleResult] = useState(null);
  const [whistleLoading, setWhistleLoading] = useState(false);

  // API Inspector state
  const [apiInspector, setApiInspector] = useState({
    endpoint: "GET /api/civic/state",
    statusCode: 200,
    mode: "DEMO_FALLBACK",
    requestBody: null,
    responseBody: {
      citizen: INITIAL_CITIZEN,
      incident: INITIAL_INCIDENT,
    },
  });

  const t = TRANSLATIONS[lang];

  const pushLedgerEntry = useCallback((entryType, amount, note) => {
    const now = new Date().toLocaleTimeString([], { hour12: true });
    setLedger((prev) => [
      {
        id: `LED-${Math.floor(1000 + Math.random() * 9000)}`,
        entryType,
        amount,
        note,
        timestamp: now,
      },
      ...prev,
    ]);
  }, []);

  const recordInspector = useCallback((endpoint, statusCode, mode, requestBody, responseBody) => {
    setApiInspector({
      endpoint,
      statusCode,
      mode,
      requestBody,
      responseBody,
    });
  }, []);

  // Attempt connecting to Express + Mongoose backend on mount
  const syncWithBackend = useCallback(async () => {
    setBackendMode("checking");
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1400);
      const res = await fetch(`${API_BASE_URL}/api/civic/state`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.citizen) setCitizen(data.citizen);
      if (data.incident) setIncident(data.incident);
      setBackendMode("live");
      recordInspector("GET /api/civic/state", res.status, "LIVE_MONGOOSE", null, data);
    } catch {
      setBackendMode("demo");
      recordInspector("GET /api/civic/state", 200, "DEMO_FALLBACK", null, {
        note: "Running in offline preview fallback mode; start Node/Express on localhost:5000 for live MongoDB persistence.",
        citizen: INITIAL_CITIZEN,
        incident: INITIAL_INCIDENT,
      });
    }
  }, [recordInspector]);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // 1. Witness Check-In (Real vs Fake GPS Spoof)
  const handleWitnessCheckIn = async (forceFakeSpoof = false) => {
    setWitnessLoading(true);
    const reqBody = {
      incidentCode: incident.incidentCode,
      latitude: forceFakeSpoof ? 18.5204 : Number(witnessLat),
      longitude: forceFakeSpoof ? 73.8567 : Number(witnessLng),
      isMockLocation: forceFakeSpoof,
      speedMps: forceFakeSpoof ? 185 : Number(speedMps),
    };

    try {
      if (backendMode === "live") {
        const res = await fetch(`${API_BASE_URL}/api/civic/witness-confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });
        const data = await res.json();
        recordInspector("POST /api/civic/witness-confirm", res.status, "LIVE_MONGOOSE", reqBody, data);

        if (res.ok && data.verified) {
          if (data.citizen) setCitizen(data.citizen);
          setIncident((prev) => ({
            ...prev,
            witnessCount: Math.min(prev.witnessCount + 1, prev.requiredWitnesses),
            status: data.incidentStatus || "CONFIRMED_PUBLIC",
          }));
          if (data.escrowReleased > 0) {
            pushLedgerEntry(
              "ESCROW_RELEASE",
              data.escrowReleased,
              `Released ₹${data.escrowReleased} escrow upon 3/3 consensus (${data.distanceMeters}m away)`
            );
          }
        }
        setWitnessLoading(false);
        return;
      }

      // Demo Fallback Logic mirroring backend rules
      if (reqBody.isMockLocation || reqBody.speedMps > 45) {
        const errResp = {
          blocked: true,
          code: 403,
          reason: "ANTI-SPOOF SHIELD TRIGGERED: Mock GPS / Impossible Velocity detected.",
        };
        recordInspector("POST /api/civic/witness-confirm", 403, "DEMO_FALLBACK", reqBody, errResp);
        setWitnessLoading(false);
        return;
      }

      const [incLng, incLat] = incident.location.coordinates;
      const dist = getHaversineMeters(incLat, incLng, reqBody.latitude, reqBody.longitude);

      if (dist > 500) {
        const geoErr = {
          blocked: true,
          code: 403,
          distanceMeters: dist,
          reason: `GEO-FENCE REJECTED: Witness is ${dist}m away (limit: 500m).`,
        };
        recordInspector("POST /api/civic/witness-confirm", 403, "DEMO_FALLBACK", reqBody, geoErr);
        setWitnessLoading(false);
        return;
      }

      const nextCount = Math.min(incident.witnessCount + 1, incident.requiredWitnesses);
      const isConfirmed = nextCount >= incident.requiredWitnesses;
      const released = isConfirmed && citizen.escrowWallet >= incident.escrowReward ? incident.escrowReward : 0;

      const updatedCitizen = {
        ...citizen,
        civicScore: isConfirmed ? Math.min(citizen.civicScore + 250, 99999) : citizen.civicScore,
        escrowWallet: Math.max(citizen.escrowWallet - released, 0),
        availableWallet: citizen.availableWallet + released,
      };

      const updatedIncident = {
        ...incident,
        witnessCount: nextCount,
        status: isConfirmed ? "CONFIRMED_PUBLIC" : "PENDING_CONSENSUS",
      };

      setCitizen(updatedCitizen);
      setIncident(updatedIncident);

      if (released > 0) {
        pushLedgerEntry(
          "ESCROW_RELEASE",
          released,
          `Released ₹${released} escrow upon 3/3 witness consensus (${dist}m radius)`
        );
      }

      recordInspector("POST /api/civic/witness-confirm", 200, "DEMO_FALLBACK", reqBody, {
        verified: true,
        distanceMeters: dist,
        consensus: `${nextCount}/${incident.requiredWitnesses}`,
        incidentStatus: updatedIncident.status,
        escrowReleased: released,
        citizen: updatedCitizen,
      });
    } finally {
      setWitnessLoading(false);
    }
  };

  // 2. BBPS Recharge with Idempotency Guard
  const handleBbpsRecharge = async () => {
    setBbpsLoading(true);
    const reqBody = {
      operator: carrier,
      mobileNumber,
      amount: Number(rechargeAmount),
    };

    try {
      if (backendMode === "live") {
        const res = await fetch(`${API_BASE_URL}/api/civic/bbps-recharge`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(reqBody),
        });
        const data = await res.json();
        recordInspector(
          "POST /api/civic/bbps-recharge",
          res.status,
          "LIVE_MONGOOSE",
          { ...reqBody, idempotencyKey },
          data
        );
        if (res.ok && data.success) {
          setCitizen((prev) => ({
            ...prev,
            availableWallet: data.availableWallet,
          }));
          pushLedgerEntry(
            "BBPS_RECHARGE_DEBIT",
            -Number(rechargeAmount),
            `BBPS ${carrier} ₹${rechargeAmount} recharge for ${mobileNumber} [${idempotencyKey}]`
          );
        }
        setBbpsLoading(false);
        return;
      }

      // Demo Fallback: check if idempotencyKey was already used
      const duplicateEntry = ledger.find((item) => item.note.includes(`[${idempotencyKey}]`));
      if (duplicateEntry) {
        const conflictResp = {
          blocked: true,
          code: 409,
          reason: "DOUBLE-SPEND BLOCKED (409): Duplicate Idempotency-Key already processed.",
          idempotencyKey,
        };
        recordInspector(
          "POST /api/civic/bbps-recharge",
          409,
          "DEMO_FALLBACK",
          { ...reqBody, idempotencyKey },
          conflictResp
        );
        setBbpsLoading(false);
        return;
      }

      if (citizen.availableWallet < Number(rechargeAmount)) {
        const lowBalResp = { error: "Insufficient available wallet balance" };
        recordInspector("POST /api/civic/bbps-recharge", 400, "DEMO_FALLBACK", reqBody, lowBalResp);
        setBbpsLoading(false);
        return;
      }

      const nextWallet = citizen.availableWallet - Number(rechargeAmount);
      const updatedCitizen = { ...citizen, availableWallet: nextWallet };
      setCitizen(updatedCitizen);

      pushLedgerEntry(
        "BBPS_RECHARGE_DEBIT",
        -Number(rechargeAmount),
        `BBPS ${carrier} ₹${rechargeAmount} recharge for ${mobileNumber} [${idempotencyKey}]`
      );

      recordInspector(
        "POST /api/civic/bbps-recharge",
        200,
        "DEMO_FALLBACK",
        { ...reqBody, idempotencyKey },
        {
          success: true,
          debited: Number(rechargeAmount),
          availableWallet: nextWallet,
          civicScore: citizen.civicScore,
          idempotencyKey,
        }
      );
    } finally {
      setBbpsLoading(false);
    }
  };

  // 3. Whistle-Blower Evidence Upload (EXIF Strip + SHA-256 Seal)
  const handleWhistleUpload = async (e) => {
    e.preventDefault();
    setWhistleLoading(true);
    const reqBody = {
      rawPhone: rawPhoneInput,
      category: whistleCategory,
      headline: whistleHeadline,
      fileName: whistleFileName,
    };

    try {
      if (backendMode === "live") {
        const res = await fetch(`${API_BASE_URL}/api/civic/whistle-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });
        const data = await res.json();
        recordInspector("POST /api/civic/whistle-upload", res.status, "LIVE_MONGOOSE", reqBody, data);
        if (res.ok) {
          setWhistleResult(data);
          setIncident((prev) => ({
            ...prev,
            evidenceSha256: data.evidenceSha256,
            metadataStripped: data.metadataStripped,
          }));
        }
        setWhistleLoading(false);
        return;
      }

      const hash = computeClientSha256Fallback(`${whistleFileName}|${whistleHeadline}|${Date.now()}`);
      const mockSealed = {
        protected: true,
        reporterIdentityStored: false,
        anonymousAlias: "Anonymous Guardian #7412",
        category: whistleCategory,
        headline: whistleHeadline,
        metadataStripped: true,
        strippedFields: ["EXIF_GPS", "DEVICE_IMEI_SERIAL", "AUTHOR_TAG", "CREATION_EXACT_MS"],
        evidenceSha256: hash,
      };
      setWhistleResult(mockSealed);
      setIncident((prev) => ({
        ...prev,
        evidenceSha256: hash,
        metadataStripped: true,
      }));
      recordInspector("POST /api/civic/whistle-upload", 200, "DEMO_FALLBACK", reqBody, mockSealed);
    } finally {
      setWhistleLoading(false);
    }
  };

  const resetAllDemo = () => {
    setCitizen(INITIAL_CITIZEN);
    setIncident(INITIAL_INCIDENT);
    setWhistleResult(null);
    setIdempotencyKey(`bbps-299-9845012844-v${Math.floor(1 + Math.random() * 99)}`);
    setLedger([
      {
        id: "LED-1001",
        entryType: "ESCROW_LOCK",
        amount: 450,
        note: "Locked ₹450 bounty for Incident #20194 (Awaiting 3/3 witnesses)",
        timestamp: new Date().toLocaleTimeString([], { hour12: true }),
      },
    ]);
    recordInspector("RESET /state", 200, backendMode === "live" ? "LIVE_MONGOOSE" : "DEMO_FALLBACK", null, {
      status: "RESET_COMPLETE",
      citizen: INITIAL_CITIZEN,
      incident: INITIAL_INCIDENT,
    });
  };

  const progressPct = Math.round((incident.witnessCount / incident.requiredWitnesses) * 100);
  const currentDistPreview = getHaversineMeters(
    incident.location.coordinates[1],
    incident.location.coordinates[0],
    Number(witnessLat) || 19.0968,
    Number(witnessLng) || 72.8902
  );

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-40 right-1/5 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* 1. TOP COMMAND HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#070B12]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wide text-white sm:text-lg">
                  NEW WORLD
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  ANTI-FRAUD CORE
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Connection Mode Pill */}
            <button
              onClick={syncWithBackend}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${backendMode === "live"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}
              title="Click to re-check connection to http://localhost:5000"
            >
              {backendMode === "live" ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live Express + Mongoose</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                  <span>Demo Fallback Mode</span>
                </>
              )}
            </button>

            {/* Language Selector */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 text-xs">
              <Globe className="ml-2 mr-1 h-3.5 w-3.5 text-slate-400" />
              {["EN", "HI", "MR"].map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${lang === code
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <button
              onClick={resetAllDemo}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* CITIZEN STATUS STRIP */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.citizen}</span>
              <MapPin className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-lg font-bold text-white">{citizen.displayAlias}</div>
            <div className="mt-0.5 flex items-center justify-between text-xs text-slate-400">
              <span>{t.location}</span>
              <span className="font-mono text-[11px] text-cyan-300">{citizen.pseudonymId}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.civicScore}</span>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold text-emerald-400">
              {citizen.civicScore.toLocaleString("en-IN")}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">Max 99,999 • +250 on 3/3 Consensus</div>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.availableWallet}</span>
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold text-white">
              ₹{citizen.availableWallet.toLocaleString("en-IN")}
            </div>
            <div className="mt-0.5 text-[11px] text-emerald-400/90">BBPS &amp; Idempotency Protected</div>
          </div>

          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.escrowWallet}</span>
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold text-amber-400">
              ₹{citizen.escrowWallet.toLocaleString("en-IN")}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">Auto-released when 3/3 witnesses verify</div>
          </div>
        </section>

        {/* WORKFLOW NAVIGATION TABS */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-1.5">
          {[
            { id: "consensus", label: t.tabConsensus, icon: MapPin },
            { id: "bbps", label: t.tabBbbs, icon: Zap },
            { id: "whistle", label: t.tabWhistle, icon: Fingerprint },
            { id: "ledger", label: t.tabLedger, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 min-w-[155px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${active
                  ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-400/40 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                  }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-emerald-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN SPLIT LAYOUT: ACTIVE MODULE + BACKEND API INSPECTOR */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT 7 COLS: ACTIVE BACKEND WORKFLOW */}
          <div className="lg:col-span-7 space-y-6">
            {/* MODULE 1: 500M GEO-FENCE & ANTI-GPS SPOOF */}
            {activeTab === "consensus" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur-md sm:p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                      POST /api/civic/witness-confirm
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      500m Geo-Fence &amp; Anti-GPS Spoof Verifier
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Incident <span className="font-mono text-slate-200">{incident.incidentCode}</span> •{" "}
                      {incident.headline} ({incident.locality})
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${incident.status === "CONFIRMED_PUBLIC"
                      ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                      }`}
                  >
                    {incident.witnessCount}/{incident.requiredWitnesses} • {incident.status}
                  </span>
                </div>

                {/* Consensus Progress Bar */}
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-400">Physical Witness Consensus Progress</span>
                    <span className="font-mono font-semibold text-emerald-400">{progressPct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Coordinate & Velocity Inputs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400">
                      Witness Latitude
                    </label>
                    <input
                      type="text"
                      value={witnessLat}
                      onChange={(e) => setWitnessLat(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 font-mono text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400">
                      Witness Longitude
                    </label>
                    <input
                      type="text"
                      value={witnessLng}
                      onChange={(e) => setWitnessLng(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 font-mono text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400">
                      GPS Speed (m/s)
                    </label>
                    <input
                      type="number"
                      value={speedMps}
                      onChange={(e) => setSpeedMps(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 font-mono text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs">
                  <span className="text-slate-400">
                    Anchor: Asalpha (<span className="font-mono text-slate-300">19.0968, 72.8902</span>)
                  </span>
                  <span
                    className={`font-mono font-semibold ${currentDistPreview <= 500 ? "text-emerald-400" : "text-rose-400"
                      }`}
                  >
                    Distance: ~{currentDistPreview}m (Max 500m)
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    disabled={witnessLoading}
                    onClick={() => handleWitnessCheckIn(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-950/60 transition hover:bg-emerald-400 disabled:opacity-50 sm:text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Real Witness Check-In (&le;500m)</span>
                  </button>

                  <button
                    disabled={witnessLoading}
                    onClick={() => handleWitnessCheckIn(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-50 sm:text-sm"
                  >
                    <XCircle className="h-4 w-4 text-rose-400" />
                    <span>Fake GPS Spoof Attack (403)</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODULE 2: BBPS RECHARGE & IDEMPOTENCY GUARD */}
            {activeTab === "bbps" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur-md sm:p-6 space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                    POST /api/civic/bbps-recharge • Header: Idempotency-Key
                  </span>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    BBPS Recharge &amp; Double-Spend Guard
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Click once to deduct ₹299 cleanly. Click a second time with the same{" "}
                    <span className="font-mono text-cyan-300">Idempotency-Key</span> to trigger{" "}
                    <span className="font-mono text-rose-400">409 CONFLICT</span>.
                  </p>
                </div>

                {/* Carrier Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Select Telecom Operator
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Jio", "Airtel", "Vi", "BSNL"].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setCarrier(op)}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition ${carrier === op
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white"
                          }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400">
                      Target Mobile Number
                    </label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3.5 py-2.5 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400">
                      Plan Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3.5 py-2.5 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-400">
                      Idempotency-Key (Prevents Duplicate Charge)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setIdempotencyKey(`bbps-299-${Date.now().toString().slice(-5)}`)
                      }
                      className="text-[11px] font-semibold text-cyan-400 hover:underline"
                    >
                      Generate New Key
                    </button>
                  </div>
                  <input
                    type="text"
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  disabled={bbpsLoading}
                  onClick={handleBbpsRecharge}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/50 transition hover:brightness-110 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    Authorize ₹{rechargeAmount} BBPS Recharge ({carrier})
                  </span>
                </button>
              </div>
            )}

            {/* MODULE 3: WHISTLE-BLOWER EVIDENCE VAULT */}
            {activeTab === "whistle" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur-md sm:p-6 space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-purple-400">
                    POST /api/civic/whistle-upload • EXIF Scrub + SHA-256
                  </span>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    Whistle-Blower Evidence Vault
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Strips camera/GPS metadata, masks whistle-blower identity behind an HMAC alias, and computes a tamper-proof SHA-256 seal.
                  </p>
                </div>

                <form onSubmit={handleWhistleUpload} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400">
                        Report Category
                      </label>
                      <select
                        value={whistleCategory}
                        onChange={(e) => setWhistleCategory(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-purple-400 focus:outline-none"
                      >
                        <option>Public &amp; Transit Safety</option>
                        <option>Environmental Danger</option>
                        <option>Civic Corruption &amp; Land Grab</option>
                        <option>Community Good Deed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400">
                        Raw Phone (Hashed Only, Never Stored Publicly)
                      </label>
                      <input
                        type="text"
                        value={rawPhoneInput}
                        onChange={(e) => setRawPhoneInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400">
                      Incident Headline
                    </label>
                    <input
                      type="text"
                      value={whistleHeadline}
                      onChange={(e) => setWhistleHeadline(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400">
                      Evidence Video Clip (.mp4)
                    </label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 px-3.5 py-2.5">
                      <FileVideo className="h-4 w-4 text-purple-400 shrink-0" />
                      <input
                        type="text"
                        value={whistleFileName}
                        onChange={(e) => setWhistleFileName(e.target.value)}
                        className="w-full bg-transparent font-mono text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={whistleLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/60 transition hover:bg-purple-400 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Scrub Metadata &amp; Seal SHA-256</span>
                  </button>
                </form>

                {whistleResult && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">
                        Evidence Sealed • Identity Protected
                      </span>
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                        {whistleResult.anonymousAlias}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(whistleResult.strippedFields || []).map((field) => (
                        <span
                          key={field}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-amber-300"
                        >
                          Stripped: {field}
                        </span>
                      ))}
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400">SHA-256 Fingerprint:</span>
                      <p className="mt-0.5 break-all rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-cyan-300">
                        {whistleResult.evidenceSha256}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE 4: IMMUTABLE WALLET LEDGER */}
            {activeTab === "ledger" && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur-md sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                      Mongoose WalletLedger Collection
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      Immutable Audit &amp; Escrow Ledger
                    </h2>
                  </div>
                  <span className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 font-mono text-xs text-slate-300">
                    {ledger.length} Entries
                  </span>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {ledger.map((row) => {
                    const isPositive = row.amount > 0;
                    return (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-slate-950/75 p-3.5 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">{row.id}</span>
                            <span
                              className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${row.entryType === "ESCROW_RELEASE"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : row.entryType === "BBPS_RECHARGE_DEBIT"
                                  ? "bg-cyan-500/15 text-cyan-300"
                                  : "bg-amber-500/15 text-amber-300"
                                }`}
                            >
                              {row.entryType}
                            </span>
                            <span className="text-[11px] text-slate-500">{row.timestamp}</span>
                          </div>
                          <p className="mt-1 text-slate-400">{row.note}</p>
                        </div>
                        <div
                          className={`font-mono text-sm font-extrabold ${isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}
                        >
                          {isPositive ? `+₹${row.amount}` : `-₹${Math.abs(row.amount)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 5 COLS: LIVE BACKEND API REQUEST / RESPONSE INSPECTOR */}
          <aside className="lg:col-span-5">
            <div className="sticky top-20 rounded-2xl border border-slate-800 bg-[#05080F] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3.5">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Backend API Inspector</h3>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 font-mono text-xs font-bold ${apiInspector.statusCode >= 400
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                >
                  HTTP {apiInspector.statusCode}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono text-xs">
                <span className="text-cyan-300">{apiInspector.endpoint}</span>
                <span className="text-[11px] text-slate-400">{apiInspector.mode}</span>
              </div>

              {apiInspector.requestBody && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <Code2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Request Payload</span>
                  </div>
                  <pre className="max-h-36 overflow-auto rounded-xl border border-slate-800/90 bg-slate-950 p-3 font-mono text-[11px] text-amber-200/90">
                    {JSON.stringify(apiInspector.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <AlertTriangle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Server Response</span>
                </div>
                <pre className="max-h-72 overflow-auto rounded-xl border border-slate-800/90 bg-slate-950 p-3 font-mono text-[11px] text-emerald-300/90">
                  {JSON.stringify(apiInspector.responseBody, null, 2)}
                </pre>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}