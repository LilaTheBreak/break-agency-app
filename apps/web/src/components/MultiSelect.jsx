import React, { useState, useRef, useEffect } from "react";

/**
 * MultiSelect - A dropdown that allows selecting multiple items
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the field
 * @param {Array} props.value - Array of selected IDs
 * @param {Function} props.onChange - Called with new array of IDs
 * @param {Array} props.options - Array of {id, name/label} objects
 * @param {string} props.placeholder
 * @param {Function} props.renderItem - Optional custom renderer for selected items
 */
export function MultiSelect({ 
  label, 
  value = [], 
  onChange, 
  options = [], 
  placeholder = "Select...",
  renderItem 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItems = options.filter(opt => value.includes(opt.id));
  const availableOptions = options.filter(opt => {
    if (value.includes(opt.id)) return false;
    if (!search) return true;
    const optionText = (opt.name || opt.label || opt.brandName || "").toLowerCase();
    return optionText.includes(search.toLowerCase());
  });

  const handleToggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const handleRemove = (id) => {
    onChange(value.filter(v => v !== id));
  };

  const defaultRenderItem = (item) => (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-black/5 px-3 py-1 text-xs">
      {item.name || item.label || item.brandName || item.id}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleRemove(item.id);
        }}
        className="hover:text-brand-red transition-colors"
      >
        ×
      </button>
    </span>
  );

  const itemRenderer = renderItem || defaultRenderItem;

  return (
    <div ref={containerRef} className="relative">
      <label className="block">
        <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</span>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="mt-2 min-h-[42px] w-full rounded-2xl border border-brand-black/20 px-4 py-2 cursor-pointer hover:border-brand-black transition-colors"
        >
          {selectedItems.length === 0 ? (
            <span className="text-sm text-brand-black/40">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedItems.map(item => (
                <div key={item.id} onClick={(e) => e.stopPropagation()}>
                  {itemRenderer(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      </label>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-brand-black/10 bg-white shadow-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-brand-black/5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-xl border border-brand-black/10 px-3 py-1.5 text-sm focus:border-brand-black focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {availableOptions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-brand-black/40">
                {search ? "No matches found" : "No options available"}
              </p>
            ) : (
              availableOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleToggle(option.id)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-brand-linen/50 transition-colors"
                >
                  {option.name || option.label || option.brandName || option.email || option.id}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
