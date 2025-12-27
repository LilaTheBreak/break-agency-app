# Complete API Routes Inventory

**Generated:** 2025-12-26T01:36:48.259Z
**Total Route Files:** 129

---

## AI

### `ai.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /:role |
| POST | /reply |
| POST | /summaries/business |
| POST | /deal/extract |
| POST | /deal/negotiation |
| POST | /:role |
| POST | /file/insights |
| POST | /social/insights |
| POST | /summaries/inbox |

---

### `aiDealExtractor.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /deal-extract |

---

### `aiFileInsights.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /ai/file-insights |

---

### `aiSocialInsights.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /ai/social-insights/:userId |

---

## Admin

### `adminActivity.ts`

| Method | Endpoint |
|--------|----------|
| GET | /admin/activity |
| GET | /admin/activity/live |

---

### `adminUsers.ts`

**Middleware:** requireRole

| Method | Endpoint |
|--------|----------|
| DELETE | /users/:email |
| POST | /users |
| GET | /users/pending |
| POST | /users/:id/approve |
| POST | /users/:id/reject |
| GET | /users |
| PATCH | /users/:id |

---

## Analytics

### `analytics.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /revenue |
| GET | /metrics |
| GET | /socials |
| GET | /growth |
| GET | /performance |
| GET | /insights |

---

## Assets

### `assets.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /api/assets/upload-url |

---

### `fileRoutes.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /upload-url |
| POST | /confirm |
| GET | / |
| GET | /:id/download |

---

### `files.ts`

| Method | Endpoint |
|--------|----------|
| GET | / |
| POST | /upload-url |
| POST | /upload |
| POST | /confirm |
| GET | /:id/download |
| DELETE | /:id |

---

## Auth

### `auth.ts`

**Middleware:** requireAuth, rateLimit

| Method | Endpoint |
|--------|----------|
| GET | /google/url |
| GET | /google/callback |
| POST | /signup |
| POST | /login |
| GET | /me |
| POST | /logout |
| POST | /onboarding/submit |
| POST | /social-links |

---

### `authEmailSchemas.ts`

*No routes found or placeholder file*

---

### `authenticity.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /check |

---

## CRM

### `crmBrands.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |
| POST | /batch-import |

---

### `crmCampaigns.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |
| POST | /batch-import |
| POST | /:id/link-deal |
| DELETE | /:id/unlink-deal/:dealId |

---

### `crmContacts.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |
| POST | /:id/notes |

---

### `crmContracts.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |
| POST | /:id/notes |
| POST | /batch-import |

---

### `crmDeals.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |
| POST | /:id/notes |
| POST | /batch-import |

---

### `crmEvents.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |
| POST | /:id/notes |
| POST | /batch-import |

---

### `crmTasks.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /users |
| GET | /talents |
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |

---

## Calendar

### `calendar.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /events |
| POST | /events |
| DELETE | /events/:id |
| POST | /api/calendar-events/sync |

---

### `calendarIntelligence.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/calendar/intelligence |

---

## Campaigns

### `campaignAuto.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | / |
| POST | /preview |
| POST | /debug |

---

### `campaignAutoDebug.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | / |

---

### `campaignAutoPreview.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | / |

---

### `campaignBuilder.ts`

| Method | Endpoint |
|--------|----------|
| POST | /from-deal/:dealDraftId |

---

### `campaigns.ts`

| Method | Endpoint |
|--------|----------|
| POST | /campaigns |
| POST | /campaigns/:id/addBrand |
| GET | /campaigns/user/:userId |
| GET | /campaigns/:id |
| PUT | /campaigns/:id |

---

## Contracts

### `contract.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /process |
| POST | /submit |
| GET | /:id |
| GET | /generated/:id |
| POST | /generated/:id/finalise |
| POST | /generated/:id/build |
| POST | /:id/signature |
| GET | /:id/signature/status |

---

