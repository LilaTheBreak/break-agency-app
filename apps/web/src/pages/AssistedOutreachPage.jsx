import React, { useState, useEffect } from 'react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { ADMIN_NAV_LINKS } from './adminNavLinks.js';
import OutreachCampaignList from '../components/OutreachCampaignList.jsx';
import OutreachCampaignDetail from '../components/OutreachCampaignDetail.jsx';
import OutreachDraftApprovalScreen from '../components/OutreachDraftApprovalScreen.jsx';

/**
 * AssistedOutreachPage
 * 
 * Dedicated page for the AI-assisted, semi-automated outreach feature.
 * - Create campaigns with AI-generated drafts
 * - Review and approve drafts
 * - Send emails with tracking
 * - Manage replies and sentiment
 * - Book meetings from positive replies
 */
export function AssistedOutreachPage({ session }) {
  const [currentView, setCurrentView] = useState('list'); // list | detail | approval
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCampaignSelect = (campaignId) => {
    setSelectedCampaignId(campaignId);
    setCurrentView('detail');
  };

  const handleApprovalRequest = (campaignId, draftId) => {
    setSelectedCampaignId(campaignId);
    setSelectedDraftId(draftId);
    setCurrentView('approval');
  };

  const handleApprovalComplete = () => {
    setCurrentView('detail');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCampaignId(null);
    setSelectedDraftId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBackToDetail = () => {
    setCurrentView('detail');
    setSelectedDraftId(null);
  };

  const handleCampaignCreated = () => {
    setCurrentView('list');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardShell
      title="Assisted Outreach"
      subtitle="AI-powered email drafting with human approval and automatic reply tracking."
      navLinks={ADMIN_NAV_LINKS}
    >
      {currentView === 'list' && (
        <OutreachCampaignList 
          onCampaignSelect={handleCampaignSelect}
          onCreateNew={() => {}} 
          refreshTrigger={refreshTrigger}
        />
      )}

      {currentView === 'detail' && selectedCampaignId && (
        <OutreachCampaignDetail 
          campaignId={selectedCampaignId}
          onBack={handleBackToList}
          onApprovalRequest={handleApprovalRequest}
          refreshTrigger={refreshTrigger}
        />
      )}

      {currentView === 'approval' && selectedCampaignId && selectedDraftId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl border border-brand-black/10 bg-white shadow-lg">
            <div className="sticky top-0 border-b border-brand-black/10 bg-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review & Approve Draft</h3>
              <button
                onClick={handleBackToDetail}
                className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <OutreachDraftApprovalScreen
                campaignId={selectedCampaignId}
                draftId={selectedDraftId}
                onComplete={handleApprovalComplete}
                onCancel={handleBackToDetail}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default AssistedOutreachPage;
