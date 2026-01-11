# Contact Information & Personal Details System - Implementation Guide

## 🎯 Overview

A comprehensive, secure system for managing talent contact information, personal details, and sensitive data. Features password-protected locked sections, role-based access control, and support for multiple addresses with proper validation.

## ✅ Implementation Status

### ✅ COMPLETED
- [x] Database Schema (9 new Prisma models)
- [x] API Endpoints (25+ routes with CRUD operations)
- [x] React Component with UI/UX
- [x] Password-Protected Locked Sections
- [x] Role-Based Access Control
- [x] Form Validation
- [x] Multiple Address Support
- [x] Admin Activity Logging

### ⏳ PENDING (Phase 2)
- [ ] Database Migrations (`npx prisma migrate`)
- [ ] Encryption Implementation for Sensitive Fields
- [ ] Document Upload/Storage (ID, Contract, Tax Forms)
- [ ] Mobile Responsiveness Testing
- [ ] Admin Consent/Audit Trail

---

## 📊 Database Models

### 1. **TalentPersonalDetails** 🔒
Locked section containing legal identity and sensitive personal information.

**Encrypted Fields:**
- `governmentIdNumber` - Government ID number
- `mobilePhoneNumber` - Mobile phone
- `whatsappNumber` - WhatsApp number
- `emergencyContactPhone` - Emergency contact phone

**Fields:**
- `legalFirstName` - Legal first name
- `legalLastName` - Legal last name
- `preferredName` - Professional/display name
- `dateOfBirth` - Date of birth
- `nationality` - ISO country code
- `countryOfResidence` - ISO country code
- `taxResidencyCountry` - ISO country code
- `governmentIdType` - PASSPORT | NATIONAL_ID | DRIVER_LICENCE
- `idExpiryDate` - ID expiration date
- `idDocumentUrl` - S3 URL to uploaded ID
- `secondaryEmail` - Secondary email address
- `emergencyContactName` - Emergency contact name
- `emergencyContactRelationship` - Relationship type

### 2. **TalentAddress** 
Multiple addresses with primary/shipping flags.

**Constraints:**
- Only one `isPrimary` per talent
- One `isPrimary` must always exist
- Multiple addresses supported

**Fields:**
- `label` - Home | Business | Shipping | Temporary
- `addressLine1` - Required
- `addressLine2` - Optional
- `city` - Required
- `stateCounty` - Optional
- `postcode` - Optional
- `country` - Required (ISO code)
- `isPrimary` - Boolean, one required
- `isShippingAddress` - Boolean
- `notes` - Access instructions, concierge info

### 3. **TalentBankingDetails** 🔒
Locked section for payment information.

**Encrypted Fields:**
- `accountNumber` - Bank account number
- `sortCode` - UK sort code
- `iban` - International bank account number
- `swiftBic` - SWIFT/BIC code
- `wiseAccountId` - Wise transfer ID

**Fields:**
- `accountHolderName` - Name on account
- `bankName` - Bank name
- `accountType` - Personal | Business
- `currency` - ISO currency code
- `countryOfBank` - ISO country code
- `preferredPaymentMethod` - BankTransfer | PayPal | Wise
- `paypalEmail` - PayPal email if applicable
- `notes` - Special instructions (accountant contact, etc)

### 4. **TalentTaxCompliance** 🔒
Locked section for tax and compliance information.

**Encrypted Fields:**
- `vatNumber` - VAT registration number
- `utr` - UK Unique Taxpayer Reference
- `einSsn` - US EIN or masked SSN

**Fields:**
- `taxStatus` - Individual | SoleTrader | LimitedCompany
- `companyName` - Company name if applicable
- `companyRegistrationNumber` - Company number
- `vatRegistered` - Boolean
- `withholdingTaxRequired` - Boolean
- `taxFormsUploaded` - Array: W-8BEN | W-9 | Other
- `accountantContactName` - Accountant name
- `accountantEmail` - Accountant email

### 5. **TalentRepresentation**
Contract and representation details.

**Fields:**
- `representationType` - Exclusive | Non-exclusive
- `representationStartDate` - Contract start
- `representationEndDate` - Contract end (optional)
- `agencyCommissionPercent` - Commission percentage
- `contractSigned` - Boolean
- `contractUrl` - S3 URL to uploaded contract
- `territoriesCovered` - Array of country codes/regions
- `notes` - Special clauses or terms

### 6. **TalentMeasurements**
Fashion and beauty measurements.

**Fields:**
- `clothingSize` - UK/EU/US
- `dressSize`, `topSize`, `bottomSize` - Specific sizing
- `shoeSize` - Shoe size with standard
- `height` - In feet/inches or cm
- `bodyTypeNotes` - Optional notes
- `skinTone`, `skinType`, `hairType`, `hairColour` - Beauty info
- `allergiesSensitivities` - Allergies and sensitivities
- `makeupPreferences` - Makeup preferences