### `contracts.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| POST | / |
| GET | /:id |
| PUT | /:id |
| DELETE | /:id |
| POST | /:id/upload |
| POST | /:id/send |
| POST | /:id/sign/talent |
| POST | /:id/sign/brand |
| POST | /:id/finalise |
| POST | /:id/analyse |
| GET | /deals/:dealId/contracts |

---

## Creators

### `creator.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| USE | /api/creator |
| GET | /api/creator/:id/score |
| POST | /api/creator/goals |
| GET | /api/creator/intent-profile |
| GET | /api/creator/analytics |
| GET | /api/creator/analytics/content |
| GET | /api/creator/analytics/audience |

---

### `creatorDashboard.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/creator/dashboard |

---

### `creatorFit.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /calculate |
| POST | /batch |
| GET | /talent/:talentId |
| GET | /brand/:brandId |

---

### `creatorGoals.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |

---

### `creatorReview.ts`

**Middleware:** protect, requireRole

| Method | Endpoint |
|--------|----------|
| / | get |
| /:ID/APPROVE | post |
| /:ID/OVERRIDE | post |

---

### `creatorReviewController.ts`

*No routes found or placeholder file*

---

## Dashboard

### `dashboard.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /creators/active |
| GET | /campaigns/live |
| GET | /briefs/pending |
| GET | /stats |

---

### `dashboardAggregator.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/dashboard/aggregate |

---

### `dashboardCampaignPacing.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /campaign-pacing |

---

### `dashboardRevenue.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/dashboard/revenue-breakdown |

---

## Deals

### `dealAnalysis.ts`

*No routes found or placeholder file*

---

### `dealExtraction.ts`

| Method | Endpoint |
|--------|----------|
| POST | /extract/:emailId |
| POST | /extract/:emailId/async |
| GET | /user/:userId |

---

### `dealInsights.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /summary |
| GET | /winrate |
| GET | /pace |
| GET | /value-distribution |
| GET | /deliverable-performance |

---

### `dealIntelligence.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| USE | /api/deals/intelligence |
| POST | /api/deals/intelligence/run/:dealId |
| GET | /api/deals/intelligence/:dealId |
| POST | /api/deals/:dealId/draft-email |

---

### `dealNegotiation.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /suggest |

---

### `dealPackages.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /generate |
| GET | /:id |

---

### `dealTimeline.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /:dealId |
| POST | /:dealId/note |

---

### `deals.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| POST | / |
| GET | /:id |
| PUT | /:id |
| DELETE | /:id |
| POST | /:id/stage |

---

## Email

### `email.ts`

**Middleware:** rateLimit

| Method | Endpoint |
|--------|----------|
| POST | /email/test |
| POST | /email/send |
| GET | /email/logs |

---

### `emailGenerator.ts`

*No routes found or placeholder file*

---

### `emailOpportunities.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /scan |
| GET | / |
| GET | /:id |
| PUT | /:id |
| POST | /:id/actions |
| GET | /stats/summary |

---

## Gmail

### `gmail.ts`

| Method | Endpoint |
|--------|----------|
| GET | /auth/url |
| GET | /auth/callback |
| POST | /ingest |

---

### `gmailAnalysis.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /analysis/email/:emailId |
| POST | /analysis/reanalyse/:emailId |
| GET | /analysis/email/:emailId |
| POST | /analysis/thread/:threadId |
| POST | /analysis/bulk |

---

### `gmailAuth.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /status |
| GET | /url |
| GET | /callback |
| POST | /draft-queue |
| POST | /disconnect |

---

### `gmailInbox.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /unread |
| GET | /search |
| GET | /thread/:threadId |
| POST | /sync |

---

### `gmailMessages.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /gmail/messages |
| GET | /gmail/messages/:id |
| GET | /gmail/threads/:id |
| POST | /gmail/sync |

---

### `gmailWebhook.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /notification |
| POST | /register |
| POST | /unregister |
| POST | /renew |

---

## Inbox

