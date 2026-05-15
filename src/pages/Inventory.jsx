import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Package,
  Download,
  Wallet,
  Plus,
  Pencil,
  CheckCircle,
  ImageOff,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  fetchProducts,
  fetchStockSummary,
  deleteStockItem,
  addProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "../store/thunks/inventoryThunk";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  SkeletonHeader,
  SkeletonStatCards,
  SkeletonTable,
} from "../components/Skeleton";
import ProductCard from "../components/ProductCard";

const ITEMS_PER_PAGE = 12;

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
      Active
    </span>
  ) : (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      Inactive
    </span>
  );
}

function StockBadge({ qty, inStockSystem }) {
  if (!inStockSystem)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        No Entry
      </span>
    );
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  if (qty <= 5)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
      In Stock
    </span>
  );
}

function StockBar({ qty, unit }) {
  return (
    <span className="font-semibold text-gray-700">
      {qty} {unit ?? ""}
    </span>
  );
}

function ExpiryCell({ date }) {
  if (!date) return <span className="text-gray-400">—</span>;
  const d = new Date(date);
  const now = new Date();
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  const label = d.toISOString().split("T")[0];
  if (diff < 0)
    return (
      <span className="text-red-600 font-semibold">{label} (Expired)</span>
    );
  if (diff <= 30)
    return (
      <span className="text-orange-500 font-semibold">
        {label} ({diff}d left)
      </span>
    );
  return <span className="text-gray-500">{label}</span>;
}

function ProductImage({ url, name }) {
  const [err, setErr] = useState(false);
  if (!url || err)
    return (
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
        <ImageOff size={14} className="text-gray-400" />
      </div>
    );
  return (
    <img
      src={url}
      alt={name}
      className="w-11 h-11 rounded-xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
      onError={() => setErr(true)}
    />
  );
}

const FIELD = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

