import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserCheck, UserX, CalendarOff, MapPin, Eye, X, Clock } from 'lucide-react';
import { fetchAllStaffAttendance, fetchStaffAttendanceById } from '../store/thunks/attendanceThunk';

const STATUS_STYLE = {
  present:      'bg-green-100 text-green-700',
  absent:       'bg-red-100 text-red-700',
  leave:        'bg-yellow-100 text-yellow-700',
  'checked-in': 'bg-blue-100 text-blue-700',
  'half-day':   'bg-purple-100 text-purple-700',
};

const statusStyle = (s) => STATUS_STYLE[s?.toLowerCase()] || 'bg-gray-100 text-gray-600';
const fmt     = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const getAddress  = (r) => r.location?.checkInLocation?.address  || r.address  || '—';
const getLatitude = (r) => r.location?.checkInLocation?.latitude  || r.latitude  || null;
const getLongitude= (r) => r.location?.checkInLocation?.longitude || r.longitude || null;

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array(7).fill(0).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function Attendance() {
  const dispatch = useDispatch();
  const { allStaff, staffDetail, loading } = useSelector((s) => s.attendance);

  const [search, setSearch]             = useState('');
  const [dateFilter, setDateFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailRecord, setDetailRecord] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');

  useEffect(() => { dispatch(fetchAllStaffAttendance()); }, [dispatch]);

  useEffect(() => {
    if (selectedStaff) dispatch(fetchStaffAttendanceById(selectedStaff));
  }, [selectedStaff, dispatch]);

  const tableData  = selectedStaff ? staffDetail : allStaff;
  const staffList  = [...new Map(allStaff.map((r) => [r.staff?._id, r.staff])).values()].filter(Boolean);

  // ── Derive today's records for stat cards ──
  const todayStr     = new Date().toDateString();
  const todayRecords = allStaff.filter((r) => new Date(r.date || r.createdAt).toDateString() === todayStr);
  const totalStaff   = new Set(allStaff.map((r) => r.staff?._id || r.staffId)).size;
  const presentCount = todayRecords.filter((r) => ['present', 'checked-in'].includes(r.status?.toLowerCase())).length;
  const absentCount  = todayRecords.filter((r) => r.status?.toLowerCase() === 'absent').length;
  const leaveCount   = todayRecords.filter((r) => r.status?.toLowerCase() === 'leave').length;

  // ── Filtered table rows ──
  const filtered = tableData.filter((r) => {
    const name = `${r.staff?.firstName || ''} ${r.staff?.lastName || ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchDate   = !dateFilter || new Date(r.date || r.createdAt).toLocaleDateString('en-CA') === dateFilter;
    const matchStatus = !statusFilter || r.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchDate && matchStatus;
  });

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Attendance Overview</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total Staff"   value={totalStaff}   color="bg-brand-50 text-brand-600" />
        <StatCard icon={UserCheck}   label="Present Today" value={presentCount} color="bg-green-50 text-green-600" />
        <StatCard icon={UserX}       label="Absent Today"  value={absentCount}  color="bg-red-50 text-red-600" />
        <StatCard icon={CalendarOff} label="On Leave"      value={leaveCount}   color="bg-yellow-50 text-yellow-600" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        {/* Table Header / Filters */}
        <div className="px-5 py-4 border-b flex flex-wrap items-center gap-3">
          <h3 className="font-semibold text-gray-800 mr-auto">Staff Attendance Records</h3>

          <select
            value={selectedStaff}
            onChange={(e) => { setSelectedStaff(e.target.value); setSearch(''); setDateFilter(''); }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Today's Records (All Staff)</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName} — {s.role}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-40"
          />

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
            <option value="checked-in">Checked-in</option>
            <option value="half-day">Half Day</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Staff', 'Role', 'Date', 'Check-in', 'Check-out', 'Status', 'Location', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.staff?.firstName} {r.staff?.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{r.staff?.role || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(r.date || r.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-green-500" />{fmt(r.checkIn)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-400" />{fmt(r.checkOut)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle(r.status)}`}>
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {getLatitude(r) ? (
                        <a
                          href={`https://www.google.com/maps?q=${getLatitude(r)},${getLongitude(r)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-brand-600 hover:underline"
                        >
                          <MapPin className="w-3 h-3" />
                          {getAddress(r) !== '—' ? getAddress(r) : 'View Map'}
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setDetailRecord(r)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && !filtered.length && (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No attendance records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Modal (read-only) ── */}
      {detailRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setDetailRecord(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-800">Attendance Detail</h2>
              <button onClick={() => setDetailRecord(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase font-medium">
                  {fmtDate(detailRecord.date || detailRecord.createdAt)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle(detailRecord.status)}`}>
                  {detailRecord.status || '—'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Staff',     `${detailRecord.staff?.firstName || ''} ${detailRecord.staff?.lastName || ''}`.trim() || '—'],
                  ['Role',      detailRecord.staff?.role || '—'],
                  ['Phone',     detailRecord.staff?.phone ? `+91 ${detailRecord.staff.phone}` : '—'],
                  ['Check-in',  fmt(detailRecord.checkIn)],
                  ['Check-out', fmt(detailRecord.checkOut)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {getLatitude(detailRecord) && (
                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Location</p>
                  <p className="text-xs text-gray-600 mb-1">{getAddress(detailRecord)}</p>
                  <a
                    href={`https://www.google.com/maps?q=${getLatitude(detailRecord)},${getLongitude(detailRecord)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <MapPin className="w-3 h-3" />
                    {getLatitude(detailRecord)}, {getLongitude(detailRecord)} ↗
                  </a>
                </div>
              )}

              {detailRecord.leaveReason && (
                <div className="bg-yellow-50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-yellow-600 mb-0.5">Leave Reason</p>
                  <p className="text-sm text-gray-700">{detailRecord.leaveReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
