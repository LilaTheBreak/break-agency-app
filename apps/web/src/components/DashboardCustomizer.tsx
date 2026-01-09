import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Grip, RotateCcw } from "lucide-react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
 * Draggable snapshot item
 */
function DraggableSnapshotItem({
  snapshot,
  enabled,
  onToggle,
}: {
  snapshot: SnapshotItem;
  enabled: boolean;
  onToggle: (snapshotId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: snapshot.snapshotId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
      >
        <Grip size={16} />
      </button>

      <Switch
        checked={enabled}
        onCheckedChange={() => onToggle(snapshot.snapshotId)}
        className="ml-auto"
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900">{snapshot.title}</p>
        {snapshot.description && (
          <p className="text-xs text-gray-600 line-clamp-1">{snapshot.description}</p>
        )}
      </div>

      {snapshot.category && (
        <Badge variant="outline" className="text-xs capitalize">
          {snapshot.category}
        </Badge>
      )}
    </div>
  );
}

/**
 * Dashboard Customizer Modal
 *
 * Allows users to:
 * - Toggle snapshots on/off
 * - Reorder snapshots via drag-and-drop
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
  const [activeTab, setActiveTab] = useState("enabled");

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localSnapshots.findIndex((s) => s.snapshotId === active.id);
      const newIndex = localSnapshots.findIndex((s) => s.snapshotId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSnapshots = [...localSnapshots];
        [newSnapshots[oldIndex], newSnapshots[newIndex]] = [
          newSnapshots[newIndex],
          newSnapshots[oldIndex],
        ];
        // Recalculate orders
        const reordered = newSnapshots.map((s, i) => ({
          ...s,
          order: i,
        }));
        setLocalSnapshots(reordered);
      }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Customise Dashboard</DialogTitle>
          <DialogDescription>
            Control which cards appear, their order, and visibility
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enabled">
              Visible ({enabledSnapshots.length})
            </TabsTrigger>
            <TabsTrigger value="disabled">
              Hidden ({disabledSnapshots.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="enabled"
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            <div className="text-xs text-gray-600 mb-4">
              Drag to reorder. Cards appear in this order on your dashboard.
            </div>

            {enabledSnapshots.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No visible cards. Enable some below to get started.
              </p>
            ) : (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={enabledSnapshots.map((s) => s.snapshotId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {enabledSnapshots.map((snapshot) => (
                      <DraggableSnapshotItem
                        key={snapshot.snapshotId}
                        snapshot={snapshot}
                        enabled={true}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </TabsContent>

          <TabsContent
            value="disabled"
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            <div className="text-xs text-gray-600 mb-4">
              Toggle cards on to show them on your dashboard.
            </div>

            {disabledSnapshots.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                All available cards are visible!
              </p>
            ) : (
              <div className="space-y-2">
                {disabledSnapshots.map((snapshot) => (
                  <DraggableSnapshotItem
                    key={snapshot.snapshotId}
                    snapshot={snapshot}
                    enabled={false}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-3 p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
            className="gap-2"
          >
            <RotateCcw size={14} />
            Reset to Default
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DashboardCustomizer;
