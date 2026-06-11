import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Check, Sun, Moon, UploadCloud, Camera, ChevronLeft, Trash2, Menu
} from 'lucide-react';

interface HeaderCoverProps {
  coverUrl: string;
  setCoverUrl: (url: string) => void;
  emoji: string;
  setEmoji: (emoji: string) => void;
  title: string;
  setTitle: (title: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onReset: () => void;
  activeTab?: string;
  desc?: string;
  onMenuClick?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string;
}

export const COVERS = [
  { name: 'Warm Pastel Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Cosmic Nebula', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Yosemite Valley', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Minimal Bauhaus', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Academic Study', url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1600&auto=format&fit=crop&q=80' }
];

export const EMOJIS = ['🧘‍♀️', '🚀', '🌿', '📈', '📚', '⚡', '🌟', '🎨', '🧠', '🪐', '☕', '🗓️', '🏆', '🍕', '🎯', '🥑'];

export default function HeaderCover({
  coverUrl,
  setCoverUrl,
  emoji,
  setEmoji,
  title,
  setTitle,
  isDark,
  toggleTheme,
  onReset,
  activeTab = 'dashboard',
  desc = 'Your Personal Operating System',
  onMenuClick,
  isSyncing = false,
  lastSyncTime = '',
}: HeaderCoverProps) {
  const [showEmojiPopover, setShowEmojiPopover] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [srcError, setSrcError] = useState(false);

  useEffect(() => {
    setSrcError(false);
  }, [coverUrl]);

  // Redesign state variables for clickable cover interaction, context menu, and bottom sheet
  const [isMobile, setIsMobile] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [showMobileBottomSheet, setShowMobileBottomSheet] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showPresetSubmenu, setShowPresetSubmenu] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive design listener
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Helper file click trigger
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Click/Tap handler on the cover image
  const handleCoverClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent reacting if clicking on nested active menus
    const target = e.target as HTMLElement;
    if (target.closest('.cover-menu-container') || target.closest('input[type="file"]')) {
      return;
    }
    
    // Dismiss emoji popover when focusing cover
    setShowEmojiPopover(false);

