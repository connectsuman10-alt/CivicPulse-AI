import React, { useState, useRef, useEffect } from "react";
import { Category, Severity, User } from "../types";
import { 
  Camera, 
  MapPin, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  AlertTriangle, 
  Upload, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";
import InteractiveMap from "./InteractiveMap";

interface NewIssueFormProps {
  currentUser: User;
  onIssueAdded: (issue: any) => void;
  onNavigateToIssue: (issueId: string) => void;
  allIssues: any[];
}

export default function NewIssueForm({ currentUser, onIssueAdded, onNavigateToIssue, allIssues }: NewIssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [address, setAddress] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Pre-Analysis States
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: Category;
    severity: Severity;
    priorityScore: number;
    department: string;
    explanation: string;
  } | null>(null);

  // Real-time Duplicate warning states
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Sync with interactive map selection
  const handleSelectCoords = (coords: { lat: number; lng: number; address: string }) => {
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    setAddress(coords.address);
  };

  // Run AI Pre-analysis
  const handleAIPreAnalysis = async () => {
    if (!title || !description) {
      alert("Please provide a Title and Description first for the AI model to analyze.");
      return;
    }

    setAnalyzingAI(true);
    setDuplicateWarning(null);

    try {
      // Direct POST to analyze issue parameters before saving
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          latitude,
          longitude,
          address,
          reportedBy: currentUser.name,
          reportedById: currentUser.id,
          dryRunOnly: true // Wait, server creates immediately, but let's check for duplicate in our custom endpoint or write customized logic
        })
      });

      if (res.ok) {
        const json = await res.json();
        setAiResult({
          category: json.category,
          severity: json.severity,
          priorityScore: json.priorityScore,
          department: json.department,
          explanation: `System detected category '${json.category}' with ${json.severity} severity and priority score of ${json.priorityScore}/100. Dispatched to the ${json.department}.`
        });
        setAiAnalyzed(true);

        if (json.isDuplicate) {
          const original = allIssues.find(i => i.id === json.duplicateOfId);
          if (original) {
            setDuplicateWarning(original);
          }
        }
      }
    } catch (err) {
      console.error("AI preanalysis error:", err);
    } finally {
      setAnalyzingAI(false);
    }
  };

  // Submit Issue to Server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      alert("Title and description are required.");
      return;
    }

    setAnalyzingAI(true);

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          latitude,
          longitude,
          address,
          reportedBy: currentUser.name,
          reportedById: currentUser.id
        })
      });

      if (response.ok) {
        const newIssue = await response.json();
        onIssueAdded(newIssue);
        // Reset states
        setTitle("");
        setDescription("");
        setImageUrl("");
        setAiAnalyzed(false);
        setAiResult(null);
        setDuplicateWarning(null);
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting issue:", error);
    } finally {
      setAnalyzingAI(false);
    }
  };

  return (
    <div id="new_issue_form_container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT FORM FIELD PANEL */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
            <Camera size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Report New Incident</h3>
            <p className="text-xs text-slate-500">Earn up to 25 contribution points for verified original reports</p>
          </div>
        </div>

        {/* DRAG AND DROP IMAGE UPLOAD */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">1. Attach Visual Photo</label>
          {imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group max-h-[220px]">
              <img src={imageUrl} alt="Issue preview" className="w-full h-[200px] object-cover" referrerPolicy="no-referrer" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                isDragOver ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/30"
              }`}
            >
              <Upload size={28} className={isDragOver ? "text-blue-600" : "text-slate-400"} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Drag & Drop issue photo here</p>
                <p className="text-[10px] text-slate-400">or click to browse local files (Supports PNG, JPG, WEBP)</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* TITLE AND DESCRIPTION */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">2. Incident Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Severe Pothole near Central Ave Crossroads"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-slate-800 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">3. Full Description</label>
            <textarea
              required
              rows={4}
              placeholder="Provide a detailed description of the incident. How large is the damage? Does it block lanes or cause pedestrian hazards? How long has it been there?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-slate-800 bg-white"
            />
          </div>
        </div>

        {/* GPS COORDINATES PICKER */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">4. Captured Address & Coordinates</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] font-medium text-slate-500 space-y-1">
              <span className="font-bold uppercase tracking-wider text-slate-400 block text-[9px]">Street Address</span>
              <span className="text-slate-800 truncate block font-semibold">{address || "Drop pin on map..."}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] font-medium text-slate-500 space-y-1">
              <span className="font-bold uppercase tracking-wider text-slate-400 block text-[9px]">Coordinates (Lat, Lng)</span>
              <span className="text-slate-800 font-mono font-semibold block">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* DUPLICATE WARNING OVERLAY */}
        {duplicateWarning && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900">Potential Duplicate Detected!</h4>
              <p className="text-[10px] text-amber-700 leading-normal font-medium">
                An active issue matching this category is reported only 180m away: <strong>"{duplicateWarning.title}"</strong>.
              </p>
              <button
                type="button"
                onClick={() => onNavigateToIssue(duplicateWarning.id)}
                className="mt-2 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                Inspect Existing Issue & Upvote Instead
                <ArrowRight size={10} />
              </button>
            </div>
          </div>
        )}

        {/* AI AUTO PRE-CLASSIFICATION SUMMARY DISPLAY */}
        {aiAnalyzed && aiResult && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
            <Sparkles className="text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" size={18} />
            <div className="space-y-1.5 flex-grow">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1">
                Gemini AI Real-time Incident Analytics
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-blue-950">
                <div className="bg-white/60 p-1.5 rounded-lg border border-blue-100/40">
                  <span className="text-slate-400 uppercase text-[8px] font-bold block">Assigned Division</span>
                  <span className="text-blue-900 font-bold">{aiResult.department}</span>
                </div>
                <div className="bg-white/60 p-1.5 rounded-lg border border-blue-100/40">
                  <span className="text-slate-400 uppercase text-[8px] font-bold block">AI Severity Rank</span>
                  <span className="text-rose-600 font-extrabold">{aiResult.severity}</span>
                </div>
                <div className="bg-white/60 p-1.5 rounded-lg border border-blue-100/40">
                  <span className="text-slate-400 uppercase text-[8px] font-bold block">Recommended Priority</span>
                  <span className="text-blue-900 font-extrabold">{aiResult.priorityScore} / 100</span>
                </div>
                <div className="bg-white/60 p-1.5 rounded-lg border border-blue-100/40">
                  <span className="text-slate-400 uppercase text-[8px] font-bold block">Auto Category</span>
                  <span className="text-blue-900 font-bold uppercase">{aiResult.category}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">{aiResult.explanation}</p>
            </div>
          </div>
        )}

        {/* BUTTON ACTION CONTROLS */}
        <div className="flex gap-3 pt-2">
          {!aiAnalyzed ? (
            <button
              type="button"
              onClick={handleAIPreAnalysis}
              disabled={analyzingAI || !title || !description}
              className="flex-grow bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-150 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {analyzingAI ? (
                <>
                  <div className="w-3 h-3 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  Gemini analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-blue-600 animate-pulse" />
                  Run Gemini Pre-Analysis
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={analyzingAI}
              className="flex-grow bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
            >
              {analyzingAI ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving report...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Submit Report & Claim points
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* RIGHT SIDE MAP PICKER PANEL */}
      <div className="lg:col-span-5 h-[450px] lg:h-auto min-h-[420px]">
        <InteractiveMap
          issues={allIssues}
          onSelectIssue={() => {}}
          reportMode={true}
          selectedCoords={{ lat: latitude, lng: longitude, address }}
          onSelectCoords={handleSelectCoords}
        />
      </div>
    </div>
  );
}
