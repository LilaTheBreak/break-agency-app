-- CreateTable TalentPersonalDetails
CREATE TABLE IF NOT EXISTS "TalentPersonalDetails" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "legalFirstName" TEXT,
  "legalLastName" TEXT,
  "preferredName" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "nationality" TEXT,
  "countryOfResidence" TEXT,
  "taxResidencyCountry" TEXT,
  "governmentIdType" TEXT,
  "governmentIdNumber" TEXT,
  "idExpiryDate" TIMESTAMP(3),
  "idDocumentUrl" TEXT,
  "secondaryEmail" TEXT,
  "mobilePhoneNumber" TEXT,
  "whatsappNumber" TEXT,
  "emergencyContactName" TEXT,
  "emergencyContactRelationship" TEXT,
  "emergencyContactPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentPersonalDetails_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentAddress
CREATE TABLE IF NOT EXISTS "TalentAddress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Home',
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT NOT NULL,
  "stateCounty" TEXT,
  "postcode" TEXT,
  "country" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isShippingAddress" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TalentAddress_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentBankingDetails
CREATE TABLE IF NOT EXISTS "TalentBankingDetails" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "accountHolderName" TEXT,
  "bankName" TEXT,
  "accountType" TEXT,
  "accountNumber" TEXT,
  "sortCode" TEXT,
  "iban" TEXT,
  "swiftBic" TEXT,
  "currency" TEXT DEFAULT 'GBP',
  "paypalEmail" TEXT,
  "wiseAccountId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentBankingDetails_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentTaxCompliance
CREATE TABLE IF NOT EXISTS "TalentTaxCompliance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "taxStatus" TEXT,
  "companyName" TEXT,
  "vatNumber" TEXT,
  "utr" TEXT,
  "einSsn" TEXT,
  "taxFormsUploaded" TEXT NOT NULL DEFAULT '[]',
  "accountantContactName" TEXT,
  "withholdingTaxRequired" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentTaxCompliance_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentRepresentation
CREATE TABLE IF NOT EXISTS "TalentRepresentation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "representationType" TEXT,
  "representationStartDate" TIMESTAMP(3),
  "representationEndDate" TIMESTAMP(3),
  "agencyCommissionPercent" DOUBLE PRECISION,
  "contractSigned" BOOLEAN DEFAULT false,
  "contractUrl" TEXT,
  "territoriesCovered" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentRepresentation_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentMeasurements
CREATE TABLE IF NOT EXISTS "TalentMeasurements" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "clothingSize" TEXT,
  "dressSize" TEXT,
  "topSize" TEXT,
  "bottomSize" TEXT,
  "shoeSize" TEXT,
  "height" TEXT,
  "skinTone" TEXT,
  "skinType" TEXT,
  "hairType" TEXT,
  "hairColour" TEXT,
  "allergiesSensitivities" TEXT NOT NULL DEFAULT '[]',
  "makeupPreferences" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentMeasurements_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentTravelInfo
CREATE TABLE IF NOT EXISTS "TalentTravelInfo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "passportNumber" TEXT,
  "passportExpiryDate" TIMESTAMP(3),
  "passportCountry" TEXT,
  "visaStatusByCountry" TEXT NOT NULL DEFAULT '{}',
  "preferredAirport" TEXT,
  "preferredSeat" TEXT,
  "frequentFlyerPrograms" TEXT NOT NULL DEFAULT '[]',
  "hotelPreferences" TEXT,
  "dietaryRequirements" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentTravelInfo_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentBrandPreferences
CREATE TABLE IF NOT EXISTS "TalentBrandPreferences" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "restrictedCategories" TEXT NOT NULL DEFAULT '[]',
  "competitorConflicts" TEXT NOT NULL DEFAULT '[]',
  "approvalRequiredForGifting" BOOLEAN DEFAULT false,
  "approvalRequiredForUsageExtensions" BOOLEAN DEFAULT false,
  "approvalRequiredForPaidAds" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentBrandPreferences_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentInternalNotes
CREATE TABLE IF NOT EXISTS "TalentInternalNotes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "riskFlags" TEXT NOT NULL DEFAULT '[]',
  "latePaymentHistory" TEXT,
  "preferredBrands" TEXT NOT NULL DEFAULT '[]',
  "negotiationNotes" TEXT,
  "specialHandlingInstructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "TalentInternalNotes_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TalentConsent
CREATE TABLE IF NOT EXISTS "TalentConsent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "talentId" TEXT NOT NULL UNIQUE,
  "consentPersonalDataStorage" BOOLEAN DEFAULT false,
  "consentBankingDetailsStorage" BOOLEAN DEFAULT false,
  "consentShareDetailsWithBrands" BOOLEAN DEFAULT false,
  "consentGivenAt" TIMESTAMP(3),
  "consentUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TalentConsent_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TalentPersonalDetails_talentId_idx" ON "TalentPersonalDetails"("talentId");

-- CreateIndex
CREATE INDEX "TalentPersonalDetails_dateOfBirth_idx" ON "TalentPersonalDetails"("dateOfBirth");

-- CreateIndex
CREATE INDEX "TalentAddress_talentId_idx" ON "TalentAddress"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentAddress_talentId_isPrimary_key" ON "TalentAddress"("talentId", "isPrimary") WHERE "isPrimary" = true;

-- CreateIndex
CREATE INDEX "TalentBankingDetails_talentId_idx" ON "TalentBankingDetails"("talentId");

-- CreateIndex
CREATE INDEX "TalentTaxCompliance_talentId_idx" ON "TalentTaxCompliance"("talentId");

-- CreateIndex
CREATE INDEX "TalentRepresentation_talentId_idx" ON "TalentRepresentation"("talentId");

-- CreateIndex
CREATE INDEX "TalentMeasurements_talentId_idx" ON "TalentMeasurements"("talentId");

-- CreateIndex
CREATE INDEX "TalentTravelInfo_talentId_idx" ON "TalentTravelInfo"("talentId");

-- CreateIndex
CREATE INDEX "TalentBrandPreferences_talentId_idx" ON "TalentBrandPreferences"("talentId");

-- CreateIndex
CREATE INDEX "TalentInternalNotes_talentId_idx" ON "TalentInternalNotes"("talentId");

-- CreateIndex
CREATE INDEX "TalentConsent_talentId_idx" ON "TalentConsent"("talentId");
