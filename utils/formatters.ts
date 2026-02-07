
// To format currency or other numbers to two decimal places consistently.
export const formatNumber = (num: number | string | null | undefined): string => {
    const number = Number(num);
    if (isNaN(number) || !isFinite(number)) return '0.00';
    return number.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// To format quantities which can be decimals, showing decimals only when necessary.
export const formatQuantity = (num: number | string | null | undefined): string => {
    const number = Number(num);
    if (isNaN(number)) return '0';
    
    // First round to 3 decimal places to fix floating point noise (e.g., 1.79999999 -> 1.8)
    const rounded = Math.round((number + Number.EPSILON) * 1000) / 1000;
    
    // Show decimals only if they exist, up to 3 places.
    return rounded.toLocaleString('en-IN', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 3 
    });
};

/**
 * Returns a date in 'YYYY-MM-DD' format from a Date object or string, defaulting to the current local date.
 * This method is timezone-safe for UI inputs.
 * @param date Optional date object or string.
 * @returns The formatted date string.
 */
export const getLocalDateString = (date: Date | string = new Date()): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns the date range for the current month.
 */
export const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        start: getLocalDateString(firstDay),
        end: getLocalDateString(lastDay)
    };
};
