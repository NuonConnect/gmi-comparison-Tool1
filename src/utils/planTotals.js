// Premium totals for one plan: each category's members x premium, plus the
// Dubai PSP fund (AED 37 a member), Northern Emirates ICP charges (AED 24 a
// member), the policy fee and 5% VAT on all of it.
export const calculatePlanTotals = (plan) => {
  // Convert string values to numbers
  const catAPremium = parseFloat(plan.catAPremium) || 0;
  const catBPremium = parseFloat(plan.catBPremium) || 0;
  const catCPremium = parseFloat(plan.catCPremium) || 0;
  const catDPremium = parseFloat(plan.catDPremium) || 0;
  const policyFee = parseFloat(plan.policyFee) || 0;
  
  const catATotal = plan.catAMembers * catAPremium;
  const catBTotal = plan.catBMembers * catBPremium;
  const catCTotal = plan.catCMembers * catCPremium;
  const catDTotal = plan.catDMembers * catDPremium;
  
  const totalMembers = plan.catAMembers + plan.catBMembers + plan.catCMembers + plan.catDMembers;
  const totalPremium = catATotal + catBTotal + catCTotal + catDTotal;
  const pspFund = plan.dubaiMembers * 37;
  const icpCharges = plan.northernEmiratesMembers * 24;
  const vat = (totalPremium + pspFund + icpCharges + policyFee) * 0.05;
  const grandTotal = totalPremium + pspFund + icpCharges + policyFee + vat;

  return { 
    ...plan, 
    catAPremium, 
    catBPremium, 
    catCPremium, 
    catDPremium, 
    policyFee,
    totalMembers, 
    totalPremium, 
    pspFund, 
    icpCharges, 
    vat, 
    grandTotal 
  };
};