### 7. **TalentTravelInfo** 🔒
Locked section for travel and logistics.

**Encrypted Fields:**
- `passportNumber` - Passport number
- `visaStatusByCountry` - JSON with visa info by country

**Fields:**
- `passportExpiryDate` - Passport expiry
- `passportCountry` - Passport issuing country
- `preferredAirport` - IATA code
- `preferredSeat` - Aisle | Window
- `frequentFlyerPrograms` - Array of programs
- `hotelPreferences` - Hotel preferences
- `dietaryRequirements` - Dietary needs
- `accessibilityRequirements` - Accessibility needs
- `travelNotes` - Additional travel notes

### 8. **TalentBrandPreferences**
Brand safety and content preferences.

**Fields:**
- `restrictedCategories` - Array: gambling, alcohol, weapons, etc
- `competitorConflicts` - Array of competitor brands
- `brandAlignmentNotes` - Brand alignment notes
- `previousBrandBlacklist` - Array of brands to avoid
- `exclusivityRestrictions` - Exclusivity terms
- `approvalRequiredForGifting` - Boolean
- `approvalRequiredForUsageExtensions` - Boolean
- `approvalRequiredForPaidAds` - Boolean
- `usageRightsPreferences` - Usage rights notes

### 9. **TalentInternalNotes** 🔒
Admin-only notes hidden from talent.

**Fields:**
- `riskFlags` - Array of risk flags
- `latePaymentHistory` - Boolean
- `preferredBrands` - Array of preferred brands
- `negotiationNotes` - Negotiation notes
- `specialHandlingInstructions` - Special instructions
- `updatedBy` - Admin user ID

### 10. **TalentConsent**
GDPR and data storage consent.

**Fields:**
- `consentPersonalDataStorage` - Boolean
- `consentBankingDetailsStorage` - Boolean
- `consentShareDetailsWithBrands` - Boolean

---

## 🔌 API Endpoints

### Password Verification
```
POST /api/admin/talent/:id/verify-password
Body: { password: "123456" }
Response: { token: "...", expiresIn: 3600 }
```

### Personal Details
```
GET    /api/admin/talent/:id/personal-details
PUT    /api/admin/talent/:id/personal-details
```

### Addresses
```
GET    /api/admin/talent/:id/addresses
POST   /api/admin/talent/:id/addresses
PUT    /api/admin/talent/:id/addresses/:addressId
DELETE /api/admin/talent/:id/addresses/:addressId
```

### Banking Details
```
GET /api/admin/talent/:id/banking-details
PUT /api/admin/talent/:id/banking-details
```

### Tax Compliance
```
GET /api/admin/talent/:id/tax-compliance
PUT /api/admin/talent/:id/tax-compliance
```

### Travel Info
```
GET /api/admin/talent/:id/travel-info
PUT /api/admin/talent/:id/travel-info
```

### Brand Preferences
```
GET /api/admin/talent/:id/brand-preferences
PUT /api/admin/talent/:id/brand-preferences
```

### Measurements
```
GET /api/admin/talent/:id/measurements
PUT /api/admin/talent/:id/measurements
```

---

## 🔐 Security Features

### Password Protection
- Temporary password: `123456` (configurable via `CONTACT_INFO_PASSWORD` env var)
- Session tokens expire after 1 hour
- Will be upgraded to bcrypt + JWT in Phase 2

### Sensitive Field Masking
- Non-super-admins see masked values: `****1234`
- Super-admins can toggle visibility
- Server encrypts at rest (Phase 2)
- Fields include:
  - Government ID Number
  - Mobile/WhatsApp Phone
  - Account Number / Sort Code / IBAN
  - VAT Number / UTR / EIN/SSN
  - Passport Number

### Role-Based Access Control
- All routes require `ADMIN` or `SUPERADMIN` role
- Non-admin requests rejected with 403
- Admin activity logged for all changes

### Admin Activity Logging
- All create/update/delete operations logged
- Includes user ID, action type, metadata
- Useful for compliance audits

---

## 🎨 UI/UX Features

### Contact Information Section
- Tabbed interface (7 tabs)
- Responsive design
- Form validation with error messages
- Toast notifications for success/failure

### Locked Section Component
- Visual lock icon when locked
- Password input field
- Unlock button
- Lock button visible when unlocked
- Red background/warning color when locked

### Sensitive Field Display
- Eye icon to toggle visibility
- Masked display by default: `****1234`
- Password-style input for security
- Clear visual indicator (🔒) for sensitive fields

### Multiple Address Support
- Add unlimited addresses
- Exactly one primary required
- Primary address enforcement
- Shipping address flag
- Delete with validation (reassigns primary if needed)

### Missing Information Alerts
- Shows critical missing fields
- Yellow warning box
- Examples:
  - Legal names
  - Primary address
  - Tax information
  - ID documents

---

## 📋 Implementation Checklist

