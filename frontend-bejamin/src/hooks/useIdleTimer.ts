import { useEffect, useRef } from 'react';

export function useIdleTimer(timeout: number, onIdle: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onIdle, timeout);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, reset));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => document.removeEventListener(e, reset));
    };
  }, [timeout, onIdle]);
}
