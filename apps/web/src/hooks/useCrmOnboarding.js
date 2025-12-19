import { useEffect, useState } from "react";
import { loadCrmOnboarding } from "../lib/crmOnboarding.js";

export function useCrmOnboarding(email) {
  const [data, setData] = useState(() => (email ? loadCrmOnboarding(email) : null));

  useEffect(() => {
    setData(email ? loadCrmOnboarding(email) : null);
  }, [email]);

  return data;
}
