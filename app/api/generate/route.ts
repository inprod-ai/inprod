// =============================================================================
// API: /api/generate - Generate fixes for identified gaps
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { analyzeCompleteness, getInstantFixGaps } from '@/lib/inprod/analyzer'
import { RepoFile, Gap, Category, GeneratedFile } from '@/lib/inprod/types'
import { generateSecurityFixes } from '@/lib/inprod/generators/security'
import { generateTests } from '@/lib/inprod/generators/testing'
import { generateCICD } from '@/lib/inprod/generators/cicd'
import { generateReadme } from '@/lib/inprod/generators/readme'

interface GenerateRequest {
  repoUrl: string
  files?: RepoFile[]
  categories?: Category[]
  gapsToFix?: string[] // Gap IDs to fix
  instantOnly?: boolean // Only auto-fixable gaps
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { repoUrl, files, categories, gapsToFix, instantOnly } = body
    
    if (!repoUrl) {
      return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 })
    }
    
    // Get files if not provided
    let repoFiles: RepoFile[] = files || []
    if (repoFiles.length === 0) {
      repoFiles = await fetchRepoFiles(repoUrl)
    }
    
    // Analyze the repo
    const analysis = await analyzeCompleteness(repoUrl, repoFiles)
    
    // Determine which gaps to fix
    let targetGaps: Gap[]
    
    if (gapsToFix && gapsToFix.length > 0) {
      // Fix specific gaps
      targetGaps = analysis.categories
        .flatMap(c => c.gaps)
        .filter(g => gapsToFix.includes(g.id))
    } else if (instantOnly) {
      // Only instant-fix gaps
      targetGaps = getInstantFixGaps(analysis)
    } else if (categories && categories.length > 0) {
      // All gaps in specified categories
      targetGaps = analysis.categories
        .filter(c => categories.includes(c.category))
        .flatMap(c => c.gaps)
    } else {
      // All instant-fix gaps
      targetGaps = getInstantFixGaps(analysis)
    }
    
    // Build context for generators
    const packageJsonFile = repoFiles.find(f => f.path === 'package.json')
    const packageJson = packageJsonFile 
      ? JSON.parse(packageJsonFile.content) 
      : undefined
    
    const readmeFile = repoFiles.find(f => f.path.toLowerCase() === 'readme.md')
    
    const ctx = {
      files: repoFiles,
      techStack: analysis.techStack,
      packageJson,
      readme: readmeFile?.content,
    }
    
    // Generate fixes by category
    const generatedFiles: GeneratedFile[] = []
    
    // Group gaps by category
    const gapsByCategory = new Map<Category, Gap[]>()
    for (const gap of targetGaps) {
      const existing = gapsByCategory.get(gap.category) || []
      existing.push(gap)
      gapsByCategory.set(gap.category, existing)
    }
    
    // Security fixes
    const securityGaps = gapsByCategory.get('security') || []
    if (securityGaps.length > 0) {
      const securityFiles = await generateSecurityFixes(ctx, securityGaps)
      generatedFiles.push(...securityFiles)
    }
    
    // Testing fixes
    const testingGaps = gapsByCategory.get('testing') || []
    if (testingGaps.length > 0) {
      const testFiles = await generateTests(ctx, testingGaps)
      generatedFiles.push(...testFiles)
    }
    
    // Deployment/CI fixes
    const deployGaps = gapsByCategory.get('deployment') || []
    if (deployGaps.length > 0) {
      const cicdFiles = await generateCICD(ctx, deployGaps)
      generatedFiles.push(...cicdFiles)
    }
    
    // Version control (README)
    const vcGaps = gapsByCategory.get('versionControl') || []
    const needsReadme = vcGaps.some(g => g.id === 'vc-no-readme')
    if (needsReadme) {
      const readmeFiles = await generateReadme(ctx)
      generatedFiles.push(...readmeFiles)
    }
    
    return NextResponse.json({
      success: true,
      generatedFiles,
      summary: {
        totalGaps: targetGaps.length,
        filesGenerated: generatedFiles.length,
        categories: Array.from(gapsByCategory.keys()),
      },
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

async function fetchRepoFiles(repoUrl: string): Promise<RepoFile[]> {
  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/)
  if (!match) {
    throw new Error('Invalid GitHub URL')
  }
  
  const [, owner, repo] = match
  const cleanRepo = repo.replace(/\.git$/, '')
  
  // Fetch repo tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  )
  
  if (!treeRes.ok) {
    throw new Error(`Failed to fetch repo: ${treeRes.status}`)
  }
  
  const tree = await treeRes.json()
  
  // Filter relevant files (same as complete endpoint)
  const relevantFiles = tree.tree
    .filter((item: { type: string; path: string; size?: number }) => 
      item.type === 'blob' &&
      !item.path.includes('node_modules') &&
      !item.path.includes('.git/') &&
      !item.path.includes('dist/') &&
      !item.path.includes('build/') &&
      !item.path.includes('.next/') &&
      (item.size || 0) < 100000
    )
    .slice(0, 200)
  
  const files: RepoFile[] = []
  
  for (let i = 0; i < relevantFiles.length; i += 10) {
    const batch = relevantFiles.slice(i, i + 10)
    const contents = await Promise.all(
      batch.map(async (item: { path: string; size?: number }) => {
        try {
          const contentRes = await fetch(
            `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${item.path}`,
            {
              headers: {
                Accept: 'application/vnd.github.v3.raw',
                ...(process.env.GITHUB_TOKEN && {
                  Authorization: `token ${process.env.GITHUB_TOKEN}`,
                }),
              },
            }
          )
          
          if (!contentRes.ok) return null
          
          const content = await contentRes.text()
          return {
            path: item.path,
            content,
            size: item.size || content.length,
          }
        } catch {
          return null
        }
      })
    )
    
    files.push(...contents.filter(Boolean) as RepoFile[])
  }
  
  return files
}

