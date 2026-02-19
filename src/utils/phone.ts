/**
 * Format phone number for display
 * Converts formats like "5511987654321" to "(11) 98765-4321" (without DDI by default)
 * Or with DDI: "+55 (11) 98765-4321"
 *
 * @param phone - Phone number string
 * @param showDDI - Whether to show the DDI (country code) - defaults to false
 * @returns Formatted phone number or original string if format is invalid
 */
export const formatPhone = (
  phone: string,
  showDDI: boolean = false,
): string => {
  if (!phone || phone.length < 12) return phone;

  const ddi = phone.slice(0, 2);
  const ddd = phone.slice(2, 4);
  const number = phone.slice(4);

  const formatNumber = () => {
    if (number.length === 9) {
      return `${number.slice(0, 5)}-${number.slice(5)}`;
    } else if (number.length === 8) {
      return `${number.slice(0, 4)}-${number.slice(4)}`;
    }
    return number;
  };

  const formattedNumber = formatNumber();

  if (showDDI) {
    return `+${ddi} (${ddd}) ${formattedNumber}`;
  }

  return `(${ddd}) ${formattedNumber}`;
};

/**
 * Get customer display label
 * Prioritizes name > phone > identifier > id
 *
 * @param customer - Customer object with name, phone, identifier, and id
 * @returns Display label for the customer
 */
export const getCustomerLabel = (customer: {
  name?: string;
  phone?: string;
  identifier?: string;
  id: string;
}): string => {
  if (customer.name) return customer.name;
  if (customer.phone) return formatPhone(customer.phone);
  return customer.identifier || customer.id;
};
