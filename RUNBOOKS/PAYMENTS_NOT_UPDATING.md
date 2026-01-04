# Runbook: Payments Not Updating

**Last Updated:** January 2025  
**Severity:** High  
**Estimated Resolution Time:** 20-45 minutes

---

## Symptoms

- Invoice status not updating after payment
- Payout records not created
- Payment webhooks not processing
- Finance dashboard showing stale data

---

## Quick Diagnosis

### Step 1: Check Webhook Logs

**Query:**
```sql
SELECT 
  provider,
  eventId,
  eventType,
  status,
  error,
  createdAt
FROM "WebhookLog"
WHERE 
  provider IN ('stripe', 'paypal')
  AND createdAt > NOW() - INTERVAL '1 hour'
ORDER BY createdAt DESC
LIMIT 20;
```

**Expected:**
- Recent entries (< 5 minutes ago)
- `status` = 'processed' (not 'failed')
- `error` should be NULL

**If Issues Found:**
- `status` = 'failed' → See "Common Errors" section
- No recent entries → Webhooks not being received

### Step 2: Check Invoice Status

**Query:**
```sql
SELECT 
  id,
  dealId,
  amount,
  status,
  paidAt,
  externalId,
  updatedAt
FROM "Invoice"
WHERE 
  status != 'paid'
  AND updatedAt > NOW() - INTERVAL '24 hours'
ORDER BY updatedAt DESC
LIMIT 10;
```

**Expected:**
- Invoices with `status` = 'paid' should have `paidAt` set
- `externalId` should be populated for Stripe invoices

**If Issues Found:**
- Invoices stuck in 'pending' → Webhook not processing
- Missing `externalId` → Invoice not synced to payment provider

### Step 3: Check Payment Records

**Query:**
```sql
SELECT 
  id,
  invoiceId,
  amount,
  status,
  provider,
  referenceId,
  createdAt
FROM "Payment"
WHERE 
  createdAt > NOW() - INTERVAL '1 hour'
ORDER BY createdAt DESC
LIMIT 10;
```

**Expected:**
- Recent payment records for paid invoices
- `status` = 'completed'
- `referenceId` matches Stripe/PayPal transaction ID

**If No Records:**
- Payments not being recorded
- Webhook processing failing

### Step 4: Test Webhook Endpoint

**Stripe:**
```bash
curl -X POST https://api.example.com/api/payments/stripe/webhook \
  -H "stripe-signature: <SIGNATURE>" \
  -H "Content-Type: application/json" \
  -d '{"type": "invoice.payment_succeeded", "id": "evt_test"}'
```

**PayPal:**
```bash
curl -X POST https://api.example.com/api/payments/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type": "PAYMENT.CAPTURE.COMPLETED", "id": "test"}'
```

**Expected:**
- 200 OK response
- Webhook logged in `WebhookLog` table

**If Error:**
- Check error message
- See "Common Errors" section

---

## Root Cause Analysis

### 1. Webhook Not Received

**Symptoms:**
- No entries in `WebhookLog` table
- Payment provider shows webhook sent

**Resolution:**
1. Check webhook URL configuration:
   - Stripe Dashboard → Webhooks → Endpoint URL
   - PayPal Dashboard → Webhooks → URL
   - Should match: `https://api.example.com/api/payments/{provider}/webhook`

2. Verify webhook is enabled:
   - Check payment provider dashboard
   - Ensure webhook is active (not disabled)

3. Check firewall/network:
   - Verify webhook endpoint is accessible
   - Check for IP whitelisting issues

**Prevention:**
- Monitor webhook receipt rate
- Alert on missing webhooks

### 2. Webhook Signature Validation Failing

**Symptoms:**
- `WebhookLog` entries with `status` = 'failed'
- `error` contains "Invalid signature"

**Resolution:**
1. Verify webhook secret:
   ```bash
   # Stripe
   echo $STRIPE_WEBHOOK_SECRET
   
   # PayPal
   echo $PAYPAL_WEBHOOK_SECRET
   ```

2. Check webhook secret matches provider:
   - Stripe Dashboard → Webhooks → Signing secret
   - PayPal Dashboard → Webhooks → Secret

3. Update environment variable if mismatch:
   ```bash
   STRIPE_WEBHOOK_SECRET=<NEW_SECRET>
   PAYPAL_WEBHOOK_SECRET=<NEW_SECRET>
   ```

**Prevention:**
- Store webhook secrets securely
- Rotate secrets periodically
- Document secret locations

### 3. Webhook Processing Failing

**Symptoms:**
- `WebhookLog` entries with `status` = 'failed'
- `error` contains processing error

**Resolution:**
1. Check error message in `WebhookLog.error`:
   ```sql
   SELECT error, eventType, createdAt
   FROM "WebhookLog"
   WHERE status = 'failed'
   ORDER BY createdAt DESC
   LIMIT 10;
   ```

2. Review processing logic:
   - `apps/api/src/routes/payments.ts`
   - `apps/api/src/services/stripeService.ts`

3. Check database constraints:
   - Foreign key violations
   - Unique constraint violations
   - Missing required fields

**Prevention:**
- Add error handling in webhook processors
- Log detailed error context
- Retry failed webhooks

### 4. Idempotency Check Blocking

**Symptoms:**
- Webhook received but not processed
- `AuditLog` shows `PAYMENT_WEBHOOK_PROCESSED` entry

**Resolution:**
1. Check if event already processed:
   ```sql
   SELECT 
     action,
     metadata,
     createdAt
   FROM "AuditLog"
   WHERE 
     action = 'PAYMENT_WEBHOOK_PROCESSED'
     AND metadata->>'eventId' = '<EVENT_ID>'
   ORDER BY createdAt DESC;
   ```

