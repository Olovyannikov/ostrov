import { useEffect, useState } from 'react';

/** Reproduces the "Обновлено N сек. назад" ticker present on every prototype screen. */
export function useUpdatedTimer(start = 5): string {
  const [secs, setSecs] = useState(start);
  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => (s > 60 ? 1 : s + 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return `Обновлено ${secs} сек. назад`;
}