### `inbox.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /api/inbox/scan |
| GET | /api/inbox/priority |
| GET | /api/inbox/awaiting-reply |
| GET | /api/inbox/open/:id |

---

### `inboxAISuggestions.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/inbox/ai-suggestions/:emailId |

---

### `inboxAiReply.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /api/inbox/ai-reply |

---

### `inboxAnalytics.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /inbox/analytics |

---

### `inboxAssign.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /api/inbox/assign |

---

### `inboxAwaitingReply.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |

---

### `inboxBulk.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /api/inbox/bulk |

---

### `inboxCategories.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/inbox/categories |

---

### `inboxCounters.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/inbox/counters |

---

### `inboxPriority.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |

---

### `inboxPriorityFeed.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |

---

### `inboxReadState.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /api/inbox/mark-read |
| POST | /api/inbox/mark-unread |

---

### `inboxRescan.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /api/inbox/rescan |

---

### `inboxThread.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/inbox/thread/:threadId |
| GET | /api/inbox/threads |

---

### `inboxTracking.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |

---

### `inboxTriage.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /triage/:emailId |
| POST | /triage/:emailId/async |
| POST | /triage/user/:userId |

---

## Opportunities

### `opportunities.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /public |
| GET | / |
| GET | /:id |
| POST | / |
| PUT | /:id |
| DELETE | /:id |
| GET | /creator/all |
| POST | /:id/apply |
| GET | /:id/application |

---

## Other

### `activity.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /api/activity |

---

### `agent.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /run |

---

### `approvals.ts`

**Middleware:** requireAuth, requireAdmin

| Method | Endpoint |
|--------|----------|
| GET | /api/approvals |
| POST | /api/approvals/:id/approve |
| POST | /api/approvals/:id/reject |

---

### `audit.ts`

| Method | Endpoint |
|--------|----------|
| GET | /audit |

---

### `automation.ts`

**Middleware:** requireAdmin

| Method | Endpoint |
|--------|----------|
| POST | /deal-automation/run |

---

### `brandCRM.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |

---

### `briefs.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| POST | /ingest |
| GET | /:id |
| GET | /:id/matches |

---

### `bundles.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| POST | / |
| GET | /:id |
| PUT | /:id |
| DELETE | /:id |
| POST | /generate |
| POST | / |
| POST | / |

---

### `checkOnboardingApproved.ts`

**Middleware:** protect, checkOnboardingApproved

*No routes found or placeholder file*

---

### `cron.ts`

| Method | Endpoint |
|--------|----------|
| POST | /gmail-sync |
| POST | /gmail-webhook-renewal |

---

### `deck.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /generate |
| POST | /summarize |

---

### `deliverables.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | / |
| GET | / |
| POST | /from-contract/:contractId |
| POST | /:id/status |
| PUT | /:id |
| POST | /:id/qa |
| POST | /:id/predict |
| POST | /:id/review |
| GET | /:id/reviews |

---

### `devAuth.ts`

| Method | Endpoint |
|--------|----------|
| POST | /login |
| POST | /logout |
| GET | /me |

---

### `documentExtraction.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /documents/:id/text |

---

### `exclusive.ts`

| Method | Endpoint |
|--------|----------|
| GET | /overview |
| GET | /onboarding-status |
| POST | /onboarding-complete |
| GET | /projects |
| GET | /opportunities |
| GET | /tasks |
| PATCH | /tasks/:id/complete |
| GET | /events |
| POST | /events/:id/accept |
| POST | /events/:id/decline |
| GET | /calendar/preview |
| GET | /insights |
| PATCH | /insights/:id/mark-read |
| GET | /revenue/summary |
| GET | /goals |
| POST | /goals |
| PATCH | /goals/:id |
| DELETE | /goals/:id |
| POST | /goals/:id/archive |
| GET | /socials |
| POST | /socials/connect |
| POST | /socials/disconnect |
| POST | /wellness-checkin |
| GET | /wellness-history |
| POST | /ai/ask |
| GET | /ai/history |

