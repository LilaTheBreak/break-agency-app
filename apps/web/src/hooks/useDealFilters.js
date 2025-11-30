import { useState } from "react";

export function useDealFilters() {
  const [filters, setFilters] = useState({
    talentId: "",
    brandId: "",
    stage: "",
    status: ""
  });

  const update = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return { filters, update };
}
