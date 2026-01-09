import React, { useState, useEffect } from "react";
import { Grip, RotateCcw, X, ChevronDown } from "lucide-react";

interface SnapshotItem {
  snapshotId: string;
  title: string;
  description?: string;
  enabled: boolean;
  order: number;
  icon?: string;
  color?: string;
  category?: string;
  helpText?: string;
}

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardType: "ADMIN_OVERVIEW" | "TALENT_OVERVIEW" | "EXCLUSIVE_TALENT_OVERVIEW";
  onSave: (snapshots: Array<{ snapshotId: string; enabled: boolean; order: number }>) => Promise<void>;
  onReset: () => Promise<void>;
  snapshots: SnapshotItem[];
  availableSnapshots: SnapshotItem[];
}

/**
 * Snapshot item with toggle
 */
function SnapshotItemCard({
  snapshot,
  enabled,
  onToggle,
}: {
  snapshot: SnapshotItem;
  enabled: boolean;
  onToggle: (snapshotId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
      <button className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600">
        <Grip size={16} />
      </button>

      <label className="flex items-center gap-2 cursor-pointer ml-auto">
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => onToggle(snapshot.snapshotId)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </label>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900">{snapshot.title}</p>
        {snapshot.description && (
          <p className="text-xs text-gray-600 line-clamp-1">{snapshot.description}</p>
        )}
      </div>

      {snapshot.category && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
          {snapshot.category}
        </span>
      )}
    </div>
  );
}

/**
 * Dashboard Customizer Modal
 *
 * Allows users to:
 * - Toggle snapshots on/off
 * - Reorder snapshots
 * - Reset to defaults
 */
export function DashboardCustomizer({
  isOpen,
  onClose,
  dashboardType,
  onSave,
  onReset,
  snapshots,
  availableSnapshots,
}: DashboardCustomizerProps) {
  const [localSnapshots, setLocalSnapshots] = useState<SnapshotItem[]>(snapshots);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<"enabled" | "disabled">("enabled");

  useEffect(() => {
    setLocalSnapshots(snapshots);
  }, [snapshots, isOpen]);

  const handleToggle = (snapshotId: string) => {
    setLocalSnapshots((prev) =>
      prev.map((s) =>
        s.snapshotId === snapshotId ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleMoveUp = (snapshotId: string) => {
    const index = localSnapshots.findIndex((s) => s.snapshotId === snapshotId);
    if (index > 0) {
      const newSnapshots = [...localSnapshots];
      [newSnapshots[index - 1], newSnapshots[index]] = [
        newSnapshots[index],
        newSnapshots[index - 1],
      ];
      const reordered = newSnapshots.map((s, i) => ({
        ...s,
        order: i,
      }));
      setLocalSnapshots(reordered);
    }
  };

  const handleMoveDown = (snapshotId: string) => {
    const index = localSnapshots.findIndex((s) => s.snapshotId === snapshotId);
    if (index < localSnapshots.length - 1) {
      const newSnapshots = [...localSnapshots];
      [newSnapshots[index], newSnapshots[index + 1]] = [
        newSnapshots[index + 1],
        newSnapshots[index],
      ];
      const reordered = newSnapshots.map((s, i) => ({
        ...s,
        order: i,
      }));
      setLocalSnapshots(reordered);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const configToSave = localSnapshots.map((s) => ({
        snapshotId: s.snapshotId,
        enabled: s.enabled,
        order: s.order,
      }));
      await onSave(configToSave);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
    } finally {
      setIsResetting(false);
    }
  };

  const enabledSnapshots = localSnapshots.filter((s) => s.enabled);
  const disabledSnapshots = localSnapshots.filter((s) => !s.enabled);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customise Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Control which cards appear, their order, and visibility
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b">
          <button
            onClick={() => setActiveTab("enabled")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "enabled"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Visible ({enabledSnapshots.length})
          </button>
          <button
            onClick={() => setActiveTab("disabled")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "disabled"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Hidden ({disabledSnapshots.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "enabled" && (
            <div className="space-y-3">
              <div className="text-xs text-gray-600 mb-4">
                Reorder using the buttons. Cards appear in this order on your dashboard.
              </div>

              {enabledSnapshots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No visible cards. Enable some from the Hidden tab to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {enabledSnapshots.map((snapshot, index) => (
                    <div
                      key={snapshot.snapshotId}
                      className="flex items-center gap-2"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(snapshot.snapshotId)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                          title="Move up"
                        >
                          <ChevronDown size={14} className="rotate-180" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(snapshot.snapshotId)}
                          disabled={index === enabledSnapshots.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <div className="flex-1">
                        <SnapshotItemCard
                          snapshot={snapshot}
                          enabled={true}
                          onToggle={handleToggle}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "disabled" && (
            <div className="space-y-3">
              <div className="text-xs text-gray-600 mb-4">
                Check the box to show cards on your dashboard.
              </div>

              {disabledSnapshots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  All available cards are visible!
                </p>
              ) : (
                <div className="space-y-2">
                  {disabledSnapshots.map((snapshot) => (
                    <SnapshotItemCard
                      key={snapshot.snapshotId}
                      snapshot={snapshot}
                      enabled={false}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw size={14} />
            Reset to Default
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCustomizer;
