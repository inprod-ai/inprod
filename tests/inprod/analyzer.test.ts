import { describe, it, expect } from 'vitest'
import { analyzeCompleteness, formatAnalysisSummary } from '@/lib/inprod/analyzer'
import { RepoFile } from '@/lib/inprod/types'

describe('Completeness Analyzer', () => {
  const baseFiles: RepoFile[] = [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'test-app',
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
        },
        devDependencies: {},
      }),
      size: 100,
    },
    {
      path: 'app/page.tsx',
      content: 'export default function Home() { return <div>Hello</div> }',
      size: 60,
    },
  ]

  it('should analyze a basic Next.js repo', async () => {
    const analysis = await analyzeCompleteness('https://github.com/test/repo', baseFiles)
    
    expect(analysis).toBeDefined()
    expect(analysis.repoUrl).toBe('https://github.com/test/repo')
    expect(analysis.techStack.frameworks).toContain('next.js')
    expect(analysis.techStack.frameworks).toContain('react')
    expect(analysis.categories).toHaveLength(12)
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0)
    expect(analysis.overallScore).toBeLessThanOrEqual(100)
  })

  it('should detect missing tests', async () => {
    const analysis = await analyzeCompleteness('https://github.com/test/repo', baseFiles)
    
    const testingCategory = analysis.categories.find(c => c.category === 'testing')
    expect(testingCategory).toBeDefined()
    expect(testingCategory?.gaps.some(g => g.id === 'testing-no-framework')).toBe(true)
  })

  it('should detect missing CI/CD', async () => {
    const analysis = await analyzeCompleteness('https://github.com/test/repo', baseFiles)
    
    const deployCategory = analysis.categories.find(c => c.category === 'deployment')
    expect(deployCategory).toBeDefined()
    expect(deployCategory?.gaps.some(g => g.id === 'deploy-no-ci')).toBe(true)
  })

  it('should give higher score when tests exist', async () => {
    const filesWithTests: RepoFile[] = [
      ...baseFiles,
      {
        path: 'vitest.config.ts',
        content: 'export default {}',
        size: 20,
      },
      {
        path: 'app/page.test.tsx',
        content: 'test("works", () => { expect(true).toBe(true) })',
        size: 50,
      },
    ]
    
    // Add vitest to dependencies
    filesWithTests[0] = {
      path: 'package.json',
      content: JSON.stringify({
        name: 'test-app',
        dependencies: { next: '^14.0.0', react: '^18.0.0' },
        devDependencies: { vitest: '^1.0.0' },
      }),
      size: 150,
    }
    
    const analysisWithTests = await analyzeCompleteness('https://github.com/test/repo', filesWithTests)
    const analysisWithoutTests = await analyzeCompleteness('https://github.com/test/repo', baseFiles)
    
    const testScoreWith = analysisWithTests.categories.find(c => c.category === 'testing')?.score || 0
    const testScoreWithout = analysisWithoutTests.categories.find(c => c.category === 'testing')?.score || 0
    
    expect(testScoreWith).toBeGreaterThan(testScoreWithout)
  })

  it('should format analysis summary', async () => {
    const analysis = await analyzeCompleteness('https://github.com/test/repo', baseFiles)
    const summary = formatAnalysisSummary(analysis)
    
    expect(summary).toContain('Production Readiness')
    expect(summary).toContain('Category Scores')
    expect(summary).toContain('next.js')
  })
})

