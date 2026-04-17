/**
 * Fix Next.js 15 params Promise pattern across all API route handlers.
 * In Next.js 15, `params` in route handlers is now a Promise and must be awaited.
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const files = [
  "app/api/agents/[id]/portal-access/route.ts",
  "app/api/agents/[id]/reset-portal-password/route.ts",
  "app/api/agents/[id]/route.ts",
  "app/api/attorneys/[id]/route.ts",
  "app/api/clients/[id]/route.ts",
  "app/api/documents/[id]/download/route.ts",
  "app/api/documents/[id]/route.ts",
  "app/api/follow-ups/[id]/attachments/route.ts",
  "app/api/follow-ups/[id]/route.ts",
  "app/api/general-tasks/[id]/route.ts",
  "app/api/inspection-templates/[id]/route.ts",
  "app/api/inspectors/[id]/route.ts",
  "app/api/lenders/[id]/route.ts",
  "app/api/other-entities/[id]/route.ts",
  "app/api/portal/transactions/[id]/route.ts",
  "app/api/properties/[id]/route.ts",
  "app/api/roles/[id]/route.ts",
  "app/api/templates/[id]/route.ts",
  "app/api/title-companies/[id]/route.ts",
  "app/api/transactions/[id]/assignments/route.ts",
  "app/api/transactions/[id]/email-logs/route.ts",
  "app/api/transactions/[id]/follow-ups/route.ts",
  "app/api/transactions/[id]/send-email/route.ts",
  // tracking routes have a different param name
  "app/api/clients/[id]/reset-password/route.ts",
  "app/api/profiles/[id]/route.ts",
  "app/api/profiles/[id]/reset-password/route.ts",
]

let totalFixed = 0

for (const file of files) {
  const path = resolve(file)
  let content
  try {
    content = readFileSync(path, "utf8")
  } catch {
    console.log(`[SKIP] ${file} - not found`)
    continue
  }

  // Skip if already fixed
  if (content.includes("params: Promise<{ id: string }>")) {
    console.log(`[SKIP] ${file} - already fixed`)
    continue
  }

  let changed = false

  // Step 1: Replace the type signature for all HTTP methods in route handlers
  // Pattern: { params }: { params: { id: string } }
  const typePattern = /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*id\s*:\s*string\s*\}\s*\}/g
  if (typePattern.test(content)) {
    content = content.replace(
      /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*id\s*:\s*string\s*\}\s*\}/g,
      "{ params }: { params: Promise<{ id: string }> }"
    )
    changed = true
  }

  // Step 2: For each function body that now has Promise params, inject `const { id } = await params`
  // We need to add it after the opening brace of the function body, before any params.id usage
  // Find functions that have the new type and add the await line if missing
  if (changed && !content.includes("const { id } = await params")) {
    // Insert `const { id } = await params` after the function signature opening brace
    // Match: ) {\n (the opening of the function body after the signature)
    // We look for the pattern right after the type replacement and inject on the next line
    content = content.replace(
      /(Promise<\{ id: string \}>\)(?:\s*:\s*\S+)?\s*\{)/g,
      "$1\n  const { id } = await params"
    )
    changed = true
  }

  // Step 3: Replace params.id with id
  if (changed) {
    content = content.replace(/params\.id/g, "id")
  }

  if (changed) {
    writeFileSync(path, content, "utf8")
    console.log(`[FIXED] ${file}`)
    totalFixed++
  } else {
    console.log(`[NOCHANGE] ${file}`)
  }
}

console.log(`\nDone. Fixed ${totalFixed} file(s).`)
