import { useEffect } from 'react'

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
    cancelIdleCallback?: (handle: number) => void
  }

export const useIdleImagePreload = (src?: string | null) => {
  useEffect(() => {
    if (!src) {
      return
    }

    let cancelled = false
    const preloadImage = () => {
      if (cancelled) {
        return
      }

      const image = new Image()
      image.src = src
    }

    const idleWindow = window as IdleWindow
    if (idleWindow.requestIdleCallback) {
      const idleCallbackId = idleWindow.requestIdleCallback(preloadImage)
      return () => {
        cancelled = true
        idleWindow.cancelIdleCallback?.(idleCallbackId)
      }
    }

    const timeoutId = setTimeout(preloadImage, 0)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [src])
}
