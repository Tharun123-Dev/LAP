import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { MEMBERS } from '../data/mockData';
import {
  ArrowLeft,
  Edit,
  Clock,
  Calendar,
  UserCheck,
  UserPlus,
  Paperclip,
  MessageSquare,
  History,
  Tag,
  Link,
  Trash2,
  CheckCircle,
  FileText,
  Download,
  CornerDownRight,
  Send,
  AlertTriangle,
  ChevronRight,
  Edit2,
  X
} from 'lucide-react';

export default function TaskDetails() {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    setActivePage,
    currentUser,
    addComment,
    deleteComment,
    updateTask
  } = useTasks();

  const task = tasks.find(t => t.id === selectedTaskId);
  
  // Local comment edit states
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={40} className="text-rose-500 mb-4" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Task Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">This task might have been deleted or archived.</p>
        <button
          onClick={() => setActivePage('tasks-list')}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Back to List
        </button>
      </div>
    );
  }

  // Styles map
  const statusStyleMap = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350',
    inProgress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    onHold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
  };

  const priorityStyleMap = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-455'
  };

  const getStatusLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    const isTaskOverdue = task.status !== 'completed' && task.status !== 'cancelled' && new Date(task.dueDate) < new Date(today);
    
    if (isTaskOverdue) return { label: 'Overdue', style: statusStyleMap.overdue };
    
    const labelMap = {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      onHold: 'On Hold',
      cancelled: 'Cancelled'
    };

    return { 
      label: labelMap[task.status] || 'Pending', 
      style: statusStyleMap[task.status] || statusStyleMap.pending 
    };
  };

  const statusLabel = getStatusLabel();

  // Comments handlers
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText);
    setCommentText('');
  };

  const handleEditCommentInit = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleSaveEditedComment = (commentId) => {
    if (!editCommentText.trim()) return;

    // Update the task comments using updateTask helper
    const updatedComments = (task.comments || []).map(c => 
      c.id === commentId ? { ...c, content: editCommentText } : c
    );

    const historyEntry = {
      id: `h-${Math.random().toString(36).substr(2, 9)}`,
      user: currentUser.name,
      action: 'Comment Updated',
      details: 'Edited a discussion comment',
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    updateTask({
      ...task,
      comments: updatedComments,
      history: [...(task.history || []), historyEntry]
    });

    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleDeleteComment = (commentId) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(task.id, commentId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedTaskId(null);
              setActivePage('tasks-list');
            }}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition-colors shadow-soft cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-550 uppercase">
                {task.id}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${statusLabel.style}`}>
                {statusLabel.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                priorityStyleMap[task.priority] || priorityStyleMap.medium
              }`}>
                {task.priority} Priority
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              {task.title}
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            // Context already has selectedTaskId, just switch page to CreateTask which functions as editor
            setActivePage('create-task');
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:scale-[1.02] cursor-pointer shadow-soft"
        >
          <Edit size={14} />
          Edit Task Details
        </button>
      </div>

      {/* Grid Layout: Left is Main Info & Discussion, Right is Metadata Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Full Description Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-900 pb-3">
              Task Description
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-normal whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Attachments Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-900 pb-3 flex items-center gap-2">
              <Paperclip size={14} className="text-slate-400" />
              Attachments ({task.attachments?.length || 0})
            </h3>
            
            {(!task.attachments || task.attachments.length === 0) ? (
              <div className="text-xs text-slate-450 dark:text-slate-500 py-2">
                No attachments uploaded. Edit the task to upload assets.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {task.attachments.map(att => (
                  <div 
                    key={att.id} 
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 group hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <FileText size={16} />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{att.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{att.size}</span>
                      </div>
                    </div>
                    <button 
                      title="Download file"
                      className="p-1.5 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-655 cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-900 pb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-slate-400" />
              Discussion Comments ({task.comments?.length || 0})
            </h3>

            {/* Comments List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {(!task.comments || task.comments.length === 0) ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                  No comments yet. Start the discussion below!
                </div>
              ) : (
                task.comments.map((comment) => {
                  const isOwnComment = comment.author?.id === currentUser.id;
                  const isEditing = editingCommentId === comment.id;

                  return (
                    <div key={comment.id} className="flex items-start gap-3.5 group/comment">
                      <img
                        src={comment.author?.avatar}
                        alt={comment.author?.name}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover mt-0.5"
                      />
                      
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {comment.author?.name}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                              {comment.timestamp}
                            </span>
                          </div>

                          {isOwnComment && !isEditing && (
                            <div className="opacity-0 group-hover/comment:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                onClick={() => handleEditCommentInit(comment)}
                                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-655 cursor-pointer"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2.5 py-1 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEditedComment(comment.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-normal whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-900">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover hidden sm:block"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type a comment... Use @ to mention assignees"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Send size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: 4 Columns - Metadata & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Assignment & Details Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-900 pb-3 uppercase tracking-wider">
              Task Details Context
            </h3>

            <div className="space-y-4 text-xs">
              {/* Assignee */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned To</span>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-900">
                  <img
                    src={task.assignedTo?.avatar}
                    alt={task.assignedTo?.name}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                  />
                  <div className="flex flex-col truncate">
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{task.assignedTo?.name}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold truncate">{task.assignedTo?.role}</span>
                  </div>
                </div>
              </div>

              {/* Assigner */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned By</span>
                <div className="flex items-center gap-3">
                  <img
                    src={task.assignedBy?.avatar}
                    alt={task.assignedBy?.name}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                  />
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-slate-655 dark:text-slate-355 truncate">{task.assignedBy?.name}</span>
                    <span className="text-[9px] text-slate-400 truncate">{task.assignedBy?.email}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-900 my-4" />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {task.startDate}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {task.dueDate}
                  </span>
                </div>
              </div>

              {/* Related module */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Related CRM Module</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 capitalize">
                  <Link size={12} className="text-blue-500" />
                  {task.relatedModule}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related Records Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-900 pb-3 flex items-center gap-2">
              <Link size={13} className="text-indigo-500" />
              Related Records
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900 rounded-xl space-y-1">
                <span className="text-[8px] font-extrabold uppercase text-indigo-500">Student Enrollment</span>
                <div className="font-bold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer flex items-center justify-between">
                  <span>Batch of Summer 2026 Intake</span>
                  <ChevronRight size={12} />
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900 rounded-xl space-y-1">
                <span className="text-[8px] font-extrabold uppercase text-emerald-500">Academic Term Calendar</span>
                <div className="font-bold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer flex items-center justify-between">
                  <span>Term II Evaluation Plan</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline Stream */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-150 border-b border-slate-100 dark:border-slate-900 pb-3 flex items-center gap-2">
              <History size={14} className="text-slate-400" />
              Activity History
            </h3>

            <div className="relative border-l border-slate-100 dark:border-slate-900 ml-2.5 pl-4 space-y-4 max-h-[300px] overflow-y-auto">
              {(!task.history || task.history.length === 0) ? (
                <div className="text-xs text-slate-450 dark:text-slate-500 py-1">No activities logged yet.</div>
              ) : (
                task.history.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative group/history">
                    {/* Timeline bullet indicator */}
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover/history:bg-blue-500 transition-colors border-2 border-white dark:border-slate-950" />
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {hist.user}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-50 dark:bg-slate-900 text-[8px] font-bold text-slate-400 border border-slate-100 dark:border-slate-900 uppercase">
                          {hist.action}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {hist.details}
                      </p>
                      <span className="text-[8px] text-slate-400 font-semibold block pt-0.5">
                        {hist.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}