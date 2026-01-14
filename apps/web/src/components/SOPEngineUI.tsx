import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import SkeletonLoader from './SkeletonLoader';
import { ErrorBoundary } from './ErrorBoundary';

interface SOPTemplate {
  id: string;
  talentId: string;
  name: string;
  description: string;
  steps: SOPStep[];
  category: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  isRequired: boolean;
}

interface SOPInstance {
  id: string;
  templateId: string;
  talentId: string;
  status: 'DRAFT' | 'ACTIVE' | 'BROKEN' | 'FOLLOWED';
  startedAt: string | null;
  completedAt: string | null;
  deviations: string[];
  notes: string;
  template?: SOPTemplate;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  talentId: string;
  onLoadingChange?: (loading: boolean) => void;
}

const SOPEngineUI: React.FC<Props> = ({ talentId, onLoadingChange }) => {
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [instances, setInstances] = useState<SOPInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('templates');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateInstance, setShowCreateInstance] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SOPTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SOPTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<SOPInstance | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    owner: '',
    steps: [{ order: 1, title: '', description: '', estimatedTime: 15, isRequired: true }],
  });

  // Fetch templates and instances
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In Phase 1, these endpoints need to be created. For now, using mock data structure
      // const templatesResponse = await fetch(`/api/sop-templates/${talentId}`, ...)
      // For Phase 2, we'll integrate with actual API once routes are added in Phase 1

      // Mock data for demonstration
      setTemplates([]);
      setInstances([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SOP data');
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [talentId]);

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...templateForm,
        talentId,
      };

      // This will be integrated with actual API in Phase 1 extension
      // const response = await fetch(`/api/sop-templates/${talentId}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${localStorage.getItem('token')}`,
      //   },
      //   body: JSON.stringify(payload),
      // });

      // For now, mock success
      const newTemplate: SOPTemplate = {
        id: `template-${Date.now()}`,
        talentId,
        ...templateForm,
        steps: templateForm.steps as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTemplates([...templates, newTemplate]);
      setShowCreateTemplate(false);
      setTemplateForm({
        name: '',
        description: '',
        category: '',
        owner: '',
        steps: [{ order: 1, title: '', description: '', estimatedTime: 15, isRequired: true }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => {
    setTemplateForm({
      ...templateForm,
      steps: [
        ...templateForm.steps,
        {
          order: templateForm.steps.length + 1,
          title: '',
          description: '',
          estimatedTime: 15,
          isRequired: true,
        },
      ],
    });
  };

  const handleRemoveStep = (index: number) => {
    setTemplateForm({
      ...templateForm,
      steps: templateForm.steps.filter((_, i) => i !== index),
    });
  };

  const handleUpdateStep = (index: number, field: string, value: any) => {
    const newSteps = [...templateForm.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setTemplateForm({ ...templateForm, steps: newSteps });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Delete this SOP template?')) return;

    try {
      // Delete via API when implemented
      // const response = await fetch(`/api/sop-templates/${templateId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem('token')}`,
      //   },
      // });

      setTemplates(templates.filter((t) => t.id !== templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleCreateInstance = async (templateId: string) => {
    try {
      // Create via API when implemented
      // const response = await fetch(`/api/sop-instances/${templateId}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${localStorage.getItem('token')}`,
      //   },
      //   body: JSON.stringify({ status: 'DRAFT' }),
      // });

      const template = templates.find((t) => t.id === templateId);
      const newInstance: SOPInstance = {
        id: `instance-${Date.now()}`,
        templateId,
        talentId,
        status: 'DRAFT',
        startedAt: null,
        completedAt: null,
        deviations: [],
        notes: '',
        template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setInstances([...instances, newInstance]);
      setShowCreateInstance(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create instance');
    }
  };

  const handleUpdateInstanceStatus = async (instanceId: string, newStatus: string) => {
    try {
      // Update via API when implemented
      // const response = await fetch(`/api/sop-instances/${instanceId}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${localStorage.getItem('token')}`,
      //   },
      //   body: JSON.stringify({ status: newStatus }),
      // });

      setInstances(
        instances.map((inst) =>
          inst.id === instanceId
            ? {
                ...inst,
                status: newStatus as any,
                completedAt: newStatus === 'FOLLOWED' ? new Date().toISOString() : null,
                startedAt: newStatus === 'ACTIVE' ? new Date().toISOString() : inst.startedAt,
              }
            : inst
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update instance');
    }
  };

  if (loading) {
    return <SkeletonLoader count={3} />;
  }

  const filteredInstances =
    filterStatus === 'ALL' ? instances : instances.filter((i) => i.status === filterStatus);

  const totalTemplates = templates.length;
  const activeInstances = instances.filter((i) => i.status === 'ACTIVE').length;
  const brokenInstances = instances.filter((i) => i.status === 'BROKEN').length;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">SOP Engine</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and track Standard Operating Procedures for your business
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">SOP Templates</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{totalTemplates}</p>
            <p className="text-xs text-gray-500 mt-1">Documented processes</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Active Executions</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{activeInstances}</p>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Broken Processes</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{brokenInstances}</p>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'templates'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            SOP Templates ({totalTemplates})
          </button>
          <button
            onClick={() => setActiveTab('instances')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'instances'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Executions ({instances.length})
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowCreateTemplate(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + Create Template
            </button>

            {templates.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600 mb-4">No SOP templates yet.</p>
                <button
                  onClick={() => setShowCreateTemplate(true)}
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Create your first template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-2 mb-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{template.steps.length} steps</span>
                        <span>
                          {template.steps.reduce((sum, s) => sum + s.estimatedTime, 0)} min total
                        </span>
                      </div>
                      {template.category && (
                        <p className="text-xs text-gray-700">
                          <strong>Category:</strong> {template.category}
                        </p>
                      )}
                      {template.owner && (
                        <p className="text-xs text-gray-700">
                          <strong>Owner:</strong> {template.owner}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleCreateInstance(template.id)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                    >
                      Start Execution
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instances Tab */}
        {activeTab === 'instances' && (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                  filterStatus === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {['DRAFT', 'ACTIVE', 'BROKEN', 'FOLLOWED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {filteredInstances.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600">
                  {instances.length === 0
                    ? 'No SOP executions yet. Create a template to get started.'
                    : 'No instances in this status.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInstances.map((instance) => (
                  <div key={instance.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {instance.template?.name || 'Unknown Template'}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{instance.template?.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full font-semibold text-xs whitespace-nowrap ml-4 ${
                          instance.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-800'
                            : instance.status === 'ACTIVE'
                            ? 'bg-blue-100 text-blue-800'
                            : instance.status === 'BROKEN'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {instance.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                      {instance.startedAt && (
                        <div>
                          <p className="font-medium">Started</p>
                          <p>{new Date(instance.startedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                      {instance.completedAt && (
                        <div>
                          <p className="font-medium">Completed</p>
                          <p>{new Date(instance.completedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {instance.deviations.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-3">
                        <p className="text-xs font-semibold text-orange-900 mb-1">
                          {instance.deviations.length} deviations:
                        </p>
                        <ul className="text-xs text-orange-800 space-y-1">
                          {instance.deviations.slice(0, 2).map((dev, idx) => (
                            <li key={idx}>• {dev}</li>
                          ))}
                          {instance.deviations.length > 2 && (
                            <li>• +{instance.deviations.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {instance.status === 'DRAFT' && (
                        <button
                          onClick={() => handleUpdateInstanceStatus(instance.id, 'ACTIVE')}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
                        >
                          Start
                        </button>
                      )}
                      {instance.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleUpdateInstanceStatus(instance.id, 'FOLLOWED')}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateInstanceStatus(instance.id, 'BROKEN')}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded font-medium text-sm hover:bg-red-700"
                          >
                            Flag Issue
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedInstance(instance)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded font-medium text-sm hover:bg-gray-50"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Template Modal */}
        <Modal
          isOpen={showCreateTemplate}
          onClose={() => setShowCreateTemplate(false)}
          title="Create SOP Template"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Launch Product, Onboard Client"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="What does this SOP accomplish?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  placeholder="e.g., Sales, Operations"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <input
                  type="text"
                  value={templateForm.owner}
                  onChange={(e) => setTemplateForm({ ...templateForm, owner: e.target.value })}
                  placeholder="Who owns this process?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Steps */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Steps</label>
                <button
                  onClick={handleAddStep}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Step
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {templateForm.steps.map((step, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-gray-700">Step {index + 1}</label>
                      {templateForm.steps.length > 1 && (
                        <button
                          onClick={() => handleRemoveStep(index)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                      placeholder="Step title"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />

                    <textarea
                      value={step.description}
                      onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                      placeholder="Step description"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      rows={2}
                    />

                    <input
                      type="number"
                      value={step.estimatedTime}
                      onChange={(e) => handleUpdateStep(index, 'estimatedTime', Number(e.target.value))}
                      placeholder="Estimated time (minutes)"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={loading || !templateForm.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 SOP Best Practices</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create templates for repetitive business processes</li>
            <li>• Track executions to identify bottlenecks and deviations</li>
            <li>• Update templates based on real-world execution</li>
            <li>• Flag broken processes immediately and fix them</li>
            <li>• Systematize your operations to scale your business</li>
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SOPEngineUI;
