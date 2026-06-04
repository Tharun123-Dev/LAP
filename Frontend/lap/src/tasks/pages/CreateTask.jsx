import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { TAGS, RELATED_MODULES } from '../data/mockData';
import { 
  Paperclip, 
  Trash2, 
  Save, 
  FileText, 
  X, 
  ArrowLeft,
  CalendarDays,
  User,
  Tags,
  Briefcase
} from 'lucide-react';

export default function CreateTask() {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    selectedTaskId, 
    setSelectedTaskId, 
    setActivePage,
    currentUser,
    members,
  } = useTasks();

  const isEditMode = !!selectedTaskId;
  const editingTask = isEditMode ? tasks.find(t => t.id === selectedTaskId) : null;

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [assignedToId, setAssignedToId] = useState('');
  const [assignedById, setAssignedById] = useState(currentUser.id);
  const [selectedTags, setSelectedTags] = useState([]);
  const [relatedModule, setRelatedModule] = useState(RELATED_MODULES[0]);
  
  // Attachments State
  const [attachments, setAttachments] = useState([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');

  // Pre-fill form if in Edit Mode
  useEffect(() => {
    if (isEditMode && editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setStartDate(editingTask.startDate || new Date().toISOString().split('T')[0]);
      setDueDate(editingTask.dueDate);
      setAssignedToId(editingTask.assignedTo?.id || members[0]?.id || '');
      setAssignedById(editingTask.assignedBy?.id || currentUser.id);
      setSelectedTags(editingTask.tags || []);
      setRelatedModule(editingTask.relatedModule || RELATED_MODULES[0]);
      setAttachments(editingTask.attachments || []);
    } else {
      // Reset to defaults
      setTitle('');
      setDescription('');
      setStatus('pending');
      setPriority('medium');
      setStartDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDueDate(d.toISOString().split('T')[0]);
      setAssignedToId(members[0]?.id || '');
      setAssignedById(currentUser.id);
      setSelectedTags([]);
      setRelatedModule(RELATED_MODULES[0]);
      setAttachments([]);
    }
  }, [isEditMode, editingTask, currentUser, members]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleAddAttachment = (e) => {
    e.preventDefault();
    if (!newAttachmentName.trim()) return;

    const mockAttachment = {
      id: `att-${Math.floor(100 + Math.random() * 900)}`,
      name: newAttachmentName.endsWith('.pdf') || newAttachmentName.endsWith('.docx') || newAttachmentName.endsWith('.xlsx') || newAttachmentName.endsWith('.png') || newAttachmentName.endsWith('.jpg')
        ? newAttachmentName
        : `${newAttachmentName}.pdf`,
      size: `${Math.floor(100 + Math.random() * 800)} KB`,
      type: newAttachmentName.includes('.') ? newAttachmentName.split('.').pop() : 'pdf',
      url: '#'
    };

    setAttachments(prev => [...prev, mockAttachment]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (attId) => {
    setAttachments(prev => prev.filter(att => att.id !== attId));
  };

  const handleCancel = () => {
    setSelectedTaskId(null);
    setActivePage('tasks-list');
  };

  const handleSubmit = (e, isDraft = false) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const assignee = members.find(m => String(m.id) === String(assignedToId)) || members[0];
    const assigner = members.find(m => String(m.id) === String(assignedById)) || currentUser;

    const taskPayload = {
      title,
      description,
      status: isDraft ? 'pending' : status,
      priority,
      startDate,
      dueDate,
      assignedTo: assignee,
      assignedBy: assigner,
      tags: selectedTags,
      attachments,
      relatedModule,
    };

    if (isEditMode) {
      updateTask({
        ...editingTask,
        ...taskPayload
      });
    } else {
      addTask(taskPayload);
    }

    setSelectedTaskId(null);
    setActivePage('tasks-list');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleCancel}
          className="p-2 hover:bg-white dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors shadow-soft cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isEditMode ? 'Modify Task Details' : 'Create Operational Task'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {isEditMode ? `Updating database entry for ${editingTask.id}` : 'Fill in the fields to dispatch a new task in the CRM/HRMS network'}
          </p>
        </div>
      </div>

      {/* Main Form container */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-blue-500" />
              Basic Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Task Title</label>
                <input
                  type="text"
                  placeholder="Summarize the action or issue..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Description / Instructions</label>
                <textarea
                  placeholder="Provide detailed logs, steps to reproduce, or workflow requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200 resize-y leading-relaxed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dates & Assignment */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays size={14} className="text-blue-500" />
              Timeline & Assignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Assigned To</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Assigned By</label>
                <select
                  value={assignedById}
                  onChange={(e) => setAssignedById(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Task Settings, Modules, Tags & Attachments */}
        <div className="space-y-6">
          
          {/* Settings Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={14} className="text-blue-500" />
              Task Context
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="pending">Pending</option>
                  <option value="inProgress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="onHold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Related System Module</label>
                <select
                  value={relatedModule}
                  onChange={(e) => setRelatedModule(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  {RELATED_MODULES.map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags Configuration */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider flex items-center gap-2">
              <Tags size={14} className="text-blue-500" />
              Categorization Tags
            </h3>

            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider flex items-center gap-2">
              <Paperclip size={14} className="text-blue-500" />
              Attachments (Upload Simulation)
            </h3>

            {/* Input field to simulate file attachment */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filename e.g. error_log.png"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-3 mt-3">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-slate-400" />
                      <div className="flex flex-col truncate">
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-350 truncate">{att.name}</span>
                        <span className="text-[8px] text-slate-400">{att.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Action Buttons Footer */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-32 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-355 rounded-xl text-xs font-semibold cursor-pointer text-center transition-all"
          >
            Cancel
          </button>
          
          {!isEditMode && (
            <button
              type="button"
              onClick={() => handleSubmit(null, true)}
              className="w-full sm:w-36 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200 dark:border-slate-800"
            >
              Save Draft
            </button>
          )}

          <button
            type="submit"
            className="w-full sm:w-44 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            {isEditMode ? 'Update Database Task' : 'Save & Publish Task'}
          </button>
        </div>

      </form>
    </div>
  );
}