function ProductModal({ initial, onClose, onSave, saving }) {
  const p0 = initial?.products?.[0];
  const [form, setForm] = useState(
    initial
      ? {
          productName: initial.productName ?? "",
          description: initial.description ?? "",
          brand: initial.brand ?? "",
          productCategory: initial.productCategory?.toLowerCase() ?? "",
          productTechnicalDetails: initial.productTechnicalDetails ?? "",
          howToUse: initial.howToUse ?? "",
          productBenefits: initial.productBenefits ?? "",
          targetCrops: initial.targetCrops?.join(", ") ?? "All",
          mrp: p0?.mrp ?? "",
          quantity: p0?.quantity ?? "",
          unit: p0?.unit ?? "",
          parameter: p0?.parameter ?? "",
          purchaseDate: p0?.purchaseDate ? p0.purchaseDate.split("T")[0] : "",
          expiryDate: p0?.expiryDate ? p0.expiryDate.split("T")[0] : "",
        }
      : {
          productName: "",
          description: "",
          brand: "",
          productCategory: "",
          productTechnicalDetails: "",
          howToUse: "",
          productBenefits: "",
          targetCrops: "All",
          mrp: "",
          quantity: "",
          unit: "",
          parameter: "",
          purchaseDate: "",
          expiryDate: "",
        },
  );

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    initial?.productImages?.[0]?.url ?? null,
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useState(null);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEdit = !!initial;
    const missing = [];
    if (!form.productName.trim()) missing.push("Product Name");
    if (!isEdit && !form.productCategory) missing.push("Category");
    if (!isEdit && !form.productTechnicalDetails.trim())
      missing.push("Technical Details");
    if (!isEdit && !form.howToUse.trim()) missing.push("How To Use");
    if (!isEdit && !form.productBenefits.trim())
      missing.push("Product Benefits");
    if (form.mrp === "" || form.mrp === null) missing.push("MRP");
    if (form.quantity === "" || form.quantity === null)
      missing.push("Quantity");
    if (!form.unit.trim()) missing.push("Unit");
    if (!isEdit && !form.purchaseDate) missing.push("Purchase Date");
    if (!isEdit && !imageFile) missing.push("Product Image");
    if (missing.length) {
      toast.error(`Required: ${missing.join(", ")}`);
      return;
    }
    onSave(form, imageFile);
  };

  const isEdit = !!initial;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <Package size={16} className="text-brand-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {isEdit ? "Edit Product" : "Add Product"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Section: Basic Info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Basic Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FIELD label="Product Name" required>
                    <input
                      value={form.productName}
                      onChange={(e) => setF("productName", e.target.value)}
                      className={inputCls}
                      placeholder="e.g. DAP Fertilizer"
                    />
                  </FIELD>
                </div>
                <FIELD label="Category" required={!isEdit}>
                  <select
                    value={form.productCategory}
                    onChange={(e) => setF("productCategory", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select category</option>
                    <option value="fertilizers">🌱 Fertilizers</option>
                    <option value="seeds">🌾 Seeds</option>
                    <option value="pesticides">🧪 Pesticides</option>
                    <option value="animal_feed">🐄 Animal Feed</option>
                    <option value="tools">🔧 Tools</option>
                    <option value="other">📦 Other</option>
                  </select>
                </FIELD>
                <FIELD label="Brand">
                  <input
                    value={form.brand}
                    onChange={(e) => setF("brand", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. IFFCO"
                  />
                </FIELD>
                <div className="col-span-2">
                  <FIELD label="Description">
                    <textarea
                      value={form.description}
                      onChange={(e) => setF("description", e.target.value)}
                      className={inputCls + " resize-none"}
                      rows={2}
                      placeholder="Optional product description"
                    />
                  </FIELD>
                </div>
                <div className="col-span-2">
                  <FIELD label="Technical Details" required={!isEdit}>
                    <textarea
                      value={form.productTechnicalDetails}
                      onChange={(e) =>
                        setF("productTechnicalDetails", e.target.value)
                      }
                      className={inputCls + " resize-none"}
                      rows={2}
                      placeholder="e.g. NPK composition, grade"
                    />
                  </FIELD>
                </div>
                <FIELD label="How To Use" required={!isEdit}>
                  <textarea
                    value={form.howToUse}
                    onChange={(e) => setF("howToUse", e.target.value)}
                    className={inputCls + " resize-none"}
                    rows={2}
                    placeholder="Usage instructions"
                  />
                </FIELD>
                <FIELD label="Product Benefits" required={!isEdit}>
                  <textarea
                    value={form.productBenefits}
                    onChange={(e) => setF("productBenefits", e.target.value)}
                    className={inputCls + " resize-none"}
                    rows={2}
                    placeholder="Key benefits"
                  />
                </FIELD>
                <div className="col-span-2">
                  <FIELD label="Target Crops">
                    <input
                      value={form.targetCrops}
                      onChange={(e) => setF("targetCrops", e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Wheat, Rice (comma separated)"
                    />
                  </FIELD>
                </div>
              </div>
            </div>

            {/* Section: Pricing & Stock */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Pricing & Stock
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FIELD label="MRP (₹)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.mrp}
                      onChange={(e) => setF("mrp", e.target.value)}
                      className={inputCls + " pl-7"}
                      placeholder="0"
                    />
                  </div>
                </FIELD>
                <FIELD label="Quantity" required>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setF("quantity", e.target.value)}
                    className={inputCls}
                    placeholder="0"
                  />
                </FIELD>
                <FIELD label="Unit" required>
                  <select
                    value={form.unit}
                    onChange={(e) => setF("unit", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select unit</option>
                    <optgroup label="Weight">
                      <option value="g">g — Gram</option>
                      <option value="kg">kg — Kilogram</option>
                      <option value="quintal">Quintal (100 kg)</option>
                      <option value="ton">Ton (1000 kg)</option>
                    </optgroup>
                    <optgroup label="Volume">
                      <option value="ml">ml — Millilitre</option>
                      <option value="L">L — Litre</option>
                    </optgroup>
                    <optgroup label="Count">
                      <option value="piece">Piece</option>
                      <option value="packet">Packet</option>
                      <option value="bag">Bag</option>
                      <option value="box">Box</option>
                      <option value="bottle">Bottle</option>
                      <option value="can">Can</option>
                      <option value="set">Set</option>
                    </optgroup>
                  </select>
                </FIELD>
                <FIELD label="Parameter">
                  <input
                    value={form.parameter}
                    onChange={(e) => setF("parameter", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 10kg"
                  />
                </FIELD>
              </div>
            </div>

            {/* Section: Dates */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Dates
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FIELD label="Purchase Date" required={!isEdit}>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setF("purchaseDate", e.target.value)}
                    className={inputCls}
                  />
                </FIELD>
                <FIELD label="Expiry Date">
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setF("expiryDate", e.target.value)}
                    className={inputCls}
                  />
                </FIELD>
              </div>
            </div>

            {/* Section: Image */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Product Image
                {!isEdit && <span className="text-red-500 ml-0.5">*</span>}
              </p>
              <div
                className={`relative border-2 border-dashed rounded-xl transition cursor-pointer ${
                  dragOver
                    ? "border-brand-400 bg-brand-50"
                    : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleImage(e.dataTransfer.files[0]);
                }}
                onClick={() =>
                  document.getElementById("product-img-input").click()
                }
              >
                <input
                  id="product-img-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files[0])}
                />
                {imagePreview ? (
                  <div className="flex items-center gap-4 p-4">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-20 h-20 rounded-xl object-cover border shadow-sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {imageFile ? imageFile.name : "Current image"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Click or drag to replace
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <ImageOff size={18} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Drag & drop or{" "}
                      <span className="text-brand-600 font-medium">browse</span>
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-400">
              <span className="text-red-500">*</span> Required fields
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductDetailModal({ row, onClose, onEdit }) {
  const stock = row._stock;
  const qty = stock ? (stock.availableQuantity ?? 0) : null;
  const purchasePrice = stock?.item?.purchasePrice ?? 0;
  const stockValue = qty != null ? qty * purchasePrice : 0;
  const p0 = row.products?.[0];
  const catLabel = (row.productCategory || row.category || "").replace(
    /_/g,
    " ",
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <ProductImage
              url={row.productImages?.[0]?.url}
              name={row.productName}
            />
            <div>
              <h2 className="font-semibold text-gray-900">
                {row.productName ?? "—"}
              </h2>
              {row.brand && (
                <p className="text-xs text-gray-400">{row.brand}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {catLabel && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 capitalize">
                {catLabel}
              </span>
            )}
            <StatusBadge isActive={row.isActive} />
            <StockBadge qty={qty ?? 0} inStockSystem={!!stock} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "MRP", value: p0?.mrp != null ? `₹${p0.mrp}` : "—" },
              {
                label: "Buy Price",
                value: purchasePrice
                  ? `₹${purchasePrice.toLocaleString("en-IN")}`
                  : "—",
              },
              {
                label: "Live Qty",
                value:
                  qty != null
                    ? `${qty} ${stock?.item?.unit ?? p0?.unit ?? ""}`
                    : "—",
              },
              {
                label: "Stock Value",
                value: stockValue
                  ? `₹${stockValue.toLocaleString("en-IN")}`
                  : "—",
              },
              { label: "Unit", value: p0?.unit ?? "—" },
              { label: "Parameter", value: p0?.parameter ?? "—" },
              {
                label: "Purchase Date",
                value: p0?.purchaseDate ? p0.purchaseDate.split("T")[0] : "—",
              },
              {
                label: "Expiry Date",
                value: p0?.expiryDate ? (
                  <ExpiryCell date={p0.expiryDate} />
                ) : (
                  "—"
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Text Details */}
          {[
            { label: "Description", value: row.description },
            { label: "Technical Details", value: row.productTechnicalDetails },
            { label: "How To Use", value: row.howToUse },
            { label: "Product Benefits", value: row.productBenefits },
          ]
            .filter((f) => f.value)
            .map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {label}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
              </div>
            ))}

          {/* Target Crops */}
          {row.targetCrops?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Target Crops
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.targetCrops.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function exportCSV(data) {
  const headers = ["Product Name", "Brand", "Description", "Status"];
  const rows = data.map((r) => [
    r.productName ?? "—",
    r.brand ?? "—",
    r.description ?? "—",
    r.isActive ? "Active" : "Inactive",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Inventory() {
  const dispatch = useDispatch();
  const { products, stockSummary, loading } = useSelector((s) => s.inventory);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmType, setConfirmType] = useState("product");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchStockSummary());
  }, [dispatch]);

  const kpi = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;
    const getStockEntry = (p) =>
      stockSummary.find((s) => {
        const ref = s.item?.sourceRef;
        if (!ref) return false;
        return (
          (typeof ref === "object" ? ref.toString() : ref) === p._id.toString()
        );
      });
    const outOfStock = products.filter((p) => {
      const s = getStockEntry(p);
      return s && (s.availableQuantity ?? 0) === 0;
    }).length;
    const lowStock = products.filter((p) => {
      const s = getStockEntry(p);
      if (!s) return false;
      const q = s.availableQuantity ?? 0;
      return q > 0 && q <= 5;
    }).length;
    const stockValue = stockSummary.reduce(
      (sum, s) =>
        sum + (s.availableQuantity ?? 0) * (s.item?.purchasePrice ?? 0),
      0,
    );
    const now = new Date();
    const expiringSoon = stockSummary.filter((s) => {
      const d = s.item?.expiryDate;
      if (!d) return false;
      const diff = Math.ceil((new Date(d) - now) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    }).length;
    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStock,
      lowStock,
      stockValue,
      expiringSoon,
    };
  }, [products, stockSummary]);

  const monthlyStockData = useMemo(() => {
    return stockSummary
      .map((item) => {
        const baseName = item.item?.itemName ?? "—";
        const param = item.item?.parameter ?? item.item?.unit ?? "";
        const qty = item.item?.quantity ?? "";
        // build a unique label: "Urea · 50 bag" or "Urea · 25kg"
        const suffix = param ? `${qty ? qty + " " : ""}${param}` : "";
        return {
          name: suffix ? `${baseName} · ${suffix}` : baseName,
          available: item.availableQuantity ?? 0,
        };
      })
      .slice(0, 10);
  }, [stockSummary]);

  const stockMap = useMemo(() => {
    const map = {};
    stockSummary.forEach((s) => {
      const key = s.item?.sourceRef;
      if (key)
        map[typeof key === "object" ? key.toString() : key] =
          s.availableQuantity ?? 0;
    });
    return map;
  }, [stockSummary]);

  // merged rows: each product + its stock entry joined
  const mergedRows = useMemo(() => {
    return products.map((p) => {
      const stock =
        stockSummary.find((s) => {
          const ref = s.item?.sourceRef;
          if (!ref) return false;
          return (
            (typeof ref === "object" ? ref.toString() : ref) ===
            p._id.toString()
          );
        }) ?? null;
      return { ...p, _stock: stock };
    });
  }, [products, stockSummary]);

  const filteredData = useMemo(() => {
    return mergedRows.filter((p) => {
      const matchSearch =
        (p.productName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.productCategory ?? "").toLowerCase().includes(search.toLowerCase());
      const qty = p._stock?.availableQuantity ?? null;
      let matchStatus = true;
      if (statusFilter === "active") matchStatus = p.isActive === true;
      else if (statusFilter === "inactive") matchStatus = p.isActive === false;
      else if (statusFilter === "instock")
        matchStatus = qty !== null && qty > 0;
      else if (statusFilter === "outofstock")
        matchStatus = qty !== null && qty === 0;
      return matchSearch && matchStatus;
    });
  }, [mergedRows, search, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const outOfStockItems = stockSummary.filter(
    (p) => (p.availableQuantity ?? 0) === 0,
  );

  const confirmDelete = () => {
    if (confirmType === "product") {
      dispatch(deleteProduct(confirmId))
        .unwrap()
        .then(() => toast.success("Product deleted"))
        .catch(() => toast.error("Failed to delete product"))
        .finally(() => setConfirmId(null));
    } else {
      dispatch(deleteStockItem(confirmId))
        .unwrap()
        .then(() => toast.success("Stock item deleted"))
        .catch(() => toast.error("Failed to delete stock item"))
        .finally(() => setConfirmId(null));
    }
  };

  const handleSaveProduct = (form, imageFile) => {
    setSaving(true);

    if (editRow) {
      const data = {
        productName: form.productName,
        productCategory: form.productCategory || editRow.productCategory || "",
        ...(form.description ? { description: form.description } : {}),
        ...(form.brand ? { brand: form.brand } : {}),
        ...(form.productTechnicalDetails
          ? { productTechnicalDetails: form.productTechnicalDetails }
          : {}),
        ...(form.howToUse ? { howToUse: form.howToUse } : {}),
        ...(form.productBenefits
          ? { productBenefits: form.productBenefits }
          : {}),
        products: [
          {
            ...(editRow.products?.[0]?._id
              ? { _id: editRow.products[0]._id }
              : {}),
            mrp: Number(form.mrp),
            quantity: Number(form.quantity),
            unit: form.unit,
            ...(form.purchaseDate ? { purchaseDate: form.purchaseDate } : {}),
            ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
            ...(form.parameter ? { parameter: form.parameter } : {}),
          },
        ],
      };

      const doRefresh = () => {
        setTimeout(() => {
          dispatch(fetchProducts());
          dispatch(fetchStockSummary());
        }, 1000);
      };

      dispatch(updateProduct({ id: editRow._id, data }))
        .unwrap()
        .then(() => {
          if (imageFile) {
            const imgFd = new FormData();
            imgFd.append("productImages", imageFile);
            dispatch(updateProduct({ id: editRow._id, data: imgFd }))
              .unwrap()
              .then(() => {
                toast.success("Product & image updated");
                setShowModal(false);
                setEditRow(null);
                doRefresh();
              })
              .catch(() => {
                toast.success("Product updated (image upload failed)");
                setShowModal(false);
                setEditRow(null);
                doRefresh();
              });
          } else {
            toast.success("Product updated");
            setShowModal(false);
            setEditRow(null);
            doRefresh();
          }
        })
        .catch((err) =>
          toast.error(
            typeof err === "string"
              ? err
              : err?.message || "Failed to update product",
          ),
        )
        .finally(() => setSaving(false));
      return;
    }

    const crops = form.targetCrops
      ? form.targetCrops
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : ["All"];

    const payload = {
      productName: form.productName,
      productCategory: form.productCategory,
      ...(form.description && { description: form.description }),
      ...(form.brand && { brand: form.brand }),
      productTechnicalDetails: form.productTechnicalDetails,
      howToUse: form.howToUse,
      productBenefits: form.productBenefits,
      targetCrops: crops,
      products: [
        {
          mrp: Number(form.mrp),
          quantity: Number(form.quantity),
          unit: form.unit,
          purchaseDate: form.purchaseDate,
          ...(form.parameter && { parameter: form.parameter }),
          ...(form.expiryDate && { expiryDate: form.expiryDate }),
        },
      ],
    };

    // Send as FormData if image exists, otherwise JSON
    let data;
    if (imageFile) {
      data = new FormData();
      data.append("productImages", imageFile);
      // Append all other fields as JSON string or individual fields
      Object.keys(payload).forEach((key) => {
        if (key === "products" || key === "targetCrops") {
          data.append(key, JSON.stringify(payload[key]));
        } else {
          data.append(key, payload[key]);
        }
      });
    } else {
      data = payload;
    }

    console.log(
      "Sending payload:",
      imageFile ? "FormData with image" : JSON.stringify(payload, null, 2),
    );

    dispatch(addProduct(data))
      .unwrap()
      .then(() => {
        toast.success("Product added");
        setShowModal(false);
        setTimeout(() => dispatch(fetchProducts()), 1500);
      })
      .catch((err) => toast.error(err || "Failed to add product"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <SkeletonStatCards count={6} />
        <SkeletonTable rows={8} cols={11} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(filteredData)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => {
              setEditRow(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition shadow-sm"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* OUT OF STOCK BANNER */}
      {outOfStockItems.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={15} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">
                {outOfStockItems.length} item
                {outOfStockItems.length > 1 ? "s" : ""} out of stock
              </p>
              <p className="text-xs text-red-400 mt-0.5">
                {outOfStockItems
                  .map((p) => p.item?.itemName ?? "—")
                  .join(" · ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("outofstock")}
            className="text-xs font-medium text-red-600 hover:text-red-700 whitespace-nowrap border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
          >
            View all →
          </button>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total",
            value: kpi.totalProducts,
            sub: `${kpi.activeProducts} active`,
            color: "bg-blue-50 text-blue-600",
            icon: Package,
          },
          {
            label: "Active",
            value: kpi.activeProducts,
            sub: `${Math.round(kpi.totalProducts > 0 ? (kpi.activeProducts / kpi.totalProducts) * 100 : 0)}% of total`,
            color: "bg-brand-50 text-brand-600",
            icon: CheckCircle,
          },
          {
            label: "Stock Value",
            value: `₹${kpi.stockValue.toLocaleString("en-IN")}`,
            sub: "buy price × qty",
            color: "bg-purple-50 text-purple-600",
            icon: Wallet,
          },
          {
            label: "Out of Stock",
            value: kpi.outOfStock,
            sub: kpi.outOfStock > 0 ? "needs restock" : "all stocked",
            color:
              kpi.outOfStock > 0
                ? "bg-red-50 text-red-500"
                : "bg-gray-50 text-gray-400",
            icon: AlertTriangle,
          },
          {
            label: "Low Stock",
            value: kpi.lowStock,
            sub: "qty ≤ 5 units",
            color:
              kpi.lowStock > 0
                ? "bg-orange-50 text-orange-500"
                : "bg-gray-50 text-gray-400",
            icon: AlertTriangle,
          },
          {
            label: "Expiring",
            value: kpi.expiringSoon,
            sub: "within 30 days",
            color:
              kpi.expiringSoon > 0
                ? "bg-yellow-50 text-yellow-600"
                : "bg-gray-50 text-gray-400",
            icon: CheckCircle,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}
              >
                <Icon size={13} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* STOCK LEVELS CHART */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-semibold text-gray-800 text-base">
              Stock Levels
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Live available quantity per item
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block" />
                In Stock
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />
                Low Stock
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
                Out of Stock
              </span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
              Top {monthlyStockData.length} items
            </span>
          </div>
        </div>

        {monthlyStockData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-300">
            <Package size={32} />
            <p className="text-sm">No stock data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={monthlyStockData}
              barSize={32}
              barCategoryGap="35%"
              margin={{ top: 16, right: 8, left: 0, bottom: 52 }}
            >
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3ECF8E" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2BB57A" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#f3f4f6"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={56}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "#f9fafb", radius: 6 }}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  padding: "8px 12px",
                }}
                formatter={(v, _name, props) => {
                  const status =
                    v === 0
                      ? "Out of Stock"
                      : v <= 5
                        ? "Low Stock"
                        : "In Stock";
                  return [
                    <span style={{ fontWeight: 700 }}>{v} units</span>,
                    <span style={{ color: "#6b7280" }}>{status}</span>,
                  ];
                }}
                labelStyle={{
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 4,
                }}
              />
              <Bar dataKey="available" radius={[6, 6, 0, 0]} minPointSize={4}>
                <LabelList
                  dataKey="available"
                  position="top"
                  style={{ fontSize: 10, fontWeight: 600, fill: "#6b7280" }}
                  formatter={(v) => (v > 0 ? v : "")}
                />
                {monthlyStockData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.available === 0
                        ? "url(#gradRed)"
                        : entry.available <= 5
                          ? "url(#gradOrange)"
                          : "url(#gradGreen)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">
              Products & Live Stock
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {filteredData.length} of {products.length} products
              {statusFilter !== "all" && (
                <span className="ml-2 text-brand-600 font-medium">
                  · Filtered: {statusFilter}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {statusFilter !== "all" && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear filter
              </button>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, brand or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
              <svg
                className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Products</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Grid View for Products */}
        {paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Package size={32} className="text-gray-300" />
            </div>
            <p className="text-base font-medium text-gray-900 mb-1">
              No products found
            </p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedData.map((row, i) => {
                const stock = row._stock;
                return (
                  <ProductCard
                    key={row._id || i}
                    product={row}
                    stock={stock}
                    onView={() => setViewRow(row)}
                    onEdit={() => {
                      setEditRow(row);
                      setShowModal(true);
                    }}
                    onDelete={() => {
                      setConfirmType("product");
                      setConfirmId(row._id);
                    }}
                    onToggleStatus={() => {
                      dispatch(
                        toggleProductStatus({
                          id: row._id,
                          isActive: !row.isActive,
                        }),
                      )
                        .unwrap()
                        .then(() =>
                          toast.success(
                            `Marked ${!row.isActive ? "Active" : "Inactive"}`,
                          ),
                        )
                        .catch(() => toast.error("Failed to update status"));
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of{" "}
              {filteredData.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                      p === currentPage
                        ? "bg-brand-600 text-white"
                        : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {viewRow && (
        <ProductDetailModal
          row={viewRow}
          onClose={() => setViewRow(null)}
          onEdit={() => {
            setEditRow(viewRow);
            setViewRow(null);
            setShowModal(true);
          }}
        />
      )}

      {showModal && (
        <ProductModal
          initial={editRow ?? null}
          onClose={() => {
            setShowModal(false);
            setEditRow(null);
          }}
          onSave={handleSaveProduct}
          saving={saving}
        />
      )}

      {confirmId && (
        <ConfirmDialog
          message={
            confirmType === "product"
              ? "Delete this product?"
              : "Delete this stock item?"
          }
          subMessage="This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

export default Inventory;
