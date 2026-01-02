# App Review Documentation for Meta (Instagram) and TikTok

This document provides reviewer-facing information about how The Break uses Instagram Graph API and TikTok Login Kit.

## Overview

The Break is a creator-brand platform that connects brands with creators for partnership opportunities. We use Instagram and TikTok APIs to help brands evaluate creator profiles and match creators with relevant opportunities.

## Read-Only Data Access

**CRITICAL: The Break uses Instagram Graph API and TikTok Login Kit in READ-ONLY mode.**

### What We Do NOT Do

The Break does **NOT**:
- ❌ Post content to Instagram or TikTok
- ❌ Send direct messages on Instagram or TikTok
- ❌ Run ads on Instagram or TikTok
- ❌ Modify user accounts, settings, or profiles
- ❌ Delete or edit existing posts
- ❌ Access private messages or DMs
- ❌ Perform any write operations on connected accounts

### What We DO Access (Read-Only)

The Break accesses the following data in read-only mode:

**Instagram Graph API:**
- Profile information (username, bio, profile picture)
- Follower and following counts
- Post engagement metrics (likes, comments, shares)
- Account analytics data (when available through API)

**TikTok Login Kit:**
- Profile information (username, bio, profile picture)
- Follower counts
- Video engagement metrics (views, likes, comments)
- Account analytics data (when available through API)

### How We Use This Data

All data accessed from Instagram and TikTok is used exclusively for:

1. **Talent Management**: Internal CRM system to manage creator profiles and track performance
2. **Opportunity Matching**: Help brands evaluate creators and match them with relevant campaign opportunities
3. **Analytics**: Provide creators with insights about their social media performance
4. **Internal Visibility**: Enable The Break team to understand creator capabilities and audience demographics

### Data Storage and Security

- All Instagram and TikTok data is stored securely in our database
- Data is encrypted in transit and at rest
- Access is restricted to authorized Break platform administrators
- Data is never sold, shared with third parties, or used for advertising purposes

### User Control

Users can:
- Connect or disconnect Instagram/TikTok accounts at any time through account settings
- Request deletion of their data (subject to legal and operational requirements)
- View what data we have collected through their account dashboard

## Technical Implementation

- **Instagram**: Uses Meta's Instagram Graph API with read-only permissions
- **TikTok**: Uses TikTok Login Kit with read-only permissions
- **OAuth Flow**: Standard OAuth 2.0 authorization flow with explicit user consent
- **Data Sync**: Periodic background sync to update analytics data (read-only)

## Contact Information

For questions about our use of Instagram or TikTok APIs, please contact:

- **Email**: lila@thebreakco.com
- **Legal Contact**: legal@thebreakco.com

## Privacy Policy

Our full privacy policy is available at: https://www.tbctbctbc.online/privacy-policy

This policy includes detailed information about:
- What data we collect from Instagram and TikTok
- How we use this data
- Data retention and deletion policies
- User rights and controls

## Compliance

The Break complies with:
- Meta's Platform Terms and Instagram Graph API policies
- TikTok's Developer Terms and Login Kit policies
- GDPR, CCPA, and other applicable data protection regulations

---

**Last Updated**: January 2025  
**Version**: 1.0

