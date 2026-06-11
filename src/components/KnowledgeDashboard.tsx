import React, { useState } from 'react';
import { Project, QuickNote } from '../types';
import { Brain, Search, Plus, Sparkles, Folder, ArrowUpRight, Trash2, CalendarDays, BookOpen, Key, Check } from 'lucide-react';

interface KnowledgeDashboardProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  quickNotes: QuickNote[];
  setQuickNotes: (notes: QuickNote[]) => void;
  addQuickNote: (content: string) => void;
  deleteQuickNote: (id: string) => void;
  promoteNoteToTask: (note: QuickNote) => void;
}

export default function KnowledgeDashboard({
  projects,
  setProjects,
  quickNotes,
  setQuickNotes,
  addQuickNote,
  deleteQuickNote,
  promoteNoteToTask,
}: KnowledgeDashboardProps) {
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addQuickNote(noteText.trim());
    setNoteText('');
  };

  const filteredNotes = quickNotes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">🧠 Second Brain Desk</h1>
        <p className="text-xs text-gray-400 mt-1">Scribe bookmarks, ideas, and knowledge vaults organically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Note Scratchpad Form & Recent Notes list */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-4.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-3 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>SCRATCH A THOUGHT OR NOTE</span>
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type anything... Use this section to write down raw insights, book reviews, code snippets, or links..."
                rows={3}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50 resize-none font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log to Vault</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Notes Scratchpad Feed with Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display select-none">Scratchpad Archive Feed</span>
              {/* Search input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter logged scratchpad entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="glass bg-white/[0.01] border border-white/5 rounded-2xl p-8 text-center text-gray-500">
                <BookOpen className="h-8 w-8 text-cyan-500/40 mx-auto mb-2" />
                <p className="text-xs font-semibold">No entries registered in Second Brain.</p>
                <p className="text-[10px] text-gray-600 mt-1">Begin by logging your thoughts above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotes.map(note => (
                  <div key={note.id} className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/25 transition-all">
                    <div>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-1.5 py-0.5 rounded">
                        Raw insight
                      </span>
                      <p className="text-xs text-gray-200 font-sans mt-2.5 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-550">
                      <span className="text-gray-500 select-none">{new Date(note.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={() => promoteNoteToTask(note)}
                          className="text-indigo-400 hover:text-white hover:underline font-extrabold flex items-center space-x-0.5 uppercase cursor-pointer"
                          title="Promote Note to Workspace Task"
                        >
                          <ArrowUpRight className="h-3 w-3 inline" />
                          <span>Taskify</span>
                        </button>
                        <button
                          onClick={() => deleteQuickNote(note.id)}
                          className="text-gray-500 hover:text-red-400 cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Knowledge projects & category links */}
        <div className="space-y-6">
          <div className="glass bg-neutral-950/40 border border-white/5 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-3.5 flex items-center space-x-2">
              <Folder className="h-4 w-4 text-purple-400" />
              <span>KNOWLEDGE CLASSIFIERS</span>
            </h3>

            <div className="space-y-2 text-xs font-sans">
              {projects.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-xs">No project structures found.</div>
              ) : (
                projects.map((proj, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/5">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="p-1 px-1.5 bg-white/5 rounded-lg border border-white/5 shrink-0 select-none">{proj.emoji || '💼'}</span>
                      <span className="font-semibold text-gray-200 truncate">{proj.name}</span>
                    </div>
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wide text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-full select-none">{proj.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-5 text-cyan-400/90 text-xs leading-relaxed space-y-2">
            <h4 className="font-bold flex items-center space-x-1 text-cyan-300 select-none">
              <Key className="h-4 w-4" />
              <span>THE 3-STEP KNOWLEDGE LOOP</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-gray-300 font-sans text-[11px] leading-relaxed">
              <li>Scribe raw insights using the scratchpad.</li>
              <li>Filter or search entries as notebooks grow.</li>
              <li>Promote actionable snippets into workspace tasks via the <strong className="text-indigo-400">Taskify</strong> action.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
