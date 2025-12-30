import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * PDF Generation Service
 * 
 * Converts contract markdown text to styled PDF documents.
 * Uses Puppeteer for headless Chrome rendering.
 */
export class PDFGenerationService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = join(process.cwd(), 'uploads', 'contracts');
  }

  /**
   * Ensure uploads directory exists
   */
  private async ensureUploadsDir(): Promise<void> {
    if (!existsSync(this.uploadsDir)) {
      await mkdir(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Get HTML template with styling
   */
  private getHTMLTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm 2.5cm;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    
    h1 {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 1.5cm 0;
      padding: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    h2 {
      font-size: 13pt;
      font-weight: bold;
      margin: 1.2cm 0 0.4cm 0;
      padding: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    h3 {
      font-size: 11pt;
      font-weight: bold;
      margin: 0.8cm 0 0.3cm 0;
      padding: 0;
    }
    
    p {
      margin: 0 0 0.4cm 0;
      padding: 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 0.4cm 0;
      padding-left: 1cm;
    }
    
    li {
      margin: 0.2cm 0;
    }
    
    strong {
      font-weight: bold;
    }
    
    em {
      font-style: italic;
    }
    
    .signatures {
      margin-top: 2cm;
      page-break-inside: avoid;
    }
    
    .signature-block {
      margin: 1cm 0;
      min-height: 2cm;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      width: 50%;
      display: inline-block;
      margin-right: 2cm;
    }
    
    .date-line {
      border-bottom: 1px solid #000;
      width: 30%;
      display: inline-block;
    }
    
    /* Print optimization */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      h2 {
        page-break-after: avoid;
      }
      
      p, li {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
    `.trim();
  }

  /**
   * Convert markdown to HTML
   */
  private async markdownToHTML(markdown: string, title: string): Promise<string> {
    // Configure marked for contract formatting
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    const htmlContent = await marked(markdown);
    return this.getHTMLTemplate(htmlContent, title);
  }

  /**
   * Generate PDF from markdown text
   * 
   * @param contractText - Contract content in markdown format
   * @param contractId - Unique identifier for the contract
   * @param title - Contract title for filename
   * @returns Path to generated PDF file
   */
  async generatePDF(
    contractText: string, 
    contractId: string, 
    title: string
  ): Promise<string> {
    await this.ensureUploadsDir();

    // Convert markdown to HTML
    const html = await this.markdownToHTML(contractText, title);

    // Generate filename
    const filename = `${contractId}.pdf`;
    const filepath = join(this.uploadsDir, filename);

    // Launch headless browser
    // In production, use system Chrome if available, or skip browser download
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };

    // Use system Chrome if PUPPETEER_EXECUTABLE_PATH is set, otherwise use bundled
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);

    try {
      const page = await browser.newPage();
      
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      await page.pdf({
        path: filepath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          right: '2.5cm',
          bottom: '2cm',
          left: '2.5cm'
        }
      });

      return filepath;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PDF from HTML string (alternative method)
   */
  async generatePDFFromHTML(
    html: string,
    contractId: string
  ): Promise<string> {
    await this.ensureUploadsDir();

    const filename = `${contractId}.pdf`;
    const filepath = join(this.uploadsDir, filename);

    // Launch headless browser
    // In production, use system Chrome if available, or skip browser download
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };

    // Use system Chrome if PUPPETEER_EXECUTABLE_PATH is set, otherwise use bundled
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      await page.pdf({
        path: filepath,
        format: 'A4',
        printBackground: true
      });

      return filepath;
    } finally {
      await browser.close();
    }
  }

  /**
   * Get public URL for contract PDF
   * In production, this would return a CDN or S3 URL
   */
  getPublicURL(filepath: string): string {
    const filename = filepath.split('/').pop();
    return `/uploads/contracts/${filename}`;
  }

  /**
   * Generate and store PDF for contract
   * Returns public URL
   */
  async generateAndStore(
    contractText: string,
    contractId: string,
    title: string
  ): Promise<string> {
    const filepath = await this.generatePDF(contractText, contractId, title);
    return this.getPublicURL(filepath);
  }
}

export const pdfGenerationService = new PDFGenerationService();