2. If duplicate detected:
   - This is expected behavior (idempotency)
   - Check if payment was actually processed
   - If not, manually process payment

**Prevention:**
- Idempotency is correct behavior
- Monitor for false positives

### 5. Invoice Not Created from Deal

**Symptoms:**
- Deal moved to "Closed Won" but no invoice
- Invoice missing `dealId`

**Resolution:**
1. Check deal status:
   ```sql
   SELECT 
     id,
     status,
     value,
     closedAt
   FROM "Deal"
   WHERE status = 'CLOSED_WON'
   AND closedAt > NOW() - INTERVAL '24 hours';
   ```

2. Check if invoice creation logic is running:
   - Review deal update service
   - Check for errors in logs

3. Manually create invoice if needed:
   ```sql
   INSERT INTO "Invoice" (
     id, dealId, amount, status, dueDate, createdAt
   ) VALUES (
     'inv_...', '<DEAL_ID>', <AMOUNT>, 'pending', NOW() + INTERVAL '30 days', NOW()
   );
   ```

**Prevention:**
- Monitor invoice creation on deal status change
- Alert on missing invoices

---

## Common Errors

### Error: "Invalid stripe signature"

**Cause:** Webhook secret mismatch

**Resolution:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Update environment variable
- Test webhook again

### Error: "Invalid PayPal signature"

**Cause:** Webhook secret mismatch

**Resolution:**
- Verify `PAYPAL_WEBHOOK_SECRET` matches PayPal Dashboard
- Update environment variable
- Test webhook again

### Error: "Invoice not found"

**Cause:** Invoice not created or `externalId` mismatch

**Resolution:**
- Check if invoice exists in database
- Verify `externalId` matches payment provider invoice ID
- Create invoice if missing

### Error: "Duplicate webhook event"

**Cause:** Idempotency check (expected behavior)

**Resolution:**
- This is normal (prevents duplicate processing)
- Verify payment was actually processed
- If not, manually process payment

### Error: "Database constraint violation"

**Cause:** Foreign key or unique constraint violation

**Resolution:**
- Check error details in logs
- Verify related records exist
- Fix data integrity issues

---

## Resolution Steps

### Step 1: Identify Affected Payments

```sql
SELECT 
  i.id as invoice_id,
  i.status as invoice_status,
  i.paidAt,
  p.id as payment_id,
  p.status as payment_status,
  wl.status as webhook_status,
  wl.error as webhook_error
FROM "Invoice" i
LEFT JOIN "Payment" p ON p.invoiceId = i.id
LEFT JOIN "WebhookLog" wl ON wl.eventId = p.referenceId
WHERE 
  i.status != 'paid'
  AND i.updatedAt > NOW() - INTERVAL '24 hours'
ORDER BY i.updatedAt DESC;
```

### Step 2: Check Webhook Configuration

**Stripe:**
1. Go to Stripe Dashboard → Webhooks
2. Verify endpoint URL: `https://api.example.com/api/payments/stripe/webhook`
3. Check signing secret matches `STRIPE_WEBHOOK_SECRET`
4. Verify webhook is enabled

**PayPal:**
1. Go to PayPal Dashboard → Webhooks
2. Verify endpoint URL: `https://api.example.com/api/payments/paypal/webhook`
3. Check secret matches `PAYPAL_WEBHOOK_SECRET`
4. Verify webhook is enabled

### Step 3: Reprocess Failed Webhooks

**Manual Reprocessing:**
1. Identify failed webhook:
   ```sql
   SELECT * FROM "WebhookLog"
   WHERE status = 'failed'
   ORDER BY createdAt DESC
   LIMIT 1;
   ```

2. Get webhook payload from payment provider
3. Manually trigger webhook endpoint (if safe to retry)

**Or:**
- Use payment provider's webhook replay feature
- Manually update invoice/payment status if safe

### Step 4: Verify Fix

**Check:**
1. Invoice status updated to 'paid'
2. Payment record created
3. `paidAt` timestamp set
4. Finance dashboard reflects update

---

## Prevention

### Monitoring

**Set Up Alerts For:**
- Webhook failures (`WebhookLog.status` = 'failed')
- Invoices stuck in 'pending' > 24 hours
- Missing payments for paid invoices
- Webhook receipt rate drops

**Query for Alerting:**
```sql
SELECT 
  COUNT(*) as failed_webhooks
FROM "WebhookLog"
WHERE 
  status = 'failed'
  AND createdAt > NOW() - INTERVAL '1 hour';
```

### Regular Maintenance

**Daily:**
- Review webhook failure rate
- Check for stuck invoices
- Verify payment records created

**Weekly:**
- Review webhook processing performance
- Check for duplicate payments
- Verify invoice creation on deal closure

---

## Escalation

**If Issue Persists After 45 Minutes:**
1. Check payment provider status pages
2. Review recent deployments for breaking changes
3. Check database performance metrics
4. Contact payment provider support if needed

**If Multiple Payments Affected:**
1. Check system-wide issues (database, webhook endpoint)
2. Review webhook secret configuration
3. Check for rate limiting issues

---

## Related Documentation

- [Integration Map](../DOCS/INTEGRATION_MAP.md#stripe-integration)
- [Architecture Overview](../DOCS/ARCHITECTURE_OVERVIEW.md#finance--payments)
- [Payment Routes](../../apps/api/src/routes/payments.ts)

---

**Document Status:** ✅ Complete  
**Maintained By:** Engineering Team  
**Last Review:** January 2025

