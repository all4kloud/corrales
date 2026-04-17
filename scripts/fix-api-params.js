const { readFileSync, writeFileSync, existsSync } = require("fs")
const { join } = require("path")

const BASE = "/"

const files = [
  "app/api/agents/[id]/portal-access/route.ts",
  "app/api/agents/[id]/reset-portal-password/route.ts",
  "app/api/agents/[id]/route.ts",
  "app/api/attorneys/[id]/route.ts",
  "app/api/clients/[id]/route.ts",
  "app/api/clients/[id]/reset-password/route.ts",
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
  "app/api/profiles/[id]/route.ts",
  "app/api/profiles/[id]/reset-password/route.ts",
  "app/api/properties/[id]/route.ts",
  "app/api/roles/[id]/route.ts",
  "app/api/templates/[id]/route.ts",
  "app/api/title-companies/[id]/route.ts",
  "app/api/transactions/[id]/assignments/route.ts",
  "app/api/transactions/[id]/email-logs/route.ts",
  "app/api/transactions/[id]/follow-ups/route.ts",
  "app/api/transactions/[id]/send-email/route.ts",
]

let totalFixed = 0

for (const file of files) {
  const path = join(BASE, file)
  if (!existsSync(path)) {
    console.log("[SKIP] " + file + " - not found at " + path)
    continue
  }
  let content
  try {
    content = readFileSync(path, "utf8")
  } catch (e) {
    console.log("[ERROR] " + file + " - " + e.message)
    continue
  }

  // Skip if already fixed
  if (content.includes("params: Promise<{ id: string }>")) {
    console.log("[SKIP] " + file + " - already fixed")
    continue
  }

  // Check if it has the old pattern
  if (!content.includes("params: { id: string }")) {
    console.log("[NOCHANGE] " + file + " - no old pattern found")
    continue
  }

  let changed = false

  // Step 1: Replace type signature
  content = content.replace(
    /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*id\s*:\s*string\s*\}\s*\}/g,
    "{ params }: { params: Promise<{ id: string }> }"
  )
  changed = true

  // Step 2: Inject `const { id } = await params` after each function's opening brace
  // Matches: Promise<{ id: string }>) {  OR  Promise<{ id: string }>): Promise<Response> {
  content = content.replace(
    /(Promise<\{ id: string \}>\)[^{]*\{)/g,
    "$1\n  const { id } = await params"
  )

  // Step 3: Replace all params.id with id
  content = content.replace(/params\.id/g, "id")

  if (changed) {
    writeFileSync(path, content, "utf8")
    console.log("[FIXED] " + file)
    totalFixed++
  }
}

console.log("\nDone. Fixed " + totalFixed + " file(s).")
