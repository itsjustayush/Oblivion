import { useState, useEffect } from 'react'

export interface ResponsiveLayout {
  width: number
  height: number
  breakpoint: 'mobile' | 'tablet' | 'desktop'
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  showCenterPill: boolean
  panelWidthClass: string
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { width, height } = dimensions
  const isMobile = width < 640
  const isTablet = width >= 640 && width < 1024
  const isDesktop = width >= 1024

  const breakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

  // Automatically adjust header nav / center pill visibility on smaller tablets/mobile
  const showCenterPill = isDesktop

  // Panel widths optimized for tablet and mobile
  const panelWidthClass = isMobile
    ? 'w-full max-w-full'
    : isTablet
    ? 'max-w-md w-full'
    : 'max-w-xl w-full'

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    showCenterPill,
    panelWidthClass
  }
}