---

### `forecastEngine.ts`

*No routes found or placeholder file*

---

### `health.ts`

*No routes found or placeholder file*

---

### `index.ts`

**Middleware:** requireAuth, requireRole, requireAdmin

| Method | Endpoint |
|--------|----------|
| GET | /health |
| USE | /system |
| USE | /admin |
| USE | /agent |
| USE | /brand |
| USE | /talent |
| USE | /ai |
| USE | /deck |
| USE | /admin |
| GET | /profiles/:email |
| PUT | /profiles/:email |

---

### `insights.ts`

| Method | Endpoint |
|--------|----------|
| GET | /:userId |
| POST | /:userId/generate |
| GET | /:userId/weekly |

---

### `listingsController.ts`

*No routes found or placeholder file*

---

### `messages.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| GET | /thread/:threadId |
| POST | /send |
| POST | /reply |

---

### `negotiation.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /generate/:dealDraftId |
| GET | /user/:userId |
| POST | /:sessionId/step |
| GET | /thread/:id |

---

### `notifications.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /unread-count |
| PATCH | /:id/read |
| PATCH | /mark-all-read |
| DELETE | /:id |

---

### `onboarding.ts`

**Middleware:** requireAuth, requireRole

| Method | Endpoint |
|--------|----------|
| GET | /onboarding/me |
| POST | /onboarding/submit |
| PATCH | /onboarding/:userId |

---

### `queues.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /all |
| POST | /:id/complete |
| POST | /:id/delete |

---

### `requestsController.ts`

*No routes found or placeholder file*

---

### `resources.ts`

**Middleware:** requireAuth, requireAdmin, protect

| Method | Endpoint |
|--------|----------|
| POST | /upload |
| GET | / |
| GET | /:id |
| POST | / |
| PUT | /:id |
| DELETE | /:id |
| POST | /:id/rsvp |
| DELETE | /:id/rsvp |
| GET | /:id/rsvps |

---

### `risk.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /check |

---

### `salesOpportunities.ts`

**Middleware:** requireAuth, requireAdmin

| Method | Endpoint |
|--------|----------|
| POST | / |
| GET | / |
| GET | /:id |
| PATCH | /:id |
| POST | /:id/convert-to-deal |
| POST | /:id/close |

---

### `sentimentEngine.ts`

*No routes found or placeholder file*

---

### `setup.ts`

| Method | Endpoint |
|--------|----------|
| POST | /verify |
| POST | /complete |

---

### `signatureWebhooks.ts`

| Method | Endpoint |
|--------|----------|
| POST | /signature |

---

### `social.ts`

**Middleware:** rateLimit

| Method | Endpoint |
|--------|----------|
| GET | / |
| POST | /connect |
| POST | /disconnect |
| POST | /refresh |
| GET | /metrics/:platform |

---

### `submissions.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |

---

### `suitability.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /score |
| GET | /history |
| GET | /result/:id |
| GET | /explain/:id |

---

### `system.ts`

**Middleware:** requireRole

| Method | Endpoint |
|--------|----------|
| GET | /system/cron |
| GET | /system/cron/:name/logs |

---

### `threads.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:threadId |
| GET | /:threadId/messages |
| POST | /:threadId/summarise |
| POST | /:threadId/reply |

---

### `unifiedInbox.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | /inbox/unified |

---

### `userApprovals.ts`

**Middleware:** requireAuth, requireAdmin

| Method | Endpoint |
|--------|----------|
| GET | /pending |
| POST | /:userId/approve |
| POST | /:userId/reject |

---

### `users.ts`

**Middleware:** requireAuth, requireAdmin

| Method | Endpoint |
|--------|----------|
| GET | /me |
| GET | /pending |
| GET | / |
| GET | /:id |
| PUT | /:id |
| PUT | /:id/role |
| POST | / |
| POST | /:id/approve |
| POST | /:id/reject |
| DELETE | /:id |

---

