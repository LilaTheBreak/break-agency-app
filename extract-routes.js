const fs = require('fs');
const path = require('path');

const routesDir = './apps/api/src/routes';
const outputFile = './API_ROUTES_INVENTORY.md';

function extractRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const routes = [];
  
  // Extract HTTP method routes
  const routePatterns = [
    /router\.(get|post|put|patch|delete|all|use)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /router\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.(get|post|put|patch|delete)\s*\(/gi,
  ];
  
  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] === 'use' && !match[2].startsWith('/')) continue; // Skip middleware
      routes.push({
        method: match[1]?.toUpperCase() || match[2]?.toUpperCase(),
        path: match[2] || match[1]
      });
    }
  });
  
  // Extract middleware
  const middlewareMatches = content.match(/(requireAuth|requireAdmin|requireRole|protect|checkOnboardingApproved|rateLimit)/g);
  const middleware = [...new Set(middlewareMatches || [])];
  
  return { fileName, routes, middleware, content };
}

function generateMarkdown() {
  const files = fs.readdirSync(routesDir)
    .filter(f => f.endsWith('.ts'))
    .sort();
  
  let markdown = `# Complete API Routes Inventory\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Total Route Files:** ${files.length}\n\n`;
  markdown += `---\n\n`;
  
  const routesByDomain = {};
  
  files.forEach(file => {
    const filePath = path.join(routesDir, file);
    const { fileName, routes, middleware, content } = extractRoutes(filePath);
    
    // Categorize by domain
    let domain = 'Other';
    if (fileName.includes('inbox')) domain = 'Inbox';
    else if (fileName.includes('gmail')) domain = 'Gmail';
    else if (fileName.includes('crm')) domain = 'CRM';
    else if (fileName.includes('campaign')) domain = 'Campaigns';
    else if (fileName.includes('deal')) domain = 'Deals';
    else if (fileName.includes('ugc')) domain = 'UGC';
    else if (fileName.includes('outreach')) domain = 'Outreach';
    else if (fileName.includes('creator')) domain = 'Creators';
    else if (fileName.includes('dashboard')) domain = 'Dashboard';
    else if (fileName.includes('analytics')) domain = 'Analytics';
    else if (fileName.includes('calendar')) domain = 'Calendar';
    else if (fileName.includes('auth')) domain = 'Auth';
    else if (fileName.includes('admin')) domain = 'Admin';
    else if (fileName.includes('email')) domain = 'Email';
    else if (fileName.includes('payment') || fileName.includes('payout')) domain = 'Payments';
    else if (fileName.includes('contract')) domain = 'Contracts';
    else if (fileName.includes('wellness')) domain = 'Wellness';
    else if (fileName.includes('opportunity') || fileName.includes('opportunities')) domain = 'Opportunities';
    else if (fileName.includes('ai')) domain = 'AI';
    else if (fileName.includes('strategy')) domain = 'Strategy';
    else if (fileName.includes('asset') || fileName.includes('file')) domain = 'Assets';
    
    if (!routesByDomain[domain]) routesByDomain[domain] = [];
    routesByDomain[domain].push({ fileName, routes, middleware, content });
  });
  
  // Generate organized output
  Object.keys(routesByDomain).sort().forEach(domain => {
    markdown += `## ${domain}\n\n`;
    
    routesByDomain[domain].forEach(({ fileName, routes, middleware }) => {
      markdown += `### \`${fileName}\`\n\n`;
      
      if (middleware.length > 0) {
        markdown += `**Middleware:** ${middleware.join(', ')}\n\n`;
      }
      
      if (routes.length === 0) {
        markdown += `*No routes found or placeholder file*\n\n`;
      } else {
        markdown += `| Method | Endpoint |\n`;
        markdown += `|--------|----------|\n`;
        routes.forEach(({ method, path }) => {
          markdown += `| ${method} | ${path} |\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    });
  });
  
  // Add summary statistics
  markdown += `## Summary Statistics\n\n`;
  const totalRoutes = Object.values(routesByDomain).reduce((sum, domain) => 
    sum + domain.reduce((s, f) => s + f.routes.length, 0), 0
  );
  
  markdown += `- **Total Domains:** ${Object.keys(routesByDomain).length}\n`;
  markdown += `- **Total Route Files:** ${files.length}\n`;
  markdown += `- **Total Endpoints:** ${totalRoutes}\n\n`;
  
  Object.keys(routesByDomain).sort().forEach(domain => {
    const domainRoutes = routesByDomain[domain].reduce((s, f) => s + f.routes.length, 0);
    markdown += `- **${domain}:** ${domainRoutes} endpoints\n`;
  });
  
  return markdown;
}

try {
  const markdown = generateMarkdown();
  fs.writeFileSync(outputFile, markdown);
  console.log(`✅ API Routes Inventory generated: ${outputFile}`);
  console.log(`📊 Total files processed: ${fs.readdirSync(routesDir).filter(f => f.endsWith('.ts')).length}`);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
