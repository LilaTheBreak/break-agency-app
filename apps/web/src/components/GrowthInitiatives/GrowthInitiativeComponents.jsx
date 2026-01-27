import React, { useState } from 'react';
import { formatDate, formatCurrency } from '../lib/utils.js';

/**
 * InitiativeCard
 * Displays a growth initiative in card format with cost, status, and quick actions
 */
export function InitiativeCard({ 
  initiative, 
  onEdit, 
  onViewDetails,
  onDelete 
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate total cost
  const totalCost = (initiative.inputs || []).reduce((sum, input) => {
    return sum + (input.costMonthly || 0) * 12 + (input.costOneOff || 0);
  }, 0);

  // Count outputs
  const outputCount = (initiative.outputs || []).length;

  // Get performance summary
  const latestPerformance = (initiative.performance || [])[0];

  return (
    <div className="rounded-lg border border-brand-black/10 bg-brand-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-brand-black">{initiative.name}</h3>
          <p className="text-xs text-brand-black/50 mt-1">
            {initiative.objective?.replace(/_/g, ' ').toUpperCase()}
          </p>
        </div>
        <div className={`px-2 py-1 text-xs font-medium rounded-full ${
          initiative.status === 'active' ? 'bg-brand-green/10 text-brand-green' :
          initiative.status === 'testing' ? 'bg-brand-yellow/10 text-brand-yellow' :
          initiative.status === 'completed' ? 'bg-brand-blue/10 text-brand-blue' :
          'bg-brand-black/10 text-brand-black'
        }`}>
          {initiative.status}
        </div>
      </div>

      {initiative.description && (
        <p className="text-sm text-brand-black/70 mb-3 line-clamp-2">
          {initiative.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="bg-brand-linen/30 rounded p-2">
          <p className="text-brand-black/50">Total Cost</p>
          <p className="font-semibold text-brand-black">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-brand-linen/30 rounded p-2">
          <p className="text-brand-black/50">Outputs</p>
          <p className="font-semibold text-brand-black">{outputCount}</p>
        </div>
      </div>

      {latestPerformance && (
        <div className="bg-brand-linen/20 rounded p-2 mb-4 text-xs">
          <p className="text-brand-black/50 mb-1">Latest Performance</p>
          <div className="flex gap-2 text-xs">
            {latestPerformance.totalViews && (
              <span>{latestPerformance.totalViews.toLocaleString()} views</span>
            )}
            {latestPerformance.inboundMessages && (
              <span>{latestPerformance.inboundMessages} messages</span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails()}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-brand-black/5 hover:bg-brand-black/10 rounded transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onEdit()}
          className="px-3 py-1.5 text-xs font-medium bg-brand-red/10 hover:bg-brand-red/20 text-brand-red rounded transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

/**
 * InitiativeForm
 * Form for creating/editing growth initiatives
 */
export function InitiativeForm({ 
  initialData, 
  onSubmit, 
  isLoading,
  talentOptions = []
}) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    talentId: '',
    objective: 'authority_building',
    platforms: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    monthlyBudget: '',
    totalBudget: '',
    owner: 'both',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-brand-black mb-2">
          Initiative Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., LinkedIn Thought Leadership - Q1"
          className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 outline-none"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-brand-black mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="What's the strategic goal of this initiative?"
          rows="3"
          className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 outline-none"
        />
      </div>

      {/* Objective */}
      <div>
        <label className="block text-sm font-medium text-brand-black mb-2">
          Strategic Objective *
        </label>
        <select
          name="objective"
          value={formData.objective}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red outline-none"
        >
          <option value="authority_building">Authority Building</option>
          <option value="inbound_brand_leads">Inbound Brand Leads</option>
          <option value="higher_deal_value">Higher Deal Value</option>
          <option value="long_term_positioning">Long-term Positioning</option>
        </select>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-brand-black mb-2">
          Platforms
        </label>
        <div className="flex flex-wrap gap-3">
          {['LinkedIn', 'Instagram', 'Press', 'Mixed'].map(platform => (
            <label key={platform} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform)}
                onChange={() => handlePlatformToggle(platform)}
                className="rounded"
              />
              <span className="text-sm">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-black mb-2">
            Start Date *
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-black mb-2">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red outline-none"
          />
        </div>
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-black mb-2">
            Monthly Budget
          </label>
          <input
            type="number"
            name="monthlyBudget"
            value={formData.monthlyBudget}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-black mb-2">
            Total Budget
          </label>
          <input
            type="number"
            name="totalBudget"
            value={formData.totalBudget}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red outline-none"
          />
        </div>
      </div>

      {/* Owner */}
      <div>
        <label className="block text-sm font-medium text-brand-black mb-2">
          Ownership
        </label>
        <select
          name="owner"
          value={formData.owner}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded border border-brand-black/10 focus:border-brand-red outline-none"
        >
          <option value="agent">Agent-led</option>
          <option value="talent">Talent-led</option>
          <option value="both">Collaborative</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-brand-red hover:bg-brand-red/90 disabled:opacity-50 text-brand-white font-medium rounded transition-colors"
      >
        {isLoading ? 'Saving...' : 'Save Initiative'}
      </button>
    </form>
  );
}

/**
 * InputsList
 * Display and manage cost inputs for an initiative
 */
export function InputsList({ 
  inputs = [], 
  onAddInput, 
  onRemoveInput,
  editable = true
}) {
  const totalMonthly = inputs.reduce((sum, input) => sum + (input.costMonthly || 0), 0);
  const totalOneOff = inputs.reduce((sum, input) => sum + (input.costOneOff || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-brand-black">Cost Drivers</h4>
        {editable && (
          <button
            onClick={onAddInput}
            className="text-xs px-3 py-1 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red rounded transition-colors"
          >
            + Add Input
          </button>
        )}
      </div>

      {inputs.length === 0 ? (
        <p className="text-sm text-brand-black/50 py-4">No cost drivers added yet</p>
      ) : (
        <div className="space-y-2">
          {inputs.map(input => (
            <div key={input.id} className="flex items-start justify-between p-3 rounded bg-brand-linen/20 text-sm">
              <div className="flex-1">
                <p className="font-medium text-brand-black">{input.name}</p>
                <p className="text-xs text-brand-black/50 mt-1">
                  {input.type} • {input.contributor?.name || 'No contributor'}
                </p>
                {(input.costMonthly || input.costOneOff) && (
                  <p className="text-xs text-brand-black/60 mt-1">
                    {input.costMonthly ? `${formatCurrency(input.costMonthly)}/mo` : ''} 
                    {input.costOneOff ? ` + ${formatCurrency(input.costOneOff)} one-off` : ''}
                  </p>
                )}
              </div>
              {editable && (
                <button
                  onClick={() => onRemoveInput(input.id)}
                  className="text-xs px-2 py-1 text-brand-black/40 hover:text-brand-black/70"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-brand-black/10 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-black/60">Monthly:</span>
              <span className="font-medium">{formatCurrency(totalMonthly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-black/60">One-off:</span>
              <span className="font-medium">{formatCurrency(totalOneOff)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-brand-black/10">
              <span>Total Cost:</span>
              <span>{formatCurrency(totalMonthly * 12 + totalOneOff)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * OutputsList
 * Display produced content/deliverables for an initiative
 */
export function OutputsList({ 
  outputs = [], 
  onAddOutput, 
  onRemoveOutput,
  editable = true
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-brand-black">Outputs ({outputs.length})</h4>
        {editable && (
          <button
            onClick={onAddOutput}
            className="text-xs px-3 py-1 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue rounded transition-colors"
          >
            + Add Output
          </button>
        )}
      </div>

      {outputs.length === 0 ? (
        <p className="text-sm text-brand-black/50 py-4">No outputs recorded yet</p>
      ) : (
        <div className="space-y-2">
          {outputs.map(output => (
            <div key={output.id} className="flex items-start justify-between p-3 rounded bg-brand-linen/20 text-sm">
              <div className="flex-1">
                <p className="font-medium text-brand-black">{output.title || 'Untitled'}</p>
                <p className="text-xs text-brand-black/50 mt-1">
                  {output.format} on {output.platform}
                </p>
                {output.url && (
                  <p className="text-xs text-brand-blue mt-1">
                    <a href={output.url} target="_blank" rel="noopener noreferrer" className="underline">
                      View
                    </a>
                  </p>
                )}
                {output.publishedAt && (
                  <p className="text-xs text-brand-black/60 mt-1">
                    Published {formatDate(output.publishedAt)}
                  </p>
                )}
              </div>
              {editable && (
                <button
                  onClick={() => onRemoveOutput(output.id)}
                  className="text-xs px-2 py-1 text-brand-black/40 hover:text-brand-black/70"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * PerformanceView
 * Display performance metrics for an initiative
 */
export function PerformanceView({ 
  performance = [], 
  onAddPerformance,
  editable = true
}) {
  const latestMetrics = performance[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-brand-black">Performance</h4>
        {editable && (
          <button
            onClick={onAddPerformance}
            className="text-xs px-3 py-1 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded transition-colors"
          >
            + Log Metrics
          </button>
        )}
      </div>

      {!latestMetrics ? (
        <p className="text-sm text-brand-black/50 py-4">No performance data recorded yet</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {latestMetrics.totalViews && (
            <div className="p-3 rounded bg-brand-linen/20">
              <p className="text-xs text-brand-black/50">Views</p>
              <p className="font-semibold text-lg text-brand-black">
                {latestMetrics.totalViews.toLocaleString()}
              </p>
            </div>
          )}
          {latestMetrics.avgEngagement && (
            <div className="p-3 rounded bg-brand-linen/20">
              <p className="text-xs text-brand-black/50">Avg Engagement</p>
              <p className="font-semibold text-lg text-brand-black">
                {(latestMetrics.avgEngagement * 100).toFixed(1)}%
              </p>
            </div>
          )}
          {latestMetrics.followerGrowth && (
            <div className="p-3 rounded bg-brand-linen/20">
              <p className="text-xs text-brand-black/50">Follower Growth</p>
              <p className="font-semibold text-lg text-brand-black">
                +{latestMetrics.followerGrowth.toLocaleString()}
              </p>
            </div>
          )}
          {latestMetrics.inboundMessages && (
            <div className="p-3 rounded bg-brand-linen/20">
              <p className="text-xs text-brand-black/50">Inbound Messages</p>
              <p className="font-semibold text-lg text-brand-black">
                {latestMetrics.inboundMessages.toLocaleString()}
              </p>
            </div>
          )}
          {latestMetrics.brandEnquiries && (
            <div className="p-3 rounded bg-brand-linen/20">
              <p className="text-xs text-brand-black/50">Brand Enquiries</p>
              <p className="font-semibold text-lg text-brand-black">
                {latestMetrics.brandEnquiries}
              </p>
            </div>
          )}
          {latestMetrics.speakingInvites && (
            <div className="p-3 rounded bg-brand-linen/20">
              <p className="text-xs text-brand-black/50">Speaking Invites</p>
              <p className="font-semibold text-lg text-brand-black">
                {latestMetrics.speakingInvites}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * BusinessImpactPanel
 * Agent insights on commercial impact and deal influence
 */
export function BusinessImpactPanel({ 
  impact, 
  onUpdateImpact,
  editable = true
}) {
  if (!impact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-brand-black">Business Impact</h4>
          {editable && (
            <button
              onClick={onUpdateImpact}
              className="text-xs px-3 py-1 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple rounded transition-colors"
            >
              + Record Impact
            </button>
          )}
        </div>
        <p className="text-sm text-brand-black/50 py-4">No impact recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-brand-black">Business Impact</h4>
        {editable && (
          <button
            onClick={onUpdateImpact}
            className="text-xs px-3 py-1 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple rounded transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="space-y-3">
        {impact.inboundLeads && (
          <div className="p-3 rounded bg-brand-linen/20">
            <p className="text-xs text-brand-black/50">Inbound Leads</p>
            <p className="font-semibold text-lg text-brand-black">{impact.inboundLeads}</p>
          </div>
        )}

        {impact.avgDealValueChangePct && (
          <div className="p-3 rounded bg-brand-linen/20">
            <p className="text-xs text-brand-black/50">Average Deal Value Change</p>
            <p className="font-semibold text-lg text-brand-black">
              {impact.avgDealValueChangePct > 0 ? '+' : ''}{impact.avgDealValueChangePct}%
            </p>
          </div>
        )}

        {impact.brandCategoriesUnlocked?.length > 0 && (
          <div className="p-3 rounded bg-brand-linen/20">
            <p className="text-xs text-brand-black/50 mb-2">Categories Unlocked</p>
            <div className="flex flex-wrap gap-1">
              {impact.brandCategoriesUnlocked.map(cat => (
                <span key={cat} className="text-xs px-2 py-1 rounded bg-brand-black/10">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {impact.agentNotes && (
          <div className="p-3 rounded bg-brand-linen/20">
            <p className="text-xs text-brand-black/50 mb-1">Agent Notes</p>
            <p className="text-sm text-brand-black">{impact.agentNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
