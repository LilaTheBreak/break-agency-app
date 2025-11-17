import { useEffect, useState } from "react";

export function useCountUp(target = 0, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const endValue = Number(target) || 0;

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(endValue * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
