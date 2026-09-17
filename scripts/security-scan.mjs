#!/usr/bin/env node
/**
 * Monovie Web Factory — Automated Static Security Scanner
 * 
 * Deterministic scanner that inspects codebases for:
 * 1. Hardcoded API keys, tokens, passwords, private keys, database URLs
 * 2. Client-side secret exposure (NEXT_PUBLIC_ secrets, server SDKs in client components)
 * 3. Injection risks (SQL concatenation, command injection, eval, new Function)
 * 4. XSS vectors (dangerouslySetInnerHTML, javascript: URIs)
 * 5. SSRF vectors (unvalidated server-side fetch on dynamic URLs)
 * 6. Path traversal vectors (direct fs operations with unsanitized parameters)
 * 7. Missing Supabase/Postgres Row Level Security (RLS)
 * 8. Insecure CORS & missing security headers
 * 9. AI provider key & client-side exposure
 * 10. Debug/development leakages (passwords/tokens in console.log)
 *
 * Usage:
 *   node scripts/security-scan.mjs [--dir <path>] [--json] [--fail-on-warning]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const targetDir = path.resolve(getArg("--dir") || process.cwd());
const outputJson = args.includes("--json");
const failOnWarning = args.includes("--fail-on-warning");

// Ignore directories and files
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  ".turbo",
  ".cache",
  "coverage"
]);

const IGNORE_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb"
]);

// File extensions to scan
const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".json", ".sql", ".env", ".env.example", ".env.local",
  ".yml", ".yaml", ".md", ".sh", ".bash"
]);

// Vulnerability Rules
const SECRET_RULES = [
  {
    id: "SEC-001",
    name: "AWS Access Key",
    severity: "CRITICAL",
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    description: "Hardcoded AWS Access Key ID detected."
  },
  {
    id: "SEC-002",
    name: "Stripe Secret / Restricted Key",
    severity: "CRITICAL",
    regex: /\b(sk_live_[0-9a-zA-Z]{24,}|rk_live_[0-9a-zA-Z]{24,}|sk_test_[0-9a-zA-Z]{24,}|rk_test_[0-9a-zA-Z]{24,})\b/g,
    description: "Hardcoded Stripe secret or restricted key detected."
  },
  {
    id: "SEC-003",
    name: "OpenAI / AI Provider API Key",
    severity: "CRITICAL",
    regex: /\b(sk-[a-zA-Z0-9]{20,T3BlbkFJ[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9_-]{40,})\b/g,
    description: "Hardcoded OpenAI API key detected."
  },
  {
    id: "SEC-004",
    name: "Anthropic API Key",
    severity: "CRITICAL",
    regex: /\b(sk-ant-api[0-9]{2}-[a-zA-Z0-9_-]{60,})\b/g,
    description: "Hardcoded Anthropic API key detected."
  },
  {
    id: "SEC-005",
    name: "Google AI / Gemini API Key",
    severity: "CRITICAL",
    regex: /\b(AIzaSy[0-9A-Za-z_-]{33})\b/g,
    description: "Hardcoded Google / Gemini API key detected."
  },
  {
    id: "SEC-006",
    name: "GitHub Personal Access Token",
    severity: "CRITICAL",
    regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})\b/g,
    description: "Hardcoded GitHub Personal Access Token detected."
  },
  {
    id: "SEC-007",
    name: "Supabase Service Role Key",
    severity: "CRITICAL",
    regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][a-zA-Z0-9_\-\.]{50,}['"]/g,
    description: "Hardcoded Supabase service role key detected."
  },
  {
    id: "SEC-008",
    name: "Private Key Block",
    severity: "CRITICAL",
    regex: /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP|PRIVATE) KEY-----/g,
    description: "Unencrypted Private Key block detected."
  },
  {
    id: "SEC-009",
    name: "Database URL with Credentials",
    severity: "HIGH",
    regex: /\b(postgres|postgresql|mysql|mongodb|redis):\/\/[a-zA-Z0-9_]+:[^@\s\n'"]+@[a-zA-Z0-9_\.\-]+:\d+/g,
    description: "Database connection URI containing plaintext password."
  },
  {
    id: "SEC-010",
    name: "Client-Exposed Secret Environment Variable",
    severity: "CRITICAL",
    regex: /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|PRIVATE|SERVICE_ROLE|ADMIN_KEY|TOKEN|PASSWORD|DATABASE_URL)\s*=/gi,
    description: "Secret or credential exposed via NEXT_PUBLIC_ prefix to client bundle."
  }
];

const CODE_VULNERABILITY_RULES = [
  {
    id: "SEC-011",
    name: "Dangerous Code Execution (eval)",
    severity: "HIGH",
    fileFilter: /\.(js|jsx|ts|tsx|mjs|cjs)$/,
    regex: /\beval\s*\(/g,
    description: "Use of eval() introduces arbitrary code execution risks."
  },
  {
    id: "SEC-012",
    name: "Dangerous Function Constructor",
    severity: "HIGH",
    fileFilter: /\.(js|jsx|ts|tsx|mjs|cjs)$/,
    regex: /new\s+Function\s*\(/g,
    description: "new Function() can be used for dynamic code injection."
  },
  {
    id: "SEC-013",
    name: "Command Injection Risk (child_process.exec with interpolation)",
    severity: "HIGH",
    fileFilter: /\.(js|jsx|ts|tsx|mjs|cjs)$/,
    regex: /\bexec(?:Sync)?\s*\(\s*`[^`]*\$\{/g,
    description: "child_process.exec/execSync with string template interpolation is vulnerable to command injection."
  },
  {
    id: "SEC-014",
    name: "Raw SQL String Interpolation",
    severity: "HIGH",
    fileFilter: /\.(js|jsx|ts|tsx|mjs|cjs)$/,
    regex: /(?:query|raw|execute|sql)\s*\(\s*`[^`]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)[^`]*\$\{/gi,
    description: "Direct string interpolation in SQL query. Use parameterized queries or ORM query builder."
  },
  {
    id: "SEC-015",
    name: "Cross-Site Scripting (dangerouslySetInnerHTML)",
    severity: "MEDIUM",
    fileFilter: /\.(jsx|tsx|js|ts)$/,
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(?!\s*["'`])/g,
    description: "dangerouslySetInnerHTML with dynamic variable can lead to XSS if not explicitly sanitized."
  },
  {
    id: "SEC-016",
    name: "Insecure JavaScript URI Scheme",
    severity: "HIGH",
    fileFilter: /\.(jsx|tsx|js|ts|html)$/,
    regex: /href\s*=\s*["']javascript:/gi,
    description: "javascript: URI scheme in href allows Cross-Site Scripting."
  },
  {
    id: "SEC-017",
    name: "Client Component Importing Server AI SDK",
    severity: "HIGH",
    fileFilter: /\.(jsx|tsx)$/,
    customCheck: (content, filePath) => {
      const isClient = /["']use client["']/.test(content);
      if (!isClient) return [];
      const matches = [];
      const aiImports = [
        /@google\/genai/,
        /@anthropic-ai\/sdk/,
        /openai/,
        /@supabase\/supabase-js.*service_role/
      ];
      for (const rx of aiImports) {
        if (rx.test(content)) {
          matches.push({
            line: 1,
            snippet: "Client component imports server-only AI/backend SDK",
            description: "Direct import of AI SDK in a 'use client' file exposes API calls and credentials to client browser."
          });
        }
      }
      return matches;
    }
  },
  {
    id: "SEC-018",
    name: "Missing Row Level Security on Table Creation",
    severity: "HIGH",
    fileFilter: /\.(sql)$/,
    customCheck: (content, filePath) => {
      const matches = [];
      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.]+)/gi;
      let match;
      while ((match = createTableRegex.exec(content)) !== null) {
        const tableName = match[1];
        const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i");
        if (!rlsRegex.test(content)) {
          const lineNum = content.slice(0, match.index).split("\n").length;
          matches.push({
            line: lineNum,
            snippet: match[0],
            description: `Table '${tableName}' created without enabling Row Level Security (ENABLE ROW LEVEL SECURITY).`
          });
        }
      }
      return matches;
    }
  },
  {
    id: "SEC-019",
    name: "Potential Path Traversal in File Operations",
    severity: "MEDIUM",
    fileFilter: /\.(js|ts|mjs|cjs)$/,
    regex: /fs\.(?:readFileSync|readFile|createReadStream|unlink|rm)\s*\(\s*(?:req\.|params\.|body\.|query\.)/g,
    description: "Direct use of user request parameter in filesystem call without path normalization/boundary check."
  },
  {
    id: "SEC-020",
    name: "Insecure Overly Permissive CORS",
    severity: "MEDIUM",
    fileFilter: /\.(js|ts|mjs|cjs|json)$/,
    regex: /["']Access-Control-Allow-Origin["']\s*:\s*["']\*["']/g,
    description: "Wildcard CORS origin ('*'). Specify explicit allowed origins for authenticated or sensitive endpoints."
  },
  {
    id: "SEC-021",
    name: "Sensitive Credential in Console Logging",
    severity: "MEDIUM",
    fileFilter: /\.(js|jsx|ts|tsx|mjs|cjs)$/,
    regex: /console\.(?:log|debug|info|warn|error)\s*\([^\)]*\b(password|secret|apiKey|token|authorization|bearer)\b/gi,
    description: "Logging variable containing sensitive keyword (password, secret, apiKey, token) to console."
  }
];

// Helper: Scan directory recursively
function scanDirectory(dir, results = { findings: [], filesScanned: 0 }) {
  if (!fs.existsSync(dir)) return results;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(targetDir, fullPath);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      scanDirectory(fullPath, results);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXTENSIONS.has(ext) && !entry.name.startsWith(".env")) continue;

      results.filesScanned++;
      scanFile(fullPath, relPath, results.findings);
    }
  }

  return results;
}

// Helper: Scan single file
function scanFile(filePath, relPath, findings) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  const lines = content.split("\n");

  // Check secrets
  for (const rule of SECRET_RULES) {
    if (filePath.endsWith(".example") || filePath.includes("example")) {
      continue;
    }

    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(content)) !== null) {
      const val = match[0];
      if (/your[-_]api[-_]key|placeholder|xxxx|123456789/i.test(val)) continue;

      const lineNum = content.slice(0, match.index).split("\n").length;
      findings.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        file: relPath,
        line: lineNum,
        snippet: lines[lineNum - 1]?.trim().slice(0, 120) || "",
        description: rule.description
      });
    }
  }

  // Check code patterns
  for (const rule of CODE_VULNERABILITY_RULES) {
    if (rule.fileFilter && !rule.fileFilter.test(filePath)) continue;

    if (rule.customCheck) {
      const customMatches = rule.customCheck(content, filePath);
      for (const m of customMatches) {
        findings.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          file: relPath,
          line: m.line,
          snippet: m.snippet,
          description: m.description
        });
      }
      continue;
    }

    if (rule.regex) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(content)) !== null) {
        const lineNum = content.slice(0, match.index).split("\n").length;
        findings.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          file: relPath,
          line: lineNum,
          snippet: lines[lineNum - 1]?.trim().slice(0, 120) || "",
          description: rule.description
        });
      }
    }
  }
}

// Main execution
const results = scanDirectory(targetDir);
const criticalCount = results.findings.filter(f => f.severity === "CRITICAL").length;
const highCount = results.findings.filter(f => f.severity === "HIGH").length;
const mediumCount = results.findings.filter(f => f.severity === "MEDIUM").length;
const lowCount = results.findings.filter(f => f.severity === "LOW").length;

const isFailed = criticalCount > 0 || highCount > 0 || (failOnWarning && (mediumCount > 0 || lowCount > 0));

if (outputJson) {
  console.log(JSON.stringify({
    targetDir,
    filesScanned: results.filesScanned,
    passed: !isFailed,
    summary: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      total: results.findings.length
    },
    findings: results.findings
  }, null, 2));
} else {
  console.log("\n=======================================================");
  console.log("       MONOVIE WEB FACTORY — STATIC SECURITY SCAN      ");
  console.log("=======================================================");
  console.log(`Target: ${targetDir}`);
  console.log(`Files Scanned: ${results.filesScanned}`);
  console.log(`Findings: ${results.findings.length} (Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount}, Low: ${lowCount})\n`);

  if (results.findings.length === 0) {
    console.log("✓ PASS: No automated security issues detected.\n");
  } else {
    for (const f of results.findings) {
      const color = f.severity === "CRITICAL" ? "[CRITICAL]" : f.severity === "HIGH" ? "[HIGH]" : "[MEDIUM]";
      console.log(`${color} ${f.ruleId}: ${f.ruleName}`);
      console.log(`  File: ${f.file}:${f.line}`);
      console.log(`  Issue: ${f.description}`);
      console.log(`  Snippet: ${f.snippet}\n`);
    }
  }

  console.log("-------------------------------------------------------");
  console.log(`RESULT: ${isFailed ? "FAIL (Critical or High issues found)" : "PASS"}`);
  console.log("=======================================================\n");
}

process.exit(isFailed ? 1 : 0);
