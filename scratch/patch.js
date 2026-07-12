const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'app/drivers/page.tsx',
  'app/expenses/page.tsx',
  'app/fuel/page.tsx',
  'app/maintenance/page.tsx',
  'app/trips/page.tsx',
  'app/users/page.tsx',
  'app/vehicles/page.tsx',
  'components/layout/mobile-nav.tsx',
  'components/layout/sidebar.tsx',
  'components/layout/topbar.tsx'
];

filesToPatch.forEach(relPath => {
  const fullPath = path.join('d:/Transistops', relPath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace imports
  content = content.replace(/import\s+\{\s*([^}]*?)hasPermission([^}]*?)\}\s+from\s+['"]@\/lib\/rbac['"];?/g, (match, p1, p2) => {
    const remaining = [p1.trim(), p2.trim()].filter(Boolean).join(', ');
    if (remaining) return `import { ${remaining} } from '@/lib/rbac';`;
    return '';
  });
  content = content.replace(/import\s+\{\s*([^}]*?)canAccessModule([^}]*?)\}\s+from\s+['"]@\/lib\/rbac['"];?/g, (match, p1, p2) => {
    const remaining = [p1.trim(), p2.trim()].filter(Boolean).join(', ');
    if (remaining) return `import { ${remaining} } from '@/lib/rbac';`;
    return '';
  });
  
  // Replace usage
  content = content.replace(/const\s+\{\s*user\s*(?:,\s*logout)?(?:,\s*switchRole)?\s*\}\s*=\s*useAuth\(\);/g, (match) => {
    let newMatch = match.replace('useAuth();', 'useAuth();');
    if (!newMatch.includes('hasPermission')) {
      newMatch = newMatch.replace('{ user', '{ user, hasPermission, canAccessModule');
    }
    return newMatch;
  });

  // Since hasPermission is used as hasPermission(role, 'module', 'perm'), change to hasPermission('module', 'perm')
  content = content.replace(/hasPermission\(\s*role\s*,\s*/g, 'hasPermission(');
  content = content.replace(/canAccessModule\(\s*role\s*,\s*/g, 'canAccessModule(');

  fs.writeFileSync(fullPath, content);
});

console.log('Patch complete.');
