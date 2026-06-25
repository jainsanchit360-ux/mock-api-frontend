import React, { useState, useEffect } from 'react';
import {
  Zap, Sparkles, Copy, Check, ExternalLink,
  History, Trash2, Loader2, Wifi, WifiOff,
  AlignLeft, Clock, Globe, Lock, Database,
  FileJson, Bot, AlertCircle, Info, Crown,
  ChevronRight,
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';

// ─── Quick-Start Templates ─────────────────────────────────────────────────
const TEMPLATES = [
  {
    key: 'ecommerce', label: '🛍️ E-commerce',
    data: {
      products: [
        { id: 1, name: 'Wireless Noise-Cancelling Headphones', price: 129.99, category: 'Electronics', rating: 4.8, in_stock: true, sku: 'WH-NC-BLK' },
        { id: 2, name: 'Ergonomic Standing Desk', price: 549.00, category: 'Furniture', rating: 4.6, in_stock: false, sku: 'DS-ERG-WHT' },
        { id: 3, name: 'Cold Brew Coffee Kit Pro', price: 39.99, category: 'Kitchen', rating: 4.9, in_stock: true, sku: 'CB-KIT-PRO' },
      ],
      meta: { total: 3, currency: 'USD', page: 1 },
    },
  },
  {
    key: 'users', label: '👤 User Profiles',
    data: {
      users: [
        { id: 'usr_001', name: 'Alex Rivera', email: 'alex@company.io', role: 'admin', plan: 'enterprise', verified: true, joined: '2024-01-15' },
        { id: 'usr_002', name: 'Jordan Kim', email: 'jordan@devlab.co', role: 'developer', plan: 'pro', verified: true, joined: '2024-03-22' },
        { id: 'usr_003', name: 'Sam Patel', email: 'sam@startup.app', role: 'viewer', plan: 'free', verified: false, joined: '2024-06-01' },
      ],
    },
  },
  {
    key: 'todos', label: '📝 Todo List',
    data: {
      tasks: [
        { id: 101, title: 'Integrate Gemini AI endpoint', done: true, priority: 'high', assignee: 'alex', due: '2024-12-20', tags: ['ai', 'backend'] },
        { id: 102, title: 'Redesign dashboard UI', done: false, priority: 'high', assignee: 'jordan', due: '2024-12-22', tags: ['design', 'frontend'] },
        { id: 103, title: 'Write API documentation', done: false, priority: 'medium', assignee: 'sam', due: '2024-12-25', tags: ['docs'] },
      ],
    },
  },
  {
    key: 'crypto', label: '₿ Crypto Prices',
    data: [
      { symbol: 'BTC', name: 'Bitcoin',  price_usd: 67234.50, change_24h:  2.34, market_cap: '1.32T', rank: 1 },
      { symbol: 'ETH', name: 'Ethereum', price_usd: 3521.80,  change_24h: -1.12, market_cap: '422B',  rank: 2 },
      { symbol: 'SOL', name: 'Solana',   price_usd: 198.40,   change_24h:  5.67, market_cap: '87B',   rank: 5 },
    ],
  },
  {
    key: 'weather', label: '🌤️ Weather',
    data: {
      location: { city: 'San Francisco', country: 'US', lat: 37.77, lon: -122.42 },
      current: { temp_f: 68, feels_like_f: 65, humidity_pct: 72, wind_mph: 12, condition: 'Partly Cloudy' },
      forecast: [
        { day: 'Mon', high_f: 71, low_f: 58, condition: 'Sunny',   precip_chance: 5  },
        { day: 'Tue', high_f: 66, low_f: 55, condition: 'Cloudy',  precip_chance: 30 },
        { day: 'Wed', high_f: 63, low_f: 52, condition: 'Rainy',   precip_chance: 85 },
      ],
    },
  },
];

const DEFAULT_JSON = JSON.stringify(TEMPLATES[0].data, null, 2);

// ─── App Component ─────────────────────────────────────────────────────────
export default function App() {

  // ── JSON editor state ──────────────────────────────────────────
  const [jsonCode, setJsonCode]       = useState(DEFAULT_JSON);
  const [isValid, setIsValid]         = useState(true);
  const [validationErr, setValidErr]  = useState('');
  const [activeTemplate, setTemplate] = useState('ecommerce');

  // ── AI prompt state ────────────────────────────────────────────
  const [aiPrompt, setAiPrompt]          = useState('');
  const [isAiGenerating, setAiLoading]   = useState(false);
  const [aiError, setAiError]            = useState('');

  // ── Endpoint deploy state ──────────────────────────────────────
  const [isDeploying, setDeploying]   = useState(false);
  const [generatedUrl, setGenUrl]     = useState('');
  const [isCopied, setCopied]         = useState(false);

  // ── Backend / AI health ────────────────────────────────────────
  const [apiStatus, setApiStatus]     = useState('checking');   // checking|online|offline
  const [aiStatus, setAiStatus]       = useState('checking');   // checking|online|offline

  // ── History ────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);

  // ─── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    checkHealth();
    try {
      const stored = localStorage.getItem('qm_history_v3');
      if (stored) setHistory(JSON.parse(stored));
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!jsonCode.trim()) {
      setIsValid(false); setValidErr('JSON cannot be empty'); return;
    }
    try {
      JSON.parse(jsonCode);
      setIsValid(true); setValidErr('');
    } catch (err) {
      setIsValid(false); setValidErr(err.message);
    }
  }, [jsonCode]);

  // ─── Handlers ─────────────────────────────────────────────────
  const checkHealth = async () => {
    setApiStatus('checking');
    try {
      const res  = await fetch('/api/health');
      const data = await res.json();
      setApiStatus(data.database === 'connected' ? 'online' : 'error');
      setAiStatus(data.ai === 'available' ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
      setAiStatus('offline');
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || isAiGenerating) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res  = await fetch('/api/generate-ai-json', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'AI generation failed.');
      setJsonCode(data.json);
      setTemplate(null);
      setAiPrompt('');
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormat = () => {
    try { setJsonCode(JSON.stringify(JSON.parse(jsonCode), null, 2)); } catch (_) {}
  };

  const handleTemplate = (tpl) => {
    setJsonCode(JSON.stringify(tpl.data, null, 2));
    setTemplate(tpl.key);
    setAiPrompt('');
    setAiError('');
  };

  const handleDeploy = async () => {
    if (!isValid || isDeploying || apiStatus !== 'online') return;
    setDeploying(true);
    setGenUrl('');
    try {
      const res  = await fetch('/api/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(JSON.parse(jsonCode)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`);
      if (data.success && data.id) {
        const url = `${window.location.origin}/api/mock/${data.id}`;
        setGenUrl(url);
        copyText(url);
        saveHistory({ id: data.id, url, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), preview: jsonCode.substring(0, 60).replace(/\s+/g, ' ').trim() + '…' });
      } else {
        throw new Error('Unexpected response from server.');
      }
    } catch (err) {
      alert(`Deploy failed: ${err.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const saveHistory = (item) => {
    setHistory((prev) => {
      const next = [item, ...prev.filter(h => h.id !== item.id)].slice(0, 12);
      localStorage.setItem('qm_history_v3', JSON.stringify(next));
      return next;
    });
  };

  const deleteHistory = (e, id) => {
    e.stopPropagation();
    setHistory((prev) => {
      const next = prev.filter(h => h.id !== id);
      localStorage.setItem('qm_history_v3', JSON.stringify(next));
      return next;
    });
    if (generatedUrl.includes(id)) setGenUrl('');
  };

  const loadHistory = async (item) => {
    try {
      const res = await fetch(item.url);
      if (res.ok) { setJsonCode(JSON.stringify(await res.json(), null, 2)); setGenUrl(item.url); }
    } catch (e) { alert('Failed to load: ' + e.message); }
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-indigo-600/6 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[130px]" />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.35)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                QuickMock <span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-0.5 leading-none">
                Premium API Generator
              </p>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex items-center space-x-2">
            <button
              onClick={checkHealth}
              title="Click to re-check connection"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-wide transition-all ${
                apiStatus === 'online'  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400' :
                apiStatus === 'offline' ? 'bg-rose-950/50 border-rose-500/30 text-rose-400' :
                                          'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              {apiStatus === 'online'  ? <Wifi className="w-3 h-3" />     :
               apiStatus === 'offline' ? <WifiOff className="w-3 h-3" /> :
                                         <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{apiStatus === 'online' ? 'API Live' : apiStatus === 'offline' ? 'API Down' : '…'}</span>
            </button>

            <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-wide ${
              aiStatus === 'online'  ? 'bg-violet-950/50 border-violet-500/30 text-violet-400' :
              aiStatus === 'offline' ? 'bg-amber-950/50 border-amber-500/30 text-amber-400' :
                                       'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}>
              <Bot className="w-3 h-3" />
              <span>{aiStatus === 'online' ? 'Gemini Ready' : aiStatus === 'offline' ? 'AI Offline' : '…'}</span>
            </div>

            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              v2.0 · Pro
            </span>
          </div>

        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 md:px-6 py-7 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ━━━━━━━━━━━━━━━━━━━ LEFT PANEL ━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="lg:col-span-7 flex flex-col space-y-4">

          {/* ── AI Prompt Card ── */}
          <div className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
            isAiGenerating
              ? 'border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.12)]'
              : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700'
          }`}>
            {/* Animated shimmer bar while generating */}
            {isAiGenerating && (
              <div className="absolute top-0 left-0 right-0 h-0.5 shimmer-bar" />
            )}

            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 rounded-lg bg-violet-950/60 border border-violet-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-200">AI JSON Generator</span>
                {aiStatus !== 'online' && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Add GEMINI_API_KEY to .env
                  </span>
                )}
              </div>

              {/* Input row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => { setAiPrompt(e.target.value); setAiError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                  placeholder="✨ Describe your data — e.g. '10 organic food products with ratings and prices'…"
                  disabled={isAiGenerating || aiStatus !== 'online'}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 font-mono focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleAIGenerate}
                  disabled={!aiPrompt.trim() || isAiGenerating || aiStatus !== 'online'}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-[0.98]"
                >
                  {isAiGenerating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Sparkles className="w-4 h-4" />
                  }
                  <span className="hidden sm:inline">
                    {isAiGenerating ? 'Generating…' : 'Generate'}
                  </span>
                </button>
              </div>

              {/* AI status feedback */}
              {isAiGenerating && (
                <p className="mt-2.5 text-[11px] font-mono text-violet-400/70 animate-pulse">
                  ✦ Gemini is crafting your JSON payload…
                </p>
              )}
              {aiError && (
                <div className="mt-2.5 flex items-start space-x-2 px-3 py-2 bg-rose-950/30 border border-rose-500/20 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-mono text-rose-300 leading-relaxed">{aiError}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Template chips + Format button ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:inline">Templates:</span>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  onClick={() => handleTemplate(tpl)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                    activeTemplate === tpl.key
                      ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.12)]'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleFormat}
              disabled={!isValid}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-all shrink-0"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Beautify</span>
            </button>
          </div>

          {/* ── Code Editor ── */}
          <div className="flex-1 min-h-[380px] flex flex-col">
            <CodeEditor
              value={jsonCode}
              onChange={(val) => { setJsonCode(val); setTemplate(null); }}
              isValid={isValid}
              error={validationErr}
            />
          </div>

          {/* ── Deploy Row ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1">
            <p className="flex items-center space-x-1.5 text-[11px] text-zinc-600 font-mono">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Valid JSON is saved to Supabase as a live GET endpoint</span>
            </p>

            <button
              onClick={handleDeploy}
              disabled={!isValid || isDeploying || apiStatus !== 'online'}
              className={`relative flex items-center justify-center space-x-2.5 px-7 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 shrink-0 overflow-hidden ${
                !isValid || apiStatus !== 'online'
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_18px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]'
              }`}
            >
              {isDeploying
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Deploying…</span></>
                : <><Zap className={`w-4 h-4 ${isValid && apiStatus === 'online' ? 'fill-current' : ''}`} /><span>Deploy Live Endpoint</span></>
              }
            </button>
          </div>

        </section>

        {/* ━━━━━━━━━━━━━━━━━━━ RIGHT PANEL ━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="lg:col-span-5 flex flex-col space-y-5">

          {/* ── Live Output Card ── */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="flex items-center space-x-2 px-5 py-3.5 border-b border-zinc-800/60">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-200">Live Endpoint</span>
            </div>

            {generatedUrl ? (
              <div className="p-5 space-y-4 animate-fade-slide-up">
                {/* Success badge */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">Live & Accessible</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-[9px] font-mono text-indigo-400 font-bold">GET</span>
                </div>

                {/* URL display */}
                <div className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-emerald-300 select-all break-all leading-relaxed shadow-inner">
                  {generatedUrl}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => copyText(generatedUrl)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm font-medium text-zinc-200 transition-all"
                  >
                    {isCopied
                      ? <><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                      : <><Copy className="w-4 h-4" /><span>Copy URL</span></>
                    }
                  </button>
                  <a
                    href={generatedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Test API</span>
                  </a>
                </div>

                {/* cURL snippet */}
                <div className="px-4 py-3 bg-zinc-950/80 border border-zinc-800/60 rounded-xl">
                  <p className="text-[10px] font-mono text-zinc-600 mb-1.5">Test in terminal:</p>
                  <code className="text-[10px] font-mono text-cyan-400 break-all leading-relaxed">
                    curl -X GET {generatedUrl}
                  </code>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-500">No endpoint deployed yet</p>
                  <p className="text-xs text-zinc-700 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Build your JSON and click "Deploy Live Endpoint"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Premium Options Card ── */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
              <span className="text-xs font-semibold text-zinc-200">Configuration</span>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-semibold">
                <Crown className="w-2.5 h-2.5" />
                <span>PRO FEATURES</span>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Link Expiry */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-400">Link Expiry</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 rounded-xl border border-indigo-500/40 bg-indigo-950/30 text-xs text-indigo-300 font-semibold text-center">
                    24 Hours
                    <span className="block text-[10px] font-normal text-indigo-500 mt-0.5">Free</span>
                  </button>
                  <div className="relative">
                    <button disabled className="w-full py-2 rounded-xl border border-zinc-800 bg-zinc-900/30 text-xs text-zinc-600 font-semibold text-center cursor-not-allowed">
                      <Lock className="w-3 h-3 inline mb-0.5 mr-1" />Permanent
                      <span className="block text-[10px] font-normal text-zinc-700 mt-0.5">Upgrade required</span>
                    </button>
                    <span className="absolute -top-2 -right-1 flex items-center space-x-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full text-[8px] text-black font-bold">
                      <Crown className="w-2 h-2" /><span>PRO</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* HTTP Methods */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5">
                  <FileJson className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-400">HTTP Methods</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { m: 'GET',    free: true  },
                    { m: 'POST',   free: false },
                    { m: 'PUT',    free: false },
                    { m: 'DELETE', free: false },
                  ].map(({ m, free }) => (
                    <div key={m} className="relative">
                      <button
                        disabled={!free}
                        className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          free
                            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
                            : 'border-zinc-800 bg-zinc-900/20 text-zinc-700 cursor-not-allowed'
                        }`}
                      >
                        {m}
                      </button>
                      {!free && (
                        <span className="absolute -top-2.5 -right-1 px-1 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full text-[7px] text-black font-bold">
                          PRO
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Private Endpoint toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                <div className="flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-600">Private Endpoint (Auth)</span>
                </div>
                <div className="relative flex items-center">
                  <div className="w-9 h-5 rounded-full bg-zinc-800 border border-zinc-700 cursor-not-allowed" />
                  <span className="absolute -top-2.5 -right-1 px-1 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full text-[7px] text-black font-bold">PRO</span>
                </div>
              </div>

              {/* Upgrade CTA */}
              <button className="w-full py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-wide transition-all flex items-center justify-center space-x-2">
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade to Pro — Unlock All Features</span>
              </button>
            </div>
          </div>

          {/* ── Session History ── */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden flex-1">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
              <div className="flex items-center space-x-2">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-zinc-200">Session History</span>
                {history.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-[10px] text-indigo-400 font-mono">
                    {history.length}
                  </span>
                )}
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => { if (confirm('Clear all history?')) { setHistory([]); localStorage.removeItem('qm_history_v3'); setGenUrl(''); } }}
                  className="text-[10px] font-mono text-zinc-600 hover:text-rose-400 uppercase tracking-wider transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[280px] p-3 space-y-1.5">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Database className="w-7 h-7 text-zinc-800 mb-2" />
                  <p className="text-xs text-zinc-600">No endpoints yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistory(item)}
                    className="group flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="text-[10px] font-mono text-indigo-400 font-semibold">/{item.id.substring(0, 8)}…</span>
                        <span className="text-[9px] font-mono text-zinc-700">{item.date}</span>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-600 truncate">{item.preview}</p>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyText(item.url); }}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-950/40 transition-all"
                        title="Copy URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => deleteHistory(e, item.id)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

      </main>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-zinc-800/60 bg-zinc-950/80 py-5 mt-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-zinc-700">
          <p>© 2026 QuickMock AI · Built for developers at speed 🚀</p>
          <div className="flex items-center space-x-4">
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Supabase</a>
            <span>·</span>
            <a href="https://fastapi.tiangolo.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">FastAPI</a>
            <span>·</span>
            <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="hover:text-violet-400 transition-colors">Gemini AI</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
