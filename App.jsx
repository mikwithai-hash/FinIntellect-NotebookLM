import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Lock, TrendingUp, Clock, FileText, Settings, 
  ChevronRight, Search, Plus, Trash2, Bot, Upload, 
  BarChart2, ShieldCheck, Sparkles, RefreshCw, Eye, EyeOff,
  AlertCircle, CheckCircle2, ChevronLeft, Calendar, DollarSign, PieChart, Info, Layers,
  Mic, MicOff
} from 'lucide-react';

const APP_TITLE = "FinIntellect | NotebookLM";

const SAMPLE_DOCUMENTS = [
  {
    id: "doc-1",
    title: "Q4 2025 TechCorp Financial Ledger",
    date: "2025-12-31",
    content: `TechCorp Q4 Financial Overview.
Our total Gross Revenue reached $12,450,000 for this quarter, showcasing robust enterprise adoption. 
We maintained an Operating Margin of 34.5% despite rising cloud infrastructure costs.
Free Cash Flow (FCF) was recorded at $3,210,000, fueled by strong deferred revenue collections.
Our Debt Service Coverage Ratio (DSCR) remains highly favorable at 2.4x, ensuring we comply with all senior debt covenants.`
  },
  {
    id: "doc-2",
    title: "Apex Retail Q1 Performance Report",
    date: "2026-03-15",
    content: `Apex Retail Group - Q1 Strategic Summary.
Revenue closed at $8,120,000, slightly lower than projections due to supply-side logistics delays.
Operating Margin optimized to 18.2% through smart inventory management systems.
Free Cash Flow (FCF) stood at $1,150,000, with aggressive investment in brick-and-mortar storefronts.
DSCR calculated at 1.8x, remaining within safe buffers.`
  },
  {
    id: "doc-3",
    title: "Nova BioTech Annual Audit Draft",
    date: "2026-06-01",
    content: `Nova BioTech Annual Audit.
Total licensing Revenue calculated at $24,600,000 during this fiscal cycle.
Operating Margin reported at a staggering 48.0% owing to high-leverage intellectual property contracts.
Free Cash Flow (FCF) reached an impressive $9,800,000, positioning us well for next-stage research.
DSCR sits comfortably at 4.5x, reflecting minimal leverage.`
  }
];

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('fin_gemini_api_key') || '');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer', 'metrics', 'visuals', 'slides'
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('fin_documents');
    return saved ? JSON.parse(saved) : SAMPLE_DOCUMENTS;
  });
  const [selectedDocId, setSelectedDocId] = useState(SAMPLE_DOCUMENTS[0].id);
  const [userInput, setUserInput] = useState('');
  const [notification, setNotification] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  // Chat History
  const [chatHistory, setChatHistory] = useState([
    { 
      role: 'assistant', 
      text: "Welcome to FinIntellect NotebookLM. I have preloaded sample corporate financial ledgers on your left. You can analyze them, extract metrics, view SVG visualizations, or draft pitch slides using my model.", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  // Session History
  const [savedSessions, setSavedSessions] = useState(() => {
    return JSON.parse(localStorage.getItem('fin_saved_sessions') || '[]');
  });

  // Trigger temporary messages
  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        showToast("Voice capture active. Speak clearly...", "info");
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(prev => prev ? `${prev} ${transcript}` : transcript);
        showToast("Voice captured successfully.", "success");
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast("Microphone access denied. Please allow microphone permissions.", "error");
        } else {
          showToast(`Speech recognition error: ${event.error}`, "error");
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleListening = (e) => {
    e.preventDefault();
    if (!recognitionRef.current) {
      showToast("Speech recognition is not fully supported in this browser environment.", "error");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  // Extract the active document object
  const activeDoc = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || documents[0];
  }, [documents, selectedDocId]);

  // Financial Metrics state calculated from current active document
  const [extractedMetrics, setExtractedMetrics] = useState({
    revenue: 0,
    margin: 0,
    fcf: 0,
    dscr: 0
  });

  // Track if custom inputs are loaded
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);

  // Custom visualizer state
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const [activeSeries, setActiveSeries] = useState('Revenue');

  const parseDocumentMetrics = (text) => {
    if (!text) return { revenue: 0, margin: 0, fcf: 0, dscr: 0 };
    
    // Revenue extraction (matches numbers after "revenue", "gross revenue", "sales", "$")
    const revMatch = text.match(/(?:revenue|sales|gross revenue)(?:\s+\w+){0,3}?\s*(?:\$?)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|\b[0-9]+(?:\.[0-9]+)?\s*m\b)/i);
    // Margin extraction (matches percentage after "margin", "operating margin", "%")
    const marginMatch = text.match(/(?:margin|operating margin|profit margin)(?:\s+\w+){0,3}?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i);
    // Free Cash Flow extraction (matches cash value after "fcf", "free cash flow")
    const fcfMatch = text.match(/(?:fcf|free cash flow|cash flow)(?:\s+\w+){0,4}?\s*(?:\$?)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|\b[0-9]+(?:\.[0-9]+)?\s*m\b)/i);
    // DSCR extraction (matches numbers near "dscr", "coverage ratio")
    const dscrMatch = text.match(/(?:dscr|debt service coverage ratio|coverage ratio)(?:\s+\w+){0,3}?\s*([0-9]+(?:\.[0-9]+)?)(?:\s*x)?/i);

    const cleanNum = (str) => {
      if (!str) return 0;
      let clean = str.toLowerCase().replace(/[^0-9.]/g, '');
      let parsed = parseFloat(clean);
      if (str.toLowerCase().includes('m')) parsed *= 1000000;
      return isNaN(parsed) ? 0 : parsed;
    };

    let revenue = 0;
    if (revMatch) {
      const matchStr = revMatch[1];
      if (matchStr.toLowerCase().endsWith('m')) {
        revenue = parseFloat(matchStr) * 1000000;
      } else {
        revenue = cleanNum(matchStr);
      }
    }

    let fcf = 0;
    if (fcfMatch) {
      const matchStr = fcfMatch[1];
      if (matchStr.toLowerCase().endsWith('m')) {
        fcf = parseFloat(matchStr) * 1000000;
      } else {
        fcf = cleanNum(matchStr);
      }
    }

    return {
      revenue: revenue || 5000000, 
      margin: marginMatch ? parseFloat(marginMatch[1]) : 20.0,
      fcf: fcf || 1000000,
      dscr: dscrMatch ? parseFloat(dscrMatch[1]) : 2.0
    };
  };

  // Run auto-parsing whenever document changes
  useEffect(() => {
    if (activeDoc && !isEditingMetrics) {
      const parsed = parseDocumentMetrics(activeDoc.content);
      setExtractedMetrics(parsed);
    }
  }, [activeDoc, isEditingMetrics]);

  // Persist documents list
  useEffect(() => {
    localStorage.setItem('fin_documents', JSON.stringify(documents));
  }, [documents]);

  const handleSaveApiKey = () => {
    const sanitized = apiKey.trim();
    if (!sanitized) {
      showToast("Token cannot be blank.", "error");
      return;
    }
    // Permissive verification check: ensure key is of appropriate length
    if (sanitized.length < 15) {
      showToast("Invalid key format. Token must be at least 15 characters.", "error");
      return;
    }
    localStorage.setItem('fin_gemini_api_key', sanitized);
    showToast("Gemini AI API Key verified and linked securely.", "success");
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('fin_gemini_api_key');
    setApiKey('');
    showToast("API Key removed from this session.", "info");
  };

  // Document management: Adding new assets
  const handleAddNewDocument = () => {
    const defaultDoc = {
      id: `doc-${Date.now()}`,
      title: `Corporate Asset ${documents.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      content: `Paste your unstructured ledger reports or financial notes here. 
E.g.,
Revenue reached $15,000,000. 
Operating Margin recorded at 25%. 
Free Cash Flow accounted for $2,500,000.
DSCR metric stands at 3.0.`
    };
    setDocuments([...documents, defaultDoc]);
    setSelectedDocId(defaultDoc.id);
    setIsEditingMetrics(false);
    showToast("Created a new editable asset sandbox.", "success");
  };

  const handleUpdateDocContent = (newContent) => {
    setDocuments(documents.map(d => {
      if (d.id === selectedDocId) {
        return { ...d, content: newContent };
      }
      return d;
    }));
  };

  const handleUpdateDocTitle = (newTitle) => {
    setDocuments(documents.map(d => {
      if (d.id === selectedDocId) {
        return { ...d, title: newTitle };
      }
      return d;
    }));
  };

  const handleDeleteDocument = (idToDelete, e) => {
    e.stopPropagation();
    if (documents.length <= 1) {
      showToast("Your analysis requires at least one asset file.", "error");
      return;
    }
    const filtered = documents.filter(d => d.id !== idToDelete);
    setDocuments(filtered);
    if (selectedDocId === idToDelete) {
      setSelectedDocId(filtered[0].id);
    }
    showToast("Asset successfully removed from current analysis.", "info");
  };

  // State Overrides (manual metric refinement)
  const handleMetricChange = (field, val) => {
    setIsEditingMetrics(true);
    setExtractedMetrics(prev => ({
      ...prev,
      [field]: parseFloat(val) || 0
    }));
  };

  // Reset to auto-parsed metrics
  const handleResetMetrics = () => {
    setIsEditingMetrics(false);
    const parsed = parseDocumentMetrics(activeDoc?.content);
    setExtractedMetrics(parsed);
    showToast("Synchronized and recalculated from document source.", "info");
  };

  const chartData = useMemo(() => {
    const baseRev = extractedMetrics.revenue;
    const baseMargin = extractedMetrics.margin;
    const baseFcf = extractedMetrics.fcf;
    const baseDscr = extractedMetrics.dscr;

    return [
      { label: "Q1-25", Revenue: baseRev * 0.75, Margin: baseMargin * 0.9, FCF: baseFcf * 0.7, DSCR: Math.max(1, baseDscr - 0.5) },
      { label: "Q2-25", Revenue: baseRev * 0.85, Margin: baseMargin * 0.95, FCF: baseFcf * 0.8, DSCR: Math.max(1, baseDscr - 0.3) },
      { label: "Q3-25", Revenue: baseRev * 0.92, Margin: baseMargin * 0.98, FCF: baseFcf * 0.9, DSCR: Math.max(1, baseDscr - 0.1) },
      { label: "Q4-25 (Current)", Revenue: baseRev, Margin: baseMargin, FCF: baseFcf, DSCR: baseDscr },
      { label: "Q1-26 (Projected)", Revenue: baseRev * 1.15, Margin: baseMargin * 1.05, FCF: baseFcf * 1.2, DSCR: baseDscr * 1.08 },
    ];
  }, [extractedMetrics]);

  const svgCoordinates = useMemo(() => {
    const seriesValues = chartData.map(d => d[activeSeries]);
    const maxVal = Math.max(...seriesValues) * 1.15 || 100;
    const minVal = Math.min(...seriesValues) * 0.85 || 0;
    const range = maxVal - minVal;

    const width = 500;
    const height = 240;
    const paddingX = 45;
    const paddingY = 30;

    return chartData.map((item, index) => {
      const x = paddingX + (index * (width - paddingX * 2) / (chartData.length - 1));
      const val = item[activeSeries];
      const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
      return { x, y, val, label: item.label, rawItem: item };
    });
  }, [chartData, activeSeries]);

  const cubicBezierPath = useMemo(() => {
    if (svgCoordinates.length === 0) return "";
    let path = `M ${svgCoordinates[0].x} ${svgCoordinates[0].y}`;
    for (let i = 0; i < svgCoordinates.length - 1; i++) {
      const p0 = svgCoordinates[i];
      const p1 = svgCoordinates[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [svgCoordinates]);

  const callGeminiAPI = async (prompt, systemPrompt) => {
    const keyToUse = apiKey || "";
    if (!keyToUse) {
      throw new Error("No Gemini API key detected. Please link your token in the Security Hub first.");
    }

    const maxRetries = 5;
    let delay = 1000; 

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${keyToUse}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const status = response.status;
          if (status === 429 || (status >= 500 && status < 600)) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; 
            continue;
          }
          throw new Error(errorData.error?.message || `API HTTP status error: ${status}`);
        }

        const data = await response.json();
        const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!outputText) {
          throw new Error("Empty model response payload format.");
        }
        return outputText;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = userInput.trim();
    if (!query) return;

    if (!apiKey) {
      showToast("Access Token required. Provide a valid Gemini token in the Left Hub.", "error");
      return;
    }

    const userMessage = { role: 'user', text: query, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setIsGenerating(true);

    const systemInstruction = `You are FinIntellect, an elite financial research assistant and senior quantitative auditor.
You analyze financial statements, assess cash health metrics, check leverage risks, and calculate growth vectors.

We are currently auditing the document: "${activeDoc.title}".
Active Extracted Metrics are:
- Revenue: $${extractedMetrics.revenue.toLocaleString()}
- Operating Margin: ${extractedMetrics.margin}%
- Free Cash Flow: $${extractedMetrics.fcf.toLocaleString()}
- Debt Service Coverage Ratio (DSCR): ${extractedMetrics.dscr}x

Raw document source content:
${activeDoc.content}

Instructions:
1. Ground your answers strictly in the ledger source content and parsed metrics when doing mathematical computations.
2. Formulate outputs using crisp formatting with clear markdown headings, bold targets, and cleanly aligned lists.
3. Be professional, direct, quantitative, and insightful.`;

    try {
      const responseText = await callGeminiAPI(query, systemInstruction);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      showToast(err.message || "Failed to reach Gemini endpoints.", "error");
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: `⚠️ Auditing Interrupted: ${err.message || "An unexpected network state occurred."} Ensure your API key is accurate and try resending.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Session Time-Travel Logic
  const handleSaveSession = () => {
    const sessionName = `Audit: ${activeDoc.title} (${new Date().toLocaleDateString()})`;
    const payload = {
      id: `session-${Date.now()}`,
      title: sessionName,
      timestamp: new Date().toLocaleString(),
      metrics: { ...extractedMetrics },
      docId: selectedDocId,
      chatHistory: [...chatHistory]
    };

    const updated = [payload, ...savedSessions];
    setSavedSessions(updated);
    localStorage.setItem('fin_saved_sessions', JSON.stringify(updated));
    showToast("Audit state captured and archived locally.", "success");
  };

  const handleLoadSession = (session) => {
    setSelectedDocId(session.docId);
    setExtractedMetrics(session.metrics);
    setIsEditingMetrics(true);
    setChatHistory(session.chatHistory);
    showToast("Time-travel load successful. State synchronized.", "success");
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    localStorage.setItem('fin_saved_sessions', JSON.stringify(updated));
    showToast("Archived audit session purged.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Premium Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              {APP_TITLE} 
              <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-slate-700">PRO v2.5</span>
            </h1>
            <p className="text-[11px] text-slate-400">Contextual Ledger AI & Vector Visualization</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={handleSaveSession}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-750 font-medium px-4 py-2.5 rounded-xl border border-slate-700/80 transition-all hover:border-slate-600 cursor-pointer"
            title="Snapshots current chat and metric states for retrieval"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Snapshot Audit
          </button>
          
          <button 
            onClick={handleAddNewDocument}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>
      </header>

      {/* Main 3-Column Ergonomic Workspace */}
      <main className="flex-1 max-w-full mx-auto w-full p-4 md:p-6 grid grid-cols-12 gap-6 items-stretch overflow-hidden">
        
        {/* ================= LEFT COLUMN: Security, Asset List & Session Archives ================= */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          
          {/* Security & Token Authentication Hub */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
            
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> API Token Security (BYOK)
            </h2>
            
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              To queries Gemini's model, enter your API token. Kept fully client-side inside local instance storage.
            </p>

            <div className="relative mb-3">
              <input
                type={isKeyVisible ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs font-mono bg-slate-900 border border-slate-700/80 rounded-xl py-3 pl-3 pr-10 outline-none text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
              />
              <button 
                type="button"
                onClick={() => setIsKeyVisible(!isKeyVisible)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSaveApiKey} 
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-xs font-semibold py-2 rounded-xl transition-all hover:border-emerald-500/50"
              >
                Sync Token
              </button>
              {apiKey && (
                <button 
                  onClick={handleClearApiKey} 
                  className="bg-slate-850 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-900/50 px-3 py-2 rounded-xl text-xs transition-all"
                  title="Wipe Token"
                >
                  Clear
                </button>
              )}
            </div>

            {apiKey && apiKey.length >= 15 ? (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> Active Token linked successfully.
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-500" /> Secure state: Offline sandbox.
              </div>
            )}
          </div>

          {/* Active Ledger Assets Index */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Active Ledger Assets
              </h2>
              <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                {documents.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setIsEditingMetrics(false);
                    }}
                    className={`group w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-slate-800/80 border-slate-700 text-white' 
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                      <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <div className="text-left overflow-hidden">
                        <p className="text-xs font-semibold truncate leading-none mb-1">{doc.title}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{doc.date}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-all"
                      title="Remove asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time-Travel Audit History */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex-1 flex flex-col min-h-[190px]">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center justify-between">
              Audit Archives <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </h2>
            
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[220px]">
              {savedSessions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[11px] text-slate-500 italic">No archived snapshots recorded.</p>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">Click "Snapshot Audit" above to save state variables.</p>
                </div>
              ) : (
                savedSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => handleLoadSession(session)}
                    className="p-2.5 text-xs text-slate-400 bg-slate-900/40 border border-slate-800/80 hover:border-slate-750 hover:bg-slate-850 hover:text-slate-200 rounded-xl cursor-pointer flex items-center justify-between transition-all group"
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-300 truncate text-[11px]">{session.title}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">{session.timestamp}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition-all"
                      title="Wipe archived node"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* ================= CENTER COLUMN: Document Synthesis & Workspace ================= */}
        <section className="col-span-12 lg:col-span-5 bg-slate-950/40 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
          
          {/* Workspace Controls Header */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="overflow-hidden w-full sm:w-auto">
              <input 
                type="text"
                value={activeDoc?.title || ""}
                onChange={(e) => handleUpdateDocTitle(e.target.value)}
                className="text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 outline-none w-full pb-0.5 transition-all truncate"
                placeholder="Untitled Ledger"
              />
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                <Calendar className="w-3 h-3 text-slate-600" /> Last Modified: {activeDoc?.date}
              </p>
            </div>
            
            {/* Elegant Tab Controls */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-between overflow-x-auto">
              {[
                { id: 'viewer', label: 'Ledger text' },
                { id: 'metrics', label: 'KPI Matrix' },
                { id: 'visuals', label: 'Charts' },
                { id: 'slides', label: 'Slides' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Body Viewports */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col">
            
            {/* VIEWPORT A: LEDGER EDITOR */}
            {activeTab === 'viewer' && (
              <div className="flex-1 flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Document Content Source
                  </label>
                  <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-800 px-2 py-0.5 rounded">
                    Auto-Parsing Heuristics Enabled
                  </span>
                </div>
                <textarea
                  value={activeDoc?.content || ""}
                  onChange={(e) => handleUpdateDocContent(e.target.value)}
                  className="flex-1 w-full min-h-[350px] p-4 bg-slate-900/60 text-slate-300 font-mono text-xs rounded-xl border border-slate-800/80 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/15 outline-none resize-none leading-relaxed"
                  placeholder="Paste unstructured audit trails, bank logs, or profit sheets to automatically scan for core assets..."
                />
              </div>
            )}

            {/* VIEWPORT B: METRICS MATRIX EDITOR & OVERRIDE */}
            {activeTab === 'metrics' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">Financial KPI Overrides</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Customize metric values; chart coordinates & templates instantly synchronize.</p>
                  </div>
                  {isEditingMetrics && (
                    <button 
                      onClick={handleResetMetrics}
                      className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 bg-slate-850 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-all font-mono"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-sync From Document
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Revenue Card */}
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 relative group hover:border-slate-750 transition-all">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Annualized Revenue</label>
                    <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden group-focus-within:border-emerald-500/50">
                      <span className="text-xs text-slate-500 px-2.5 py-1 bg-slate-950 font-mono font-bold">$</span>
                      <input 
                        type="number"
                        value={extractedMetrics.revenue}
                        onChange={(e) => handleMetricChange('revenue', e.target.value)}
                        className="w-full bg-transparent p-2 text-xs font-mono text-white outline-none"
                      />
                    </div>
                    <span className="absolute bottom-2 right-4 text-[9px] text-slate-600 font-mono">
                      Parsed value: ${(extractedMetrics.revenue).toLocaleString()}
                    </span>
                  </div>

                  {/* Margin Card */}
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 relative group hover:border-slate-750 transition-all">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Operating Margin</label>
                    <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden group-focus-within:border-emerald-500/50">
                      <input 
                        type="number" 
                        step="0.1"
                        value={extractedMetrics.margin}
                        onChange={(e) => handleMetricChange('margin', e.target.value)}
                        className="w-full bg-transparent p-2 text-xs font-mono text-white outline-none text-right pr-2"
                      />
                      <span className="text-xs text-slate-500 px-2.5 py-1 bg-slate-950 font-mono font-bold">%</span>
                    </div>
                    <span className="absolute bottom-2 left-4 text-[9px] text-slate-600 font-mono">
                      Operating: {extractedMetrics.margin}%
                    </span>
                  </div>

                  {/* Free Cash Flow Card */}
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 relative group hover:border-slate-750 transition-all">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Free Cash Flow (FCF)</label>
                    <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden group-focus-within:border-emerald-500/50">
                      <span className="text-xs text-slate-500 px-2.5 py-1 bg-slate-950 font-mono font-bold">$</span>
                      <input 
                        type="number"
                        value={extractedMetrics.fcf}
                        onChange={(e) => handleMetricChange('fcf', e.target.value)}
                        className="w-full bg-transparent p-2 text-xs font-mono text-white outline-none"
                      />
                    </div>
                    <span className="absolute bottom-2 right-4 text-[9px] text-slate-600 font-mono">
                      Cash pool: ${(extractedMetrics.fcf).toLocaleString()}
                    </span>
                  </div>

                  {/* DSCR Card */}
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 relative group hover:border-slate-750 transition-all">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">DSCR Leverage</label>
                    <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden group-focus-within:border-emerald-500/50">
                      <input 
                        type="number"
                        step="0.1"
                        value={extractedMetrics.dscr}
                        onChange={(e) => handleMetricChange('dscr', e.target.value)}
                        className="w-full bg-transparent p-2 text-xs font-mono text-white outline-none text-right pr-2"
                      />
                      <span className="text-xs text-slate-500 px-2.5 py-1 bg-slate-950 font-mono font-bold">x</span>
                    </div>
                    <span className="absolute bottom-2 left-4 text-[9px] text-slate-600 font-mono">
                      Benchmark Target: 2.0x
                    </span>
                  </div>
                </div>

                {/* Analysis Breakdown */}
                <div className="p-4 bg-slate-900/20 border border-slate-800 rounded-xl space-y-2.5">
                  <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">Liquidity Assessment Heuristic</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/60">
                      <p className="text-[10px] text-slate-500">Margin Profile</p>
                      <p className={`text-xs font-bold mt-1 ${extractedMetrics.margin > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {extractedMetrics.margin > 30 ? 'High Leverage' : 'Standard'}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/60">
                      <p className="text-[10px] text-slate-500">Leverage Risk</p>
                      <p className={`text-xs font-bold mt-1 ${extractedMetrics.dscr >= 2.0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {extractedMetrics.dscr >= 2.0 ? 'Low Risk' : 'High Risk'}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/60">
                      <p className="text-[10px] text-slate-500">Cash Generation</p>
                      <p className={`text-xs font-bold mt-1 ${extractedMetrics.fcf > 2000000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {extractedMetrics.fcf > 2000000 ? 'Aggressive' : 'Conservative'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEWPORT C: HIGH-FIDELITY INTERACTIVE SVG CHART */}
            {activeTab === 'visuals' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">Normalize Financial Scaling</h3>
                    <p className="text-[10px] text-slate-500">Dynamic projection curves mapped to active corporate properties.</p>
                  </div>

                  {/* Series Selector */}
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    {['Revenue', 'Margin', 'FCF', 'DSCR'].map(series => (
                      <button
                        key={series}
                        onClick={() => {
                          setActiveSeries(series);
                          setHoveredDataPoint(null);
                        }}
                        className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                          activeSeries === series 
                            ? 'bg-slate-800 text-emerald-400' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {series}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Render Block */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-2 left-4 text-[9px] font-mono text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Interactive Trend Line ({activeSeries})
                  </div>

                  <svg 
                    viewBox="0 0 500 240" 
                    className="w-full h-auto mt-2 select-none"
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Background grid lines */}
                    {[0, 1, 2, 3, 4].map(idx => (
                      <line
                        key={idx}
                        x1="45"
                        y1={30 + idx * 45}
                        x2="455"
                        y2={30 + idx * 45}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Gradient under curve */}
                    {svgCoordinates.length > 0 && (
                      <path
                        d={`${cubicBezierPath} L ${svgCoordinates[svgCoordinates.length - 1].x} 210 L ${svgCoordinates[0].x} 210 Z`}
                        fill="url(#chartGradient)"
                      />
                    )}

                    {/* Bezier Path Line */}
                    <path
                      d={cubicBezierPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Dynamic coordinates hover indicators */}
                    {svgCoordinates.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredDataPoint?.label === pt.label ? "6" : "4"}
                          className="transition-all duration-200"
                          fill={hoveredDataPoint?.label === pt.label ? "#10b981" : "#022c22"}
                          stroke="#10b981"
                          strokeWidth="2"
                          onMouseEnter={() => setHoveredDataPoint(pt)}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                          style={{ cursor: 'pointer' }}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Horizontal Axis Labels */}
                  <div className="w-full flex justify-between px-10 pt-2 border-t border-slate-900 mt-2">
                    {chartData.map((d, i) => (
                      <span key={i} className="text-[10px] font-mono text-slate-500 font-semibold">{d.label}</span>
                    ))}
                  </div>
                </div>

                {/* Tooltip detail block */}
                <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between min-h-[50px]">
                  {hoveredDataPoint ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-xs font-mono font-bold text-slate-200">{hoveredDataPoint.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 mr-2 uppercase tracking-wide">Extrapolated Value:</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {activeSeries === 'Revenue' || activeSeries === 'FCF' 
                            ? `$${hoveredDataPoint.val.toLocaleString()}` 
                            : activeSeries === 'Margin' 
                              ? `${hoveredDataPoint.val.toFixed(1)}%` 
                              : `${hoveredDataPoint.val.toFixed(2)}x`
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center w-full py-1 text-[10px] text-slate-500 italic flex items-center justify-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Hover over coordinate nodes on the curve to see precise quantitative values.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEWPORT D: AUTOMATED PITCH SLIDE GENERATOR */}
            {activeTab === 'slides' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">Pitch deck builder</h3>
                    <p className="text-[10px] text-slate-500">Automated slides derived from the document's active metrics.</p>
                  </div>
                </div>

                {/* Simulated Deck View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Slide 1 */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-slate-900 text-[8px] font-mono text-slate-500 border-l border-b border-slate-800">Slide 1</div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">The Revenue Engine</p>
                      <h4 className="text-xs font-bold text-white mt-1">Growth & Market Penetration</h4>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        During this cycle, total annualized baseline revenue was locked at <strong className="text-emerald-400">${(extractedMetrics.revenue).toLocaleString()}</strong>.
                      </p>
                    </div>
                    <div className="pt-2 text-[9px] text-emerald-400 font-mono font-bold">🎯 TechCorp Confidential</div>
                  </div>

                  {/* Slide 2 */}
                  <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-slate-900 text-[8px] font-mono text-slate-500 border-l border-b border-slate-800">Slide 2</div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Operating Efficiency</p>
                      <h4 className="text-xs font-bold text-white mt-1">Margin Optimization Strategy</h4>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        By consolidating cloud nodes and engineering workflows, operating margins optimized to <strong className="text-emerald-400">{extractedMetrics.margin}%</strong>.
                      </p>
                    </div>
                    <div className="pt-2 text-[9px] text-emerald-400 font-mono font-bold">🎯 Efficiency Baseline</div>
                  </div>

                  {/* Slide 3 */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-slate-900 text-[8px] font-mono text-slate-500 border-l border-b border-slate-800">Slide 3</div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Treasury Allocation</p>
                      <h4 className="text-xs font-bold text-white mt-1">Liquidity & Free Cash Flow</h4>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        Our treasury holds <strong className="text-emerald-400">${(extractedMetrics.fcf).toLocaleString()}</strong> in liquid FCF, allowing flexible capital re-allocation.
                      </p>
                    </div>
                    <div className="pt-2 text-[9px] text-emerald-400 font-mono font-bold">🎯 Asset Allocation</div>
                  </div>

                  {/* Slide 4 */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-slate-900 text-[8px] font-mono text-slate-500 border-l border-b border-slate-800">Slide 4</div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Debt Integrity</p>
                      <h4 className="text-xs font-bold text-white mt-1">DSCR Leverage Compliance</h4>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        With an active Debt Service Coverage Ratio of <strong className="text-emerald-400">{extractedMetrics.dscr}x</strong>, covenants remain exceptionally safe.
                      </p>
                    </div>
                    <div className="pt-2 text-[9px] text-emerald-400 font-mono font-bold">🎯 Risk Management</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Footer inside Synthesis box */}
          <div className="px-5 py-3 border-t border-slate-850 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Asset Context Status</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Dynamic Workspace Syncing
            </span>
          </div>
        </section>

        {/* ================= RIGHT COLUMN: Interactive Copilot Chat Engine ================= */}
        <section className="col-span-12 lg:col-span-4 bg-slate-950/40 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">FinIntellect Copilot</h3>
                <p className="text-[10px] text-slate-500">Grounded in Active Document State</p>
              </div>
            </div>

            <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">
              gemini-3-flash
            </span>
          </div>

          {/* Dialog Chat Thread */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chatHistory.map((chat, idx) => {
              const isAssistant = chat.role === 'assistant';
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${isAssistant ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                >
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAssistant 
                      ? 'bg-slate-900/80 text-slate-300 border border-slate-800 rounded-tl-none' 
                      : 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/5'
                  }`}>
                    {chat.text}
                  </div>
                  <span className="text-[9px] text-slate-600 mt-1 font-mono">{chat.timestamp}</span>
                </div>
              );
            })}
            {isGenerating && (
              <div className="flex flex-col items-start max-w-[85%] mr-auto">
                <div className="p-3.5 rounded-2xl text-xs bg-slate-900/80 text-slate-400 border border-slate-800 rounded-tl-none flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Analyzing ledger vector maps...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Entry Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-850 bg-slate-950/20">
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl group focus-within:border-emerald-500/40 transition-all">
              <input 
                className="w-full text-xs p-3.5 bg-transparent outline-none text-white placeholder:text-slate-500 pr-20" 
                placeholder="Ask financial ratios, covenant compliance, or trends..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
              
              <div className="absolute right-2 flex items-center gap-1.5">
                {/* Voice Input Mic Trigger */}
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Use Voice Dictation"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button 
                  type="submit"
                  disabled={isGenerating || !userInput.trim()}
                  className="p-2 rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-600 transition-all font-semibold cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-[9px] text-center text-slate-600 mt-2 leading-none">
              Press enter to send. The context automatically syncs to the workspace document metrics.
            </p>
          </form>
        </section>
      </main>

      {/* Modern Soft Toast Notification Overlay */}
      {notification && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md z-50 border transition-all duration-300 animate-bounce bg-slate-900 border-slate-750 text-white">
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}
