import { useCallback, useRef } from 'react'

export function useThrottle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        fn(...args)
        lastRun.current = now
      }
    }) as T,
    [fn, delay]
  )
} 