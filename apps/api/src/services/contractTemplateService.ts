import prisma from '../lib/prisma.js';
import { generateId } from '../lib/utils.js';

interface ContractTemplate {
  id: string;
  name: string;
  type: 'influencer_agreement' | 'brand_partnership' | 'content_license';
  sections: TemplateSection[];
}

interface TemplateSection {
  title: string;
  content: string;
  order: number;
}

interface DealData {
  dealId: string;
  brandName: string;
  creatorName: string;
  dealValue: number;
  currency: string;
  deliverables: Array<{
    title: string;
    description?: string;
    deliverableType?: string;
    dueAt?: Date;
    usageRights?: string;
    frequency?: string;
  }>;
  paymentTerms?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Contract Template Service
 * 
 * Provides contract generation from templates without e-signature integration.
 * Manual-first approach: Generate PDFs, store in Files, track signature dates manually.
 */
export class ContractTemplateService {
  /**
   * Get default influencer agreement template
   */
  private getDefaultTemplate(): ContractTemplate {
    return {
      id: 'default-influencer-agreement',
      name: 'Standard Influencer Agreement',
      type: 'influencer_agreement',
      sections: [
        {
          title: 'Parties',
          content: `This Influencer Marketing Agreement ("Agreement") is entered into as of {{CONTRACT_DATE}} by and between:

{{BRAND_NAME}} ("Brand")
and
{{CREATOR_NAME}} ("Creator")

collectively referred to as the "Parties."`,
          order: 1
        },
        {
          title: 'Scope of Services',
          content: `The Creator agrees to create and deliver the following content ("Deliverables") for the Brand:

{{DELIVERABLES_LIST}}

All deliverables must be completed by the dates specified above.`,
          order: 2
        },
        {
          title: 'Compensation',
          content: `In consideration for the services provided under this Agreement, Brand agrees to pay Creator a total fee of {{DEAL_VALUE}} {{CURRENCY}}.

{{PAYMENT_TERMS}}

Payment shall be made within 30 days of invoice receipt, subject to satisfactory completion and approval of all deliverables.`,
          order: 3
        },
        {
          title: 'Usage Rights',
          content: `{{USAGE_RIGHTS}}

The Brand may use the content across the following platforms and for the duration specified in the deliverables section above.`,
          order: 4
        },
        {
          title: 'Creator Obligations',
          content: `The Creator shall:
- Create original content that aligns with Brand guidelines
- Disclose the partnership in accordance with FTC guidelines
- Deliver content by the agreed-upon deadlines
- Obtain necessary rights and permissions for content creation
- Maintain professional conduct and Brand reputation`,
          order: 5
        },
        {
          title: 'Brand Obligations',
          content: `The Brand shall:
- Provide clear creative direction and brand guidelines
- Review and approve deliverables within 5 business days
- Make timely payments as specified in this Agreement
- Provide necessary assets or resources for content creation`,
          order: 6
        },
        {
          title: 'Intellectual Property',
          content: `Upon full payment, all rights to the content deliverables shall be transferred to the Brand as specified in the Usage Rights section. The Creator retains the right to showcase the work in their portfolio unless otherwise agreed.`,
          order: 7
        },
        {
          title: 'Confidentiality',
          content: `Both Parties agree to maintain confidentiality regarding the terms of this Agreement and any proprietary information shared during the partnership.`,
          order: 8
        },
        {
          title: 'Term and Termination',
          content: `This Agreement begins on {{START_DATE}} and continues until {{END_DATE}} or until all deliverables are completed and payment is made, whichever is later.

Either Party may terminate this Agreement with 14 days written notice if the other Party materially breaches any term and fails to cure such breach within that period.`,
          order: 9
        },
        {
          title: 'Signatures',
          content: `By signing below, the Parties agree to the terms and conditions set forth in this Agreement.

Brand Representative: ____________________  Date: __________
{{BRAND_NAME}}

Creator: ____________________  Date: __________
{{CREATOR_NAME}}`,
          order: 10
        }
      ]
    };
  }