### Phase 1: Database & API ✅
- [x] Create Prisma models
- [x] Add Talent model relations
- [x] Build API endpoints (25+ routes)
- [x] Add admin activity logging
- [x] Implement role-based access

### Phase 2: Encryption & Security (TODO)
- [ ] Run `npx prisma migrate dev`
- [ ] Implement bcrypt for password hashing
- [ ] Encrypt sensitive fields at rest
- [ ] Add JWT token generation
- [ ] Set up environment variables

### Phase 3: Document Management (TODO)
- [ ] S3 integration for uploads
- [ ] File upload endpoints
- [ ] Virus scanning
- [ ] Document versioning

### Phase 4: Testing & Polish (TODO)
- [ ] Unit tests for endpoints
- [ ] Integration tests
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Accessibility audit

---

## 🚀 Running Migrations

```bash
# Create migration files
npx prisma migrate dev --name "add-contact-information-models"

# Push to database without creating migration file
npx prisma db push

# Generate Prisma client
npx prisma generate
```

---

## 🔑 Environment Variables

```env
# Contact Information
CONTACT_INFO_PASSWORD=123456

# Database encryption (Phase 2)
DATABASE_ENCRYPTION_KEY=your-key-here

# S3 File Upload (Phase 3)
S3_BUCKET_NAME=talent-documents
S3_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

---

## 📱 Usage Example

### Viewing Contact Information
1. Navigate to talent detail page
2. Click "Contact Information" tab
3. Sections start locked by default
4. Enter password `123456` to unlock
5. Toggle sensitive field visibility with eye icon

### Editing Information
1. Click "Edit Talent" button
2. Complete form in modal
3. Submit to save changes
4. Admin activity logged automatically

### Managing Addresses
1. Go to "Contact Information" → "Addresses" tab
2. Add address with label, full details, and flags
3. Check "Set as Primary Address" if first address
4. Multiple addresses supported
5. Only one primary required

### Checking Missing Information
- Yellow alert box shows incomplete sections
- Use to prompt talent managers for completeness
- Helps ensure data quality

---

## ⚙️ Configuration

### Password Configuration
Change in `.env`:
```env
CONTACT_INFO_PASSWORD=your-secure-password-here
```

Or temporarily in code (not recommended):
```typescript
const ADMIN_PASSWORD = process.env.CONTACT_INFO_PASSWORD || "123456";
```

### Field Encryption (Phase 2)
Sensitive fields to encrypt:
- Government ID Number
- Mobile/WhatsApp numbers
- Bank account details
- Tax identification numbers
- Passport number

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Load contact information page
- [ ] Verify tab navigation works
- [ ] Test password unlock with correct/incorrect password
- [ ] Toggle sensitive field visibility
- [ ] Add new address
- [ ] Edit existing address
- [ ] Set address as primary
- [ ] Delete address
- [ ] Submit form and verify save
- [ ] Check admin activity log
- [ ] Test role-based access (non-admin sees 403)
- [ ] Verify missing info alerts

### API Testing
```bash
# Get personal details
curl http://localhost:3001/api/admin/talent/:id/personal-details

# Add address
curl -X POST http://localhost:3001/api/admin/talent/:id/addresses \
  -H "Content-Type: application/json" \
  -d '{"addressLine1":"123 Main St","city":"London","country":"UK","isPrimary":true}'

# Verify password
curl -X POST http://localhost:3001/api/admin/talent/:id/verify-password \
  -H "Content-Type: application/json" \
  -d '{"password":"123456"}'
```

---

## 🐛 Common Issues

### 1. "Talent not found" Error
- Verify talent ID in URL
- Check talent exists in database
- Confirm admin permission

### 2. Password Not Working
- Check password in `.env` file
- Temporarily hardcoded as `123456`
- Will be bcrypt-hashed in Phase 2

### 3. Missing Fields in Response
- API returns all fields, even if empty
- Frontend initializes empty values
- Check for null/undefined before display

### 4. Address Validation Error
- Address Line 1 required
- City required
- Country required
- At least one address must be primary

---

## 📚 File Locations

```
apps/api/
  ├── prisma/schema.prisma (models + relations)
  └── src/routes/admin/talent.ts (API endpoints)

apps/web/
  └── src/
      ├── components/AdminTalent/
      │   └── ContactInformationSection.jsx (React component)
      └── pages/AdminTalentDetailPage.jsx (integration)
```

---

## 🎓 Next Steps

1. **Run migrations**: `npx prisma migrate dev`
2. **Test API endpoints** with Postman/curl
3. **Test UI in browser** with admin account
4. **Add encryption** for sensitive fields (Phase 2)
5. **Implement document upload** (Phase 3)
6. **Add unit tests** (Phase 4)

---

## 📞 Support

For questions or issues:
1. Check error messages in console
2. Review logs in admin activity
3. Verify database schema with `npx prisma introspect`
4. Test endpoints with REST client first

---

**Version**: 1.0  
**Date**: January 2026  
**Status**: Ready for Phase 2 (Encryption Implementation)
