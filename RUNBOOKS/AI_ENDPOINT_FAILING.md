# Runbook: AI Endpoint Failing

**Last Updated:** January 2025  
**Severity:** Medium  
**Estimated Resolution Time:** 15-30 minutes

---

## Symptoms

- AI assistant not responding
- AI reply suggestions failing
- Deal extraction not working
- AI endpoints returning errors
- OpenAI API errors in logs

---

## Quick Diagnosis

### Step 1: Check OpenAI API Key

**Test:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Expected:**
- 200 OK response
- List of available models

**If Error:**
- 401 Unauthorized → API key invalid/expired
- 429 Too Many Requests → Rate limit exceeded
- 500 Internal Server Error → OpenAI service issue

### Step 2: Check AI Endpoint Status

**Test:**
```bash
curl -X POST https://api.example.com/api/ai/assistant \
  -H "Cookie: break_session=<SESSION_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "role": "admin"}'
```

**Expected:**
```json
{
  "success": true,
  "response": "...",
  "tokens": 150
}
```

**If Error:**
- Check error message
- See "Common Errors" section

### Step 3: Check Rate Limiting

**Query:**
```sql
SELECT 
  COUNT(*) as ai_requests_last_hour
FROM "AuditLog"
WHERE 
  action LIKE 'AI_%'
  AND createdAt > NOW() - INTERVAL '1 hour';
```

**Expected:**
- < 20 requests per user per hour (rate limit)
- No spike in requests

**If Issues Found:**
- Rate limit exceeded → Wait for reset
- Check for abuse/retry loops

### Step 4: Check Token Usage

**Query:**
```sql
SELECT 
  SUM((metadata->>'tokens')::int) as total_tokens,
  COUNT(*) as request_count
FROM "AuditLog"
WHERE 
  action LIKE 'AI_%'
  AND createdAt > NOW() - INTERVAL '24 hours';
```

**Expected:**
- Reasonable token usage (< 1M tokens/day)
- No sudden spikes

**If Issues Found:**
- Token usage spike → Check for retry loops
- Review prompt sizes

---

## Root Cause Analysis

### 1. OpenAI API Key Invalid/Expired

**Symptoms:**
- 401 Unauthorized errors
- "Invalid API key" in logs

**Resolution:**
1. Verify API key in environment:
   ```bash
   echo $OPENAI_API_KEY
   ```

2. Check OpenAI Dashboard:
   - Go to https://platform.openai.com/api-keys
   - Verify key is active
   - Check key permissions

3. Regenerate key if needed:
   - Create new API key in OpenAI Dashboard
   - Update `OPENAI_API_KEY` environment variable
   - Restart API server

**Prevention:**
- Monitor API key expiry
- Alert on 401 errors
- Rotate keys periodically

### 2. Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- "Rate limit exceeded" in logs

**Resolution:**
1. Check current rate limits:
   - OpenAI Dashboard → Usage → Rate Limits
   - Review tier limits (free/tier 1/tier 2)

2. Implement backoff:
   - Already implemented in services
   - Check if backoff is working

3. Upgrade tier if needed:
   - Request rate limit increase
   - Upgrade OpenAI plan

**Prevention:**
- Monitor rate limit usage
- Implement request queuing
- Alert on rate limit warnings

### 3. Token Quota Exceeded

**Symptoms:**
- "Insufficient quota" errors
- API calls failing

**Resolution:**
1. Check usage:
   - OpenAI Dashboard → Usage
   - Review token usage vs. quota

2. Request quota increase:
   - Contact OpenAI support
   - Upgrade plan if needed

3. Optimize prompts:
   - Reduce prompt size
   - Use more efficient models

**Prevention:**
- Monitor token usage
- Set usage alerts
- Optimize prompts regularly

### 4. Model Unavailable

**Symptoms:**
- "Model not found" errors
- Specific model endpoints failing