  /**
   * Generate contract text from template and deal data
   */
  async generateContractText(dealData: DealData): Promise<string> {
    const template = this.getDefaultTemplate();
    const contractDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Build deliverables list
    const deliverablesList = dealData.deliverables.map((d, idx) => {
      let deliverableText = `${idx + 1}. ${d.title}`;
      if (d.description) deliverableText += `\n   Description: ${d.description}`;
      if (d.deliverableType) deliverableText += `\n   Type: ${d.deliverableType}`;
      if (d.dueAt) deliverableText += `\n   Due Date: ${d.dueAt.toLocaleDateString('en-US')}`;
      if (d.frequency) deliverableText += `\n   Frequency: ${d.frequency}`;
      return deliverableText;
    }).join('\n\n');

    // Build usage rights section
    const usageRights = dealData.deliverables
      .filter(d => d.usageRights)
      .map(d => d.usageRights)
      .join(', ') || 'Standard social media usage rights apply';

    // Build payment terms
    const paymentTerms = dealData.paymentTerms || 
      'Payment will be made in full upon completion and approval of all deliverables.';

    // Replacements map
    const replacements: Record<string, string> = {
      '{{CONTRACT_DATE}}': contractDate,
      '{{BRAND_NAME}}': dealData.brandName,
      '{{CREATOR_NAME}}': dealData.creatorName,
      '{{DEAL_VALUE}}': dealData.dealValue.toLocaleString('en-US'),
      '{{CURRENCY}}': dealData.currency,
      '{{DELIVERABLES_LIST}}': deliverablesList,
      '{{PAYMENT_TERMS}}': paymentTerms,
      '{{USAGE_RIGHTS}}': usageRights,
      '{{START_DATE}}': dealData.startDate?.toLocaleDateString('en-US') || contractDate,
      '{{END_DATE}}': dealData.endDate?.toLocaleDateString('en-US') || 
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US')
    };

    // Render template
    let contractText = `# ${template.name}\n\n`;
    
    for (const section of template.sections.sort((a, b) => a.order - b.order)) {
      contractText += `## ${section.title}\n\n`;
      
      let sectionContent = section.content;
      for (const [placeholder, value] of Object.entries(replacements)) {
        sectionContent = sectionContent.replace(new RegExp(placeholder, 'g'), value);
      }
      
      contractText += `${sectionContent}\n\n`;
    }

    return contractText;
  }

  /**
   * Create contract from deal
   * Generates contract text and creates Contract record
   */
  async createFromDeal(dealId: string): Promise<any> {
    // Fetch deal with relations
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        Brand: true,
        Talent: {
          include: {
            User: true
          }
        },
        Deliverable: true
      }
    });

    if (!deal) {
      throw new Error(`Deal ${dealId} not found`);
    }

    if (!deal.Brand || !deal.Talent) {
      throw new Error(`Deal ${dealId} missing Brand or Talent relationship`);
    }

    // Build deal data
    const dealData: DealData = {
      dealId: deal.id,
      brandName: deal.Brand.name,
      creatorName: deal.Talent.User.name || 'Creator',
      dealValue: deal.value || 0,
      currency: deal.currency,
      deliverables: deal.Deliverable.map(d => ({
        title: d.title,
        description: d.description || undefined,
        deliverableType: d.deliverableType || undefined,
        dueAt: d.dueAt || undefined,
        usageRights: d.usageRights || undefined,
        frequency: d.frequency || undefined
      })),
      paymentTerms: undefined, // Can be customized
      startDate: deal.campaignLiveAt || undefined,
      endDate: undefined // Can be customized
    };

    // Generate contract text
    const contractText = await this.generateContractText(dealData);

    // Create contract record
    const contract = await prisma.contract.create({
      data: {
        id: generateId(),
        dealId: deal.id,
        brandId: deal.brandId, // Explicit brand linkage
        title: `${deal.Brand.name} x ${dealData.creatorName} Agreement`,
        status: 'draft',
        terms: {
          contractText,
          brandName: dealData.brandName,
          creatorName: dealData.creatorName,
          dealValue: dealData.dealValue,
          currency: dealData.currency,
          deliverableCount: dealData.deliverables.length
        },
        templateId: 'default-influencer-agreement'
      }
    });

    return contract;
  }

  /**
   * Get contract text for display or PDF generation
   */
  async getContractText(contractId: string): Promise<string | null> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract?.terms) return null;

    const terms = contract.terms as any;
    return terms.contractText || null;
  }

  /**
   * Mark contract as sent (manual tracking)
   */
  async markAsSent(contractId: string): Promise<any> {
    return prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });
  }

  /**
   * Record talent signature (manual tracking)
   */
  async recordTalentSignature(contractId: string): Promise<any> {
    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        talentSignedAt: new Date(),
        status: 'partially_signed'
      }
    });

    // Check if both parties signed
    if (contract.brandSignedAt) {
      await this.markAsFullySigned(contractId);
    }

    return contract;
  }

  /**
   * Record brand signature (manual tracking)
   */
  async recordBrandSignature(contractId: string): Promise<any> {
    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        brandSignedAt: new Date(),
        status: 'partially_signed'
      }
    });

    // Check if both parties signed
    if (contract.talentSignedAt) {
      await this.markAsFullySigned(contractId);
    }

    return contract;
  }

  /**
   * Mark contract as fully signed
   */
  async markAsFullySigned(contractId: string): Promise<any> {
    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'fully_signed',
        fullySignedAt: new Date()
      }
    });

    // Update deal's contractSignedAt
    await prisma.deal.update({
      where: { id: contract.dealId },
      data: {
        contractSignedAt: new Date()
      }
    });

    return contract;
  }

  /**
   * List all contracts for a deal
   */
  async listForDeal(dealId: string): Promise<any[]> {
    return prisma.contract.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get contract by ID
   */
  async getById(contractId: string): Promise<any> {
    return prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        Deal: {
          include: {
            Brand: true,
            Talent: {
              include: {
                User: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Delete contract
   */
  async delete(contractId: string): Promise<void> {
    await prisma.contract.delete({
      where: { id: contractId }
    });
  }
}

export const contractTemplateService = new ContractTemplateService();
