# App Review Screencast Walkthrough Script

This document provides a step-by-step script for creating a screencast walkthrough for Meta (Instagram) and TikTok app review.

## Purpose

This screencast demonstrates:
1. How users connect their Instagram and TikTok accounts
2. That The Break uses read-only access (no posting, messaging, or account modification)
3. How the data is used within The Break platform
4. User controls for disconnecting accounts

## Recording Checklist

Before recording, ensure:
- [ ] Test account with Instagram connected
- [ ] Test account with TikTok connected
- [ ] Browser console is open (to show no errors)
- [ ] Network tab is open (to show API calls are read-only)
- [ ] Recording software is set up (Loom, OBS, or similar)
- [ ] Audio is clear and narration is prepared

## Screencast Script

### Introduction (0:00 - 0:30)

**Narration:**
"Hi, this is a walkthrough of The Break platform for Meta and TikTok app review. I'll demonstrate how we use Instagram Graph API and TikTok Login Kit in read-only mode to help brands evaluate creators and match them with opportunities."

**Visual:**
- Show The Break homepage
- Navigate to login page

### Step 1: User Login (0:30 - 1:00)

**Narration:**
"First, I'll log in as a creator user to show the account connection flow."

**Visual:**
- Log in with test account
- Navigate to profile or settings page
- Show social media connection section

### Step 2: Connect Instagram Account (1:00 - 2:30)

**Narration:**
"Now I'll connect an Instagram account. When the user clicks 'Connect Instagram', they're taken through Meta's OAuth flow. Notice that we only request read permissions—no write permissions for posting or messaging."

**Visual:**
- Click "Connect Instagram" button
- Show OAuth popup/redirect
- Point out permission scopes requested (read-only)
- Complete OAuth flow
- Show success message

**Key Points to Highlight:**
- Only read permissions requested
- No write permissions visible
- User explicitly consents to connection

### Step 3: Verify Read-Only Access (2:30 - 4:00)

**Narration:**
"After connecting, let me show you what data we access. I'll open the browser's Network tab to demonstrate that all API calls are read-only GET requests. We're fetching profile information, follower counts, and engagement metrics—but we're not making any POST, PUT, or DELETE requests."

**Visual:**
- Open browser DevTools → Network tab
- Navigate to a page that displays Instagram data
- Show API calls in Network tab
- Filter to show only Instagram API calls
- Point out all requests are GET requests (read-only)
- Show response data (profile info, metrics)

**Key Points to Highlight:**
- All API calls are GET requests
- No POST/PUT/DELETE requests visible
- Data shown is read-only (profile, metrics)

### Step 4: Show Instagram Data Usage (4:00 - 5:00)

**Narration:**
"Here's how we use the Instagram data. We display it in the creator's profile for talent management purposes. Brands can see this information when evaluating creators for opportunities. Notice there's no option to post, send messages, or modify the Instagram account—only viewing and analytics."

**Visual:**
- Show creator profile page with Instagram data
- Show follower counts, engagement metrics
- Scroll through analytics dashboard
- Point out there are no "Post" or "Send Message" buttons
- Show that data is read-only display only

**Key Points to Highlight:**
- Data is displayed for viewing only
- No posting or messaging capabilities
- Used for talent evaluation and matching

### Step 5: Connect TikTok Account (5:00 - 6:30)

**Narration:**
"Now I'll connect a TikTok account. Similar to Instagram, we use TikTok Login Kit with read-only permissions. The OAuth flow requests only read access to profile and analytics data."

**Visual:**
- Click "Connect TikTok" button
- Show TikTok OAuth flow
- Point out read-only permissions
- Complete OAuth flow
- Show success message

**Key Points to Highlight:**
- Only read permissions requested
- No write permissions
- User explicitly consents

### Step 6: Verify TikTok Read-Only Access (6:30 - 8:00)

**Narration:**
"Again, let me verify that all TikTok API calls are read-only. I'll check the Network tab to show that we're only making GET requests to fetch profile and analytics data."

**Visual:**
- Open Network tab
- Navigate to page showing TikTok data
- Filter to TikTok API calls
- Show all requests are GET requests
- Show response data (profile, metrics)

**Key Points to Highlight:**
- All API calls are GET requests
- No write operations
- Data is read-only

### Step 7: Show TikTok Data Usage (8:00 - 9:00)

**Narration:**
"Here's how we use TikTok data—same as Instagram. It's displayed in the creator profile for talent management and opportunity matching. No posting or messaging capabilities."

**Visual:**
- Show creator profile with TikTok data
- Show follower counts, video metrics
- Point out no posting/messaging buttons
- Show analytics dashboard

**Key Points to Highlight:**
- Read-only display
- No write capabilities
- Used for evaluation and matching

### Step 8: User Controls - Disconnect (9:00 - 10:00)

**Narration:**
"Users have full control. They can disconnect their Instagram or TikTok accounts at any time through their account settings. When disconnected, we stop syncing new data, though historical data may be retained for a limited period for service continuity."

**Visual:**
- Navigate to account settings
- Show "Disconnect Instagram" option
- Show "Disconnect TikTok" option
- Click disconnect (or show the option)
- Show confirmation dialog
- Explain data retention policy

**Key Points to Highlight:**
- Users can disconnect anytime
- Clear disconnect options
- Transparent about data retention

### Step 9: Privacy Policy Reference (10:00 - 10:30)

**Narration:**
"Finally, our privacy policy clearly explains our read-only data usage. It's publicly accessible and includes detailed sections about Instagram Graph API and TikTok Login Kit usage."

**Visual:**
- Navigate to /privacy-policy
- Scroll to Instagram section
- Scroll to TikTok section
- Highlight read-only language
- Show contact information

**Key Points to Highlight:**
- Privacy policy is public
- Clear read-only explanation
- Contact information provided

### Conclusion (10:30 - 11:00)

**Narration:**
"To summarize: The Break uses Instagram Graph API and TikTok Login Kit exclusively in read-only mode. We do not post content, send messages, run ads, or modify user accounts. All data is used internally for talent management and opportunity matching. Users have full control to connect or disconnect at any time. Thank you for your review."

**Visual:**
- Show summary slide or return to homepage
- Display key points:
  - Read-only access
  - No posting/messaging
  - User control
  - Privacy policy available

## Post-Recording Checklist

After recording:
- [ ] Review video for clarity and accuracy
- [ ] Ensure all key points are visible
- [ ] Verify Network tab clearly shows read-only requests
- [ ] Check that privacy policy sections are readable
- [ ] Upload to Loom, YouTube (unlisted), or similar
- [ ] Update this document with video link

## Video Link Placeholder

**Screencast URL**: [To be added after recording]

**Recording Date**: [To be added]

**Duration**: ~11 minutes

**Format**: MP4, 1080p recommended

## Notes for Reviewers

- All API calls shown in Network tab are read-only (GET requests only)
- No POST, PUT, or DELETE requests are made to Instagram or TikTok APIs
- User interface shows no posting or messaging capabilities
- Privacy policy clearly states read-only usage
- Users can disconnect accounts at any time

---

**Last Updated**: January 2025  
**Version**: 1.0