**Resolution:**
1. Check model availability:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     | jq '.data[] | select(.id == "gpt-4o")'
   ```

2. Fallback to alternative model:
   - Update `OPENAI_MODEL` environment variable
   - Use `gpt-3.5-turbo` as fallback

3. Wait for model to return:
   - Check OpenAI status page
   - Monitor model availability

**Prevention:**
- Use model fallbacks
- Monitor model availability
- Alert on model errors

### 5. Request Timeout

**Symptoms:**
- Requests timing out
- Slow AI responses

**Resolution:**
1. Check request timeout settings:
   ```typescript
   // apps/api/src/services/ai/aiAssistant.ts
   // Should have timeout configured
   ```

2. Increase timeout if needed:
   - Update fetch timeout
   - Consider async processing for long requests

3. Optimize prompts:
   - Reduce prompt complexity
   - Use streaming for long responses

**Prevention:**
- Set appropriate timeouts
- Use async processing for long tasks
- Monitor response times

### 6. Context Building Failing

**Symptoms:**
- AI responses missing context
- Database errors when building context

**Resolution:**
1. Check context building service:
   ```typescript
   // apps/api/src/services/ai/aiAssistant.ts
   // buildContext() function
   ```

2. Review database queries:
   - Check for slow queries
   - Verify foreign key relationships

3. Add error handling:
   - Graceful degradation
   - Fallback to minimal context

**Prevention:**
- Monitor context building performance
- Add error handling
- Cache context when possible

---

## Common Errors

### Error: "Invalid API key"

**Cause:** API key invalid, expired, or missing

**Resolution:**
- Verify `OPENAI_API_KEY` environment variable
- Check key in OpenAI Dashboard
- Regenerate key if needed

### Error: "Rate limit exceeded"

**Cause:** Too many requests per minute/hour

**Resolution:**
- Wait for rate limit reset
- Reduce request frequency
- Upgrade OpenAI plan

### Error: "Insufficient quota"

**Cause:** Token quota exceeded

**Resolution:**
- Check usage in OpenAI Dashboard
- Request quota increase
- Optimize prompts

### Error: "Model not found"

**Cause:** Model unavailable or name incorrect

**Resolution:**
- Verify model name (`gpt-4o`, `gpt-3.5-turbo`)
- Check model availability
- Use fallback model

### Error: "Request timeout"

**Cause:** Request taking too long

**Resolution:**
- Increase timeout
- Optimize prompts
- Use async processing

### Error: "Database error in context building"

**Cause:** Database query failing

**Resolution:**
- Check database connection
- Review query performance
- Add error handling

---

## Resolution Steps

### Step 1: Verify API Configuration

```bash
# Check environment variables
echo $OPENAI_API_KEY
echo $OPENAI_MODEL

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Step 2: Check Recent Errors

```sql
SELECT 
  action,
  metadata->>'error' as error_message,
  createdAt
FROM "AuditLog"
WHERE 
  action LIKE 'AI_%'
  AND metadata->>'error' IS NOT NULL
ORDER BY createdAt DESC
LIMIT 10;
```

### Step 3: Test AI Endpoint

```bash
curl -X POST https://api.example.com/api/ai/assistant \
  -H "Cookie: break_session=<SESSION_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "role": "admin"
  }'
```

### Step 4: Check Rate Limiting

**Endpoint:** `GET /api/admin/diagnostics/rate-limits`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalKeys": 10,
    "topLimitedKeys": [
      {
        "key": "user_123",
        "count": 25,
        "resetTime": "2025-01-15T11:00:00Z"
      }
    ]
  }
}
```

### Step 5: Verify Fix

**Check:**
1. AI endpoint returns successful response
2. No errors in logs
3. Token usage within limits
4. Response time acceptable

---

## Prevention

### Monitoring

**Set Up Alerts For:**
- OpenAI API errors (401, 429, 500)
- Rate limit warnings (> 80% of limit)
- Token usage spikes
- Response time > 10 seconds

**Query for Alerting:**
```sql
SELECT 
  COUNT(*) as ai_errors_last_hour
FROM "AuditLog"
WHERE 
  action LIKE 'AI_%'
  AND metadata->>'error' IS NOT NULL
  AND createdAt > NOW() - INTERVAL '1 hour';
```

### Regular Maintenance

**Daily:**
- Review AI endpoint error rate
- Check token usage
- Monitor response times

**Weekly:**
- Review prompt optimization opportunities
- Check rate limit usage
- Verify API key status

---

## Escalation

**If Issue Persists After 30 Minutes:**
1. Check OpenAI status page
2. Review recent deployments for breaking changes
3. Check database performance metrics
4. Contact OpenAI support if API issue

**If Multiple Endpoints Affected:**
1. Check system-wide issues (API key, network)
2. Review OpenAI account status
3. Check for service-wide outages

---

## Related Documentation

- [Architecture Overview](../DOCS/ARCHITECTURE_OVERVIEW.md#ai-features)
- [Feature Flag Matrix](../DOCS/FEATURE_FLAG_MATRIX.md#1-ai-features)
- [AI Services](../../apps/api/src/services/ai/)

---

**Document Status:** ✅ Complete  
**Maintained By:** Engineering Team  
**Last Review:** January 2025

