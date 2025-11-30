/**
 * A stub for a Xero API client.
 */
export const xeroClient = {
  createInvoice: async (contactId: string, amount: number) => {
    console.log(`[XERO STUB] Creating Invoice for contact ${contactId}`);
    return { id: `xero_${Date.now()}`, url: 'https://go.xero.com/invoice/stub' };
  },
};