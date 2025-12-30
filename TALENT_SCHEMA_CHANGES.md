# Talent Schema Changes

## Updated Talent Model

```prisma
model Talent {
  id                String                    @id @default(cuid())
  displayName       String                    // Renamed from 'name'
  legalName         String?                   // NEW
  primaryEmail      String?                   // NEW
  representationType String                   @default("NON_EXCLUSIVE") // NEW: EXCLUSIVE | NON_EXCLUSIVE | FRIEND_OF_HOUSE | UGC | FOUNDER
  status            String                    @default("ACTIVE") // NEW: ACTIVE | PAUSED | ARCHIVED
  userId            String?                   @unique // CHANGED: Now optional (was required)
  managerId         String?                   // NEW: Admin/agent responsible
  notes             String?                   // NEW: Internal notes
  categories        String[]                 @default([]) // Keep existing
  stage             String?                   // Keep existing (legacy)
  metadata          Json?                    // NEW: Flexible storage
  createdAt         DateTime                 @default(now())
  updatedAt         DateTime                 @updatedAt
  
  // Relations
  User              User?                    @relation(fields: [userId], references: [id], onDelete: SetNull) // CHANGED: Optional, SetNull
  Manager           User?                    @relation("TalentManager", fields: [managerId], references: [id], onDelete: SetNull) // NEW
  
  // Existing relations (keep all)
  AIPromptHistory         AIPromptHistory[]
  BrandSavedTalent        BrandSavedTalent[]
  CreatorEvent            CreatorEvent[]
  CreatorFitScore         CreatorFitScore[]
  CreatorGoal             CreatorGoal[]
  CreatorInsight          CreatorInsight[]
  CreatorTask             CreatorTask[]
  Deal                    Deal[]
  Payment                 Payment[]
  Payout                  Payout[]
  SocialAccountConnection SocialAccountConnection[]
  SuitabilityResult       SuitabilityResult[]
  TalentAssignment        TalentAssignment[]
  WellnessCheckin         WellnessCheckin[]
  
  // New relations to add
  Opportunity             Opportunity[]
  OpportunityApplication  OpportunityApplication[]
  InboundEmail            InboundEmail[]
  InboxMessage            InboxMessage[]
  CrmTask                 CrmTask[]
  
  @@index([userId])
  @@index([managerId])
  @@index([representationType])
  @@index([status])
  @@index([displayName])
}
```

## User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  // Update Talent relation (make optional, change onDelete)
  Talent              Talent?                 @relation(fields: [talentId], references: [id], onDelete: SetNull)
  
  // Add manager relation
  ManagedTalents      Talent[]                @relation("TalentManager")
  
  // ... rest of relations ...
}
```

## Models Needing talentId

### Opportunity

```prisma
model Opportunity {
  // ... existing fields ...
  createdBy              String
  talentId               String?              // NEW: Optional talent reference
  Talent                 Talent?              @relation(fields: [talentId], references: [id], onDelete: SetNull)
  
  @@index([talentId])
}
```

### OpportunityApplication

```prisma
model OpportunityApplication {
  // ... existing fields ...
  creatorId     String
  talentId      String?                       // NEW: Optional talent reference
  Talent        Talent?                       @relation(fields: [talentId], references: [id], onDelete: SetNull)
  
  @@index([talentId])
}
```

### InboundEmail

```prisma
model InboundEmail {
  // ... existing fields ...
  userId              String?
  talentId            String?                 // NEW: Optional talent reference
  Talent              Talent?                 @relation(fields: [talentId], references: [id], onDelete: SetNull)
  
  @@index([talentId])
}
```

### InboxMessage

```prisma
model InboxMessage {
  // ... existing fields ...
  userId          String
  talentId        String?                     // NEW: Optional talent reference
  Talent          Talent?                     @relation(fields: [talentId], references: [id], onDelete: SetNull)
  
  @@index([talentId])
}
```

### CrmTask

```prisma
model CrmTask {
  // ... existing fields ...
  ownerId          String?
  talentId         String?                    // NEW: Optional talent reference
  Talent           Talent?                    @relation(fields: [talentId], references: [id], onDelete: SetNull)
  
  @@index([talentId])
}
```

## Migration Steps

1. Make `userId` optional in Talent (ALTER COLUMN)
2. Add new fields to Talent (displayName, legalName, primaryEmail, representationType, status, managerId, notes, metadata)
3. Update User relation to SetNull instead of Cascade
4. Add Manager relation to User
5. Add `talentId` to Opportunity, OpportunityApplication, InboundEmail, InboxMessage, CrmTask
6. Add indexes for performance
7. Backfill data:
   - Set `displayName` = `name` for existing Talent records
   - Set `representationType` = "EXCLUSIVE" for existing Talent (or based on business logic)
   - Set `status` = "ACTIVE" for existing Talent

