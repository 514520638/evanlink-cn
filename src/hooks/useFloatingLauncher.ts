import { useEffect, useRef } from 'react'

export function useFloatingLauncher(enabled = true) {
  const launcherRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!enabled) return
    const viewport = window.visualViewport
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const button = launcherRef.current
        if (!button) return
        button.style.setProperty('--launcher-right', Math.max(0, document.documentElement.clientWidth - ((viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth))) + 'px')
        button.style.setProperty('--launcher-bottom', Math.max(0, window.innerHeight - ((viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight))) + 'px')
      })
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    window.addEventListener('pageshow', update)
    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('pageshow', update)
    }
  }, [enabled])
  return launcherRef
}
