export const normalizePaymentMethod = (value = "") => {
  return String(value ?? "").trim().toUpperCase();
};

export const getPaymentMethodType = (paymentMethod = "Cash") => {
  const value = normalizePaymentMethod(paymentMethod);

  if (value === "SWIGGY") return "Swiggy";
  if (value === "UPI" || value === "ONLINE" || value === "QR" || value === "CARD") return "UPI";

  return "Cash";
};

export const getPaymentMethodBadgeClasses = (paymentMethod = "Cash") => {
  const type = getPaymentMethodType(paymentMethod);

  if (type === "UPI") {
    return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  }

  if (type === "Swiggy") {
    return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
  }

  return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
};
