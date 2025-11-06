export const isEmail = (v = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const isNumber = (v = "") =>
  /^\d+(\.\d+)?$/.test(String(v).trim());

export const notEmpty = (v = "") =>
  String(v).trim().length > 0;

/** Simple UK postcode checker (permissive, case-insensitive) */
export const isUKPostcode = (v = "") =>
  /^([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(String(v).trim());