### `webhooks.ts`

*No routes found or placeholder file*

---

## Outreach

### `outreach.ts`

**Middleware:** requireAuth, requireAdmin

| Method | Endpoint |
|--------|----------|
| POST | /generate |
| POST | /prospect |
| POST | /start/:leadId |
| PATCH | /sequence/:seqId/pause |
| GET | /records |
| POST | /records |
| PATCH | /records/:id |
| GET | /records/:id |
| DELETE | /records/:id |
| GET | /records/:id/gmail-thread |
| POST | /records/:id/link-gmail-thread |
| POST | /records/:id/notes |
| GET | /records/:id/notes |
| POST | /records/:id/tasks |
| GET | /records/:id/tasks |
| PATCH | /tasks/:taskId |
| GET | /reminders |

---

### `outreachLeads.ts`

| Method | Endpoint |
|--------|----------|
| GET | / |

---

### `outreachMetrics.ts`

**Middleware:** requireAuth, requireAdmin

| Method | Endpoint |
|--------|----------|
| GET | /pipeline |
| GET | / |

---

### `outreachRecords.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /:id |
| POST | / |
| PATCH | /:id |
| DELETE | /:id |
| GET | /summary/stats |

---

### `outreachSequences.ts`

| Method | Endpoint |
|--------|----------|
| GET | / |

---

### `outreachTemplates.ts`

| Method | Endpoint |
|--------|----------|
| GET | / |

---

## Payments

### `payments.ts`

| Method | Endpoint |
|--------|----------|
| POST | /intent |
| POST | /invoice |
| POST | /stripe/webhook |
| POST | /paypal/webhook |

---

### `payouts.ts`

**Middleware:** requireRole

| Method | Endpoint |
|--------|----------|
| GET | /payouts/summary |

---

## Strategy

### `strategy.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| POST | /campaign-plan |
| POST | /creator-fit |

---

### `strategyEngine.ts`

*No routes found or placeholder file*

---

## UGC

### `ugc.ts`

**Middleware:** protect, requireRole

| Method | Endpoint |
|--------|----------|
| POST | /apply |
| GET | /application/my |
| GET | /ugc-applications |
| POST | /ugc-applications/:id/approve |
| POST | /ugc-applications/:id/reject |
| USE | /admin |

---

### `ugcAdmin.ts`

**Middleware:** protect, requireRole

| Method | Endpoint |
|--------|----------|
| POST | /listings/:id/approve |
| POST | /requests/:id/approve |

---

### `ugcAdminController.ts`

*No routes found or placeholder file*

---

## Wellness

### `wellness.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| USE | /api/wellness |
| POST | /api/wellness/check-in |
| GET | /api/wellness/history |
| GET | /api/wellness/insights |

---

### `wellnessCheckins.ts`

**Middleware:** requireAuth

| Method | Endpoint |
|--------|----------|
| GET | / |
| GET | /latest |
| GET | /stats |
| POST | / |
| GET | /:id |

---

## Summary Statistics

- **Total Domains:** 22
- **Total Route Files:** 129
- **Total Endpoints:** 453

- **AI:** 12 endpoints
- **Admin:** 9 endpoints
- **Analytics:** 6 endpoints
- **Assets:** 11 endpoints
- **Auth:** 9 endpoints
- **CRM:** 48 endpoints
- **Calendar:** 5 endpoints
- **Campaigns:** 11 endpoints
- **Contracts:** 20 endpoints
- **Creators:** 20 endpoints
- **Dashboard:** 7 endpoints
- **Deals:** 23 endpoints
- **Email:** 9 endpoints
- **Gmail:** 26 endpoints
- **Inbox:** 23 endpoints
- **Opportunities:** 9 endpoints
- **Other:** 153 endpoints
- **Outreach:** 28 endpoints
- **Payments:** 5 endpoints
- **Strategy:** 2 endpoints
- **UGC:** 8 endpoints
- **Wellness:** 9 endpoints
