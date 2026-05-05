const fs = require('fs');

const file = 'lib/security/requestGuards.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/process\.env\.NODE_ENV = /g, 'vi.stubEnv(\'NODE_ENV\', ');
content = content.replace(/const originalEnv = process\.env\.NODE_ENV;/g, '');
content = content.replace(/vi\.stubEnv\('NODE_ENV', originalEnv\);/g, 'vi.unstubAllEnvs();');
content = content.replace(/import { describe, it, expect } from 'vitest';/, "import { describe, it, expect, vi } from 'vitest';");

fs.writeFileSync(file, content);
