import React, { useEffect, useState } from "react";
import { useDeliverables } from "../hooks/useDeliverables.js";

export default function DeliverablesList() {
  const { list, updateStatus } = useDeliverables();
  const [items, setItems] = useState([]);

  useEffect(() => {
    list().then((data) => setItems(data.deliverables || [])).catch(() => {});
  }, []);

  const handleUpdate = async (id, status) => {
    const updated = await updateStatus(id, status);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...(updated.deliverable || {}) } : item))
    );
  };

  return (
    <div className="border rounded-xl p-4">
      <h3 className="font-semibold text-lg mb-3">Deliverables</h3>

      {items.map((d) => (
        <div key={d.id} className="p-3 border-b last:border-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{d.title}</p>
              <p className="text-xs text-gray-500">{d.status}</p>
            </div>
            <button
              onClick={() => handleUpdate(d.id, "submitted")}
              className="text-xs bg-black text-white px-2 py-1 rounded"
            >
              Mark Submitted
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
