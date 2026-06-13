/**
 * Get the business date for an order (adjusted for 2am cutoff)
 * Orders from 00:00-01:59 are counted as previous day
 * Orders from 02:00-23:59 are counted as current day
 */
export const getBusinessDate = (date) => {
  const d = new Date(date);
  const businessDate = new Date(d);
  
  if (d.getHours() < 2) {
    // If before 2am, move to previous day
    businessDate.setDate(businessDate.getDate() - 1);
  }
  
  return businessDate.toLocaleDateString("en-CA");
};

/**
 * Format date in en-CA format (YYYY-MM-DD)
 */
export const formatDateCA = (date) => {
  return new Date(date).toLocaleDateString("en-CA");
};
