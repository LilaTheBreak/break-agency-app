/**
 * Email Routing Rules
 * 
 * Processes classified emails and automatically routes them to CRM modules
 * with safe defaults: no auto-replies, no auto-deal creation, approval gates on critical actions
 */

/**
 * Process email based on classification
 * Returns routing instructions and CRM objects to create/update
 */
export async function routeEmail(email, classification, extractedData) {
  const { primary } = classification;
  const instructions = {
    actions: [],
    requiresApproval: [],
    created: [],
    linked: [],
    errors: [],
    auditLog: {
      timestamp: new Date().toISOString(),
      emailId: email.id,
      classification: primary.type,
      confidence: primary.confidence,
      rule: getRuleForClassification(primary.type)
    }
  };

  try {
    switch (primary.type) {
      case "MEETING_REQUEST":
        await processMeetingRequest(instructions, email, extractedData);
        break;
      case "EVENT_INVITE":
        await processEventInvite(instructions, email, extractedData);
        break;
      case "BRAND_OPPORTUNITY":
        await processBrandOpportunity(instructions, email, extractedData);
        break;
      case "DEAL_NEGOTIATION":
        // Mark for review - don't auto-create deals
        instructions.requiresApproval.push({
          type: "CREATE_OPPORTUNITY",
          reason: "Deal negotiation detected",
          description: "This email may relate to a new deal or partnership opportunity",
          requiresHumanReview: true
        });
        break;
      case "INVOICE_PAYMENT":
        await processInvoicePayment(instructions, email, extractedData);
        break;
      case "DELIVERABLE_CONTENT":
        await processDeliverableContent(instructions, email, extractedData);
        break;
      case "TASK_ACTION":
        await processTaskAction(instructions, email, extractedData);
        break;
      case "SYSTEM_NOTIFICATION":
        instructions.actions.push({
          type: "ARCHIVE_OR_LABEL",
          priority: "LOW",
          description: "System notification - archive or label for reference"
        });
        break;
      case "LOW_PRIORITY":
        instructions.actions.push({
          type: "LOW_PRIORITY_REVIEW",
          priority: "LOW",
          description: "Email requires manual review"
        });
        break;
    }
  } catch (error) {
    instructions.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  return instructions;
}

// ============ ROUTING RULES ============

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function processMeetingRequest(instructions, email, data) {
  const { senderEmail, senderName } = data.extractedFields;
  
  // Ensure contact exists or will be created
  if (senderEmail) {
    instructions.actions.push({
      type: "ENSURE_CONTACT",
      priority: "HIGH",
      contact: {
        email: senderEmail,
        name: senderName,
        syncFromEmail: true
      },
      description: "Create/link contact if not already in CRM"
    });
  }

  // Create meeting draft
  instructions.actions.push({
    type: "CREATE_MEETING",
    priority: "HIGH",
    meeting: {
      title: data.extractedFields.title || email.subject,
      status: "DRAFT", // User reviews before confirming
      attendees: [senderEmail],
      hasLink: data.extractedFields.hasLink,
      linkType: data.extractedFields.linkType,
      extractedFromEmail: email.id,
      dueDate: estimateDueDate(email.body, 7) // 7 days default
    },
    description: "Create meeting record from invite"
  });

  // Link meeting to contact
  instructions.actions.push({
    type: "LINK_MEETING_TO_CONTACT",
    priority: "MEDIUM",
    description: "Link meeting to contact record"
  });

  instructions.auditLog.meetingCreated = true;
}

async function processEventInvite(instructions, email, data) {
  const { senderEmail, senderName } = data.extractedFields;

  // Ensure contact exists
  if (senderEmail) {
    instructions.actions.push({
      type: "ENSURE_CONTACT",
      priority: "HIGH",
      contact: {
        email: senderEmail,
        name: senderName,
        type: "EVENT_HOST"
      }
    });
  }

  // Create event record
  instructions.actions.push({
    type: "CREATE_EVENT",
    priority: "HIGH",
    event: {
      name: data.extractedFields.eventName || email.subject,
      source: "EMAIL_INVITE",
      hasLocation: data.extractedFields.hasLocation,
      requiresRSVP: data.extractedFields.requiresRSVP,
      extractedFromEmail: email.id,
      status: "INVITED"
    },
    description: "Create event record from invite"
  });

  // Add action item if RSVP required
  if (data.extractedFields.requiresRSVP) {
    instructions.actions.push({
      type: "CREATE_TASK",
      priority: "HIGH",
      task: {
        title: `RSVP to ${data.extractedFields.eventName}`,
        description: `Confirm attendance for event from ${senderName}`,
        dueDate: addDays(new Date(), 3).toISOString(),
        linkedEmailId: email.id,
        priority: "HIGH"
      }
    });
  }

  instructions.auditLog.eventCreated = true;
}

async function processBrandOpportunity(instructions, email, data) {
  const { senderEmail, brandDomain, brandName } = data.extractedFields;
  const { senderName } = data.extractedFields;

  // Create or link brand
  instructions.actions.push({
    type: "ENSURE_BRAND",
    priority: "HIGH",
    brand: {
      name: brandName || senderName,
      domain: brandDomain,
      sourceEmail: senderEmail,
      status: "PROSPECT",
      extractedFromEmail: email.id
    },
    description: "Create/link brand record"
  });

  // Create contact at brand
  instructions.actions.push({
    type: "ENSURE_CONTACT",
    priority: "HIGH",
    contact: {
      name: senderName,
      email: senderEmail,
      linkedToBrand: true,
      role: "PRIMARY_CONTACT",
      syncFromEmail: true
    },
    description: "Create contact at brand"
  });

  instructions.auditLog.brandProcessed = true;
}

async function processInvoicePayment(instructions, email, data) {
  const { senderEmail, senderName } = data.extractedFields;
  const { amount, dueDate } = data.extractedFields;

  // Create financial record (not auto-paying)
  instructions.actions.push({
    type: "CREATE_FINANCIAL_RECORD",
    priority: "MEDIUM",
    record: {
      type: "INVOICE_RECEIVED",
      amount: amount,
      dueDate: dueDate,
      sender: senderName,
      senderEmail: senderEmail,
      extractedFromEmail: email.id,
      status: "PENDING_REVIEW"
    },
    description: "Record invoice for review and approval"
  });

  // Create task for payment
  instructions.requiresApproval.push({
    type: "CREATE_PAYMENT_TASK",
    reason: "Invoice received",
    priority: "HIGH",
    description: `Invoice from ${senderName} - Amount: ${amount || "not specified"}`
  });

  instructions.auditLog.invoiceLogged = true;
}

async function processDeliverableContent(instructions, email, data) {
  const { senderEmail, senderName } = data.extractedFields;
  const { dueDate, hasAttachments } = data.extractedFields;

  // Ensure contact
  instructions.actions.push({
    type: "ENSURE_CONTACT",
    priority: "MEDIUM",
    contact: {
      email: senderEmail,
      name: senderName
    }
  });

  // Create deliverable record
  instructions.actions.push({
    type: "CREATE_DELIVERABLE",
    priority: "HIGH",
    deliverable: {
      title: `Deliverable: ${email.subject}`,
      fromContact: senderEmail,
      dueDate: dueDate || addDays(new Date(), 7).toISOString(),
      hasAttachments: hasAttachments,
      extractedFromEmail: email.id,
      status: "PENDING_REVIEW"
    },
    description: "Create deliverable record"
  });

  // Create task for review
  if (hasAttachments) {
    instructions.actions.push({
      type: "CREATE_TASK",
      priority: "HIGH",
      task: {
        title: "Review deliverable content",
        linkedEmailId: email.id,
        dueDate: dueDate || addDays(new Date(), 7).toISOString(),
        priority: "HIGH"
      }
    });
  }

  instructions.auditLog.deliverableProcessed = true;
}

async function processTaskAction(instructions, email, data) {
  const { senderEmail, senderName } = data.extractedFields;

  // Ensure contact
  instructions.actions.push({
    type: "ENSURE_CONTACT",
    priority: "MEDIUM",
    contact: {
      email: senderEmail,
      name: senderName
    }
  });

  // Create task from action email
  instructions.actions.push({
    type: "CREATE_TASK",
    priority: "HIGH",
    task: {
      title: email.subject,
      description: email.body.substring(0, 500),
      linkedEmailId: email.id,
      relatedContact: senderEmail,
      dueDate: addDays(new Date(), 3).toISOString(), // 3 days default
      priority: "HIGH",
      actionRequired: true
    },
    description: "Create action item from email"
  });

  instructions.auditLog.taskCreated = true;
}

// ============ HELPER FUNCTIONS ============

function getRuleForClassification(type) {
  const rules = {
    MEETING_REQUEST: "auto_create_meeting_draft",
    EVENT_INVITE: "auto_create_event_and_rsvp_task",
    BRAND_OPPORTUNITY: "auto_link_or_create_brand",
    DEAL_NEGOTIATION: "flag_for_opportunity_review",
    INVOICE_PAYMENT: "log_invoice_and_flag_payment",
    DELIVERABLE_CONTENT: "create_deliverable_and_review_task",
    TASK_ACTION: "auto_create_task",
    SYSTEM_NOTIFICATION: "auto_label",
    LOW_PRIORITY: "manual_review"
  };
  return rules[type] || "unknown_rule";
}

function estimateDueDate(body, daysOffset = 7) {
  // Check for specific dates mentioned
  const dateMatch = body.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
  if (dateMatch) {
    try {
      return new Date(dateMatch[0]).toISOString();
    } catch (e) {
      // Fall back to offset
    }
  }
  return addDays(new Date(), daysOffset).toISOString();
}

/**
 * Execute routing instructions (backend only)
 */
export async function executeRoutingInstructions(instructions, userId, brandId) {
  const results = {
    timestamp: new Date().toISOString(),
    userId,
    brandId,
    created: [],
    errors: [],
    auditLog: instructions.auditLog
  };

  // IMPORTANT: Approval gates for critical actions
  const approvalRequired = instructions.requiresApproval.length > 0;

  for (const action of instructions.actions) {
    try {
      // Skip actions that need approval if not approved
      if (approvalRequired && isCriticalAction(action.type)) {
        results.created.push({
          ...action,
          status: "PENDING_APPROVAL",
          waitingFor: "user_review"
        });
        continue;
      }

      // Execute action
      const result = await executeAction(action, userId, brandId);
      results.created.push({
        ...result,
        status: "SUCCESS"
      });
    } catch (error) {
      results.errors.push({
        action: action.type,
        message: error.message
      });
    }
  }

  return results;
}

async function executeAction(action, userId, brandId) {
  // This will be implemented to call actual CRM APIs
  // For now, return the action structure
  return {
    type: action.type,
    data: action,
    createdAt: new Date().toISOString()
  };
}

function isCriticalAction(actionType) {
  // Critical actions require human approval
  const critical = [
    "CREATE_MEETING",
    "CREATE_EVENT",
    "CREATE_DELIVERABLE",
    "CREATE_FINANCIAL_RECORD"
  ];
  return critical.includes(actionType);
}
