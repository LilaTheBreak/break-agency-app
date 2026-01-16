import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * HierarchicalTabNavigation Component
 * 
 * Displays grouped navigation tabs with:
 * - Primary row always visible (Overview, Opportunities, Meetings, Deals)
 * - Secondary groups with collapsible headers on mobile
 * - Desktop: All groups always visible
 * - Mobile: Groups collapsible to reduce clutter
 * 
 * @param {Object[]} tabGroups - Array of tab group objects
 * @param {string} activeTab - Currently active tab ID
 * @param {Function} onTabChange - Callback when tab is selected
 */
export function HierarchicalTabNavigation({ tabGroups, activeTab, onTabChange }) {
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const toggleGroup = (groupId) => {
    const updated = new Set(collapsedGroups);
    if (updated.has(groupId)) {
      updated.delete(groupId);
    } else {
      updated.add(groupId);
    }
    setCollapsedGroups(updated);
  };

  return (
    <div className="mb-8 space-y-4 border-b border-brand-black/10 pb-6">
      {tabGroups.map((tabGroup) => {
        const isCollapsed = collapsedGroups.has(tabGroup.group);
        const isPrimaryGroup = tabGroup.group === "PRIMARY";

        return (
          <div key={tabGroup.group}>
            {/* Group Header */}
            {tabGroup.label && (
              <button
                onClick={() => toggleGroup(tabGroup.group)}
                className="w-full md:pointer-events-none flex items-center justify-between px-2 py-2 md:py-3 mb-2 text-xs uppercase tracking-[0.35em] font-semibold text-brand-red/70 hover:text-brand-red/90 md:hover:text-brand-red/70 transition-colors"
              >
                <span>{tabGroup.label}</span>
                {/* Collapse chevron - mobile only */}
                <ChevronDown
                  className={`h-4 w-4 md:hidden transition-transform ${
                    isCollapsed ? "" : "rotate-180"
                  }`}
                />
              </button>
            )}

            {/* Tab Buttons - Hidden on mobile if group is collapsed */}
            {(!isCollapsed || isPrimaryGroup) && (
              <div className="flex flex-wrap gap-3">
                {tabGroup.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-xs uppercase tracking-[0.2em] rounded-lg border transition-all ${
                        isActive
                          ? "border-brand-red bg-brand-red/5 text-brand-red font-semibold shadow-sm"
                          : "border-brand-black/10 bg-brand-white text-brand-black/60 hover:border-brand-black/20 hover:bg-brand-black/3"
                      }`}
                      title={tab.label}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {/* Full label on desktop, hidden on mobile for secondary groups */}
                      <span className="hidden md:inline whitespace-nowrap">{tab.label}</span>
                      {/* Icon-only on mobile for secondary groups, full label for primary */}
                      {isPrimaryGroup && <span className="md:hidden">{tab.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