    if (isMobile) {
      setShowMobileBottomSheet(true);
      setShowDesktopMenu(false);
      setShowPresetSubmenu(false);
    } else {
      // Desktop: floating dropdown positioned inside the container
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const menuWidth = 208; // 13rem text
      const menuHeight = 150; // default state height approximation
      
      const finalX = Math.min(clickX, rect.width - menuWidth - 12);
      const finalY = Math.min(clickY, rect.height - menuHeight - 12);
      
      setMenuPosition({
        x: Math.max(12, finalX),
        y: Math.max(12, finalY)
      });
      setShowDesktopMenu(true);
      setShowPresetSubmenu(false);
    }
  };

  // Mobile Touch events for long-press trigger indicator
  const handleTouchStart = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
    }, 450); // 450ms is standard long press threshold
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    // Smoothly clear longpress flag
    setTimeout(() => {
      setIsLongPressing(false);
    }, 1000);
  };

  // Click-away listener for desktop menu dismiss
  useEffect(() => {
    if (!showDesktopMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cover-menu-container')) {
        setShowDesktopMenu(false);
        setShowPresetSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showDesktopMenu]);

  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Life Dashboard';
      case 'planner': return 'Weekly Planner';
      case 'calendar': return 'Monthly Calendar';
      case 'analytics': return 'Workspace Analytics';
      case 'habits': return 'Tasks Board';
      case 'brain': return 'Second Brain';
      case 'finance': return 'Finance Ledger';
      case 'health': return 'Health & Wellness';
      case 'silva': return 'Silva Meditations';
      case 'goals': return 'Goals & Milestones';
      case 'travel': return 'Travel Planner';
      case 'relationships': return 'Relationships CRM';
      case 'history': return 'History';
      case 'settings': return 'Settings';
      default: return 'Life Dashboard';
    }
  };

  return (
    <div className="relative w-full group/header">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="h-12 px-4 sm:px-6 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 text-xs text-gray-500 dark:text-neutral-400 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md font-sans">
        <div className="flex items-center">
          {/* Hamburger Menu button */}
          <button
            onClick={onMenuClick}
            id="header-hamburger-btn"
            className="p-1.5 rounded-lg text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center mr-2"
            title="Toggle Sidebar Menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300 transition-colors"
            title="Toggle Light/Dark Mode"
          >
            {isDark ? (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Light</span>
              </>
            )}
          </button>

          {/* Live Sync Status Pill */}
          <span className="h-4 w-px bg-gray-200 dark:bg-neutral-800" />
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 rounded-full text-[#7C5CFF] font-sans text-[11px] font-semibold tracking-wide">
            <span className={`h-1.5 w-1.5 rounded-full bg-[#7C5CFF] shrink-0 ${isSyncing ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
            <span>
              {isSyncing ? 'Syncing...' : lastSyncTime ? `Synced ${lastSyncTime}` : 'Synced'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Cover Banner */}
      <div 
        className="h-48 sm:h-56 relative w-full overflow-hidden bg-gray-100 dark:bg-neutral-800 cursor-pointer group/cover select-none transition-all duration-350 active:brightness-95 hover:brightness-[0.98]"
        onClick={handleCoverClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        title="Click anywhere to change or remove cover image"
      >
        {coverUrl && !srcError ? (
          <img
            src={coverUrl}
            referrerPolicy="no-referrer"
            alt="Dashboard Cover"
            className="w-full h-full object-cover transition-all duration-700"
            onError={() => {
              console.warn(`Cover image fail to load smoothly: ${coverUrl}. Using default elegant workspace dark gradient.`);
              setSrcError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#121318] via-[#1a1b24] to-[#252632] flex flex-col items-center justify-center space-y-2 text-center px-4">
            <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover/cover:scale-110 transition-all duration-300">
              <Camera className="h-5 w-5 text-gray-400 dark:text-neutral-500" />
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-neutral-400 font-display">
              {srcError ? "Fallback Banner Displayed" : "No cover photo set"}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-neutral-500 font-mono">
              {srcError ? "Failed to load custom remote URL" : "Click anywhere to configure image"}
            </span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

        {/* Subtle edit overlay shown on hovering (desktop) or long-pressing (mobile) */}
        <div className={`absolute inset-0 bg-black/35 flex items-center justify-center transition-all duration-300 pointer-events-none ${
          isMobile 
            ? (isLongPressing ? 'opacity-100 scale-100' : 'opacity-0 scale-95') 
            : 'opacity-0 group-hover/cover:opacity-100'
        }`}>
          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 text-white text-xs font-semibold shadow-xl transition-all">
            <Camera className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
            <span>Configure Cover Photo</span>
          </div>
        </div>

        {/* Desktop Context Menu (Anchored near click coordinates) */}
        {!isMobile && showDesktopMenu && (
          <div 
            className="absolute z-50 w-52 p-2 bg-neutral-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150 cover-menu-container"
            style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {!showPresetSubmenu ? (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                    setShowDesktopMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer text-left"
                >
                  <UploadCloud className="h-4 w-4 text-blue-450" />
                  <span>Upload from Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPresetSubmenu(true);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer text-left"
                >
                  <ImageIcon className="h-4 w-4 text-amber-450" />
                  <span>Choose Preset Cover</span>
                </button>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverUrl('');
                      setShowDesktopMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-500/20 text-xs font-semibold text-red-300 hover:text-red-200 transition-all cursor-pointer text-left"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                    <span>Remove Cover</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-1.5 px-2 mb-1.5 pb-1 border-b border-white/5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPresetSubmenu(false);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-all shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Preset Covers</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 scrollbar-thin">
                  {COVERS.map((cov) => (
                    <button
                      key={cov.name}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverUrl(cov.url);
                        setShowDesktopMenu(false);
                        setShowPresetSubmenu(false);
                      }}
                      className={`w-full flex items-center space-x-2 p-1.5 rounded-lg hover:bg-white/5 transition-all text-left cursor-pointer ${
                        coverUrl === cov.url ? 'bg-indigo-500/15 border border-indigo-500/30' : 'border border-transparent'
                      }`}
                    >
                      <img src={cov.url} referrerPolicy="no-referrer" alt={cov.name} className="w-10 h-7 rounded object-cover shrink-0" />
                      <span className="text-[10px] font-medium truncate text-neutral-300">{cov.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          id="device-cover-file-input"
        />
      </div>

      {/* Mobile Bottom Sheet Overlay portal-like experience */}
      {isMobile && showMobileBottomSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none" onClick={(e) => e.stopPropagation()}>
          {/* Backdrop with fade-in */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              setShowMobileBottomSheet(false);
              setShowPresetSubmenu(false);
            }}
          />
          
          {/* Slide-up Container */}
          <div className="relative w-full max-w-lg bg-[#16171d] border-t border-white/10 rounded-t-3xl px-6 pt-5 pb-8 shadow-2xl z-55 animate-in slide-in-from-bottom duration-300 ease-out">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            
            {!showPresetSubmenu ? (
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white font-display">Manage Cover Photo</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Customize your Life Dashboard cover style</p>
                </div>
                
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerFileInput();
                      setShowMobileBottomSheet(false);
                    }}
                    className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all active:scale-[0.98] cursor-pointer text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-bold">📷 Upload from Gallery</span>
                      <span className="block text-[10px] text-gray-400 font-normal">Select image files from your device</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowPresetSubmenu(true);
                    }}
                    className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all active:scale-[0.98] cursor-pointer text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-bold">🎨 Choose Preset Cover</span>
                      <span className="block text-[10px] text-gray-400 font-normal">Select a vibrant custom art curated banner</span>
                    </div>
                  </button>
                  
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverUrl('');
                        setShowMobileBottomSheet(false);
                      }}
                      className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-200 hover:text-red-100 font-semibold transition-all active:scale-[0.98] cursor-pointer text-left"
                    >
                      <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-xs font-bold">🗑 Remove Cover</span>
                        <span className="block text-[10px] text-red-300 font-normal">Revert cover space to sleek dark pattern</span>
                      </div>
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileBottomSheet(false);
                  }}
                  className="w-full mt-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-bold text-center text-xs text-gray-400 hover:text-white border border-white/5 cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2.5 border-b border-white/5 justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPresetSubmenu(false);
                    }}
                    className="flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-xs font-bold text-neutral-350 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Preset Gallery</span>
                  <div className="w-14" /> {/* Spacer */}
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-none">
                  {COVERS.map((cov) => (
                    <button
                      key={cov.name}
                      type="button"
                      onClick={() => {
                        setCoverUrl(cov.url);
                        setShowMobileBottomSheet(false);
                        setShowPresetSubmenu(false);
                      }}
                      className={`flex items-center space-x-3.5 p-2 rounded-xl text-left border hover:bg-white/5 cursor-pointer transition-all ${
                        coverUrl === cov.url ? 'bg-indigo-500/15 border-indigo-500/50' : 'border-white/5'
                      }`}
                    >
                      <img src={cov.url} referrerPolicy="no-referrer" alt={cov.name} className="w-14 h-9 rounded-lg object-cover shadow shrink-0" />
                      <span className="text-xs font-semibold text-neutral-250 truncate">{cov.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
