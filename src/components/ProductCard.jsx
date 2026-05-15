import { useState } from "react";
import { Pencil, Trash2, ImageOff, Star, X } from "lucide-react";

function ProductImage({ url, name, onImageClick }) {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!url || err)
    return (
      <div className="w-full h-64 rounded-t-xl bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center border-2 border-dashed border-red-200">
        <ImageOff size={56} className="text-red-300 mb-2" />
        <p className="text-xs text-red-500 font-medium">No Image Available</p>
        <p className="text-xs text-red-400 mt-0.5">Click Edit to add image</p>
      </div>
    );

  return (
    <div className="relative w-full h-64 rounded-t-xl bg-white overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10">
          <div className="text-xs text-gray-400">Loading...</div>
        </div>
      )}
      <img
        src={url}
        alt={name}
        className="w-full h-64 rounded-t-xl object-contain bg-white p-2 cursor-pointer hover:opacity-90 transition"
        onError={() => {
          setErr(true);
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
        onClick={onImageClick}
      />
    </div>
  );
}

function StockBadge({ qty, inStockSystem }) {
  if (!inStockSystem)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        No Entry
      </span>
    );
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  if (qty <= 5)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        Low Stock ({qty})
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      {qty} In Stock
    </span>
  );
}

export default function ProductCard({
  product,
  stock,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const inStockSystem = !!stock;
  const qty = stock ? (stock.availableQuantity ?? 0) : null;
  const purchasePrice = stock?.item?.purchasePrice ?? 0;
  const mrp = product.products?.[0]?.mrp ?? 0;
  const stockValue = qty != null ? qty * purchasePrice : 0;
  const catLabel = (product.productCategory || product.category || "").replace(
    /_/g,
    " ",
  );
  const isOOS = qty === 0;

  // Calculate discount if MRP is higher than buy price
  const discount =
    mrp > purchasePrice ? Math.round(((mrp - purchasePrice) / mrp) * 100) : 0;
  const imageUrl = product.productImages?.[0]?.url;

  return (
    <>
      <div
        onClick={onView}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gray-50 group">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (imageUrl) setShowImageModal(true);
            }}
            className="cursor-zoom-in hover:opacity-95 transition"
          >
            <ProductImage
              url={imageUrl}
              name={product.productName}
              onImageClick={() => imageUrl && setShowImageModal(true)}
            />
          </div>

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
              {discount}% off
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {product.isActive ? (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 shadow-sm">
                Active
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 shadow-sm">
                Inactive
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOOS && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}

          {/* View Full Image Button */}
          {imageUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(true);
              }}
              className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition opacity-0 group-hover:opacity-100"
              title="View full image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {catLabel && (
            <div className="mb-2">
              <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 capitalize">
                {catLabel}
              </span>
            </div>
          )}

          {/* Product Name */}
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">
              {product.productName ?? "—"}
            </h3>
            {product.brand && (
              <p className="text-xs text-gray-400 mt-1">{product.brand}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">₹{mrp}</span>
            {purchasePrice && purchasePrice !== mrp && (
              <span className="text-sm text-gray-400 line-through">
                ₹{purchasePrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-3">
            <StockBadge qty={qty ?? 0} inStockSystem={inStockSystem} />
          </div>

          {/* Stock Value */}
          {stockValue > 0 && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="text-sm font-bold text-blue-600">
                ₹{stockValue.toLocaleString("en-IN")}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition"
              title="Edit"
            >
              <Pencil size={13} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                product.isActive
                  ? "bg-red-50 hover:bg-red-100 text-red-600"
                  : "bg-green-50 hover:bg-green-100 text-green-600"
              }`}
              title={product.isActive ? "Deactivate" : "Activate"}
            >
              <span className="hidden sm:inline">
                {product.isActive ? "Deactivate" : "Activate"}
              </span>
              <span className="sm:hidden">
                {product.isActive ? "OFF" : "ON"}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && imageUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition z-10"
            >
              <X size={24} />
            </button>
            <img
              src={imageUrl}
              alt={product.productName}
              className="w-full h-full object-contain"
            />
            <div className="p-4 bg-gray-50 border-t">
              <h3 className="font-semibold text-gray-900">
                {product.productName}
              </h3>
              {product.brand && (
                <p className="text-sm text-gray-600">{product.brand}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
