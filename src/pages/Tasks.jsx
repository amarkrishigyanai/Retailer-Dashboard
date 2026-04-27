import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClipboardList, Plus, Pencil, Trash2, Eye, X, CheckCircle, Clock, AlertCircle, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAssignedTasks, fetchTaskStats, createTask, updateTask, deleteTask, fetchTaskById } from '../store/thunks/taskThunk';
import { clearDetail } from '../store/slices/taskSlice';
import { fetchMembers } from '../store/thunks/membersThunk';

const PRIORITY_STYLE = {
  Low:    'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High:   'bg-red-100 text-red-700',
};
const STATUS_STYLE = {
  Pending:     'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed:   'bg-green-100 text-green-700',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

const EMPTY_FORM = { title: '', description: '', assignedTo: '', priority: 'Medium', category: '', date: '', deadline: '', location: '', notes: '' };

export default function Tasks() {
  const dispatch = useDispatch();
  const { tasks, stats, detail, loading, actionLoading } = useSelector((s) => s.tasks);
  const { members } = useSelector((s) => s.members);

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [priorityFilter, setPriority] = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    dispatch(fetchAssignedTasks());
    dispatch(fetchTaskStats());
    dispatch(fetchMembers());
  }, [dispatch]);

  const staffMembers = members.filter((m) => ['staff', 'retailer'].includes(m.role?.toLowerCase()));

  const filtered = tasks.filter((t) => {
    const matchSearch   = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = !statusFilter   || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCreate = () => { setEditTask(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit   = (t) => {
    setEditTask(t);
    setForm({
      title: t.title || '', description: t.description || '',
      assignedTo: t.assignedTo?._id || t.assignedTo || '',
      priority: t.priority || 'Medium', category: t.category || '',
      date: t.date ? t.date.slice(0, 10) : '',
      deadline: t.deadline ? t.deadline.slice(0, 10) : '',
      location: t.location || '', notes: t.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.description) delete payload.description;
    if (!payload.category)    delete payload.category;
    if (!payload.location)    delete payload.location;
    if (!payload.notes)       delete payload.notes;

    if (editTask) {
      const res = await dispatch(updateTask({ taskId: editTask._id, data: payload }));
      if (!res.error) { toast.success('Task updated'); setShowForm(false); }
      else toast.error(res.payload || 'Update failed');
    } else {
      const res = await dispatch(createTask(payload));
      if (!res.error) { toast.success('Task created'); setShowForm(false); dispatch(fetchTaskStats()); }
      else toast.error(res.payload || 'Create failed');
    }
  };

  const handleDelete = async () => {
    const res = await dispatch(deleteTask(deleteConfirm));
    if (!res.error) { toast.success('Task deleted'); dispatch(fetchTaskStats()); }
    else toast.error(res.payload || 'Delete failed');
    setDeleteConfirm(null);
  };

  const handleView = (id) => {
    dispatch(fetchTaskById(id));
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Task Management</h1>
          <p className="text-sm text-gray-500">Assign and track tasks for your team</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" /> Assign Task
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Assigned"  value={stats?.total      ?? tasks.length} color="bg-brand-50 text-brand-600" />
        <StatCard icon={Clock}         label="Pending"         value={stats?.pending     ?? tasks.filter((t) => t.status === 'Pending').length}     color="bg-gray-50 text-gray-600" />
        <StatCard icon={AlertCircle}   label="In Progress"     value={stats?.inProgress  ?? tasks.filter((t) => t.status === 'In Progress').length}  color="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle}   label="Completed"       value={stats?.completed   ?? tasks.filter((t) => t.status === 'Completed').length}    color="bg-green-50 text-green-600" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex flex-wrap items-center gap-3">
          <h3 className="font-semibold text-gray-800 mr-auto">Assigned Tasks</h3>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-44"
          />
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Priority</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Title', 'Assigned To', 'Priority', 'Status', 'Date', 'Deadline', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(7).fill(0).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
                : filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.assignedTo?.firstName
                        ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_STYLE[t.priority] || 'bg-gray-100 text-gray-600'}`}>
                        {t.priority || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-600'}`}>
                        {t.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(t.date)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(t.deadline)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(t._id)} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(t._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No tasks found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-800">{editTask ? 'Edit Task' : 'Assign New Task'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Task title" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Assign To *</label>
                  <select required value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select member</option>
                    {staffMembers.map((m) => (
                      <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Deadline *</label>
                  <input required type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Delivery" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Optional location" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Additional notes" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm hover:bg-brand-700 transition font-medium disabled:opacity-60">
                  {actionLoading ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setDetailOpen(false); dispatch(clearDetail()); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-800">Task Details</h2>
              <button onClick={() => { setDetailOpen(false); dispatch(clearDetail()); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {!detail ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
            ) : (
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-800 text-base">{detail.title}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_STYLE[detail.status] || 'bg-gray-100 text-gray-600'}`}>
                    {detail.status}
                  </span>
                </div>
                {detail.description && <p className="text-sm text-gray-500">{detail.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Assigned To', detail.assignedTo ? `${detail.assignedTo.firstName} ${detail.assignedTo.lastName}` : '—'],
                    ['Priority',    detail.priority || '—'],
                    ['Category',    detail.category || '—'],
                    ['Date',        fmtDate(detail.date)],
                    ['Deadline',    fmtDate(detail.deadline)],
                    ['Location',    detail.location || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
                {detail.notes && (
                  <div className="bg-yellow-50 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-yellow-600 mb-0.5">Notes</p>
                    <p className="text-sm text-gray-700">{detail.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Delete Task</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition font-medium">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition font-medium disabled:opacity-60">
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
