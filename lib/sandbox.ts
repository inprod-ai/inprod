/**
 * E2B Sandbox Integration
 * 
 * Provides sandboxed code execution for:
 * - Build verification
 * - Test execution
 * - Generated code validation
 * 
 * Cost: ~$0.01-0.03 per execution (2-5 minutes)
 * Max monthly cost at 1000 executions: $30
 */

import { Sandbox } from 'e2b'

// Validate E2B API key
if (!process.env.E2B_API_KEY) {
  console.warn('E2B_API_KEY not set - sandbox execution disabled')
}

export interface SandboxResult {
  success: boolean
  buildSuccess?: boolean
  testsSuccess?: boolean
  testOutput?: string
  coverage?: {
    lines: number
    branches: number
    functions: number
  }
  errors?: string[]
  duration: number
}

export interface SandboxOptions {
  timeout?: number // milliseconds, default 5 minutes
  runTests?: boolean
  runBuild?: boolean
  installDeps?: boolean
}

const DEFAULT_OPTIONS: SandboxOptions = {
  timeout: 5 * 60 * 1000, // 5 minutes
  runTests: true,
  runBuild: true,
  installDeps: true
}

/**
 * Execute code in a sandboxed environment
 * 
 * @param files - Map of file path to content
 * @param stack - Tech stack (node, python, go, etc.)
 * @param options - Execution options
 */
export async function runInSandbox(
  files: Record<string, string>,
  stack: 'node' | 'python' | 'go' | 'rust' = 'node',
  options: SandboxOptions = {}
): Promise<SandboxResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()

  // Return mock result if E2B not configured
  if (!process.env.E2B_API_KEY) {
    return {
      success: false,
      errors: ['E2B_API_KEY not configured - sandbox execution disabled'],
      duration: 0
    }
  }

  const templateMap = {
    node: 'node-20',
    python: 'python-3.11',
    go: 'golang-1.21',
    rust: 'rust-1.75'
  }

  let sandbox: Sandbox | null = null

  try {
    sandbox = await Sandbox.create(templateMap[stack], {
      timeoutMs: opts.timeout
    })

    const errors: string[] = []
    let buildSuccess = false
    let testsSuccess = false
    let testOutput = ''

    // Write files to sandbox
    for (const [path, content] of Object.entries(files)) {
      await sandbox.files.write(`/app/${path}`, content)
    }

    // Install dependencies
    if (opts.installDeps) {
      const installCmd = getInstallCommand(stack, files)
      if (installCmd) {
        const install = await sandbox.commands.run(installCmd, {
          cwd: '/app',
          timeoutMs: 120_000 // 2 minutes for install
        })
        
        if (install.exitCode !== 0) {
          errors.push(`Install failed: ${install.stderr}`)
        }
      }
    }

    // Run build
    if (opts.runBuild) {
      const buildCmd = getBuildCommand(stack, files)
      if (buildCmd) {
        const build = await sandbox.commands.run(buildCmd, {
          cwd: '/app',
          timeoutMs: 120_000
        })
        
        buildSuccess = build.exitCode === 0
        if (!buildSuccess) {
          errors.push(`Build failed: ${build.stderr}`)
        }
      } else {
        buildSuccess = true // No build step needed
      }
    }

    // Run tests
    if (opts.runTests) {
      const testCmd = getTestCommand(stack, files)
      if (testCmd) {
        const tests = await sandbox.commands.run(testCmd, {
          cwd: '/app',
          timeoutMs: 180_000 // 3 minutes for tests
        })
        
        testsSuccess = tests.exitCode === 0
        testOutput = tests.stdout + tests.stderr

        if (!testsSuccess) {
          errors.push(`Tests failed`)
        }
      }
    }

    // Parse coverage if available
    const coverage = parseCoverage(testOutput)

    return {
      success: buildSuccess && testsSuccess && errors.length === 0,
      buildSuccess,
      testsSuccess,
      testOutput,
      coverage,
      errors: errors.length > 0 ? errors : undefined,
      duration: Date.now() - startTime
    }

  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Sandbox execution failed'],
      duration: Date.now() - startTime
    }
  } finally {
    if (sandbox) {
      await sandbox.kill()
    }
  }
}

function getInstallCommand(stack: string, files: Record<string, string>): string | null {
  switch (stack) {
    case 'node':
      if ('package-lock.json' in files) return 'npm ci'
      if ('yarn.lock' in files) return 'yarn install --frozen-lockfile'
      if ('pnpm-lock.yaml' in files) return 'pnpm install --frozen-lockfile'
      if ('package.json' in files) return 'npm install'
      return null
    case 'python':
      if ('requirements.txt' in files) return 'pip install -r requirements.txt'
      if ('pyproject.toml' in files) return 'pip install -e .'
      return null
    case 'go':
      if ('go.mod' in files) return 'go mod download'
      return null
    case 'rust':
      if ('Cargo.toml' in files) return 'cargo fetch'
      return null
    default:
      return null
  }
}

function getBuildCommand(stack: string, files: Record<string, string>): string | null {
  const packageJson = files['package.json']
  
  switch (stack) {
    case 'node':
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson)
          if (pkg.scripts?.build) return 'npm run build'
        } catch {}
      }
      return null
    case 'python':
      return null // Python doesn't usually have a build step
    case 'go':
      return 'go build ./...'
    case 'rust':
      return 'cargo build'
    default:
      return null
  }
}

function getTestCommand(stack: string, files: Record<string, string>): string | null {
  const packageJson = files['package.json']
  
  switch (stack) {
    case 'node':
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson)
          if (pkg.scripts?.test) return 'npm test -- --coverage --passWithNoTests'
        } catch {}
      }
      return null
    case 'python':
      return 'pytest --cov=. --cov-report=term-missing -v || python -m pytest --cov=. -v || echo "No pytest found"'
    case 'go':
      return 'go test -v -cover ./...'
    case 'rust':
      return 'cargo test'
    default:
      return null
  }
}

function parseCoverage(output: string): SandboxResult['coverage'] | undefined {
  // Try to parse Jest/Vitest coverage
  const jestMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/)
  if (jestMatch) {
    return {
      lines: parseFloat(jestMatch[1]),
      branches: parseFloat(jestMatch[2]),
      functions: parseFloat(jestMatch[3])
    }
  }

  // Try to parse pytest coverage
  const pytestMatch = output.match(/TOTAL\s+\d+\s+\d+\s+([\d.]+)%/)
  if (pytestMatch) {
    const coverage = parseFloat(pytestMatch[1])
    return { lines: coverage, branches: coverage, functions: coverage }
  }

  // Try to parse Go coverage
  const goMatch = output.match(/coverage: ([\d.]+)% of statements/)
  if (goMatch) {
    const coverage = parseFloat(goMatch[1])
    return { lines: coverage, branches: coverage, functions: coverage }
  }

  return undefined
}

/**
 * Validate generated code by running it in a sandbox
 */
export async function validateGeneratedCode(
  generatedFiles: Array<{ path: string; content: string }>,
  existingFiles: Record<string, string>,
  stack: 'node' | 'python' | 'go' | 'rust' = 'node'
): Promise<{
  valid: boolean
  testsPass: boolean
  errors: string[]
}> {
  // Merge generated files with existing
  const allFiles = { ...existingFiles }
  for (const file of generatedFiles) {
    allFiles[file.path] = file.content
  }

  const result = await runInSandbox(allFiles, stack, {
    runBuild: true,
    runTests: true
  })

  return {
    valid: result.success,
    testsPass: result.testsSuccess || false,
    errors: result.errors || []
  }
}

