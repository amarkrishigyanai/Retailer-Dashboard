import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllInquiries,
  fetchInquiryById,
} from "../store/thunks/inquiryThunk";
import { clearCurrent } from "../store/slices/inquirySlice";
import {
  MessageSquare,
  X,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";

const STATUS_STYLE = {
  Open: "bg-red-100 text-red-700",
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
};

const ITEMS_PER_PAGE = 10;

function SkeletonRow() {
  return (
    <tr>
      {Array(8)
        .fill(0)
        .map((_, i) => (
          <td key={i} className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </td>
        ))}
    </tr>
  );
}

export default function Inquiry() {
  const dispatch = useDispatch();
  const { inquiries, loading, current } = useSelector((s) => s.inquiry);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllInquiries());
  }, [dispatch]);

  const openDetail = (id) => {
    setDetailId(id);
    dispatch(fetchInquiryById(id));
  };
  const closeDetail = () => {
    setDetailId(null);
    dispatch(clearCurrent());
  };

  const inquiryTypes = [
    ...new Set(inquiries.map((q) => q.inquiryType).filter(Boolean)),
  ];

  const filtered = inquiries.filter((q) => {
    const matchSearch =
      `${q.inquiryType} ${q.productName} ${q.cropName} ${q.user?.firstName} ${q.user?.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchType = filterType === "All" || q.inquiryType === filterType;
    const matchStatus = filterStatus === "All" || q.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleType = (val) => {
    setFilterType(val);
    setPage(1);
  };
  const handleStatus = (val) => {
    setFilterStatus(val);
    setPage(1);
  };

  const counts = {
    total: inquiries.length,
    open: inquiries.filter((q) => q.status === "Open").length,
    pending: inquiries.filter((q) => q.status === "Pending").length,
    resolved: inquiries.filter((q) => q.status === "Resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <p className="text-sm text-gray-500">
          Manage and track all member inquiries
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total",
            value: counts.total,
            icon: MessageSquare,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Open",
            value: counts.open,
            icon: AlertCircle,
            color: "bg-red-50 text-red-600",
          },
          {
            label: "Pending",
            value: counts.pending,
            icon: Clock,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Resolved",
            value: counts.resolved,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 bg-white shadow-sm rounded-xl"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? "—" : value}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by product, crop, member..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
        />
        <select
          value={filterType}
          onChange={(e) => handleType(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="All">All Types</option>
          {inquiryTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => handleStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {["All", "Open", "Pending", "In Progress", "Resolved"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="text-xs text-gray-600 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">ID</th>
              <th className="px-6 py-4 text-left">Member</th>
              <th className="px-6 py-4 text-left">Inquiry Type</th>
              <th className="px-6 py-4 text-left">Product</th>
              <th className="px-6 py-4 text-left">Crop</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => <SkeletonRow key={i} />)
              : paginated.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-500">
                      #{q._id?.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-medium text-brand-700">
                      {q.user?.firstName} {q.user?.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {q.inquiryType || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {q.productName || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {q.cropName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[q.status] || STATUS_STYLE.Pending}`}
                      >
                        {q.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openDetail(q._id)}
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
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No inquiries found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Prev
            </button>
            <span className="px-3 py-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-800">
                Inquiry Detail
              </h2>
              <button
                onClick={closeDetail}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {!current ? (
                <div className="space-y-3">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="h-5 bg-gray-200 rounded animate-pulse"
                      />
                    ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium uppercase">
                      #{current._id?.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[current.status] || STATUS_STYLE.Pending}`}
                    >
                      {current.status || "Pending"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      [
                        "Member",
                        `${current.user?.firstName || ""} ${current.user?.lastName || ""}`.trim() ||
                          "—",
                      ],
                      [
                        "Phone",
                        current.user?.phone ? `+91 ${current.user.phone}` : "—",
                      ],
                      ["Inquiry Type", current.inquiryType || "—"],
                      [
                        "Date",
                        current.createdAt
                          ? new Date(current.createdAt).toLocaleDateString(
                              "en-IN",
                            )
                          : "—",
                      ],
                      ["Product", current.productName || "—"],
                      ["Crop", current.cropName || "—"],
                      [
                        "Quantity",
                        current.requiredQuantity
                          ? `${current.requiredQuantity} ${current.quantityUnit || ""}`.trim()
                          : "—",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="bg-gray-50 rounded-lg px-3 py-2.5"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                          {label}
                        </p>
                        <p className="text-sm font-medium text-gray-800">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {current.message && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                        Message
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {current.message}
                      </p>
                    </div>
                  )}
                  {current.photo && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Photo
                        </p>
                        <a
                          href={current.photo?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Open ↗
                        </a>
                      </div>
                      <img
                        src={current.photo?.url}
                        alt="Inquiry"
                        className="w-full max-h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div
                        style={{ display: "none" }}
                        className="w-full h-24 bg-gray-100 rounded-lg items-center justify-center text-xs text-gray-400"
                      >
                        Failed to load image
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
