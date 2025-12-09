'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Share2, Copy } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useSettingsStore } from '@/lib/store'
import { exportChartAsPNG, copyShareableLink } from '@/lib/export'
import { useToast } from '@/lib/toast'

interface ChartVisualizationProps {
  chart: any
}

export default function ChartVisualization({ chart }: ChartVisualizationProps) {
  const svgRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const settings = useSettingsStore()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const loadSVG = async () => {
      if (!chart) return
      
      try {
        // Add cache-busting timestamp to force refresh
        const response = await apiClient.chart.getSVG(
          chart,
          chart.aspects,
          settings.chartStyle,
          settings.chartSize
        )
        if (svgRef.current) {
          svgRef.current.innerHTML = response.data
          // Make SVG scale to fit container
          const svgElement = svgRef.current.querySelector('svg')
          if (svgElement) {
            svgElement.style.width = '100%'
            svgElement.style.height = 'auto'
            svgElement.style.maxWidth = '100%'
            // Ensure viewBox is set for proper scaling
            if (!svgElement.getAttribute('viewBox') && svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
              const width = svgElement.getAttribute('width')
              const height = svgElement.getAttribute('height')
              svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`)
              svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
            }
          }
        }
      } catch (error) {
        console.error('Error loading chart SVG:', error)
        toast.error('Failed to load chart visualization')
      }
    }

    loadSVG()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, settings.chartStyle, settings.chartSize])

  const handleExportPNG = async () => {
    if (!containerRef.current) return
    setExporting(true)
    try {
      await exportChartAsPNG(containerRef.current, {
        format: 'png',
        filename: `orbitalastro-chart-${Date.now()}.png`,
      })
      toast.success('Chart exported successfully!')
    } catch (error) {
      toast.error('Failed to export chart')
    } finally {
      setExporting(false)
    }
  }

  const handleShare = async () => {
    try {
      await copyShareableLink(chart)
      toast.success('Shareable link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to generate shareable link')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportPNG}
          disabled={exporting}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
          title="Export as PNG"
          aria-label="Export chart as PNG image"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
          title="Copy shareable link"
          aria-label="Copy shareable link to clipboard"
        >
          <Share2 className="h-4 w-4" />
          Share
        </motion.button>
      </div>
      <div
        ref={containerRef}
        className="flex justify-center items-center p-4 overflow-hidden relative w-full"
        style={{ minHeight: '400px' }}
      >
        <div
          ref={svgRef}
          className="chart-container relative w-full"
          style={{ 
            maxWidth: '100%',
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1
          }}
        />
      </div>
    </div>
  )
}

