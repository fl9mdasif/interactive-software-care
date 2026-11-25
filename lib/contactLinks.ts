/** wa.me needs the country code and digits only; local numbers are Bangladeshi. */
export const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  return `https://wa.me/${/^01\d{9}$/.test(digits) ? `88${digits}` : digits}`;
};
