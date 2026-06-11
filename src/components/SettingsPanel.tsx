import React, { useState } from 'react';
import { 
  Settings, RotateCcw, Paintbrush, Moon, Sun, Monitor, 
  HelpCircle, Shield, Key, Bell, Check, Sparkles, User, Database, Sidebar,
  RefreshCw, Cloud, Copy, Flame
} from 'lucide-react';
import { motion } from 'motion/react';
import { StreakData } from '../lib/firebaseStore';

interface SettingsPanelProps {
  isDark: boolean;
  toggleTheme: () => void;
  showFloatingTaskbar: boolean;
  setShowFloatingTaskbar: (val: boolean) => void;
  onReset: () => void;
  title: string;
  setTitle: (title: string) => void;
  currentUser: string;
  currentUserImage: string;
  syncId: string;
  setSyncId: (id: string) => void;
  streakState: StreakData;
  onResetStreak: () => void;
}

export default function SettingsPanel({
  isDark,
  toggleTheme,
  showFloatingTaskbar,
  setShowFloatingTaskbar,
  onReset,
  title,
  setTitle,
  currentUser = 'Dhruvv',
  currentUserImage = '',
  syncId,
  setSyncId,
  streakState,
  onResetStreak
}: SettingsPanelProps) {
  const [copiedSetting, setCopiedSetting] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [tempTitle, setTempTitle] = useState(title);
  const [tempSyncId, setTempSyncId] = useState(syncId);

  const triggerResetWithConfirmation = () => {
    const ok = window.confirm('Are you absolutely sure you want to reset your LifeOS Workspace? This will restore dummy records and erase local storage.');
    if (ok) {
      onReset();
    }
  };

  const triggerResetStreakWithConfirmation = () => {
    const ok = window.confirm("Are you sure you want to reset all streak data? This will erase all previously completed days and start fresh with TODAY as the official Start Date (Day 0). Any task completed starting today will build a fresh streak!");
    if (ok) {
      onResetStreak();
      setCopiedSetting('streak-reset');
      setTimeout(() => setCopiedSetting(null), 2500);
    }
  };

  const saveWorkspaceTitle = () => {
    setTitle(tempTitle);
    setCopiedSetting('title');
    setSyncStatus('syncing');
    setTimeout(() => {
      setCopiedSetting(null);
      setSyncStatus('synced');
    }, 1500);
  };

  const saveSyncIdChange = () => {
    if (tempSyncId.trim()) {
      setSyncId(tempSyncId.trim());
      setCopiedSetting('sync-id');
      setSyncStatus('syncing');
      setTimeout(() => {
        setCopiedSetting(null);
        setSyncStatus('synced');
      }, 1500);
    }
  };

  const copySyncIdToClipboard = () => {
    navigator.clipboard.writeText(syncId);
    setCopiedSetting('copy-id');
    setTimeout(() => setCopiedSetting(null), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* Header */}
      <div className="pb-4 border-b border-white/5">
        <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-gray-400" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Configure visual aesthetics, local workspace databases, task bars, and general user accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COMPACT NAVIGATION RAILS OR INFO CARDS */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* User profile card */}
          <div className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center space-x-3.5">
              <div className="h-14 w-14 rounded-2xl border-2 border-white/10 overflow-hidden shrink-0 flex items-center justify-center bg-zinc-950">
                {currentUserImage ? (
                  <img 
                    src={currentUserImage}
                    referrerPolicy="no-referrer"
                    alt="User Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white uppercase">{currentUser.charAt(0)}</span>
                )}
              </div>
              <div className="leading-tight">
                <span className="text-[9px] font-sans font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 px-1.5 py-0.5 rounded">LifeOS Administrator</span>
                <h3 className="text-base font-bold text-white mt-1">{currentUser}</h3>
                <span className="text-[10px] text-zinc-500 font-sans">active@workspace.local</span>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-border-color grid grid-cols-2 gap-2 text-center text-[10px] font-mono text-gray-455">
              <div className="bg-bg-secondary p-2 rounded-xl border border-border-color">
                <div className="text-white font-extrabold text-xs">V2.46</div>
                <div>Engine Ver.</div>
              </div>
              <div className="bg-bg-secondary p-2 rounded-xl border border-border-color">
                <div className="text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ONLINE</span>
                </div>
                <div>Portal Node</div>
              </div>
            </div>
          </div>

          {/* Connected Integrations Status */}
          <div className="bg-card-bg border border-border-color rounded-2xl p-4.5 space-y-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-display">System Status Feed</h4>
            
            <div className="space-y-2 text-[10.5px]">
              <div className="flex justify-between items-center bg-bg-secondary p-2 rounded-lg border border-border-color">
                <span className="text-gray-400">LocalStorage DB Cache</span>
                <span className="text-emerald-400 font-bold font-mono">Active (100% OK)</span>
              </div>
              <div className="flex justify-between items-center bg-bg-secondary p-2 rounded-lg border border-border-color">
                <span className="text-gray-400">Database Sync Speed</span>
                <span className="text-indigo-400 font-bold font-mono">0.02 ms</span>
              </div>
              <div className="flex justify-between items-center bg-bg-secondary p-2 rounded-lg border border-border-color">
                <span className="text-gray-400">Browser Environment</span>
                <span className="text-gray-200 font-bold font-mono">React v18+</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL - MAIN SETTINGS LIST */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* A. General Preferences */}
          <div className="bg-card-bg border border-border-color rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-border-color">
              <Paintbrush className="h-4.5 w-4.5 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display">General & Aesthetic Preferences</h3>
            </div>

            <div className="space-y-4.5">
              
              {/* Reset layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-white block">Aesthetic visual mode</span>
                  <span className="text-[10.5px] text-gray-400 block mt-0.5">Switch between dark mode and classical styling</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-white/5 hover:border-white/10 text-gray-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer hover:bg-neutral-800"
                >
                  {isDark ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span>Light Theme</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-400" />
                      <span>Dark Theme</span>
                    </>
                  )}
                </button>
              </div>

              <hr className="border-white/5" />

              {/* Float settings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-white block">Bottom floating things-to-do dock bar</span>
                  <span className="text-[10.5px] text-gray-400 block mt-0.5">Toggle the floating quick-task action widget at bottom of viewport</span>
                </div>
                <button
                  onClick={() => setShowFloatingTaskbar(!showFloatingTaskbar)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    showFloatingTaskbar 
                      ? 'bg-blue-600/10 text-blue-300 border-blue-500/25 shadow-[0_0_10px_rgba(37,99,235,0.15)]'
                      : 'bg-neutral-900 border border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {showFloatingTaskbar ? 'Dock Enabled' : 'Dock Disabled'}
                </button>
              </div>

              <hr className="border-white/5" />

              {/* Title Rename settings */}
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-bold text-white block">LifeOS Header Title Label</span>
                  <span className="text-[10.5px] text-gray-400 block mt-0.5">Customize the main landing header title persistent in local cache</span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-white/10 text-white rounded-xl py-2 px-3 outline-none focus:border-indigo-500 font-sans text-xs"
                    placeholder="Enter dashboard name"
                  />
                  <button
                    onClick={saveWorkspaceTitle}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold font-mono text-[10px] uppercase transition-all tracking-wider shrink-0 cursor-pointer"
                  >
                    {copiedSetting === 'title' ? (
                      <span className="flex items-center space-x-1">
                        <Check className="h-3 w-3" />
                        <span>Saved</span>
                      </span>
                    ) : (
                      <span>Save</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Task Streak & Cloud Sync Control Panel */}
          <div className="bg-card-bg border border-border-color rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-border-color">
              <Cloud className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display">Task Streak & Cloud Sync</h3>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Connect multiple devices (laptops, phones, or tablets) using a shared Cloud Sync ID. Real-time updates push completed milestones instantly across your active screens.
              </p>

              {/* Sync settings */}
              <div className="space-y-2 pt-1">
                <label className="text-[10.5px] font-bold text-gray-300 block">Active Device Cloud Sync Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tempSyncId}
                      onChange={(e) => setTempSyncId(e.target.value)}
                      className="w-full bg-bg-secondary border border-border-color text-white rounded-xl py-2 px-3 pr-10 outline-none focus:border-indigo-500 font-sans text-xs"
                      placeholder="Enter Sync ID (e.g., lifeos-654321)"
                    />
                    <button
                      onClick={copySyncIdToClipboard}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Copy Sync ID"
                    >
                      {copiedSetting === 'copy-id' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  
                  <button
                    onClick={saveSyncIdChange}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold font-mono text-[10px] uppercase transition-all tracking-wider shrink-0 cursor-pointer"
                  >
                    {copiedSetting === 'sync-id' ? 'Connected' : 'Connect'}
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1">
                  <div className={`h-2 w-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-spin'}`} />
                  <span>
                    {syncStatus === 'synced' 
                      ? `Synced: Using group "${syncId}"` 
                      : 'Connecting to Cloud Port...'}
                  </span>
                </div>
              </div>

              <hr className="border-border-color my-4" />

              {/* Streak info & Reset */}
              <div className="space-y-3.5">
                <div>
                  <span className="text-xs font-bold text-white block">Streak Baseline Status</span>
                  <p className="text-[10.5px] text-gray-400 mt-0.5 leading-relaxed">
                    Tracked from: <strong className="text-gray-200">{streakState.startDate}</strong> (Baseline START DATE). All previous historical calculations have been reset. Track fresh from today!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div className="bg-bg-secondary p-2.5 rounded-xl border border-border-color">
                    <div className="text-gray-400 text-[10px] uppercase tracking-wider">Current Streak</div>
                    <div className="text-white font-extrabold text-sm flex items-center gap-1 mt-0.5">
                      <Flame className="h-4.5 w-4.5 text-orange-500 fill-orange-500" />
                      <span>{streakState.currentStreak} Days</span>
                    </div>
                  </div>
                  <div className="bg-bg-secondary p-2.5 rounded-xl border border-border-color">
                    <div className="text-gray-400 text-[10px] uppercase tracking-wider">Longest Hot Streak</div>
                    <div className="text-white font-extrabold text-sm flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>{streakState.longestStreak} Days</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={triggerResetStreakWithConfirmation}
                    className="px-4 py-2.5 bg-bg-secondary hover:bg-card-hover border border-border-color text-gray-200 font-bold rounded-xl text-[10px] font-mono tracking-wider uppercase flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                    <span>
                      {copiedSetting === 'streak-reset' ? 'Stripped to Baseline (0)' : 'Reset System & Start Fresh From Today'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* B. Database Reset and Maintenance */}
          <div className="bg-card-bg border border-border-color rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-border-color">
              <Database className="h-4.5 w-4.5 text-red-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display text-red-400">Database Erasure Control</h3>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-400 text-[11px] leading-relaxed">
                If the application state becomes compromised, stale, or you wish to clean-clear your workspace dummy notes and goals, you can execute a full cache reset. This resets all projects, streaks, tasks, and notes in localStorage back to original dummy presets.
              </p>

              <div className="pt-2">
                <button
                  onClick={triggerResetWithConfirmation}
                  className="px-4 py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-[10px] font-mono tracking-widest uppercase flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] border border-red-500/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Execute Hard Workspace Reset</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
