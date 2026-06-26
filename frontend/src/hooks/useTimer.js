import { useEffect, useState } from 'react';

/** Ticking counter that starts from an initial seconds value while `running`. */
export const useTimer = (initialSeconds = 0, running = false) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => setSeconds(initialSeconds), [initialSeconds]);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return seconds;
};

export default useTimer;
