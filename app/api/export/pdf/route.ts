import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFReport from '@/components/PDFReport'
import type { AnalysisResult } from '@/types/analysis'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    // Check if user is Pro
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true }
    })
    
    if (!user || user.tier !== 'PRO') {
      return new NextResponse('PDF export is a Pro feature', { status: 403 })
    }
    
    const { scanId } = await request.json()
    
    // Fetch scan data
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      select: {
        repoUrl: true,
        owner: true,
        repo: true,
        overallScore: true,
        confidence: true,
        categories: true,
        findings: true,
        summary: true,
        createdAt: true,
      }
    })
    
    // Ensure the scan belongs to the user (security fix)
    const userScan = await prisma.scan.findFirst({
      where: { 
        id: scanId,
        userId: session.user.id // Only allow users to export their own scans
      },
      select: {
        repoUrl: true,
        owner: true,
        repo: true,
        overallScore: true,
        confidence: true,
        categories: true,
        findings: true,
        summary: true,
        createdAt: true,
      }
    })
    
    if (!userScan) {
      return new NextResponse('Scan not found or access denied', { status: 404 })
    }
    
    // Use userScan instead of scan
    
    // Convert Prisma data to AnalysisResult format
    const result: AnalysisResult = {
      repoUrl: userScan.repoUrl,
      owner: userScan.owner,
      repo: userScan.repo,
      overallScore: userScan.overallScore,
      timestamp: userScan.createdAt,
      confidence: userScan.confidence as any,
      categories: userScan.categories as any,
      findings: userScan.findings as any,
      summary: userScan.summary as any,
    }
    
    // Generate PDF
    const pdfBuffer = await renderToBuffer(PDFReport({ result }))
    
    // Return PDF as response with sanitized filename
    const sanitizedFilename = userScan.repo.replace(/[^a-zA-Z0-9_-]/g, '_')
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}-analysis.pdf"`,
      },
    })
  } catch (error) {
    const sanitizedMessage = process.env.NODE_ENV === 'production'
      ? 'Failed to generate PDF'
      : error instanceof Error ? error.message : 'Failed to generate PDF'
      
    console.error('PDF export error:', {
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
      userId: 'masked'
    })
    
    return new NextResponse(sanitizedMessage, { status: 500 })
  }
}
