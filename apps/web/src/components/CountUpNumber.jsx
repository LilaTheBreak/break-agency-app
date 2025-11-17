import React, { useMemo } from "react";
import { useCountUp } from "../hooks/useCountUp.js";

export function CountUpNumber({ value = 0, prefix = "", suffix = "", decimals = 0, duration = 1200 }) {
  const animatedValue = useCountUp(value, duration);
  const formatted = useMemo(() => {
    return animatedValue.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, [animatedValue, decimals]);

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
