import React, { useState } from 'react';
import { Project, Task } from '../types';
import { 
  FolderPlus, Calendar, Plus, Trash2, Edit3, 
  Building, CheckCircle2, AlertTriangle, PlayCircle, Loader, HelpCircle, AlertCircle,
  LayoutGrid, Kanban 
} from 'lucide-react';

interface ProjectTrackerProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  onAddTask: (title: string, projectId: string, priority: 'High' | 'Medium' | 'Low', dueDate: string) => void;
}

export default function ProjectTracker({
  projects,
  setProjects,
  tasks,
  setTasks,
  onAddTask
}: ProjectTrackerProps) {
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  // Drag and Drop settings for Project Columns
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<Project['status'] | null>(null);

  // Drag and drop settings for tasks
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropTaskColumn, setActiveDropTaskColumn] = useState<string | null>(null); // format: `${projId}-${status}`

  // New Project State
  const [newProjName, setNewProjName] = useState('');
  const [newProjEmoji, setNewProjEmoji] = useState('🚀');
  const [newProjStatus, setNewProjStatus] = useState<Project['status']>('Planning');
  const [newProjPriority, setNewProjPriority] = useState<Project['priority']>('Medium');
  const [newProjCategory, setNewProjCategory] = useState('Personal');
  const [newProjDeadline, setNewProjDeadline] = useState('');
  const [newProjDescription, setNewProjDescription] = useState('');

  // Quick Task State inside custom project expander
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjName.trim(),
      emoji: newProjEmoji,
      status: newProjStatus,
      priority: newProjPriority,
      category: newProjCategory.trim() || 'General',
      deadline: newProjDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: newProjDescription.trim() || 'No description provided.'
    };

    setProjects([...projects, newProject]);
    setNewProjName('');
    setNewProjDescription('');
    setShowAddProject(false);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details card
    setProjects(projects.filter(p => p.id !== id));
    // Unlink tasks
    setTasks(tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Helper: calculate project completion rate based on tasks
  const getProjectProgress = (projId: string) => {
    const projTasks = tasks.filter(t => t.projectId === projId);
    if (projTasks.length === 0) return 0;
    const completedTasks = projTasks.filter(t => t.status === 'Completed');
    return Math.round((completedTasks.length / projTasks.length) * 100);
  };

  const getStatusBadgeStyle = (status: Project['status']) => {
    switch (status) {
      case 'Planning':
        return 'bg-gray-150 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border border-blue-105 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30';
      case 'Blocked':
        return 'bg-red-50 text-red-700 border border-red-105 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/30';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-110 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-250';
    }
  };

  const getPriorityStyle = (priority: Project['priority']) => {
    switch (priority) {
      case 'High': return 'text-red-650 dark:text-red-400 font-bold';
      case 'Medium': return 'text-amber-650 dark:text-amber-400 font-medium';
      case 'Low': return 'text-gray-450 dark:text-neutral-500';
    }
  };

  // Project Drag Events
  const handleProjectDragStart = (e: React.DragEvent, projId: string) => {
    e.dataTransfer.setData('text/plain', projId);
    setDraggedProjectId(projId);
  };

  const handleProjectDragEnd = () => {
    setDraggedProjectId(null);
    setActiveDropColumn(null);
  };

  const handleProjectDrop = (status: Project['status']) => {
    if (!draggedProjectId) return;
    setProjects(projects.map(p => p.id === draggedProjectId ? { ...p, status } : p));
    setDraggedProjectId(null);
    setActiveDropColumn(null);
  };

  // Task Drag Events
  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
    setActiveDropTaskColumn(null);
  };

  const handleTaskDrop = (targetStatus: Task['status']) => {
    if (!draggedTaskId) return;
    setTasks(tasks.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));
    setDraggedTaskId(null);
    setActiveDropTaskColumn(null);
  };

  return (
    <div className="space-y-6">
      {/* Upper Action Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white font-display tracking-tight uppercase flex items-center space-x-1.5 prose">
            <span>PROJECT MANAGER</span>
            <span className="font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black">{projects.length} ACTIVE</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-450 mt-0.5">Define core focal streams and follow real-time progress calculations automatically.</p>
        </div>
        
        <div className="flex items-center space-x-3.5 self-center sm:self-auto shrink-0 select-none">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-gray-205 dark:border-neutral-750/70">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all font-semibold ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-neutral-750/30'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all font-semibold ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-neutral-750/30'
              }`}
            >
              <Kanban className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline">Kanban Board</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddProject(!showAddProject)}
            id="trigger-add-project-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-750 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Slide-out Add Project Form */}
      {showAddProject && (
        <form onSubmit={handleCreateProject} className="p-5 rounded-2xl border border-gray-150 dark:border-neutral-850 bg-white dark:bg-neutral-900 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-gray-100 dark:border-neutral-850">
            <span className="text-lg">📁</span>
            <h4 className="text-xs font-bold text-gray-700 dark:text-neutral-200 uppercase tracking-widest">ADD CORE WORKSPACE CHANNEL</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="e.g. Launch Personal Brand"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-850/80 outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Icon Emoji</label>
                <select
                  value={newProjEmoji}
                  onChange={(e) => setNewProjEmoji(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-850/80 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                >
                  <option value="🚀">🚀 Launch</option>
                  <option value="💻">💻 Code</option>
                  <option value="🧘‍♀️">🧘‍♀️ Mind</option>
                  <option value="🎨">🎨 Art</option>
                  <option value="🏃‍♂️">🏃‍♂️ Health</option>
                  <option value="🌿">🌿 Nature</option>
                  <option value="📈">📈 Career</option>
                  <option value="📚">📚 Book</option>
                  <option value="💰">💰 Finance</option>
                  <option value="🏡">🏡 House</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Stream Category</label>
                <input
                  type="text"
                  value={newProjCategory}
                  onChange={(e) => setNewProjCategory(e.target.value)}
                  placeholder="e.g. Career, Health"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-850/80 outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={newProjStatus}
                onChange={(e) => setNewProjStatus(e.target.value as Project['status'])}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-850/80 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
              >
                <option value="Planning">📌 Planning</option>
                <option value="In Progress">⚡ In Progress</option>
                <option value="Blocked">⚠️ Blocked</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={newProjPriority}
                  onChange={(e) => setNewProjPriority(e.target.value as Project['priority'])}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-850/80 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                >
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">⚪ Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Target Date</label>
                <input
                  type="date"
                  value={newProjDeadline}
                  onChange={(e) => setNewProjDeadline(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-850/80 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Mission / Brief Summary</label>
            <textarea
              value={newProjDescription}
              onChange={(e) => setNewProjDescription(e.target.value)}
              placeholder="What target objective defines this project's completion?"
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-850/80 outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2.5">
            <button
              type="button"
              onClick={() => setShowAddProject(false)}
              className="px-3.5 py-2 text-xs rounded-lg bg-gray-100 hover:bg-gray-150 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-650 dark:text-neutral-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs rounded-lg bg-blue-650 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
            >
              Save Stream
            </button>
          </div>
        </form>
      )}

      {/* View Mode Switching: Kanban Column board vs standard grid */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
          {(['Planning', 'In Progress', 'Blocked', 'Completed'] as Project['status'][]).map((colStatus) => {
            const statusProjects = projects.filter(p => p.status === colStatus);
            const isOverThisCol = activeDropColumn === colStatus;

            return (
              <div
                key={colStatus}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedProjectId) {
                    setActiveDropColumn(colStatus);
                  }
                }}
                onDragLeave={() => setActiveDropColumn(null)}
                onDrop={() => handleProjectDrop(colStatus)}
                className={`p-4 rounded-xl border flex flex-col min-h-[480px] transition-all bg-opacity-40 ${
                  isOverThisCol
                    ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(109,95,252,0.25)] ring-2 ring-blue-500/20'
                    : 'bg-black/20 dark:bg-neutral-950/20 border-gray-150/70 dark:border-neutral-850/40'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-150/50 dark:border-neutral-850/50 mb-3.5">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${
                      colStatus === 'Planning' ? 'bg-gray-400' : colStatus === 'In Progress' ? 'bg-blue-500 animate-pulse' : colStatus === 'Blocked' ? 'bg-red-500' : 'bg-emerald-500'
                    }`} />
                    <h4 className="text-[11px] font-bold text-gray-800 dark:text-neutral-200 uppercase tracking-widest leading-none font-display">
                      {colStatus}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-neutral-500 bg-gray-50 dark:bg-neutral-800/80 px-2 py-0.5 rounded-full">
                    {statusProjects.length}
                  </span>
                </div>

                {/* Column List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-0.5">
                  {statusProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 dark:border-neutral-800/60 rounded-xl px-2">
                      <HelpCircle className="h-5 w-5 text-gray-300 dark:text-neutral-700 mb-1.5" />
                      <p className="text-[9px] text-gray-400 dark:text-neutral-500 italic">
                        Empty lane
                      </p>
                      <p className="text-[8px] text-gray-400/80 dark:text-neutral-600 mt-0.5">
                        Drag channels here
                      </p>
                    </div>
                  ) : (
                    statusProjects.map((proj) => {
                      const progress = getProjectProgress(proj.id);
                      const projTasks = tasks.filter(t => t.projectId === proj.id);
                      const isSelected = selectedProjectId === proj.id;

                      return (
                        <div
                          key={proj.id}
                          draggable="true"
                          onDragStart={(e) => handleProjectDragStart(e, proj.id)}
                          onDragEnd={handleProjectDragEnd}
                          onClick={() => setSelectedProjectId(isSelected ? null : proj.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-md relative group/prow select-none ${
                            isSelected
                              ? 'bg-neutral-50/90 dark:bg-neutral-850/80 border-indigo-400 dark:border-indigo-900 ring-2 ring-indigo-500/10'
                              : 'bg-white dark:bg-neutral-900 border-gray-150/80 dark:border-neutral-850/70 hover:border-gray-250 dark:hover:border-neutral-800'
                          } ${draggedProjectId === proj.id ? 'opacity-40 border-dashed border-gray-400' : ''}`}
                        >
                          {/* Card header */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="h-6 w-6 shrink-0 rounded-lg bg-gray-50 dark:bg-neutral-850 border border-gray-100 dark:border-neutral-800 flex items-center justify-center text-xs">{proj.emoji}</span>
                              <div className="truncate">
                                <h5 className="text-[11px] font-bold text-gray-900 dark:text-white truncate font-display leading-none">
                                  {proj.name}
                                </h5>
                                <span className="text-[8px] font-mono text-gray-400 dark:text-neutral-550 uppercase tracking-wider">{proj.category}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteProject(proj.id, e)}
                              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover/prow:opacity-100 transition-all cursor-pointer flex-shrink-0"
                              title="Delete project"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <p className="text-[10px] text-gray-500 dark:text-neutral-400 leading-relaxed mt-2 line-clamp-2 select-none">
                            {proj.description}
                          </p>

                          {/* Progress calculations */}
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-[9px] font-semibold text-gray-400 mb-0.5">
                              <span>Progression</span>
                              <span className="text-gray-750 dark:text-neutral-300 font-mono font-bold">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-1 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 dark:bg-emerald-450 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer parameters */}
                          <div className="mt-3 pt-2 border-t border-gray-50 dark:border-neutral-850/50 flex items-center justify-between text-[8px] font-mono text-gray-400">
                            <span className="flex items-center space-x-0.5">
                              <Calendar className="h-2.5 w-2.5 text-blue-500" />
                              <span className="truncate max-w-[55px]">{proj.deadline}</span>
                            </span>
                            <span className={`${getPriorityStyle(proj.priority)}`}>
                              {proj.priority}
                            </span>
                          </div>

                          {/* Details task Kanban inside Kanban project card */}
                          {isSelected && (
                            <div
                              className="mt-4 pt-3 border-t border-gray-100 dark:border-neutral-800/80 space-y-3 cursor-default"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h5 className="text-[9px] font-bold text-[#A1A1AA] tracking-widest uppercase mb-1">
                                SUB-TASK WORKSPACES
                              </h5>

                              {/* Interactive mini task status cols */}
                              <div className="grid grid-cols-1 gap-2.5">
                                {(['To Do', 'In Progress', 'Completed'] as Task['status'][]).map((taskStatus) => {
                                  const statusTasks = projTasks.filter(t => t.status === taskStatus);
                                  const isOverTaskCol = activeDropTaskColumn === `${proj.id}-${taskStatus}`;

                                  return (
                                    <div
                                      key={taskStatus}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggedTaskId) {
                                          setActiveDropTaskColumn(`${proj.id}-${taskStatus}`);
                                        }
                                      }}
                                      onDragLeave={() => setActiveDropTaskColumn(null)}
                                      onDrop={() => handleTaskDrop(taskStatus)}
                                      className={`p-2 rounded-xl border flex flex-col min-h-[60px] transition-all ${
                                        isOverTaskCol
                                          ? 'bg-indigo-500/10 border-indigo-500'
                                          : 'bg-black/10 dark:bg-neutral-900/10 border-gray-100 dark:border-neutral-850'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-gray-50 dark:border-neutral-850">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{taskStatus}</span>
                                        <span className="text-[8px] font-mono text-gray-500">{statusTasks.length}</span>
                                      </div>

                                      <div className="space-y-1">
                                        {statusTasks.length === 0 ? (
                                          <p className="text-[8px] text-gray-400 italic text-center py-1">Drop here</p>
                                        ) : (
                                          statusTasks.map(t => (
                                            <div
                                              key={t.id}
                                              draggable="true"
                                              onDragStart={(e) => handleTaskDragStart(e, t.id)}
                                              onDragEnd={handleTaskDragEnd}
                                              className={`p-1.5 rounded bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 text-[9px] flex items-center justify-between cursor-grab hover:border-gray-300 dark:hover:border-neutral-700 ${
                                                draggedTaskId === t.id ? 'opacity-40' : ''
                                              }`}
                                            >
                                              <span className="truncate pr-1 max-w-[100px]">{t.title}</span>
                                              <button
                                                onClick={() => handleDeleteTask(t.id)}
                                                className="p-0.5 rounded text-gray-400 hover:text-red-500"
                                              >
                                                <Trash2 className="h-2 w-2" />
                                              </button>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Quick input inside Kanban details */}
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={quickTaskTitle}
                                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                                  placeholder="Subtask name..."
                                  className="w-full px-2 py-1 text-[10px] rounded border border-gray-205 dark:border-neutral-750 bg-white/80 dark:bg-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!quickTaskTitle.trim()) return;
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    onAddTask(quickTaskTitle.trim(), proj.id, 'Medium', todayStr);
                                    setQuickTaskTitle('');
                                  }}
                                  className="w-full py-1 bg-blue-650 hover:bg-blue-700 text-white rounded text-[9px] font-bold transition-all"
                                >
                                  Add Subtask
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Original Premium Grid of Projects */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
          {projects.map((proj) => {
            const progress = getProjectProgress(proj.id);
            const projTasks = tasks.filter(t => t.projectId === proj.id);
            const completedTasksCount = projTasks.filter(t => t.status === 'Completed').length;
            const isSelected = selectedProjectId === proj.id;

            return (
              <div
                key={proj.id}
                draggable="true"
                onDragStart={(e) => handleProjectDragStart(e, proj.id)}
                onDragEnd={handleProjectDragEnd}
                onClick={() => setSelectedProjectId(isSelected ? null : proj.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative group/prow shadow-sm backdrop-blur-md select-none ${
                  isSelected
                    ? 'bg-neutral-50/70 dark:bg-neutral-850/50 border-indigo-400 dark:border-neutral-700 ring-1 ring-indigo-500/15'
                    : 'bg-white/75 dark:bg-neutral-900/60 border-gray-150/80 dark:border-neutral-850/70 hover:shadow-md hover:border-gray-250 dark:hover:border-neutral-800'
                } ${draggedProjectId === proj.id ? 'opacity-40 border-dashed border-gray-400' : ''}`}
              >
                {/* Header section on card */}
                <div className="flex items-start justify-between gap-2 bg-transparent">
                  <div className="flex items-center space-x-2.5">
                    <span className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-neutral-850 border border-gray-100 dark:border-neutral-800 flex items-center justify-center text-xl">{proj.emoji}</span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-905 dark:text-white group-hover/prow:text-blue-600 dark:group-hover/prow:text-blue-400 font-display transition-colors">
                        {proj.name}
                      </h4>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase tracking-widest leading-none mt-0.5">{proj.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusBadgeStyle(proj.status)}`}>
                      {proj.status}
                    </span>
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover/prow:opacity-100 transition-all cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-550 dark:text-neutral-400 leading-relaxed mt-3.5 line-clamp-2">
                  {proj.description}
                </p>

                {/* Deadline & Priority Summary */}
                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-neutral-850 flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span className="flex items-center space-x-1 font-semibold text-[#A1A1AA]">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    <span>Due: {proj.deadline}</span>
                  </span>
                  <span>
                    Priority: <span className={`${getPriorityStyle(proj.priority)}`}>{proj.priority}</span>
                  </span>
                </div>

                {/* Calculated dynamic dynamic progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-gray-450 mb-1">
                    <span>Stream Progression</span>
                    <span className="text-gray-700 dark:text-neutral-300 font-mono font-bold">
                      {completedTasksCount}/{projTasks.length} ({progress}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 dark:bg-emerald-450 rounded-full transition-all duration-550"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Card Details (using Task Kanban columns inside selector drawer) */}
                {isSelected && (
                  <div
                    className="mt-5 pt-4 border-t border-gray-150 dark:border-neutral-800 space-y-4 animate-in fade-in duration-200"
                    onClick={(e) => e.stopPropagation()} // Stop toggle when crawling inside details
                  >
                    <div>
                      <h5 className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#6D5FFC]" />
                        <span>Interactive Sub-Task Boards:</span>
                      </h5>

                      {projTasks.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic py-2 pl-1 select-none">
                          No active workflow tasks allocated to this project workspace.
                        </p>
                      ) : (
                        /* Beautiful 3 column Kanban list for Sub-tasks in GRID view */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          {(['To Do', 'In Progress', 'Completed'] as Task['status'][]).map((taskStatus) => {
                            const statusTasks = projTasks.filter(t => t.status === taskStatus);
                            const isOverThisTaskCol = activeDropTaskColumn === `${proj.id}-${taskStatus}`;

                            return (
                              <div
                                key={taskStatus}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (draggedTaskId) {
                                    setActiveDropTaskColumn(`${proj.id}-${taskStatus}`);
                                  }
                                }}
                                onDragLeave={() => setActiveDropTaskColumn(null)}
                                onDrop={() => handleTaskDrop(taskStatus)}
                                className={`p-3 rounded-xl border flex flex-col min-h-[140px] transition-all ${
                                  isOverThisTaskCol
                                    ? 'bg-indigo-50/15 border-indigo-400 dark:bg-indigo-950/20 shadow-[0_0_12px_rgba(109,95,252,0.15)] ring-1 ring-indigo-500/20'
                                    : 'bg-gray-50/30 dark:bg-neutral-850/30 border-gray-150/40 dark:border-neutral-800/80 hover:border-gray-200/60 dark:hover:border-neutral-750/70'
                                }`}
                              >
                                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-neutral-800/80 mb-2 select-none">
                                  <span className="text-[9px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest flex items-center space-x-1">
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      taskStatus === 'To Do' ? 'bg-gray-400' : taskStatus === 'In Progress' ? 'bg-blue-400 bg-opacity-70' : 'bg-emerald-400'
                                    }`} />
                                    <span>{taskStatus}</span>
                                  </span>
                                  <span className="text-[9px] font-mono text-gray-400 bg-gray-100 dark:bg-neutral-800 px-1 rounded">
                                    {statusTasks.length}
                                  </span>
                                </div>

                                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-44 pr-0.5">
                                  {statusTasks.length === 0 ? (
                                    <p className="text-[9px] text-gray-400 dark:text-neutral-500 italic py-6 text-center select-none">
                                      Drop tasks here
                                    </p>
                                  ) : (
                                    statusTasks.map(t => {
                                      const isCompleted = t.status === 'Completed';

                                      return (
                                        <div
                                          key={t.id}
                                          draggable="true"
                                          onDragStart={(e) => handleTaskDragStart(e, t.id)}
                                          onDragEnd={handleTaskDragEnd}
                                          className={`p-2 rounded bg-white dark:bg-neutral-900 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-900 border border-gray-105/50 dark:border-neutral-850 transition-all cursor-move active:scale-[0.98] ${
                                            draggedTaskId === t.id ? 'opacity-40 border-dashed border-gray-400' : 'shadow-2xs'
                                          }`}
                                        >
                                          <div className="flex items-start space-x-1.5 justify-between">
                                            <div className="flex items-center space-x-2 truncate">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setTasks(tasks.map(tsk => tsk.id === t.id ? { ...tsk, status: tsk.status === 'Completed' ? 'To Do' : 'Completed' } : tsk));
                                                }}
                                                className={`h-3.5 w-3.5 rounded flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border ${
                                                  isCompleted ? 'bg-emerald-500 border-none text-white' : 'border-gray-300 dark:border-neutral-600'
                                                }`}
                                              >
                                                {isCompleted && <CheckSquare className="h-2.5 w-2.5 stroke-[2.5] text-white" />}
                                              </button>
                                              <span className={`text-[10px] leading-snug truncate ${isCompleted ? 'line-through text-gray-400 dark:text-neutral-550' : 'text-gray-700 dark:text-neutral-200'}`}>
                                                {t.title}
                                              </span>
                                            </div>

                                            <button
                                              onClick={() => handleDeleteTask(t.id)}
                                              className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer flex-shrink-0"
                                              title="Remove"
                                            >
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </button>
                                          </div>

                                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50/50 dark:border-neutral-850/50">
                                            <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${
                                              t.priority === 'High' ? 'text-red-500 bg-red-50/50 dark:bg-red-950/20' : t.priority === 'Medium' ? 'text-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : 'text-gray-450 bg-gray-50 border border-gray-150'
                                            }`}>
                                              {t.priority}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Inline quick task insertion inside project expander */}
                    <div className="pt-3 border-t border-gray-50 dark:border-neutral-850 p-3 bg-gray-50/50 dark:bg-neutral-850 rounded-xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest pl-0.5">Quick Add Linked Task</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={quickTaskTitle}
                          onChange={(e) => setQuickTaskTitle(e.target.value)}
                          placeholder="Type task task title..."
                          className="flex-1 px-2.5 py-1.5 text-xs rounded border border-gray-205 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                        />
                        <div className="flex gap-2 justify-end">
                          <select
                            value={quickTaskPriority}
                            onChange={(e) => setQuickTaskPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                            className="px-1.5 py-1 text-xs rounded border border-gray-205 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-white cursor-pointer"
                          >
                            <option value="High">🔴 High</option>
                            <option value="Medium">🟡 Med</option>
                            <option value="Low">⚪ Low</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quickTaskTitle.trim()) return;
                              const todayStr = new Date().toISOString().split('T')[0];
                              onAddTask(quickTaskTitle.trim(), proj.id, quickTaskPriority, todayStr);
                              setQuickTaskTitle('');
                              setQuickTaskPriority('Medium');
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold leading-none flex items-center justify-center cursor-pointer transition-all active:scale-95"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Internal small helper to avoid import complexity
function CheckSquare({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
