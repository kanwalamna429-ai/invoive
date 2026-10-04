export function calculateRecommendedRates({
  desiredIncome,
  businessExpenses,
  taxRate,
  workingHours,
  billableHours,
  profitMargin,
}) {
  const values = [desiredIncome, businessExpenses, taxRate, workingHours, billableHours, profitMargin].map(Number);
  if (!values.every(Number.isFinite)) throw new RangeError("Enter valid numbers for every calculator field.");

  const [income, expenses, tax, projectHours, billable, margin] = values;
  if (income < 0 || expenses < 0 || projectHours <= 0 || billable <= 0 || tax < 0 || margin < 0) {
    throw new RangeError("Income, expenses, and percentages cannot be negative; both hour amounts must be greater than zero.");
  }

  const retainedShare = 1 - tax / 100 - margin / 100;
  if (retainedShare <= 0) throw new RangeError("Tax and profit margin must add up to less than 100%.");

  const requiredRevenue = (income + expenses) / retainedShare;
  const hourlyRate = roundCurrencyAmount(requiredRevenue / billable);
  return {
    hourlyRate,
    projectPrice: roundCurrencyAmount(hourlyRate * projectHours),
    requiredRevenue,
  };
}

function roundCurrencyAmount(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
