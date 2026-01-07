import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// SECTION 1: CONSTANTS & DATA
// ============================================================================

const PROVIDER_OPTIONS = [
  'ABU DHABI NATIONAL INSURANCE COMPANY',
  'ABU DHABI NATIONAL TAKAFUL COMPANY PSC',
  'ADAMJEE INSURANCE COMPANY LTD.',
  'AL AIN AHLIA INSURANCE COMPANY (PSC)',
  'AL BUHAIRA NATIONAL INSURANCE COMPANY',
  'AL FUJAIRAH NATIONAL INSURANCE COMPANY',
  'AL ITTIHAD AL WATANI GENERAL INSURANCE COMPANY',
  'AL SAGR NATIONAL INSURANCE COMPANY',
  'AL WATHBA NATIONAL INSURANCE COMPANY',
  'ALLIANCE INSURANCE P.S.C',
  'AMERICAN HOME ASSURANCE COMPANY',
  'ARABIA INSURANCE COMPANY S.A.L.',
  'AXA INSURANCE (GULF) B.S.C.(C)',
  'CIGNA INSURANCE MIDDLE EAST S.A.L.',
  'DUBAI INSURANCE CO. PSC',
  'DUBAI NATIONAL INSURANCE & REINSURANCE',
  'EMIRATES INSURANCE CO. (PSC)',
  'INSURANCE HOUSE P.S.C',
  'ISLAMIC ARAB INSURANCE CO - SALAMA',
  'LIVA INSURANCE B.S.C (c)',
  'METHAQ TAKAFUL INSURANCE COMPANY',
  'METLIFE ALICO INSURANCE',
  'NATIONAL GENERAL INSURANCE CO',
  'NATIONAL HEALTH INSURANCE CO. - DAMAN',
  'NEW INDIA ASSURANCE CO LTD, ABU DHABI',
  'ORIENT INSURANCE PJSC',
  'ORIENT TAKAFUL PJSC',
  'QATAR GENERAL INSURANCE & REINSURANCE CO.S.A.Q',
  'QATAR INSURANCE COMPANY',
  'RAK INSURANCE',
  'SAUDI ARABIAN INSURANCE COMPANY B.S.C(c)',
  'SHARJAH INSURANCE COMPANY',
  'SUKOON INSURANCE PJSC',
  'SUKOON TAKAFUL P.J.S.C',
  'TAKAFUL EMARAT',
  'TAKAFUL EMARAT INSURANCE PSC',
  'THE MEDITERRANEAN AND GULF INS. AND REINSURANCE CO',
  'THE NEW INDIA ASSURANCE COMPANY',
  'TOKIO MARINE NICHIDO FIRE INSURANCE CO. LTD.',
  'UNION INSURANCE COMPANY',
  'FIDELITY UNITED INSURANCE COMPANY PSC',
  'WATANIA TAKAFUL GENERAL P.J.S.C',
  'YAS TAKAFUL PJSC',
   'Takaful Emarat - ECare',
  'Qatar Insurance - Al Madallah', 
  'Dubai Insurance - ECare',
  'Al Sagr - Al Madallah',
  'Dubai National Insurance - Al Madallah',
  'Medgulf Insurance',
  'Orient Insurance',
  'Dubai National Insurance - NextCare',
  'National General Insurance',
  'Liva Insurance BSC',
  'ASNIC - Al Madallah',
  'DNI - Al Madallah'
];

// Custom Companies Storage Key (fallback for localStorage)
const CUSTOM_COMPANIES_STORAGE_KEY = 'gmi_custom_companies';
const COMPARISONS_STORAGE_KEY = 'insuranceHistory';

// API endpoints for cloud storage
const API_BASE = '/api';

// Load custom companies from cloud (with localStorage fallback)
const loadCustomCompanies = async () => {
  try {
    const response = await fetch(`${API_BASE}/custom-companies`);
    if (response.ok) {
      const data = await response.json();
      // Also update localStorage as backup
      localStorage.setItem(CUSTOM_COMPANIES_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.log('Cloud fetch failed, using localStorage:', error);
  }
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(CUSTOM_COMPANIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom companies:', error);
    return [];
  }
};

// Sync version for initial render
const loadCustomCompaniesSync = () => {
  try {
    const stored = localStorage.getItem(CUSTOM_COMPANIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

// Save custom companies to cloud (with localStorage backup)
const saveCustomCompanies = async (companies) => {
  // Always save to localStorage first (instant)
  try {
    localStorage.setItem(CUSTOM_COMPANIES_STORAGE_KEY, JSON.stringify(companies));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  // Then save to cloud
  try {
    await fetch(`${API_BASE}/custom-companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companies)
    });
  } catch (error) {
    console.error('Error saving to cloud:', error);
  }
};

// Load comparisons from cloud (with localStorage fallback)
const loadComparisons = async () => {
  try {
    const response = await fetch(`${API_BASE}/comparisons`);
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(COMPARISONS_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.log('Cloud fetch failed, using localStorage:', error);
  }
  try {
    const stored = localStorage.getItem(COMPARISONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

// Save comparisons to cloud (with localStorage backup)
const saveComparisons = async (comparisons) => {
  try {
    localStorage.setItem(COMPARISONS_STORAGE_KEY, JSON.stringify(comparisons));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  try {
    await fetch(`${API_BASE}/comparisons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comparisons)
    });
  } catch (error) {
    console.error('Error saving to cloud:', error);
  }
};

// Default template fields for custom companies
const CUSTOM_COMPANY_DEFAULT_TEMPLATE = {
  planName: 'Custom Plan',
  annualLimit: 'AED 150,000',
  geographicalScope: 'UAE',
  network: 'Network Name',
  accessForOP: 'Clinics & Medical Centers',
  referralProcedure: 'GP referral to SP',
  ipCoinsurance: 'Covered with 20% Co-Pay',
  deductibleConsultation: 'Covered with 20% Co-Pay',
  opCoinsurance: 'Covered with 20% Co-Pay',
  pharmacyLimit: 'Covered up to AED 2,500',
  pharmacyCoinsurance: 'Covered with 30% Co-Pay',
  physiotherapySessions: '6 Sessions',
  maternity: 'As per Standard DHA',
  dentalDiscounts: 'Yes',
  opticalDiscount: 'Yes'
};

// SME Constants
const AREA_OF_COVER_OPTIONS = ['UAE', 'GCC', 'ISC', 'Arab countries', 'South East Asia', 'Indian Sub Continent','Worldwide','Worldwide(Excluding USA & CANADA)', 'Other','UAE only',
  'UAE, ISC and SEA at R&C of UAE',
  'UAE, GCC, ISC and SEA at R&C of UAE',
  'WW excl. US, Canada & Europe at R&C of UAE',
  'WW excl. US & Canada at R&C of UAE',
  'Worldwide at R&C of UAE',
  'UAE and SEA at Actuals',
  'UAE, GCC and SEA at Actuals',
  'WW excl. US & Canada at Actuals'];
const AGGREGATE_LIMIT_OPTIONS = ['AED 150,000', 'AED 200,000', 'AED 250,000', 'AED 300,000', 'AED 500,000', 'AED 1,000,000', 'AED 2,000,000','AED 3,000,000'];
const TPA_OPTIONS = ['Invoice', 'NAS', 'NEXTCARE', 'MEDNET', 'NEURON', 'ECARE', 'AL MADALLAH', 'DUBAICARE', 'FMC', 'INAYAH', 'HEALTHNET', 'AAFIYA', 'Other'];

// BASIC Plan Constants
const BASIC_TPA_OPTIONS = ['NEXTCARE', 'INHOUSE', 'ECARE', 'ALMADALLAH', 'HEALTHNET'];
const BASIC_AREA_OF_COVER_OPTIONS = [
  'UAE + Home country**Home country coverage is applicable upon 100% of UAE UCR*Only In Patient will be covered in Home countries (Out Patient treatment NOT covered)',
  'UAE+(Arab Countries and South East Asia+International(Home Country only, for Inpatient treatment))',
  'UAE + Home country**Only In Patient will be covered in Home countries (Out Patient treatment not covered)',
  'UAE (Excl AUH & Al Ain) + Home Country',
  'UAE + Home country (Only In Patient will be covered in Home countries - Out Patient treatment NOT covered)'
];
const BASIC_ANNUAL_LIMITS = ['AED 150,000'];

const TPA_NETWORK_MAPPING = {
  'NEXTCARE': ['GN+', 'GN', 'RN', 'RN2', 'RN3-HOSP', 'RN3- OP allowed at hospitals', 'RN3- OP restricted to clinics'],
  'NAS': ['CN', 'GN', 'GN(EX MEDICLINIC)', 'RN', 'SRN', 'WN- OP allowed at hospitals', 'WN- OP restricted to clinics'],
  'MEDNET': ['GOLD', 'Silver Premium', 'Silver Classic', 'Green', 'Silk Road', 'Emerald', 'Pearl'],
  'ECARE': ['Blue', 'Classic', 'Green'],
  'AL MADALLAH': ['GN+', 'GN', 'RN', 'RN2', 'RN3', 'RN4'],
  'DUBAICARE': ['N1', 'Exclusive N2', 'N2', 'N3', 'N4', 'N5'],
  'HEALTHNET': ['HN Exclusive', 'HN premium', 'HN advantage', 'HN standard Plus', 'HN standard', 'HN basic Plus', 'HN basic'],
  'AAFIYA': ['APN Network', 'Essential Network', 'Edge'],
  'NEURON': ['Comprehensive Network', 'General Network +', 'General Network', 'Restricted Network', 'Restricted Network 1'],
  'INAYAH': ['Silver', 'Sapphire', 'Platinum', 'Gold', 'EBP Chrome', 'Diamond', 'Chrome', 'Bronze', 'Premier', 'Chrome Lite'],
  'Invoice': ['Cat A- Gold Network', 'Cat B- Silver Network', 'Cat A-General Network', 'Cat B- Restricted Network', 'Other'],
  'Other': ['Cat A- Gold Network', 'Cat B- Silver Network', 'Cat A-General Network', 'Cat B- Restricted Network', 'Other']
};

// BASIC TPA Network Mapping
const BASIC_TPA_NETWORK_MAPPING = {
  'NEXTCARE': ['PCP+RN3', 'PCPC'],
  'INHOUSE': ['Vital','Vital Eco'],
  'ECARE': ['Blue'],
  'ALMADALLAH': ['RN4'],
  'HEALTHNET': [ 'Basic Network']
};

const ROOM_TYPE_OPTIONS = ['PRIVATE', 'SEMI PRIVATE', 'SHARED ROOM','WARD', 'Other'];
const COVERAGE_OPTIONS = [
  'Covered', 
  'Covered with 10% copay', 
  'Covered with 15% copay', 
  'Covered with 20% copay', 
  'Covered with 30% copay',
  'Not Covered', 
  'Other'
];

const CONSULTATION_DEDUCTIBLE_OPTIONS = ['No Deductible', '20% co-pay', '20% co-pay up to max AED 20/-', '20% co-pay up to max AED 25/-', '20% co-pay up to max AED 50/-', '10% co-pay', '10% co-pay up to max AED 25/-', '10% co-pay up to max AED 50/-', 'Other'];
const PREVENTIVE_SERVICES_OPTIONS = ['Covered as per DHA', 'Not Covered', 'Other'];
const PRESCRIBED_PHYSIOTHERAPY_NETWORK_OPTIONS = [
  'Covered  upto 6 session with Nil copay',
  'Covered  upto 6 session with 10%copay',
  'Covered  upto 6 session with 20%copay',
  'Covered  upto 8 session with Nil copay',
  'Covered  upto 8 session with 10%copay',
  'Covered  upto 8 session with 20%copay',
  'Covered  upto 10 session with Nil copay',
  'Covered  upto 10 session with 10%copay',
  'Covered  upto 10 session with 20%copay',    
  'Covered  upto 12 session with Nil copay',
  'Covered  upto 12 session with 10%copay',
  'Covered  upto 12 session with 20%copay',   
  'Covered  upto 15 session with Nil copay',
  'Covered  upto 15 session with 10%copay',
  'Covered  upto 15 session with 20%copay',  
  'Covered  upto 20 session with Nil copay',
  'Covered  upto 20 session with 10%copay',
  'Covered  upto 20 session with 20%copay',
  'Covered',
  'Not Covered',
  'Other'
];

const CATEGORY_OPTIONS = ['CAT A', 'CAT B', 'CAT C', 'CAT D'];
const BASIC_CATEGORY_OPTIONS = ['LSB', 'HSB'];

// BASIC Plan Default Values for AED 150,000
const BASIC_150K_DEFAULTS = {
  inpatientCopay: { 'LSB': '20% co-insurance payable by the insured with a cap of AED 500 payable per encounter, An annual aggregate cap of AED 1,000', 'HSB': '20% co-insurance payable by the insured with a cap of AED 500 payable per encounter, An annual aggregate cap of AED 1,000' },
  outpatientConsultation: { 'LSB': 'Covered with 20% Copay', 'HSB': 'Covered with 20% Copay' },
  outpatientCopay: { 'LSB': 'Covered with 20% copay', 'HSB': 'Covered with 20% copay' },
  pharmacyLimit: { 'LSB': 'Covered upto AED 2,500', 'HSB': 'Covered upto AED 2,500' },
  pharmacyCopay: { 'LSB': 'Covered with 30% copay', 'HSB': 'Covered with 30% copay' },
  prescribedPhysiotherapy: { 'LSB': 'Physiotherapy treatment services-Covered upto 6 sessions with 20% copay', 'HSB': 'Physiotherapy treatment services-Covered upto 6 sessions with 20% copay' }
};

// DHA ENHANCED TEMPLATES - Provider-TPA Mapping

// DHA ENHANCED TEMPLATES - Provider-TPA Mapping
const DHA_ENHANCED_PROVIDERS = {
  'Takaful Emarat - ECare': 'TAKAFUL EMARAT',
  'Qatar Insurance - Al Madallah': 'QATAR INSURANCE COMPANY',
  'Dubai Insurance - ECare': 'DUBAI INSURANCE CO. PSC',
  'Al Sagr - Al Madallah': 'AL SAGR NATIONAL INSURANCE COMPANY',
  'Dubai National Insurance - Al Madallah': 'DUBAI NATIONAL INSURANCE & REINSURANCE',
  'Medgulf Insurance': 'THE MEDITERRANEAN AND GULF INS. AND REINSURANCE CO',
  'Orient Insurance': 'ORIENT INSURANCE PJSC',
  'Dubai National Insurance - NextCare': 'DUBAI NATIONAL INSURANCE & REINSURANCE',
  'National General Insurance': 'NATIONAL GENERAL INSURANCE CO',
  'Liva Insurance BSC': 'LIVA INSURANCE B.S.C (c)'
};

// TAKAFUL EMARAT PLAN TEMPLATES
// TAKAFUL EMARAT PLAN TEMPLATES - UPDATED (removed returnAirFare and annualHealthCheckup)
const TAKAFUL_EMARAT_TEMPLATES = {
  'Basic EBP': {
    planName: 'Basic EBP',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: '20%-Max 500 per encounter & 1000 Annual Agg.',
    deductibleConsultation: '20%',
    opCoinsurance: '20%',
    pharmacyLimit: 'AED 1,500',
    pharmacyCoinsurance: '30%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    lsbPremium: 525,
    hsbPremium: 751
  },
  'Blue 2202': {
    planName: 'Blue 2202',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 751
  },
  'Blue 2203': {
    planName: 'Blue 2203',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 751
  },
  'Blue 2204': {
    planName: 'Blue 2204',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 780
  },
  'Blue 2205': {
    planName: 'Blue 2205',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Blue',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 850
  },
  'Blue 2206': {
    planName: 'Blue 2206',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Blue',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 920
  },
  'Green 2201': {
    planName: 'Green 2201',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Green',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 850
  },
  'Green 2202': {
    planName: 'Green 2202',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Green',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 900
  },
  'Green 2203': {
    planName: 'Green 2203',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Green',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 990
  },
  'Green 2204': {
    planName: 'Green 2204',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Green',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 1030
  },
  'Classic 2201': {
    planName: 'Classic 2201',
   
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Classic',
    accessForOP: 'Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 980
  },
  'Classic 2202': {
    planName: 'Classic 2202',
   
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 1110
  },
  'Classic 2203': {
    planName: 'Classic 2203',
   
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 1185
  },
  'Classic 2204': {
    planName: 'Classic 2204',
   
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 1260
  },
  'Classic 2205': {
    planName: 'Classic 2205',
    groupSize: '20 - 250',
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 10,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dentalDiscounts: 'Y',
    opticalDiscount: 'Y',
    premium: 1350
  }
};
// ASNIC PLAN TEMPLATES
const ASNIC_TEMPLATES = {
  'Basic EBP': {
    planName: 'Basic EBP',
  
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP at Clinics',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: '20%-Max 500 per encounter & 1000 Annual Agg.',
    deductibleConsultation: '20%',
    opCoinsurance: '20%',
    pharmacyLimit: 'AED 2,500',
    pharmacyCoinsurance: '30%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
  
    repatriation: 'Y',
    premium: 850
  },
  'Plan 1': {
    planName: 'Plan 1',
 
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP at Clinics',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 1025
  },
  'Plan 2': {
    planName: 'Plan 2',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP at Clinics',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 1070
  },
  'Plan 3': {
    planName: 'Plan 3',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP at Clinics',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 1100
  },
  'Plan 4': {
    planName: 'Plan 4',

    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
 
    repatriation: 'Y',
    premium: 1193
  },
  'Plan 5': {
    planName: 'Plan 5',

    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

   
    repatriation: 'Y',
    premium: 1268
  },
  'Plan 6': {
    planName: 'Plan 6',
  
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP at Clinics',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

  
    repatriation: 'Y',
    premium: 1193
  },
  'Plan 7': {
    planName: 'Plan 7',

    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP at Clinics',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  

    repatriation: 'Y',
    premium: 1256
  },
  'Plan 8': {
    planName: 'Plan 8',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1355
  },
  'Plan 9': {
    planName: 'Plan 9',
 
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 1393
  },
  'Plan 10': {
    planName: 'Plan 10',

    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP at Clinics',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1349
  },
  'Plan 11': {
    planName: 'Plan 11',

    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
 
    repatriation: 'Y',
    premium: 1516
  },
  'Plan 12': {
    planName: 'Plan 12',
  
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1605
  },
  'Plan 13': {
    planName: 'Plan 13',

    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1679
  },
  'Plan 14': {
    planName: 'Plan 14',

    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE',
    network: 'RN4',
    accessForOP: 'OP allowed at HOSPITALS (OP@Hospital-20%)',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 10,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1785
  }
};
// DNI PLAN TEMPLATES
const DNI_TEMPLATES = {
  'Basic EBP': {
    planName: 'Basic EBP',
  
    annualLimit: 'AED 150,000',
    geographicalScope: 'Within the Emirate of Dubai',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: '20%-Max 500 per encounter & 1000 Annual Agg.',
    deductibleConsultation: '20%',
    opCoinsurance: '20%',
    pharmacyLimit: 'AED 2,500',
    pharmacyCoinsurance: '30%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    lsbPremium: 660,
    hsbPremium: 887
  },
  'Plan 1': {
    planName: 'Plan 1',
  
    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 1155
  },
  'Plan 2': {
    planName: 'Plan 2',

    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 1112
  },
  'Plan 3': {
    planName: 'Plan 3',

    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1191
  },
  'Plan 4': {
    planName: 'Plan 4',

    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1306
  },
  'Plan 5': {
    planName: 'Plan 5',

    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1399
  },
  'Plan 6': {
    planName: 'Plan 6',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1561
  },
  'Plan 7': {
    planName: 'Plan 7',

    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1757
  },
  'Plan 8': {
    planName: 'Plan 8',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 2167
  },
  'Plan 9': {
    planName: 'Plan 9',

    annualLimit: 'AED 150,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 2572
  },
  'Plan 10': {
    planName: 'Plan 10',

    annualLimit: 'AED 200,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 1653
  },
  'Plan 11': {
    planName: 'Plan 11',
 
    annualLimit: 'AED 200,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 2008
  },
  'Plan 12': {
    planName: 'Plan 12',

    annualLimit: 'AED 200,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 2352
  },
  'Plan 13': {
    planName: 'Plan 13',
  
    annualLimit: 'AED 200,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    repatriation: 'Y',
    premium: 2744
  },
  'Plan 14': {
    planName: 'Plan 14',
   
    annualLimit: 'AED 200,000',
    geographicalScope: 'Within UAE Only. Emergency extension to Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 10,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',

    repatriation: 'Y',
    premium: 3050
  }
};
// QIC PLAN TEMPLATES
const QIC_TEMPLATES = {
  'Basic EBP': {
    planName: 'Basic EBP',
    annualLimit: 'AED 150,000',
    geographicalScope: 'Within the Emirate of Dubai',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: '20%-Max 500 per encounter & 1000 Annual Agg.',
    deductibleConsultation: '20%',
    opCoinsurance: '20%',
    pharmacyLimit: 'AED 2,500',
    pharmacyCoinsurance: '30%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 750.50 // (658 + 843) / 2
  },
  'Plan 1': {
    planName: 'Plan 1',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1055
  },
  'Plan 2': {
    planName: 'Plan 2',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1096
  },
  'Plan 3': {
    planName: 'Plan 3',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1124
  },
  'Plan 4': {
    planName: 'Plan 4',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1210
  },
  'Plan 5': {
    planName: 'Plan 5',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1278
  },
  'Plan 6': {
    planName: 'Plan 6',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1210
  },
  'Plan 7': {
    planName: 'Plan 7',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1267
  },
  'Plan 8': {
    planName: 'Plan 8',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1358
  },
  'Plan 9': {
    planName: 'Plan 9',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1393
  },
  'Plan 10': {
    planName: 'Plan 10',
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1353
  },
  'Plan 11': {
    planName: 'Plan 11',
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1507
  },
  'Plan 12': {
    planName: 'Plan 12',
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1587
  },
  'Plan 13': {
    planName: 'Plan 13',
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1656
  },
  'Plan 14': {
    planName: 'Plan 14',
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE + Home Country (IP Only)',
    network: 'RN4',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 10,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
    repatriation: 'Y',
    premium: 1753
  }
};
// DUBAI INSURANCE - ECARE PLAN TEMPLATES 2025
// DUBAI INSURANCE - ECARE PLAN TEMPLATES 2025
const DUBAI_INSURANCE_TEMPLATES = {
  'Basic EBP': {
    planName: 'Basic EBP',

    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE ONLY',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: '20% Max AED 500 / AED 1,000',
    deductibleConsultation: '20%',
    opCoinsurance: '20%',
    pharmacyLimit: 'AED 2,500',
    pharmacyCoinsurance: '30%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 500 with 30% Copay',
    psychiatry: 'AED 800 with 30% Copay',
  
    opticalDiscount: 'Yes',

    repatriation: 'AED 5,000',
    lsbPremium: 626,
    hsbPremium: 850
  },
  'Blue 2401': {
    planName: 'Blue 2401',
 
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 3,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',

    opticalDiscount: 'Yes',

    repatriation: 'AED 7,000',
    premium: 865
  },
  'Blue 2402': {
    planName: 'Blue 2402',
 
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
  
    opticalDiscount: 'Yes',
    returnAirFare: 'Yes',
    healthCheckup: 'Yes @ AED 150',
    repatriation: 'AED 7,000',
    premium: 950
  },
  'Blue 2403': {
    planName: 'Blue 2403',

    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
   
    opticalDiscount: 'Yes',

    repatriation: 'AED 7,000',
    premium: 901
  },
  'Blue 2404': {
    planName: 'Blue 2404',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
  
    
    opticalDiscount: 'Yes',

    repatriation: 'AED 7,000',
    premium: 970
  },
  'Blue 2405': {
    planName: 'Blue 2405',

    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Blue',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',

    opticalDiscount: 'Yes',

    repatriation: 'AED 7,000',
    premium: 1010
  },
  'Blue 2406': {
    planName: 'Blue 2406',

    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Blue',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '6',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',

    opticalDiscount: 'Yes',

    repatriation: 'AED 7,000',
    premium: 1100
  },
  'Green 2401': {
    planName: 'Green 2401',
    
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Green',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
 
    opticalDiscount: 'Yes',

    repatriation: 'AED 7,000',
    premium: 1050
  },
  'Green 2402': {
    planName: 'Green 2402',
  
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Green',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
    
    opticalDiscount: 'Yes',
   
    repatriation: 'AED 7,000',
    premium: 1125
  },
  'Green 2403': {
    planName: 'Green 2403',
  
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Green',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
 
    opticalDiscount: 'Yes',
  
    repatriation: 'AED 7,000',
    premium: 1195
  },
  'Green 2404': {
    planName: 'Green 2404',
   
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Green',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '8',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
    
    opticalDiscount: 'Yes',
    
    repatriation: 'AED 7,000',
    premium: 1325
  },
  'Classic 2401': {
    planName: 'Classic 2401',
   
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Classic',
    accessForOP: 'Clinics & Medical Centers',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
    
    opticalDiscount: 'Yes',
 
    repatriation: 'AED 7,000',
    premium: 1190
  },
  'Classic 2402': {
    planName: 'Classic 2402',
   
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: '10%',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: '10%',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
 
    opticalDiscount: 'Yes',
 
    repatriation: 'AED 7,000',
    premium: 1450
  },
  'Classic 2403': {
    planName: 'Classic 2403',

    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 5,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
    
    opticalDiscount: 'Yes',
    
    repatriation: 'AED 7,000',
    premium: 1490
  },
  'Classic 2404': {
    planName: 'Classic 2404',
    
    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 7,500',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
  
    opticalDiscount: 'Yes',
  
    repatriation: 'AED 7,000',
    premium: 1580
  },
  'Classic 2405': {
    planName: 'Classic 2405',

    annualLimit: 'AED 200,000',
    geographicalScope: 'UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore) Covered for IP subject to UAE R&C selected Network rates and with prior-approval.',
    network: 'E Care Classic - H',
    accessForOP: 'Clinics & Medical Centers + Network hospitals with 20% copay on all OP services',
    referralProcedure: 'Direct SP access',
    ipCoinsurance: 'NIL',
    deductibleConsultation: '20% Max AED 25',
    opCoinsurance: 'NIL',
    pharmacyLimit: 'AED 10,000',
    pharmacyCoinsurance: 'NIL',
    physiotherapySessions: '10',
    maternity: 'As per Std. DHA',
    dental: 'AED 600 with 30% Copay',
    psychiatry: 'AED 900 with 30% Copay',
   
    opticalDiscount: 'Yes',
   
    repatriation: 'AED 7,000',
    premium: 1680
  }
};

// SIMPLIFIED SINGLE TEMPLATE FOR MANUAL ENTRY PROVIDERS
const SIMPLIFIED_TEMPLATE = {
  'Basic EBP': {
    planName: 'Basic EBP',
    annualLimit: 'AED 150,000',
    geographicalScope: 'UAE (Excluding the Emirate of Abu Dhabi & Al Ain Region). Emergency extension to UAE; Home country (IP only at ISC + SEA excluding China, Japan, HK, Taiwan, Thailand, Singapore)',
    network: 'E Care Blue',
    accessForOP: 'Only Clinics & Medical Centers',
    referralProcedure: 'GP referral to SP',
    ipCoinsurance: 'Covered with 20% Co-Pay - Max 500 per encounter & 1000 Annual Agg.',
    deductibleConsultation: 'Covered with 20% Co-Pay',
    opCoinsurance: 'Covered with 20% Co-Pay',
    pharmacyLimit: 'Covered up to AED 1,500',
    pharmacyCoinsurance: 'Covered with 30% Co-Pay',
    physiotherapySessions: '6 Sessions',
    maternity: 'As per Standard DHA',
    dentalDiscounts: 'Yes',
    opticalDiscount: 'Yes'
  }
};

// ============================================================================
// SECTION 2: UTILITY FUNCTIONS
// ============================================================================

// Format field values for better display
const formatFieldValue = (value) => {
  if (!value || typeof value !== 'string') return value;
  
  let formatted = value;
  
  // Replace "Y" with "Yes"
  if (formatted === 'Y' || formatted === 'y') {
    return 'Yes';
  }
  
  // Replace "As per Std. DHA" with "As per Standard DHA"
  formatted = formatted.replace(/As per Std\. DHA/gi, 'As per Standard DHA');
  
  // Replace standalone percentages like "20%" with "Covered with 20% Co-Pay"
  if (/^(\d+)%$/.test(formatted.trim())) {
    return `Covered with ${formatted.trim()} Co-Pay`;
  }
  
  // Replace "20% Max AED X" patterns
  formatted = formatted.replace(/^(\d+)% Max AED (\d+)/i, 'Covered with $1% Co-Pay (Max AED $2)');
  
  // Replace "NIL" with "Covered with NIL Co-Pay"
  if (formatted === 'NIL' || formatted === 'Nil' || formatted.toLowerCase() === 'nil co-pay') {
    return 'Covered with NIL Co-Pay';
  }
  
  // Replace standalone AED amounts like "AED 1,500" with "Covered up to AED 1,500"
  if (/^AED\s*[\d,]+$/i.test(formatted.trim())) {
    return `Covered up to ${formatted.trim()}`;
  }
  
  return formatted;
};

const calculatePlanTotals = (plan) => {
  const catATotal = plan.catAMembers * plan.catAPremium;
  const catBTotal = plan.catBMembers * plan.catBPremium;
  const catCTotal = plan.catCMembers * plan.catCPremium;
  const catDTotal = plan.catDMembers * plan.catDPremium;
  
  const totalMembers = plan.catAMembers + plan.catBMembers + plan.catCMembers + plan.catDMembers;
  const totalPremium = catATotal + catBTotal + catCTotal + catDTotal;
  const pspFund = plan.dubaiMembers * 37;
  const icpCharges = plan.northernEmiratesMembers * 24;
  const vat = (totalPremium + pspFund + icpCharges + plan.policyFee) * 0.05;
  const grandTotal = totalPremium + pspFund + icpCharges + plan.policyFee + vat;

  return { ...plan, totalMembers, totalPremium, pspFund, icpCharges, vat, grandTotal };
};

const generateReferenceNumber = () => {
  const timestamp = Date.now();
  const last4 = timestamp.toString().slice(-4);
  const random2 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `GMI${last4}${random2}`;
};

function downloadHTMLFile(htmlContent, fileName) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const formatCategoryData = (categoriesData) => {
  if (!categoriesData || typeof categoriesData !== 'object') return 'Not specified';
  
  const allCategories = Object.keys(categoriesData);
  if (allCategories.length === 0) return 'Not specified';

  // Clean up category names - remove "Other" suffix and merge values
  const cleanedData = {};
  allCategories.forEach(cat => {
    const value = categoriesData[cat];
    if (value && value.trim() !== '') {
      // Remove "Other" suffix from category name (e.g., "CAT AOther" -> "CAT A")
      const cleanCatName = cat.replace(/Other$/, '');
      // Apply formatFieldValue to clean up values
      const formattedValue = formatFieldValue(value);
      // If we already have a value for this category from the dropdown, prefer the "Other" (textarea) value
      // as it's more specific
      if (!cleanedData[cleanCatName] || cat.endsWith('Other')) {
        cleanedData[cleanCatName] = formattedValue;
      }
    }
  });

  const cleanedCategories = Object.keys(cleanedData);
  if (cleanedCategories.length === 0) return 'Not specified';

  const firstValue = cleanedData[cleanedCategories[0]];
  const allSame = cleanedCategories.every(cat => cleanedData[cat] === firstValue);
  
  if (allSame) {
    return firstValue;
  } else {
    return cleanedCategories.map(cat => `${cat}: ${cleanedData[cat]}`).join('\n');
  }
};

function generateHTMLContent(plans, companyInfo, advisorComment, referenceNumber, highlightedPlanId = null, highlightedItems = {}, customFields = [], showFirstPage = true) {
  const today = new Date().toLocaleDateString('en-GB');
  const hasComment = advisorComment && advisorComment.trim() !== '';

  const isBenefitHighlighted = (planId, benefitKey) => {
    return highlightedItems[planId] && highlightedItems[planId][benefitKey];
  };

  // Smart field detection
  const hasSMEPlan = plans.some(plan => plan.planType === 'SME');
  const hasBasicPlan = plans.some(plan => plan.planType === 'BASIC');
  const hasEnhancedPlan = plans.some(plan => plan.planType === 'ENHANCED_BASIC');

  // Premium labels based on plan type
  const getPremiumLabelA = () => {
    if (hasEnhancedPlan) return 'CAT A';
    if (hasBasicPlan) return 'LSB';
    return 'Category A';
  };

  const getPremiumLabelB = () => {
    if (hasEnhancedPlan) return 'CAT B';
    if (hasBasicPlan) return 'HSB';
    return 'Category B';
  };

  // Helper to get field value or '-' for non-applicable plans
  const getFieldValue = (plan, fieldKey) => {
    if (plan.categoriesData?.[fieldKey]) {
      return formatCategoryData(plan.categoriesData[fieldKey]);
    }
    return '-';
  };

  // Helper to generate table row with merged cells if all values are the same
  const generateMergedRow = (fieldName, fieldKey, plans, highlightedPlanId) => {
    const values = plans.map(plan => getFieldValue(plan, fieldKey));
    const nonDashValues = values.filter(v => v !== '-');
    
    // If no values exist, don't show the row
    if (nonDashValues.length === 0) return '';
    
    // Check if all non-dash values are the same
    const allSame = nonDashValues.length > 0 && nonDashValues.every(v => v === nonDashValues[0]);
    
    if (allSame && plans.length > 1 && nonDashValues.length === plans.length) {
      // All plans have the same value - merge cells
      return `
        <tr>
          <td class="benefit-name">${fieldName}</td>
          <td colspan="${plans.length}" style="text-align: center; white-space: pre-line; background: #f0fdf4;">${nonDashValues[0]}</td>
        </tr>
      `;
    } else {
      // Different values - show separately
      return `
        <tr>
          <td class="benefit-name">${fieldName}</td>
          ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, fieldKey)}</td>`).join('')}
        </tr>
      `;
    }
  };

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>NSIB Group Medical Insurance Comparison</title>
    <style>
       * { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; }
@page { size: A4 landscape; margin: 0; }
@media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .page1 { page-break-after: always !important; page-break-inside: avoid !important; }
    .page2 { page-break-before: always !important; page-break-after: always !important; }
    .page3 { page-break-before: always !important; page-break-inside: avoid !important; }
}
.page1 { width: 297mm; height: 210mm; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; page-break-after: always; }
.page1 img { width: 100%; height: auto; max-height: 100%; object-fit: contain; }
.page2 { width: 297mm; min-height: 210mm; padding: 5mm 8mm; page-break-before: always; position: relative; }
.page3 { width: 297mm; height: 210mm; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; page-break-before: always; background: #fff; }
.page3 img { width: 100%; height: auto; max-height: 100%; object-fit: contain; }
.header-simple { text-align: center; margin-bottom: 4mm; position: relative; height: 15mm; }
.header-logo { height: 15mm; }
.header-corner { position: absolute; right: 0; top: 0; height: 18mm; }
.reference-number { position: absolute; top: 0; left: 0; font-size: 9px; color: #666; font-weight: bold; }
.section-title { font-size: 18px; font-weight: bold; text-align: center; margin: 3mm 0; color: #1e40af; }
.company-info { background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 3mm; margin-bottom: 3mm; border-radius: 2mm; border: 1px solid #93c5fd; }
.company-info h2 { font-size: 14px; color: #1e40af; margin-bottom: 1mm; text-align: center; }
.company-info h3 { font-size: 12px; color: #4338ca; margin-bottom: 1mm; text-align: center; }
table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 2mm; table-layout: fixed; }
th { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; padding: 2mm; text-align: left; border: 2px solid #4338ca; font-weight: bold; font-size: 9px; }
td { background: #fff; padding: 2mm; border: 2px solid #6366f1; font-size: 9px; vertical-align: top; text-align: center; }
tr:not(.section-header) td:first-child {
    font-weight: bold !important;
    background: #e0e7ff;
    text-align: left !important;
    padding-left: 3mm;
    width: 200px;
    min-width: 200px;
}
.benefit-name { 
    font-weight: bold !important; 
    color: #374151; 
    background: #e0e7ff; 
    padding: 1.5mm 2mm 1.5mm 3mm; 
    white-space: nowrap; 
    min-width: 55mm; 
    font-size: 9px;
    text-align: left;
}
.benefit-cell { background: #fff; padding: 1.5mm; word-wrap: break-word; text-align: center; }
.benefit-cell.highlighted { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; font-weight: bold; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3); }
.benefit-cell.recommended { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; font-weight: bold; }
.benefit-cell.renewal { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; font-weight: bold; }
.benefit-cell.highlighted-benefit { background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%) !important; border: 2px solid #ffc107 !important; font-weight: bold !important; box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3) !important; }
.badge { display: inline-block; padding: 1mm 2mm; border-radius: 1mm; font-size: 8px; font-weight: bold; margin-left: 2mm; color: #fff; }
.recommended-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.renewal-badge { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.highlighted-badge { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.premium-summary { background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); padding: 2mm; border-radius: 1mm; border: 1px solid #93c5fd; margin-top: 1mm; }
.premium-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; font-size: 8px; }
.premium-row.grand-total { border-top: 1px solid #4338ca; padding-top: 1mm; margin-top: 1mm; font-weight: bold; font-size: 9px; color: #1e40af; }
.advisor-comment { background: linear-gradient(135deg, #fff7ed 0%, #d6d2e7ff 100%); padding: 3mm; border-radius: 2mm; border: 1px solid #708dccff; margin-top: 3mm; }
.advisor-comment strong { color: #9a3412; font-size: 10px; display: block; margin-bottom: 1mm; }
.footer { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #fff; padding: 2mm; text-align: center; font-size: 8px; margin-top: 2mm; border-radius: 1mm; }
.disclaimer { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 2mm; padding: 3mm; margin: 3mm 0; }
.disclaimer h3 { font-size: 12px; color: #92400e; margin-bottom: 2mm; font-weight: bold; }
.disclaimer p { font-size: 9px; color: #000; line-height: 1.4; margin-bottom: 1mm; }
.price-highlight { font-weight: bold; font-size: 10px; color: #059669; }
.section-header { 
    background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
    color:  #1e40af; 
    font-weight: bold; 
    padding: 2.5mm; 
    text-align: left;
    border: 2px solid #1e40af;
    padding-left: 3mm;
}
.section-header td {
    text-align: left !important;
    padding: 2.5mm !important;
    padding-left: 3mm !important;
    background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%) !important;
    width: auto !important;
    min-width: auto !important;
    font-weight: bold !important;
    color: #1e40af; !important;
    font-size: 10px !important;
}
.footer-contact { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%) !important; padding: 3mm 8mm; margin: 3mm -8mm 0 -8mm; display: flex; justify-content: space-between; color: #fff !important; font-size: 8px; line-height: 1.5; }
.footer-left, .footer-right { flex: 1; color: #fff !important; }
.footer-right { text-align: right; }
.footer-contact strong { display: block; margin-bottom: 1mm; color: #fff !important; font-size: 9px; }
.tag { display: inline-block; padding: 1mm 2mm; border-radius: 1mm; font-size: 8px; font-weight: bold; margin-left: 2mm; color: #fff; }
.tag-recommended { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.tag-renewal { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.tag-highlighted { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.plan-header { text-align: center; vertical-align: top; }
.details-text { font-size: 8px; color: #666; margin-top: 1mm; font-style: italic; }
.category-info { background: #f8fafc; padding: 1mm 2mm; border-radius: 1mm; margin: 1mm 0; font-size: 8px; border-left: 3px solid #4f46e5; }
    </style>
</head>
<body>
   ${showFirstPage ? `
    <div class="page1">
        <img src="https://i.imgur.com/Qr8D3ML.png" alt="Cover Page">
    </div>
    ` : ''}

    <div class="page2">
        <div class="reference-number">Reference: ${referenceNumber}</div>
        <div class="header-simple">
            <img src="https://i.imgur.com/GCOPBN1.png" alt="NSIB Logo" class="header-logo">
            <img src="https://i.imgur.com/Wsv3Ah2.png" alt="Corner" class="header-corner">
        </div>
        
        <div class="section-title">GROUP MEDICAL INSURANCE - LIVE COMPARISON</div>
        
        <div class="company-info">
            <h2>COMPANY: ${companyInfo.companyName}</h2>
            <h3>DATE: ${today}</h3>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 200px; min-width: 200px;">BENEFITS</th>
                    ${plans.map(plan => `
                        <th class="plan-header">
                            ${plan.providerName.substring(0, 30)}
                            ${plan.isRenewal ? '<div class="tag tag-renewal">RENEWAL</div>' : ''}
                            ${plan.isRecommended ? '<div class="tag tag-recommended">RECOMMENDED</div>' : ''}
                            ${plan.id === highlightedPlanId ? '<div class="tag tag-highlighted">HIGHLIGHTED</div>' : ''}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                <tr class="section-header">
                    <td colspan="${plans.length + 1}">COMPANY INFORMATION</td>
                </tr>
                <tr>
                    <td class="benefit-name">TPA</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${companyInfo.tpa === 'Other' && companyInfo.tpaManual ? companyInfo.tpaManual : companyInfo.tpa}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">Network</td>
                    ${plans.map(plan => {
                      const networkData = plan.categoriesData?.network || {};
                      const displayText = formatCategoryData(networkData);
                      return `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${displayText}</td>`;
                    }).join('')}
                </tr>
                ${!hasBasicPlan && !hasEnhancedPlan ? `
                <tr>
                    <td class="benefit-name">Categories</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${plan.selectedCategories?.join(', ') || 'Not specified'}</td>`).join('')}
                </tr>
                ` : ''}
                <tr>
                    <td class="benefit-name">Area of Cover</td>
                    ${plans.map(plan => {
                      const areaData = plan.categoriesData?.areaOfCover || plan.categoriesData?.geographicalScope || {};
                      const displayText = formatCategoryData(areaData);
                      return `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${displayText}</td>`;
                    }).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">Aggregate Limit</td>
                    ${plans.map(plan => {
                      const limitData = plan.categoriesData?.aggregateLimit || plan.categoriesData?.annualLimit || {};
                      const displayText = formatCategoryData(limitData);
                      return `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${displayText}</td>`;
                    }).join('')}
                </tr>

                <!-- DHA ENHANCED TEMPLATE FIELDS - Show only if DHA plans exist -->
<!-- DHA ENHANCED TEMPLATE FIELDS - Show only if DHA plans exist -->
${hasEnhancedPlan ? `
<tr class="section-header">
    <td colspan="${plans.length + 1}">DHA ENHANCED PLAN DETAILS</td>
</tr>
${plans.some(plan => plan.categoriesData?.planName) ? generateMergedRow('Product Name', 'planName', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.accessForOP) ? generateMergedRow('Access for OP', 'accessForOP', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.referralProcedure) ? generateMergedRow('Referral Procedure', 'referralProcedure', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.ipCoinsurance) ? generateMergedRow('IP Co-insurance', 'ipCoinsurance', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.deductibleConsultation) ? generateMergedRow('Deductible (Consultation)', 'deductibleConsultation', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.opCoinsurance) ? generateMergedRow('OP Co-insurance', 'opCoinsurance', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.pharmacyLimit) ? generateMergedRow('Pharmacy Limit', 'pharmacyLimit', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.pharmacyCoinsurance) ? generateMergedRow('Pharmacy Co-insurance', 'pharmacyCoinsurance', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.prescribedPhysiotherapy) ? generateMergedRow('Physiotherapy Sessions', 'prescribedPhysiotherapy', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.maternity) ? generateMergedRow('Maternity', 'maternity', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.dentalDiscounts) ? generateMergedRow('Dental Discounts', 'dentalDiscounts', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.opticalDiscount) ? generateMergedRow('Optical Discount', 'opticalDiscount', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.kidneyDialysis) ? generateMergedRow('Kidney Dialysis', 'kidneyDialysis', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.organTransplant) ? generateMergedRow('Organ Transplant', 'organTransplant', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.optical) ? generateMergedRow('Optical Benefits', 'optical', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.returnAirFare) ? generateMergedRow('Return Air Fare', 'returnAirFare', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.annualHealthCheckup) ? generateMergedRow('Annual Health Checkup', 'annualHealthCheckup', plans, highlightedPlanId) : ''}
${plans.some(plan => plan.categoriesData?.repatriation) ? generateMergedRow('Repatriation', 'repatriation', plans, highlightedPlanId) : ''}
` : ''}

                <!-- SME BENEFIT FIELDS - Show only if SME plans exist -->
                ${hasSMEPlan ? `
                <tr class="section-header">
                    <td colspan="${plans.length + 1}">INPATIENT BENEFITS</td>
                </tr>
                ${plans.some(plan => plan.categoriesData?.roomType) ? `
                <tr>
                    <td class="benefit-name">Room Type</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'roomType')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.inpatientCopay) ? `
                <tr>
                    <td class="benefit-name">Inpatient Copay</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'inpatientCopay')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.diagnosticTests) ? `
                <tr>
                    <td class="benefit-name">Diagnostic Tests & Procedures</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'diagnosticTests')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.drugsMedicines) ? `
                <tr>
                    <td class="benefit-name">Drugs and Medicines</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'drugsMedicines')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.consultantFees) ? `
                <tr>
                    <td class="benefit-name">Consultant's, Surgeon's and Anesthetist's Fees</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'consultantFees')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.inpatientOutNetwork) ? `
                <tr>
                    <td class="benefit-name">Inpatient Benefits - Out-of-Network</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'inpatientOutNetwork')}</td>`).join('')}
                </tr>
                ` : ''}

                <tr class="section-header">
                    <td colspan="${plans.length + 1}">OUTPATIENT BENEFITS</td>
                </tr>
                ${plans.some(plan => plan.categoriesData?.outpatientConsultation) ? `
                <tr>
                    <td class="benefit-name">Outpatient Consultation</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'outpatientConsultation')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.outpatientCopay) ? `
                <tr>
                    <td class="benefit-name">Outpatient Copay</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'outpatientCopay')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.diagnosticLabs) ? `
                <tr>
                    <td class="benefit-name">Diagnostic Tests and Labs</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'diagnosticLabs')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.prescribedPhysiotherapy) ? `
                <tr>
                    <td class="benefit-name">Prescribed Physiotherapy</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'prescribedPhysiotherapy')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.outpatientOutNetwork) ? `
                <tr>
                    <td class="benefit-name">Outpatient Benefits - Out-of-Network</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'outpatientOutNetwork')}</td>`).join('')}
                </tr>
                ` : ''}

                <tr class="section-header">
                    <td colspan="${plans.length + 1}">OTHER BENEFITS</td>
                </tr>
                ${plans.some(plan => plan.categoriesData?.maternity) ? `
                <tr>
                    <td class="benefit-name">Maternity</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'maternity')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.routineDental) ? `
                <tr>
                    <td class="benefit-name">Dental Benefits</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'routineDental')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.routineOptical) ? `
                <tr>
                    <td class="benefit-name">Optical Benefits</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'routineOptical')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.preventiveServices) ? `
                <tr>
                    <td class="benefit-name">Preventive Services</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'preventiveServices')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.repatriation) ? `
                <tr>
                    <td class="benefit-name">Repatriation</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'repatriation')}</td>`).join('')}
                </tr>
                ` : ''}
                ` : ''}

                <!-- BASIC PLAN FIELDS - Show only if Basic plans exist -->
                ${hasBasicPlan ? `
                <tr class="section-header">
                    <td colspan="${plans.length + 1}">BASIC PLAN BENEFITS</td>
                </tr>
                ${plans.some(plan => plan.categoriesData?.inpatientCopay) ? `
                <tr>
                    <td class="benefit-name">Inpatient Copay</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'inpatientCopay')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.outpatientConsultation) ? `
                <tr>
                    <td class="benefit-name">Outpatient Consultation</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'outpatientConsultation')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.outpatientCopay) ? `
                <tr>
                    <td class="benefit-name">Outpatient Copay</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'outpatientCopay')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.pharmacyLimit) ? `
                <tr>
                    <td class="benefit-name">Pharmacy Limit</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'pharmacyLimit')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.pharmacyCopay) ? `
                <tr>
                    <td class="benefit-name">Pharmacy Copay</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'pharmacyCopay')}</td>`).join('')}
                </tr>
                ` : ''}
                ${plans.some(plan => plan.categoriesData?.prescribedPhysiotherapy) ? `
                <tr>
                    <td class="benefit-name">Physiotherapy</td>
                    ${plans.map(plan => `<td style="text-align: center; white-space: pre-line;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${getFieldValue(plan, 'prescribedPhysiotherapy')}</td>`).join('')}
                </tr>
                ` : ''}
                ` : ''}

                <!-- CUSTOM FIELDS -->
                ${customFields.map(field => `
                <tr>
                    <td class="benefit-name">${field.label}</td>
                    ${plans.map(plan => {
                      const fieldData = plan.categoriesData?.[field.key] || {};
                      const displayText = formatCategoryData(fieldData);
                      return `
                        <td style="text-align: center; font-size: 8px; white-space: pre-line;">
                            ${displayText || '-'}
                        </td>
                    `;
                    }).join('')}
                </tr>
                `).join('')}
                
                <tr class="section-header">
                    <td colspan="${plans.length + 1}">PREMIUM DETAILS</td>
                </tr>
                <tr>
                    <td class="benefit-name">${getPremiumLabelA()} Members</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${plan.catAMembers}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">${getPremiumLabelB()} Members</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${plan.catBMembers}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">${getPremiumLabelA()} Premium</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.catAPremium.toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">${getPremiumLabelB()} Premium</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.catBPremium.toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">${getPremiumLabelA()} Total</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${(plan.catAMembers * plan.catAPremium).toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">${getPremiumLabelB()} Total</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${(plan.catBMembers * plan.catBPremium).toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">Total Members</td>
                    ${plans.map(plan => `<td style="text-align: center; font-weight: bold;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">${plan.totalMembers}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">Total Premium</td>
                    ${plans.map(plan => `<td style="text-align: center; font-weight: bold;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.totalPremium.toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">PSP Fund (37/member)</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.pspFund.toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">ICP Charges (24/member)</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.icpCharges.toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">Policy Fee</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.policyFee.toLocaleString()}</td>`).join('')}
                </tr>
                <tr>
                    <td class="benefit-name">VAT (5%)</td>
                    ${plans.map(plan => `<td style="text-align: center;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.vat.toLocaleString()}</td>`).join('')}
                </tr>
                <tr class="grand-total-row">
                    <td style="font-size: 11px;">GRAND TOTAL</td>
                    ${plans.map(plan => `<td style="text-align: center; font-size: 12px;" class="${plan.id === highlightedPlanId ? 'benefit-cell highlighted' : ''}">AED ${plan.grandTotal.toLocaleString()}</td>`).join('')}
                </tr>
            </tbody>
        </table>
        
        ${hasComment ? `
        <div class="advisor-comment">
            <h4>Advisor Comment</h4>
            <p>${advisorComment}</p>
        </div>
        ` : ''}
        
        <div class="disclaimer"><h4>Disclaimer
        </h4><p>While we make every effort to ensure the accuracy and timeliness of the details provided in the comparison table, there may be instances where the actual coverage differs. In such cases, the terms outlined in the insurer's official policy wording and schedule will take precedence over the information provided by us.</p><p style="margin-top: 2mm;">For the complete <strong>Material Information Declaration</strong> and <strong>Disclaimer</strong>, please refer to the quote.</p></div>
        <div class="footer-contact">
            <div class="footer-left"><strong>Suite 2801, One by Omniyat</strong>Al Mustaqbal Street, Business Bay, Dubai, U.A.E | P O BOX 233640<br><strong>UAE Central Bank Registration Number : 200</strong></div>
            <div class="footer-right"><strong>Call us on +971 47058000</strong>Email us : enquiry@nsib.ae | Visit our website: nsib.ae</div>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================================
// SECTION 3: REUSABLE COMPONENTS
// ============================================================================

// -------- Benefit Section Table Component --------
// -------- Benefit Section Table Component --------
const BenefitSectionTable = ({ 
  sectionTitle, 
  benefits, 
  categories, 
  categoriesData, 
  onChange, 
  highlightedItems,
  onHighlightChange,
  currentPlanId,
  customFields = []
}) => {
  const handleCopyFromFirst = () => {
    if (categories.length > 1) {
      const firstCategory = categories[0];
      
      benefits.forEach(benefit => {
        const firstCategoryValue = categoriesData[benefit.field]?.[firstCategory] || '';
        const firstCategoryOtherValue = categoriesData[benefit.field]?.[`${firstCategory}Other`] || '';
        
        categories.slice(1).forEach(category => {
          if (benefit.showMainValue && firstCategoryValue !== '') {
            onChange(benefit.field, category, firstCategoryValue);
          }
          if (firstCategoryOtherValue !== '') {
            onChange(benefit.field, `${category}Other`, firstCategoryOtherValue);
          }
        });
      });
      
      customFields.forEach(field => {
        const firstCategoryValue = categoriesData[field.key]?.[firstCategory] || '';
        if (firstCategoryValue !== '') {
          categories.slice(1).forEach(category => {
            onChange(field.key, category, firstCategoryValue);
          });
        }
      });
      alert(`Copied ${categories[0]} values to all other categories for ${sectionTitle}`);
    }
  };

  // Filter out custom fields from regular benefits to avoid duplication
  const regularBenefits = benefits.filter(benefit => 
    !customFields.some(customField => customField.key === benefit.field)
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-gray-800">{sectionTitle}</h4>
        {categories.length > 1 && (
          <button
            type="button"
            onClick={handleCopyFromFirst}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition font-bold"
          >
            Copy {categories[0]} to All
          </button>
        )}
      </div>

      <div className="overflow-x-auto border-2 border-gray-300 rounded-lg">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 border-r-2 border-indigo-700 text-left w-1/5 sticky left-0 z-10">
                Benefit
              </th>
              {categories.map(category => (
                <th key={category} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-2 border-r border-indigo-600 text-center">
                  {category}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Render regular benefits */}
            {regularBenefits.map((benefit, index) => (
              <tr key={benefit.field} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-2 border-r-2 border-gray-300 font-medium text-gray-700 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center justify-between">
                    <span>{benefit.label}</span>
                    {benefit.canHighlight && (
                      <label className="flex items-center ml-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={highlightedItems[currentPlanId || 'draft']?.[benefit.field] || false}
                          onChange={(e) => onHighlightChange(benefit.field, e.target.checked)}
                          className="w-3 h-3 text-yellow-500 focus:ring-1 focus:ring-yellow-500"
                        />
                        <span className="ml-1 text-yellow-600">
                          {highlightedItems[currentPlanId || 'draft']?.[benefit.field] ? '★' : '☆'}
                        </span>
                      </label>
                    )}
                  </div>
                </td>
                {categories.map(category => (
                  <td key={category} className="p-1 border-r border-gray-200">
                    {benefit.showMainValue && benefit.options && (
                      <select
                        value={categoriesData[benefit.field]?.[category] || ''}
                        onChange={(e) => onChange(benefit.field, category, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 mb-1"
                      >
                        <option value="">Select...</option>
                        {benefit.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    {benefit.hasTextArea && (
                      <textarea
                        value={categoriesData[benefit.field]?.[`${category}Other`] || categoriesData[benefit.field]?.[category] || ''}
                        onChange={(e) => {
                          if (benefit.showMainValue) {
                            onChange(benefit.field, `${category}Other`, e.target.value);
                          } else {
                            onChange(benefit.field, category, e.target.value);
                          }
                        }}
                        className="w-full p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                        rows="2"
                        placeholder={`${benefit.label}...`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Render custom fields separately */}
            {customFields.map((field, index) => (
              <tr key={field.key} className={(regularBenefits.length + index) % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-2 border-r-2 border-gray-300 font-medium text-gray-700 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center justify-between">
                    <span>{field.label}</span>
                    <label className="flex items-center ml-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highlightedItems[currentPlanId || 'draft']?.[field.key] || false}
                        onChange={(e) => onHighlightChange(field.key, e.target.checked)}
                        className="w-3 h-3 text-yellow-500 focus:ring-1 focus:ring-yellow-500"
                      />
                      <span className="ml-1 text-yellow-600">
                        {highlightedItems[currentPlanId || 'draft']?.[field.key] ? '★' : '☆'}
                      </span>
                    </label>
                  </div>
                </td>
                {categories.map(category => (
                  <td key={category} className="p-1 border-r border-gray-200">
                    <textarea
                      value={categoriesData[field.key]?.[category] || ''}
                      onChange={(e) => onChange(field.key, category, e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                      rows="2"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// ============================================================================
// SECTION 3: REUSABLE COMPONENTS - UPDATED DHA ENHANCED SELECTOR
// ============================================================================

// Custom Company Manager Modal Component
const CustomCompanyManager = ({ isOpen, onClose, onCompanyAdded }) => {
  const [companyName, setCompanyName] = useState('');
  const [tpaName, setTpaName] = useState('');
  const [templateFields, setTemplateFields] = useState({ ...CUSTOM_COMPANY_DEFAULT_TEMPLATE });
  const [existingCompanies, setExistingCompanies] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchCompanies = async () => {
        setIsLoading(true);
        const companies = await loadCustomCompanies();
        setExistingCompanies(companies);
        setIsLoading(false);
      };
      fetchCompanies();
    }
  }, [isOpen]);

  const handleFieldChange = (key, value) => {
    setTemplateFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveCompany = async () => {
    if (!companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    const newCompany = {
      id: Date.now(),
      name: companyName.trim(),
      tpa: tpaName.trim() || 'Custom TPA',
      template: { ...templateFields, planName: templateFields.planName || `${companyName.trim()} Plan` },
      createdAt: new Date().toISOString()
    };

    const updatedCompanies = [...existingCompanies, newCompany];
    await saveCustomCompanies(updatedCompanies);
    setExistingCompanies(updatedCompanies);
    
    // Reset form
    setCompanyName('');
    setTpaName('');
    setTemplateFields({ ...CUSTOM_COMPANY_DEFAULT_TEMPLATE });
    
    if (onCompanyAdded) {
      onCompanyAdded(newCompany);
    }
    
    alert(`✅ Company "${newCompany.name}" added successfully! It will now appear in the provider list.`);
  };

  const handleDeleteCompany = async (companyId) => {
    const updatedCompanies = existingCompanies.filter(c => c.id !== companyId);
    await saveCustomCompanies(updatedCompanies);
    setExistingCompanies(updatedCompanies);
    setShowDeleteConfirm(null);
    alert('✅ Company deleted successfully!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-800">➕ Add Custom Insurance Company</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Existing Custom Companies */}
        {existingCompanies.length > 0 && (
          <div className="mb-6 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-700 mb-3">📋 Your Custom Companies ({existingCompanies.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {existingCompanies.map(company => (
                <div key={company.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                  <div>
                    <span className="font-semibold text-purple-700">{company.name}</span>
                    <span className="text-xs text-gray-500 ml-2">TPA: {company.tpa}</span>
                  </div>
                  <div className="flex gap-2">
                    {showDeleteConfirm === company.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-700"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(company.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-600"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Company Form */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
          <h3 className="font-bold text-purple-800 mb-4">🏢 New Company Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Insurance Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 border-2 border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., ABC Insurance Company"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">TPA Name</label>
              <input
                type="text"
                value={tpaName}
                onChange={(e) => setTpaName(e.target.value)}
                className="w-full p-2 border-2 border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., NextCare, ECare, Al Madallah"
              />
            </div>
          </div>

          <h4 className="font-bold text-purple-700 mb-3">📝 Default Template Fields (Editable)</h4>
          <p className="text-xs text-gray-600 mb-3">Set default values for this company. You can modify these when creating a plan.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(templateFields).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace('Ip', 'IP')
                .replace('Op', 'OP')
                .trim();
              
              const isLongField = ['geographicalScope', 'accessForOP'].includes(key);
              
              return (
                <div key={key} className={isLongField ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  {isLongField ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full p-2 border border-purple-200 rounded text-xs focus:ring-1 focus:ring-purple-500"
                      rows="2"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full p-2 border border-purple-200 rounded text-xs focus:ring-1 focus:ring-purple-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveCompany}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition"
          >
            💾 Save Company
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-bold hover:bg-gray-600 transition"
          >
            ✗ Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DHAEnhancedSelector = ({ onTemplateSelect, onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [editedTemplate, setEditedTemplate] = useState(null);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [showCustomCompanyManager, setShowCustomCompanyManager] = useState(false);
  const [customCompanies, setCustomCompanies] = useState(loadCustomCompaniesSync());

  // Load custom companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const companies = await loadCustomCompanies();
      setCustomCompanies(companies);
    };
    fetchCompanies();
  }, []);

  // Refresh custom companies when manager closes
  const handleCustomCompanyAdded = async (newCompany) => {
    const companies = await loadCustomCompanies();
    setCustomCompanies(companies);
  };

  // Define the available DHA Enhanced providers
 const DHA_ENHANCED_PROVIDER_OPTIONS = [
  'Takaful Emarat - ECare',
  'Qatar Insurance - Al Madallah', 
  'Dubai Insurance - ECare',
  'Al Sagr - Al Madallah',
  'Dubai National Insurance - Al Madallah',
  'Medgulf Insurance',
  'Orient Insurance',
  'Dubai National Insurance - NextCare',
  'National General Insurance',
  'Liva Insurance BSC'
];

  // Combine standard providers with custom companies
  const getAllProviderOptions = () => {
    const customProviderNames = customCompanies.map(c => `⭐ ${c.name}`);
    return [...DHA_ENHANCED_PROVIDER_OPTIONS, ...customProviderNames];
  };

  // Check if provider is a custom company
  const isCustomCompany = (providerName) => {
    return providerName && providerName.startsWith('⭐ ');
  };

  // Get custom company by display name
  const getCustomCompanyByDisplayName = (displayName) => {
    const actualName = displayName.replace('⭐ ', '');
    return customCompanies.find(c => c.name === actualName);
  };

  // ONLY providers that actually have templates
   const DETAILED_TEMPLATE_PROVIDERS = [
    'Takaful Emarat - ECare',
    'Qatar Insurance - Al Madallah',
    'Al Sagr - Al Madallah', 
    'Dubai National Insurance - Al Madallah',
    'Dubai Insurance - ECare'
  ];
  
  // Providers that use simplified single template
  const SIMPLIFIED_TEMPLATE_PROVIDERS = [
    'Medgulf Insurance',
    'Orient Insurance',
    'Dubai National Insurance - NextCare',
    'National General Insurance',
    'Liva Insurance BSC'
  ];


  // Manual entry fields - removed dental and psychiatry
  const MANUAL_FIELDS = [
    { key: 'planName', label: 'Product Name', type: 'text' },
    { key: 'aggregateLimit', label: 'Annual Limit', type: 'text' },
    { key: 'areaOfCover', label: 'Geographical Scope', type: 'textarea', rows: 3 },
    { key: 'accessForOP', label: 'Access for OP', type: 'textarea', rows: 2 },
    { key: 'referralProcedure', label: 'Referral Procedure', type: 'text' },
    { key: 'inpatientCopay', label: 'IP Co-insurance', type: 'text' },
    { key: 'consultationDeductible', label: 'Deductible (Consultation)', type: 'text' },
    { key: 'outpatientCopay', label: 'OP Co-insurance', type: 'text' },
    { key: 'pharmacyLimit', label: 'Pharmacy Limit', type: 'text' },
    { key: 'pharmacyCoinsurance', label: 'Pharmacy Co-insurance', type: 'text' },
    { key: 'prescribedPhysiotherapy', label: 'Physiotherapy Sessions', type: 'text' },
    { key: 'maternity', label: 'Maternity', type: 'text' },
    { key: 'dentalDiscounts', label: 'Dental Discounts', type: 'text' },
    { key: 'opticalDiscount', label: 'Optical Discount', type: 'text' },
    { key: 'repatriation', label: 'Repatriation', type: 'text' }
  ];

  // Initialize manual template
  const initializeManualTemplate = () => {
    const manualTemplate = {};
    MANUAL_FIELDS.forEach(field => {
      manualTemplate[field.key] = '';
    });
    // Add basic structure
    manualTemplate.planName = `Custom Plan - ${selectedProvider}`;
    manualTemplate.groupSize = '20 - 250';
    manualTemplate.network = 'To be specified';
    return manualTemplate;
  };

  // Corrected template mapping - ONLY for providers with actual templates
  const availableTemplates = 
  selectedProvider === 'Takaful Emarat - ECare' ? Object.keys(TAKAFUL_EMARAT_TEMPLATES) :
  selectedProvider === 'Al Sagr - Al Madallah' ? Object.keys(ASNIC_TEMPLATES) :
  selectedProvider === 'Dubai National Insurance - Al Madallah' ? Object.keys(DNI_TEMPLATES) :
  selectedProvider === 'Qatar Insurance - Al Madallah' ? Object.keys(QIC_TEMPLATES) :
  selectedProvider === 'Dubai Insurance - ECare' ? Object.keys(DUBAI_INSURANCE_TEMPLATES) :
  selectedProvider && SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) ? Object.keys(SIMPLIFIED_TEMPLATE) :
  [];
const handleTemplateSelect = (templateName) => {
  let template;
  if (selectedProvider === 'Takaful Emarat - ECare') {
    template = TAKAFUL_EMARAT_TEMPLATES[templateName];
  } else if (selectedProvider === 'Al Sagr - Al Madallah') {
    template = ASNIC_TEMPLATES[templateName];
  } else if (selectedProvider === 'Dubai National Insurance - Al Madallah') {
    template = DNI_TEMPLATES[templateName];
  } else if (selectedProvider === 'Qatar Insurance - Al Madallah') {
    template = QIC_TEMPLATES[templateName];
  } else if (selectedProvider === 'Dubai Insurance - ECare') {
    template = DUBAI_INSURANCE_TEMPLATES[templateName];
  } else if (SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider)) {
    template = SIMPLIFIED_TEMPLATE[templateName];
  }
  
  if (template) {
    // Format all values and remove dental/psychiatry
    const formattedTemplate = {};
    Object.entries(template).forEach(([key, value]) => {
      // Skip dental and psychiatry fields
      if (key === 'dental' || key === 'psychiatry') return;
      // Format the value
      formattedTemplate[key] = typeof value === 'string' ? formatFieldValue(value) : value;
    });
    
    setSelectedTemplate(templateName);
    setEditedTemplate(formattedTemplate);
  }
};

  const handleTemplateFieldChange = (field, value) => {
    setEditedTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualFieldChange = (field, value) => {
    setEditedTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyTemplate = () => {
    if (!selectedProvider) {
      alert('Please select a provider');
      return;
    }

    if (manualEntryMode && !editedTemplate) {
      alert('Please fill in the required fields');
      return;
    }

    // For detailed providers, require template selection
    if (DETAILED_TEMPLATE_PROVIDERS.includes(selectedProvider) && !selectedTemplate) {
      alert('Please select a plan template');
      return;
    }

    // Remove dental and psychiatry from final template
    const cleanedTemplate = { ...editedTemplate };
    delete cleanedTemplate.dental;
    delete cleanedTemplate.psychiatry;

    // For custom companies, pass the actual company name (without the star prefix)
    const actualProviderName = isCustomCompany(selectedProvider) 
      ? selectedProvider.replace('⭐ ', '') 
      : selectedProvider;

    onTemplateSelect(cleanedTemplate, actualProviderName, isCustomCompany(selectedProvider));
  };

  // Handle provider change
const handleProviderChange = (provider) => {
  setSelectedProvider(provider);
  setSelectedTemplate('');
  setEditedTemplate(null);
  
  // Check if it's a custom company
  if (isCustomCompany(provider)) {
    const customCompany = getCustomCompanyByDisplayName(provider);
    if (customCompany && customCompany.template) {
      setManualEntryMode(false);
      setSelectedTemplate('Custom Plan');
      // Format all values in the template
      const formattedTemplate = {};
      Object.entries(customCompany.template).forEach(([key, value]) => {
        if (key === 'dental' || key === 'psychiatry') return;
        formattedTemplate[key] = typeof value === 'string' ? formatFieldValue(value) : value;
      });
      setEditedTemplate(formattedTemplate);
    }
    return;
  }
  
  setManualEntryMode(!DETAILED_TEMPLATE_PROVIDERS.includes(provider) && !SIMPLIFIED_TEMPLATE_PROVIDERS.includes(provider));
  
  if (SIMPLIFIED_TEMPLATE_PROVIDERS.includes(provider)) {
    // Auto-select the simplified template
    const templateName = 'Basic EBP';
    setSelectedTemplate(templateName);
    
    // Get the simplified template and format values
    const template = SIMPLIFIED_TEMPLATE[templateName];
    if (template) {
      // Format all values and remove dental/psychiatry
      const formattedTemplate = {};
      Object.entries(template).forEach(([key, value]) => {
        // Skip dental and psychiatry fields
        if (key === 'dental' || key === 'psychiatry') return;
        // Format the value
        formattedTemplate[key] = typeof value === 'string' ? formatFieldValue(value) : value;
      });
      setEditedTemplate(formattedTemplate);
    }
  } else if (DETAILED_TEMPLATE_PROVIDERS.includes(provider)) {
    // For detailed template providers, show template selection
    // Don't auto-select - let user choose
  } else {
    // Initialize manual entry form for truly manual providers
    setEditedTemplate(initializeManualTemplate());
  }
};
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-indigo-800 mb-4">🌟 DHA Enhanced - Template Selection</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">Select Provider</label>
              <button
                onClick={() => setShowCustomCompanyManager(true)}
                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1"
              >
                ➕ Add Custom Company
              </button>
            </div>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full p-3 border-2 border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Provider --</option>
              <optgroup label="Standard Providers">
                {DHA_ENHANCED_PROVIDER_OPTIONS.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </optgroup>
              {customCompanies.length > 0 && (
                <optgroup label="⭐ Custom Companies">
                  {customCompanies.map(company => (
                    <option key={company.id} value={`⭐ ${company.name}`}>⭐ {company.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {customCompanies.length > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                ⭐ = Custom companies you've added. These are saved permanently.
              </p>
            )}
          </div>

          {/* Template Selection Dropdown - ONLY for detailed template providers */}
          {selectedProvider && DETAILED_TEMPLATE_PROVIDERS.includes(selectedProvider) && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Plan Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full p-3 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Template --</option>
                {availableTemplates.map(template => (
                  <option key={template} value={template}>{template}</option>
                ))}
              </select>
            </div>
          )}

          {/* Show templates for custom companies */}
          {selectedProvider && isCustomCompany(selectedProvider) && editedTemplate && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
              <h3 className="font-bold text-purple-800 mb-3">📋 Custom Company Template: {selectedProvider.replace('⭐ ', '')}</h3>
              <p className="text-xs text-gray-600 mb-3">Edit the template fields below. Click <span className="text-red-600 font-bold">−</span> to remove a field from comparison.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(editedTemplate).map(([key, value]) => {
                  if (key.includes('Premium') || key.includes('premium')) return null;
                  if (key === 'dental' || key === 'psychiatry' || key === 'groupSize') return null;
                  
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .replace('Ip', 'IP')
                    .replace('Op', 'OP')
                    .replace('T P A', 'TPA')
                    .trim();
                    
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-gray-700">
                          {label}:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditedTemplate(prev => {
                              const newTemplate = { ...prev };
                              delete newTemplate[key];
                              return newTemplate;
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-0 leading-none hover:bg-red-100 rounded"
                          title={`Remove ${label}`}
                        >
                          −
                        </button>
                      </div>
                      <textarea
                        value={String(value)}
                        onChange={(e) => handleTemplateFieldChange(key, e.target.value)}
                        className="w-full p-2 border border-purple-300 rounded text-xs focus:ring-1 focus:ring-purple-500"
                        rows={key.includes('geographicalScope') || key.includes('accessForOP') ? 3 : 2}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-purple-700 bg-purple-100 p-2 rounded border border-purple-200">
                💡 This is a custom company template. Modify as needed and click "Apply Template" below.
              </div>
            </div>
          )}

          {/* Show templates for providers with templates */}
{selectedProvider && !isCustomCompany(selectedProvider) && (DETAILED_TEMPLATE_PROVIDERS.includes(selectedProvider) || SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider)) && editedTemplate && (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
    <h3 className="font-bold text-green-800 mb-3">📋 Editable Template Preview: {selectedTemplate || 'Basic EBP'}</h3>
    <p className="text-xs text-gray-600 mb-3">Click <span className="text-red-600 font-bold">−</span> to remove a field from comparison.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {/* Render template fields - skip dental, psychiatry, groupSize, and premium fields */}
      {Object.entries(editedTemplate).map(([key, value]) => {
        // Skip premium fields, dental, psychiatry, and groupSize
        if (key.includes('Premium') || key.includes('premium')) return null;
        if (key === 'dental' || key === 'psychiatry' || key === 'groupSize') return null;
        
        // Create a human-readable label
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .replace('Ip', 'IP')
          .replace('Op', 'OP')
          .replace('T P A', 'TPA')
          .trim();
          
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-gray-700">
                {label}:
              </label>
              <button
                type="button"
                onClick={() => {
                  setEditedTemplate(prev => {
                    const newTemplate = { ...prev };
                    delete newTemplate[key];
                    return newTemplate;
                  });
                }}
                className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-0 leading-none hover:bg-red-100 rounded"
                title={`Remove ${label}`}
              >
                −
              </button>
            </div>
            <textarea
              value={String(value)}
              onChange={(e) => handleTemplateFieldChange(key, e.target.value)}
              className="w-full p-2 border border-green-300 rounded text-xs focus:ring-1 focus:ring-green-500"
              rows={key.includes('geographicalScope') || key.includes('accessForOP') ? 3 : 2}
            />
          </div>
        );
      })}
      
      {/* Premium fields - ONLY show for detailed template providers, NOT for simplified */}
      {!SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) && editedTemplate.lsbPremium !== undefined && (
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">
            LSB Premium:
          </label>
          <input
            type="text"
            value={String(editedTemplate.lsbPremium)}
            onChange={(e) => handleTemplateFieldChange('lsbPremium', e.target.value)}
            className="w-full p-2 border border-green-300 rounded text-xs focus:ring-1 focus:ring-green-500"
          />
        </div>
      )}
      
      {!SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) && editedTemplate.hsbPremium !== undefined && (
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">
            HSB Premium:
          </label>
          <input
            type="text"
            value={String(editedTemplate.hsbPremium)}
            onChange={(e) => handleTemplateFieldChange('hsbPremium', e.target.value)}
            className="w-full p-2 border border-green-300 rounded text-xs focus:ring-1 focus:ring-green-500"
          />
        </div>
      )}
      
      {!SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) && editedTemplate.premium !== undefined && (
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">
            Premium:
          </label>
          <input
            type="text"
            value={String(editedTemplate.premium)}
            onChange={(e) => handleTemplateFieldChange('premium', e.target.value)}
            className="w-full p-2 border border-green-300 rounded text-xs focus:ring-1 focus:ring-green-500"
          />
        </div>
      )}
    </div>
    <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded border border-green-200">
      💡 {SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) ? 'Showing simplified template fields including Dental Discounts and Optical Discount. Modify as needed and click "Add Plan" below.' : 'You can edit any field above before applying the template.'}
    </div>
  </div>
)}

           {/* Show manual entry form for providers without ANY templates (shouldn't happen with current setup) */}
          {selectedProvider && !isCustomCompany(selectedProvider) && !DETAILED_TEMPLATE_PROVIDERS.includes(selectedProvider) && !SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-3">📝 Manual Entry Required</h3>
              <p className="text-sm text-blue-700 mb-4">
                Please fill in the plan details for <strong>{selectedProvider}</strong>. 
                Templates for this provider are coming soon!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MANUAL_FIELDS.map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      {field.label}:
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={editedTemplate?.[field.key] || ''}
                        onChange={(e) => handleManualFieldChange(field.key, e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        rows={field.rows || 2}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={editedTemplate?.[field.key] || ''}
                        onChange={(e) => handleManualFieldChange(field.key, e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                💡 Fill in all the required fields above. You can modify premium values in the main form after applying this template.
              </div>
            </div>
          )}

        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleApplyTemplate}
          disabled={!selectedProvider || (!manualEntryMode && !selectedTemplate && !SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) && !isCustomCompany(selectedProvider))}
            className={`flex-1 p-3 rounded-lg font-bold transition ${
              selectedProvider && (manualEntryMode || selectedTemplate || isCustomCompany(selectedProvider))
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
                 {isCustomCompany(selectedProvider) ? '✅ Apply Custom Company' : (manualEntryMode ? '✅ Apply Manual Plan' : (SIMPLIFIED_TEMPLATE_PROVIDERS.includes(selectedProvider) ? '✅ Apply Basic Template' : '✅ Apply Template'))}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-bold hover:bg-gray-600 transition"
          >
            ✗ Cancel
          </button>
        </div>
      </div>
      
      {/* Custom Company Manager Modal */}
      <CustomCompanyManager
        isOpen={showCustomCompanyManager}
        onClose={() => {
          setShowCustomCompanyManager(false);
          setCustomCompanies(loadCustomCompanies()); // Refresh list
        }}
        onCompanyAdded={handleCustomCompanyAdded}
      />
    </div>
  );
};

// History Manager Component - UPDATED
// History Manager Component - UPDATED with Back to Normal at top
const HistoryManager = ({ isOpen, onClose, history, onLoadComparison, onDeleteComparison, onNewComparison, onBackToNormal }) => {
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-indigo-800">📋 Saved Comparisons</h2>
          <button
            onClick={() => {
              onBackToNormal();
              onClose();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition text-sm"
          >
            ↩️ Exit
          </button>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No saved comparisons found.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.companyName}</h3>
                    <p className="text-sm text-gray-600">Reference: {item.referenceNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString()} • {item.plans.length} plans
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onLoadComparison(item);
                        onClose();
                      }}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                      View/Edit
                    </button>
                    <button
                      onClick={() => onDeleteComparison(item.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              onNewComparison();
              onClose();
            }}
            className="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition"
          >
            ➕ New Comparison
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-bold hover:bg-gray-600 transition"
          >
            ✗ Close
          </button>
        </div>
      </div>
    </div>
  );
};
// ============================================================================
// SECTION 4: MAIN COMPONENTS
// ============================================================================

// -------- Plan Generator Component --------
function PlanGenerator() {
  const [planType, setPlanType] = useState('SME');
  const [plans, setPlans] = useState([]);
  const [showDHAEnhancedSelector, setShowDHAEnhancedSelector] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({
    id: null,
    planType: 'SME',
    providerName: '',
    selectedCategories: [],
    categoriesData: {},
    catAMembers: 0,
    catAPremium: 0,
    catBMembers: 0,
    catBPremium: 0,
    catCMembers: 0,
    catCPremium: 0,
    catDMembers: 0,
    catDPremium: 0,
    dubaiMembers: 0,
    northernEmiratesMembers: 0,
    policyFee: 0,
    isRecommended: false,
    isRenewal: false,
    annualLimit: '',
    areaOfCoverMode: 'dropdown',
    areaOfCoverDropdown: '',
    areaOfCoverTextarea: ''
  });

  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'Demo Corporation LLC',
    tpa: 'NAS',
    tpaManual: '',
    networkSelection: 'GN',
    networkManual: ''
  });

  const [advisorComment, setAdvisorComment] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [networkOptions, setNetworkOptions] = useState(TPA_NETWORK_MAPPING['NAS'] || []);
  const [highlightedPlanId, setHighlightedPlanId] = useState(null);
  const [highlightedItems, setHighlightedItems] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [showHistoryManager, setShowHistoryManager] = useState(false);
  const [isEditingComparison, setIsEditingComparison] = useState(false);
  const [currentComparisonId, setCurrentComparisonId] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (planType === 'BASIC' && companyInfo.tpa && BASIC_TPA_NETWORK_MAPPING[companyInfo.tpa]) {
      setNetworkOptions(BASIC_TPA_NETWORK_MAPPING[companyInfo.tpa]);
    } else if (planType === 'SME' && companyInfo.tpa && TPA_NETWORK_MAPPING[companyInfo.tpa]) {
      setNetworkOptions(TPA_NETWORK_MAPPING[companyInfo.tpa]);
    }
  }, [companyInfo.tpa, planType]);

  const handleAnnualLimitChange = (limit) => {
    if (limit === 'AED 150,000') {
      setCurrentPlan(prev => ({
        ...prev,
        annualLimit: limit,
        selectedCategories: ['LSB', 'HSB'],
        categoriesData: {
          ...prev.categoriesData,
          aggregateLimit: { 'LSB': 'AED 150,000', 'HSB': 'AED 150,000' },
          inpatientCopay: { 'LSB': '20% co-insurance payable by the insured with a cap of AED 500 payable per encounter, An annual aggregate cap of AED 1,000', 'HSB': '20% co-insurance payable by the insured with a cap of AED 500 payable per encounter, An annual aggregate cap of AED 1,000' },
          outpatientConsultation: { 'LSB': 'Covered with 20% Copay', 'HSB': 'Covered with 20% Copay' },
          outpatientCopay: { 'LSB': 'Covered with 20% copay', 'HSB': 'Covered with 20% copay' },
          pharmacyLimit: { 'LSB': 'Covered upto AED 2,500', 'HSB': 'Covered upto AED 2,500' },
          pharmacyCopay: { 'LSB': 'Covered with 30% copay', 'HSB': 'Covered with 30% copay' },
          prescribedPhysiotherapy: { 'LSB': 'Physiotherapy treatment services-Covered upto 6 sessions with 20% copay', 'HSB': 'Physiotherapy treatment services-Covered upto 6 sessions with 20% copay' }
        }
      }));
    } else {
      setCurrentPlan(prev => ({
        ...prev,
        annualLimit: limit
      }));
    }
  };

  const handleNumberChange = useCallback((field, value) => {
    setCurrentPlan(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTpaChange = useCallback((value) => {
    setCompanyInfo(prev => ({
      ...prev,
      tpa: value,
      tpaManual: ''
    }));
  }, []);

  const handleCategoryChange = useCallback((selectedCats) => {
    setCurrentPlan(prev => {
      const newCategoriesData = { ...prev.categoriesData };
      
      if (prev.planType === 'BASIC' && prev.annualLimit === 'AED 150,000') {
        selectedCats.forEach(cat => {
          if (!prev.selectedCategories.includes(cat)) {
            Object.keys(BASIC_150K_DEFAULTS).forEach(field => {
              if (!newCategoriesData[field]) {
                newCategoriesData[field] = {};
              }
              newCategoriesData[field][cat] = BASIC_150K_DEFAULTS[field][cat];
            });
            if (!newCategoriesData.aggregateLimit) {
              newCategoriesData.aggregateLimit = {};
            }
            newCategoriesData.aggregateLimit[cat] = 'AED 150,000';
          }
        });
      } else {
        selectedCats.forEach(cat => {
          if (!prev.selectedCategories.includes(cat)) {
            const sourceCategory = prev.selectedCategories.find(sc => 
              Object.keys(newCategoriesData).some(field => 
                newCategoriesData[field] && newCategoriesData[field][sc]
              )
            );
            
            if (sourceCategory) {
              Object.keys(newCategoriesData).forEach(field => {
                if (typeof newCategoriesData[field] === 'object' && newCategoriesData[field][sourceCategory]) {
                  newCategoriesData[field] = {
                    ...newCategoriesData[field],
                    [cat]: newCategoriesData[field][sourceCategory]
                  };
                }
              });
            }
          }
        });
      }

      Object.keys(newCategoriesData).forEach(field => {
        if (typeof newCategoriesData[field] === 'object') {
          Object.keys(newCategoriesData[field]).forEach(cat => {
            if (!selectedCats.includes(cat)) {
              delete newCategoriesData[field][cat];
            }
          });
        }
      });

      return {
        ...prev,
        selectedCategories: selectedCats,
        categoriesData: newCategoriesData
      };
    });
  }, []);

  const handleCategoryDataChange = useCallback((field, category, value) => {
    setCurrentPlan(prev => ({
      ...prev,
      categoriesData: {
        ...prev.categoriesData,
        [field]: {
          ...prev.categoriesData[field],
          [category]: value
        }
      }
    }));
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setCurrentPlan(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCompanyInfoChange = useCallback((field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleBenefitHighlight = (benefitKey, isHighlighted) => {
    const planKey = currentPlan.id || 'draft';
    
    setHighlightedItems(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        [benefitKey]: isHighlighted
      }
    }));
  };

  const handleTemplateSelect = (template, providerName, isCustom = false) => {
    // Use CAT A/CAT B for DHA Enhanced plans
    const categories = template.lsbPremium ? ['CAT A', 'CAT B'] : ['CAT A'];
    
    // Create comprehensive categories data from template
    const categoriesData = {};
    
    // Standardized field mappings - template field -> categoriesData field
    const fieldMappings = {
      planName: 'planName',
      annualLimit: 'aggregateLimit',
      geographicalScope: 'areaOfCover',
      network: 'network',
      accessForOP: 'accessForOP',
      referralProcedure: 'referralProcedure',
      ipCoinsurance: 'ipCoinsurance',
      deductibleConsultation: 'deductibleConsultation',
      opCoinsurance: 'opCoinsurance',
      pharmacyLimit: 'pharmacyLimit',
      pharmacyCoinsurance: 'pharmacyCoinsurance',
      physiotherapySessions: 'prescribedPhysiotherapy',
      maternity: 'maternity',
      dentalDiscounts: 'dentalDiscounts',
      opticalDiscount: 'opticalDiscount',
      kidneyDialysis: 'kidneyDialysis',
      organTransplant: 'organTransplant',
      optical: 'optical',
      returnAirFare: 'returnAirFare',
      annualHealthCheckup: 'annualHealthCheckup',
      repatriation: 'repatriation'
    };

    // Populate categories data
    Object.keys(fieldMappings).forEach(templateField => {
      const dataField = fieldMappings[templateField];
      if (template[templateField] !== undefined) {
        categoriesData[dataField] = {};
        categories.forEach(cat => {
          categoriesData[dataField][cat] = String(template[templateField]);
        });
      }
    });

    // AUTO-SET TPA based on provider
    // AUTO-SET TPA based on provider
let tpaValue = '';

// For custom companies, check if they have a TPA set
if (isCustom) {
  const customCompanies = loadCustomCompanies();
  const customCompany = customCompanies.find(c => c.name === providerName);
  if (customCompany && customCompany.tpa) {
    tpaValue = customCompany.tpa;
  }
} else if (providerName === 'Takaful Emarat - ECare') {
  tpaValue = 'ECARE';
} else if (providerName === 'Qatar Insurance - Al Madallah') {
  tpaValue = 'AL MADALLAH';
} else if (providerName === 'Dubai Insurance - ECare') {
  tpaValue = 'ECARE';
} else if (providerName === 'Al Sagr - Al Madallah') {
  tpaValue = 'AL MADALLAH';
} else if (providerName === 'Dubai National Insurance - Al Madallah') {
  tpaValue = 'AL MADALLAH';
} else if (providerName === 'Dubai National Insurance - NextCare') {
  tpaValue = 'NEXTCARE';
}
// Add TPA for other simplified template providers if needed

    // For custom companies, use the company name directly; for standard providers, use mapping
    const displayProviderName = isCustom ? providerName : (DHA_ENHANCED_PROVIDERS[providerName] || providerName);

    const newPlan = {
      ...currentPlan,
      providerName: displayProviderName,
      planType: 'ENHANCED_BASIC',
      selectedCategories: categories,
      categoriesData: categoriesData,
      // Set premium values
      catAPremium: template.lsbPremium || template.premium || 0,
      catBPremium: template.hsbPremium || template.premium || 0,
      // Set default member counts
      catAMembers: 1,
      catBMembers: template.hsbPremium ? 1 : 0,
      dubaiMembers: 1,
      northernEmiratesMembers: 0,
      policyFee: 0,
      isCustomCompany: isCustom
    };

    // Update company info with auto-generated TPA
    if (tpaValue) {
      setCompanyInfo(prev => ({
        ...prev,
        tpa: tpaValue
      }));
    }

    setCurrentPlan(newPlan);
    setShowDHAEnhancedSelector(false);
    
    if (isCustom) {
      alert(`✅ Custom Company Template loaded successfully!\n\n• Provider: ${providerName}\n• TPA: ${tpaValue || 'Not specified'}\n\nAll template details have been auto-populated. You can now review and modify as needed before adding to comparison.`);
    } else {
      alert(`✅ Template "${template.planName}" loaded successfully!\n\n• Provider: ${displayProviderName}\n• TPA: ${tpaValue}\n\nAll template details have been auto-populated. You can now review and modify as needed before adding to comparison.`);
    }
  };

  const handlePlanTypeChange = (newPlanType) => {
    setPlanType(newPlanType);
    
    if (newPlanType === 'ENHANCED_BASIC') {
      // Initialize for ENHANCED_BASIC with CAT A/CAT B
      setCurrentPlan({
        id: null,
        planType: 'ENHANCED_BASIC',
        providerName: '',
        selectedCategories: [],
        categoriesData: {},
        catAMembers: 0,
        catAPremium: 0,
        catBMembers: 0,
        catBPremium: 0,
        catCMembers: 0,
        catCPremium: 0,
        catDMembers: 0,
        catDPremium: 0,
        dubaiMembers: 0,
        northernEmiratesMembers: 0,
        policyFee: 0,
        isRecommended: false,
        isRenewal: false
      });
      
      // Automatically open DHA Enhanced selector
      setShowDHAEnhancedSelector(true);
    } else if (newPlanType === 'BASIC') {
      setCurrentPlan({
        id: null,
        planType: 'BASIC',
        providerName: '',
        selectedCategories: [],
        categoriesData: {},
        catAMembers: 0,
        catAPremium: 0,
        catBMembers: 0,
        catBPremium: 0,
        catCMembers: 0,
        catCPremium: 0,
        catDMembers: 0,
        catDPremium: 0,
        dubaiMembers: 0,
        northernEmiratesMembers: 0,
        policyFee: 0,
        isRecommended: false,
        isRenewal: false,
        annualLimit: '',
        areaOfCoverMode: 'dropdown',
        areaOfCoverDropdown: '',
        areaOfCoverTextarea: ''
      });
      
      setCompanyInfo(prev => ({
        ...prev,
        tpa: 'NEXTCARE'
      }));
    } else {
      setCurrentPlan({
        id: null,
        planType: 'SME',
        providerName: '',
        selectedCategories: [],
        categoriesData: {},
        catAMembers: 0,
        catAPremium: 0,
        catBMembers: 0,
        catBPremium: 0,
        catCMembers: 0,
        catCPremium: 0,
        catDMembers: 0,
        catDPremium: 0,
        dubaiMembers: 0,
        northernEmiratesMembers: 0,
        policyFee: 0,
        isRecommended: false,
        isRenewal: false
      });
      
      setCompanyInfo(prev => ({
        ...prev,
        tpa: 'NAS'
      }));
    }
  };

  const addOrUpdatePlan = () => {
    try {
      if (!currentPlan.providerName) {
        alert('Please select a provider');
        return;
      }

      if (currentPlan.selectedCategories.length === 0) {
        alert('Please select at least one category (LSB/HSB for BASIC plans, CAT A/B for ENHANCED_BASIC plans, or CAT A/B/C/D for SME plans)');
        return;
      }

      let planToAdd = { ...currentPlan, planType };

      if (planType === 'BASIC') {
        if (!currentPlan.annualLimit) {
          alert('Please select Annual Limit');
          return;
        }

        const areaValue = currentPlan.areaOfCoverMode === 'dropdown' 
          ? currentPlan.areaOfCoverDropdown 
          : currentPlan.areaOfCoverTextarea;
        
        if (!areaValue) {
          alert('Please select or enter Area of Cover');
          return;
        }

        const networkValue = currentPlan.categoriesData?.network?.[currentPlan.selectedCategories[0]];
        
        if (!networkValue) {
          alert('Please select a Network');
          return;
        }
        
        const areaData = {};
        currentPlan.selectedCategories.forEach(cat => {
          areaData[cat] = areaValue;
        });
        
        planToAdd = {
          ...planToAdd,
          categoriesData: {
            ...planToAdd.categoriesData,
            areaOfCover: areaData
          }
        };
      }

      // For DHA Enhanced plans, ensure we're using CAT A/CAT B
      if (planType === 'ENHANCED_BASIC') {
        if (!planToAdd.selectedCategories.includes('CAT A') && !planToAdd.selectedCategories.includes('CAT B')) {
          alert('DHA Enhanced plans require at least CAT A or CAT B categories');
          return;
        }
      }

      const planWithTotals = calculatePlanTotals(planToAdd);
      const newPlanId = currentPlan.id || Date.now();

      if (currentPlan.id) {
        setPlans(plans.map(p => p.id === currentPlan.id ? planWithTotals : p));
      } else {
        setPlans([...plans, { ...planWithTotals, id: newPlanId }]);
        
        if (highlightedItems['draft']) {
          setHighlightedItems(prev => ({
            ...prev,
            [newPlanId]: { ...prev['draft'] },
            draft: undefined
          }));
        }
      }

      alert('✅ Plan added successfully!');

      // Reset form based on plan type - allow adding another DHA Enhanced plan
      if (planType === 'BASIC') {
        setCurrentPlan({
          id: null,
          planType: 'BASIC',
          providerName: '',
          selectedCategories: [],
          categoriesData: {},
          catAMembers: 0,
          catAPremium: 0,
          catBMembers: 0,
          catBPremium: 0,
          catCMembers: 0,
          catCPremium: 0,
          catDMembers: 0,
          catDPremium: 0,
          dubaiMembers: 0,
          northernEmiratesMembers: 0,
          policyFee: 0,
          isRecommended: false,
          isRenewal: false,
          annualLimit: '',
          areaOfCoverMode: 'dropdown',
          areaOfCoverDropdown: '',
          areaOfCoverTextarea: ''
        });
      } else if (planType === 'ENHANCED_BASIC') {
        // Keep ENHANCED_BASIC selected but reset the form to allow adding another DHA Enhanced plan
        setCurrentPlan({
          id: null,
          planType: 'ENHANCED_BASIC',
          providerName: '',
          selectedCategories: [],
          categoriesData: {},
          catAMembers: 0,
          catAPremium: 0,
          catBMembers: 0,
          catBPremium: 0,
          catCMembers: 0,
          catCPremium: 0,
          catDMembers: 0,
          catDPremium: 0,
          dubaiMembers: 0,
          northernEmiratesMembers: 0,
          policyFee: 0,
          isRecommended: false,
          isRenewal: false
        });
      } else {
        setCurrentPlan({
          id: null,
          planType: 'SME',
          providerName: '',
          selectedCategories: [],
          categoriesData: {},
          catAMembers: 0,
          catAPremium: 0,
          catBMembers: 0,
          catBPremium: 0,
          catCMembers: 0,
          catCPremium: 0,
          catDMembers: 0,
          catDPremium: 0,
          dubaiMembers: 0,
          northernEmiratesMembers: 0,
          policyFee: 0,
          isRecommended: false,
          isRenewal: false
        });
      }
    } catch (error) {
      console.error('ERROR in addOrUpdatePlan:', error);
      alert('❌ Error adding plan: ' + error.message);
    }
  };

  const editPlan = (plan) => {
    setPlanType(plan.planType || 'SME');
    setCurrentPlan(plan);
  };

  const deletePlan = (id) => {
    setPlans(plans.filter(p => p.id !== id));
    if (highlightedPlanId === id) {
      setHighlightedPlanId(null);
    }
  };

  const saveAndDownload = async () => {
    if (!companyInfo.companyName) {
      alert('Please enter company name');
      return;
    }
    if (plans.length === 0) {
      alert('Please add at least one plan');
      return;
    }

    const referenceNumber = isEditingComparison ? 
      history.find(h => h.id === currentComparisonId)?.referenceNumber || generateReferenceNumber() 
      : generateReferenceNumber();
    
    const htmlContent = generateHTMLContent(plans, companyInfo, advisorComment, referenceNumber, highlightedPlanId, highlightedItems, customFields);
    const fileName = `${companyInfo.companyName.replace(/\s+/g, '_')}_Insurance_Comparison_${referenceNumber}.html`;
    downloadHTMLFile(htmlContent, fileName);
    
    const comparison = {
      id: isEditingComparison ? currentComparisonId : Date.now(),
      date: new Date().toISOString(),
      companyName: companyInfo.companyName,
      referenceNumber,
      plans,
      companyInfo,
      advisorComment,
      highlightedPlanId,
      highlightedItems,
      customFields
    };
    
    let updatedHistory;
    if (isEditingComparison) {
      // Update existing comparison
      updatedHistory = history.map(item => 
        item.id === currentComparisonId ? comparison : item
      );
      alert('✅ Comparison updated successfully!');
    } else {
      // Add new comparison
      updatedHistory = [comparison, ...history];
      alert('✅ Comparison saved successfully!');
    }
    
    // Save to cloud
    await saveComparisons(updatedHistory);
    setHistory(updatedHistory);
    
    // Reset editing state
    setIsEditingComparison(false);
    setCurrentComparisonId(null);
  };

  const handleHighlightPlan = (planId) => {
    setHighlightedPlanId(planId === highlightedPlanId ? null : planId);
  };

  const addCustomField = () => {
  if (newFieldName.trim()) {
    const fieldKey = `custom_${Date.now()}`;
    setCustomFields([...customFields, { key: fieldKey, label: newFieldName.trim() }]);
    setNewFieldName('');
    
    // Initialize the custom field for all existing plans with empty values for each category
    setPlans(plans.map(plan => {
      const initialData = {};
      plan.selectedCategories.forEach(cat => {
        initialData[cat] = '';
      });
      
      return {
        ...plan,
        categoriesData: {
          ...plan.categoriesData,
          [fieldKey]: initialData
        }
      };
    }));
  }
};
 const removeCustomField = (fieldKey) => {
  setCustomFields(customFields.filter(f => f.key !== fieldKey));
  setPlans(plans.map(plan => {
    const newCategoriesData = { ...plan.categoriesData };
    delete newCategoriesData[fieldKey];
    return { ...plan, categoriesData: newCategoriesData };
  }));
};

 const updateCustomFieldValue = (planId, fieldKey, value) => {
  setPlans(plans.map(plan => {
    if (plan.id === planId) {
      const updatedData = {};
      plan.selectedCategories.forEach(cat => {
        updatedData[cat] = value;
      });
      
      return {
        ...plan,
        categoriesData: {
          ...plan.categoriesData,
          [fieldKey]: updatedData
        }
      };
    }
    return plan;
  }));
};
  
// Add this function in the PlanGenerator component, after the other handler functions:

// Back to Normal - Reset form without loading any 
// Add this function in your PlanGenerator component
const updatePlanCustomField = (planId, fieldKey, category, value) => {
  setPlans(plans.map(plan => {
    if (plan.id === planId) {
      return {
        ...plan,
        categoriesData: {
          ...plan.categoriesData,
          [fieldKey]: {
            ...plan.categoriesData[fieldKey],
            [category]: value
          }
        }
      };
    }
    return plan;
  }));
};
const handleBackToNormal = () => {
  // Reset everything to initial state
  setPlans([]);
  setCompanyInfo({
    companyName: 'Demo Corporation LLC',
    tpa: 'NAS',
    tpaManual: '',
    networkSelection: 'GN',
    networkManual: ''
  });
  setAdvisorComment('');
  setHighlightedPlanId(null);
  setHighlightedItems({});
  setCustomFields([]);
  setIsEditingComparison(false);
  setCurrentComparisonId(null);
  
  // Reset current plan to default SME state
  setCurrentPlan({
    id: null,
    planType: 'SME',
    providerName: '',
    selectedCategories: [],
    categoriesData: {},
    catAMembers: 0,
    catAPremium: 0,
    catBMembers: 0,
    catBPremium: 0,
    catCMembers: 0,
    catCPremium: 0,
    catDMembers: 0,
    catDPremium: 0,
    dubaiMembers: 0,
    northernEmiratesMembers: 0,
    policyFee: 0,
    isRecommended: false,
    isRenewal: false,
    annualLimit: '',
    areaOfCoverMode: 'dropdown',
    areaOfCoverDropdown: '',
    areaOfCoverTextarea: ''
  });
  
  alert('✅ Returned to normal mode. You can now create a new comparison from scratch.');
};
  // Load saved comparison
  const loadSavedComparison = (comparison) => {
    // Set company info
    setCompanyInfo(comparison.companyInfo);
    setAdvisorComment(comparison.advisorComment);
    
    // Set plans
    setPlans(comparison.plans);
    
    // Set highlighted items
    setHighlightedItems(comparison.highlightedItems || {});
    setHighlightedPlanId(comparison.highlightedPlanId || null);
    
    // Set custom fields
    setCustomFields(comparison.customFields || []);
    
    // Set editing mode
    setIsEditingComparison(true);
    setCurrentComparisonId(comparison.id);
    
    // Reset current plan form
    setCurrentPlan({
      id: null,
      planType: 'SME',
      providerName: '',
      selectedCategories: [],
      categoriesData: {},
      catAMembers: 0,
      catAPremium: 0,
      catBMembers: 0,
      catBPremium: 0,
      catCMembers: 0,
      catCPremium: 0,
      catDMembers: 0,
      catDPremium: 0,
      dubaiMembers: 0,
      northernEmiratesMembers: 0,
      policyFee: 0,
      isRecommended: false,
      isRenewal: false,
      annualLimit: '',
      areaOfCoverMode: 'dropdown',
      areaOfCoverDropdown: '',
      areaOfCoverTextarea: ''
    });
  };

  // Start new comparison
  const startNewComparison = () => {
    // Reset everything
    setPlans([]);
    setCompanyInfo({
      companyName: 'Demo Corporation LLC',
      tpa: 'NAS',
      tpaManual: '',
      networkSelection: 'GN',
      networkManual: ''
    });
    setAdvisorComment('');
    setHighlightedPlanId(null);
    setHighlightedItems({});
    setCustomFields([]);
    setIsEditingComparison(false);
    setCurrentComparisonId(null);
    
    // Reset current plan
    setCurrentPlan({
      id: null,
      planType: 'SME',
      providerName: '',
      selectedCategories: [],
      categoriesData: {},
      catAMembers: 0,
      catAPremium: 0,
      catBMembers: 0,
      catBPremium: 0,
      catCMembers: 0,
      catCPremium: 0,
      catDMembers: 0,
      catDPremium: 0,
      dubaiMembers: 0,
      northernEmiratesMembers: 0,
      policyFee: 0,
      isRecommended: false,
      isRenewal: false,
      annualLimit: '',
      areaOfCoverMode: 'dropdown',
      areaOfCoverDropdown: '',
      areaOfCoverTextarea: ''
    });
  };

  // Load history from cloud
  const loadHistory = async () => {
    const savedHistory = await loadComparisons();
    setHistory(savedHistory);
  };

  // Delete comparison from cloud
  const deleteComparison = async (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    await saveComparisons(updatedHistory);
  };

  // Preview comparison without first page
  const previewComparison = () => {
    if (!companyInfo.companyName) {
      alert('Please enter company name');
      return;
    }
    if (plans.length === 0) {
      alert('Please add at least one plan');
      return;
    }

    const referenceNumber = isEditingComparison ? 
      history.find(h => h.id === currentComparisonId)?.referenceNumber || generateReferenceNumber() 
      : generateReferenceNumber();
    
    // Generate HTML without first page
    const htmlContent = generateHTMLContent(plans, companyInfo, advisorComment, referenceNumber, highlightedPlanId, highlightedItems, customFields, false);
    
    // Open in new tab for preview
    const newWindow = window.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  const getSMEBenefits = () => {
    const companyInfoBenefits = [
      { field: 'network', label: 'Network', options: networkOptions, showMainValue: true, hasTextArea: false, canHighlight: false },
      { field: 'aggregateLimit', label: 'Aggregate Limit', options: AGGREGATE_LIMIT_OPTIONS, showMainValue: true, hasTextArea: false, canHighlight: false }
    ];

    const inpatientBenefits = [
      { field: 'roomType', label: 'Room Type', options: ROOM_TYPE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
        { field: 'inpatientCopay', label: 'Inpatient Copay', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'diagnosticTests', label: 'Diagnostic Tests & Procedures', options: COVERAGE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
      { field: 'drugsMedicines', label: 'Drugs and Medicines', options: COVERAGE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
      { field: 'consultantFees', label: "Consultant's, Surgeon's and Anesthetist's Fees", options: COVERAGE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
      
    ];

    const outpatientBenefits = [
         { field: 'outpatientConsultation', label: 'Outpatient Consultation', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'outpatientCopay', label: 'Outpatient Copay', options: COVERAGE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
      { field: 'diagnosticLabs', label: 'Diagnostic Tests and Labs', options: COVERAGE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
      { field: 'pharmacyLimit', label: 'Pharmacy Limit', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'pharmacyCopay', label: 'Pharmacy Copay', options: COVERAGE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
      { field: 'prescribedPhysiotherapy', label: 'Prescribed Physiotherapy', options: PRESCRIBED_PHYSIOTHERAPY_NETWORK_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
   
    ];

    const otherBenefits = [
      { field: 'maternity', label: 'Maternity', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'routineDental', label: 'Dental Benefits', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'routineOptical', label: 'Optical Benefits', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'preventiveServices', label: 'Preventive Services', options: PREVENTIVE_SERVICES_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
      { field: 'alternativeMedicines', label: 'Alternative Medicines', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'repatriation', label: 'Repatriation', options: COVERAGE_OPTIONS, showMainValue: true, hasTextArea: true, canHighlight: true },
   
    ];

    return { companyInfoBenefits, inpatientBenefits, outpatientBenefits, otherBenefits };
  };

  const getBasicBenefits = () => {
    const basicBenefits = [
      { field: 'inpatientCopay', label: 'Inpatient Copay', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'outpatientConsultation', label: 'Outpatient Consultation', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'outpatientCopay', label: 'Outpatient Copay', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'pharmacyLimit', label: 'Pharmacy Limit', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'pharmacyCopay', label: 'Pharmacy Copay', options: [], showMainValue: false, hasTextArea: true, canHighlight: true },
      { field: 'prescribedPhysiotherapy', label: 'Physiotherapy', options: [], showMainValue: false, hasTextArea: true, canHighlight: true }
    ];

    return { basicBenefits };
  };

  // UPDATED ENHANCED BASIC FIELDS DISPLAY
 // UPDATED ENHANCED BASIC FIELDS DISPLAY - Shows only template fields
// UPDATED ENHANCED BASIC FIELDS DISPLAY - Shows all DHA Enhanced template fields
const showEditableEnhancedBasicFields = () => {
  if (planType !== 'ENHANCED_BASIC' || !currentPlan.providerName) return null;

  // Define ALL possible DHA Enhanced template fields - keys must match categoriesData keys
  const ALL_DHA_ENHANCED_FIELDS = [
    { key: 'planName', label: 'Product Name', type: 'text' },
    { key: 'aggregateLimit', label: 'Annual Limit', type: 'text' },
    { key: 'areaOfCover', label: 'Geographical Scope', type: 'textarea', rows: 3 },
    { key: 'network', label: 'Network', type: 'text' },
    { key: 'accessForOP', label: 'Access for OP', type: 'textarea', rows: 2 },
    { key: 'referralProcedure', label: 'Referral Procedure', type: 'text' },
    { key: 'ipCoinsurance', label: 'IP Co-insurance', type: 'text' },
    { key: 'deductibleConsultation', label: 'Deductible (Consultation)', type: 'text' },
    { key: 'opCoinsurance', label: 'OP Co-insurance', type: 'text' },
    { key: 'pharmacyLimit', label: 'Pharmacy Limit', type: 'text' },
    { key: 'pharmacyCoinsurance', label: 'Pharmacy Co-insurance', type: 'text' },
    { key: 'prescribedPhysiotherapy', label: 'Physiotherapy Sessions', type: 'text' },
    { key: 'maternity', label: 'Maternity', type: 'text' },
    { key: 'dentalDiscounts', label: 'Dental Discounts', type: 'text' },
    { key: 'kidneyDialysis', label: 'Kidney Dialysis', type: 'text' },
    { key: 'organTransplant', label: 'Organ Transplant', type: 'text' },
    { key: 'optical', label: 'Optical', type: 'text' },
    { key: 'opticalDiscount', label: 'Optical Discount', type: 'text' },
    { key: 'returnAirFare', label: 'Return Air Fare', type: 'text' },
    { key: 'annualHealthCheckup', label: 'Annual Health Checkup', type: 'text' },
    { key: 'repatriation', label: 'Repatriation', type: 'text' }
  ];

  // Check which providers need dentalDiscounts/opticalDiscount fields
  const SIMPLIFIED_TEMPLATE_PROVIDERS = [
    'Medgulf Insurance',
    'Orient Insurance',
    'Dubai National Insurance - NextCare',
    'National General Insurance',
    'Liva Insurance BSC'
  ];

  // Define the fields that should appear for simplified template (Basic Template)
  const SIMPLIFIED_TEMPLATE_FIELDS = [
    { key: 'planName', label: 'Product Name', type: 'text' },
    { key: 'aggregateLimit', label: 'Annual Limit', type: 'text' },
    { key: 'areaOfCover', label: 'Geographical Scope', type: 'textarea', rows: 3 },
    { key: 'network', label: 'Network', type: 'text' },
    { key: 'accessForOP', label: 'Access for OP', type: 'textarea', rows: 2 },
    { key: 'referralProcedure', label: 'Referral Procedure', type: 'text' },
    { key: 'ipCoinsurance', label: 'IP Co-insurance', type: 'text' },
    { key: 'deductibleConsultation', label: 'Deductible (Consultation)', type: 'text' },
    { key: 'opCoinsurance', label: 'OP Co-insurance', type: 'text' },
    { key: 'pharmacyLimit', label: 'Pharmacy Limit', type: 'text' },
    { key: 'pharmacyCoinsurance', label: 'Pharmacy Co-insurance', type: 'text' },
    { key: 'prescribedPhysiotherapy', label: 'Physiotherapy Sessions', type: 'text' },
    { key: 'maternity', label: 'Maternity', type: 'text' },
    { key: 'dentalDiscounts', label: 'Dental Discounts', type: 'text' },
    { key: 'opticalDiscount', label: 'Optical Discount', type: 'text' }
  ];

  // Check if current provider is a simplified template provider
  const isSimplifiedProvider = Object.keys(DHA_ENHANCED_PROVIDERS).some(
    key => DHA_ENHANCED_PROVIDERS[key] === currentPlan.providerName && 
    SIMPLIFIED_TEMPLATE_PROVIDERS.includes(key)
  );

  // Use simplified template fields for simplified providers, otherwise use all fields
  // Only show fields that exist in categoriesData (not deleted)
  const allFields = isSimplifiedProvider ? SIMPLIFIED_TEMPLATE_FIELDS : ALL_DHA_ENHANCED_FIELDS;
  const fieldsToShow = allFields.filter(field => currentPlan.categoriesData?.[field.key] !== undefined);

  // Function to delete a field from the current plan
  const deleteField = (fieldKey) => {
    setCurrentPlan(prev => {
      const newCategoriesData = { ...prev.categoriesData };
      delete newCategoriesData[fieldKey];
      return {
        ...prev,
        categoriesData: newCategoriesData
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
        <h3 className="font-bold text-purple-800 mb-3 text-sm">✏️ EDIT TEMPLATE BENEFITS</h3>
        <p className="text-xs text-gray-600 mb-3">
          Review and modify the auto-populated benefits before adding to comparison. Click <span className="text-red-600 font-bold">−</span> to remove a field.
          <span className="block mt-1 text-purple-700 font-medium">
            {isSimplifiedProvider ? '📋 Showing Basic Template fields' : '📋 Showing DHA Enhanced template fields'}
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fieldsToShow.map(field => {
            const fieldValue = formatCategoryData(currentPlan.categoriesData?.[field.key] || {});
            
            return (
              <div key={field.key} className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-700">
                    {field.label}
                  </label>
                  <button
                    type="button"
                    onClick={() => deleteField(field.key)}
                    className="text-red-600 hover:text-red-800 text-lg font-bold px-2 py-0 leading-none hover:bg-red-100 rounded"
                    title={`Remove ${field.label}`}
                  >
                    −
                  </button>
                </div>
                {field.type === 'textarea' ? (
                  <textarea
                    value={fieldValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      const updated = {};
                      currentPlan.selectedCategories.forEach(cat => {
                        updated[cat] = value;
                      });
                      setCurrentPlan(prev => ({
                        ...prev,
                        categoriesData: {
                          ...prev.categoriesData,
                          [field.key]: updated
                        }
                      }));
                    }}
                    className="w-full p-2 border-2 border-purple-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                    rows={field.rows || 3}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                ) : (
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      const updated = {};
                      currentPlan.selectedCategories.forEach(cat => {
                        updated[cat] = value;
                      });
                      setCurrentPlan(prev => ({
                        ...prev,
                        categoriesData: {
                          ...prev.categoriesData,
                          [field.key]: updated
                        }
                      }));
                    }}
                    className="w-full p-2 border-2 border-purple-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Premium fields section - ONLY show for detailed template providers, NOT for simplified */}
        {!isSimplifiedProvider && (currentPlan.catAPremium > 0 || currentPlan.catBPremium > 0) && (
          <div className="mt-4 pt-4 border-t border-purple-300">
            <h4 className="font-bold text-purple-700 mb-2 text-xs">PREMIUM FIELDS</h4>
            <div className="grid grid-cols-2 gap-4">
              {currentPlan.catAPremium > 0 && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">
                    {planType === 'ENHANCED_BASIC' ? 'CAT A Premium' : 'LSB Premium'}
                  </label>
                  <input
                    type="text"
                    value={currentPlan.catAPremium.toLocaleString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(value) && value !== '') {
                        setCurrentPlan(prev => ({
                          ...prev,
                          catAPremium: parseFloat(value)
                        }));
                      }
                    }}
                    className="w-full p-2 border-2 border-purple-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter premium..."
                  />
                </div>
              )}
              {currentPlan.catBPremium > 0 && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">
                    {planType === 'ENHANCED_BASIC' ? 'CAT B Premium' : 'HSB Premium'}
                  </label>
                  <input
                    type="text"
                    value={currentPlan.catBPremium.toLocaleString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(value) && value !== '') {
                        setCurrentPlan(prev => ({
                          ...prev,
                          catBPremium: parseFloat(value)
                        }));
                      }
                    }}
                    className="w-full p-2 border-2 border-purple-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter premium..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
          💡 {isSimplifiedProvider 
            ? 'Showing simplified template fields including Dental Discounts and Optical Discount. Modify as needed and click "Add Plan" below.'
            : 'Showing only fields that exist in the selected template. Modify as needed and click "Add Plan" below.'}
        </div>
      </div>
    </div>
  );
};

  const { companyInfoBenefits, inpatientBenefits, outpatientBenefits, otherBenefits } = 
    planType === 'SME' ? getSMEBenefits() : { companyInfoBenefits: [], inpatientBenefits: [], outpatientBenefits: [], otherBenefits: [] };
  
  const { basicBenefits } = planType === 'BASIC' ? getBasicBenefits() : { basicBenefits: [] };

 return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* LEFT COLUMN - FORM */}
    <div className="bg-white rounded-xl p-5 shadow-2xl">
      <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
        <h3 className="font-bold text-indigo-800 mb-3 text-sm">📑 PLAN TYPE SELECTION</h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="planType"
              checked={planType === 'BASIC'}
              onChange={() => handlePlanTypeChange('BASIC')}
              className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm font-bold text-indigo-700">BASIC</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="planType"
              checked={planType === 'ENHANCED_BASIC'}
              onChange={() => handlePlanTypeChange('ENHANCED_BASIC')}
              className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm font-bold text-indigo-700">ENHANCED BASIC (DHA Enhanced)</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="planType"
              checked={planType === 'SME'}
              onChange={() => handlePlanTypeChange('SME')}
              className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm font-bold text-indigo-700">SME</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-indigo-700">
          {currentPlan.id ? '✏️ Edit Plan' : '➕ Add New Plan'} ({planType})
        </h2>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 font-bold text-sm"
        >
          {isFormVisible ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {isFormVisible && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
            <h3 className="font-bold text-indigo-800 mb-3 text-sm">📋 COMPANY INFORMATION</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Company Name *</label>
                {planType === 'BASIC' ? (
                  <textarea
                    value={companyInfo.companyName}
                    onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                    className="w-full p-2 border-2 border-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                    placeholder="Enter company name"
                  />
                ) : (
                  <input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                    className="w-full p-2 border-2 border-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter company name"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">TPA *</label>
                <select
                  value={companyInfo.tpa}
                  onChange={(e) => handleTpaChange(e.target.value)}
                  className="w-full p-2 border-2 border-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {(planType === 'BASIC' ? BASIC_TPA_OPTIONS : TPA_OPTIONS).map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {companyInfo.tpa === 'Other' && planType === 'SME' && (
                  <input
                    type="text"
                    value={companyInfo.tpaManual}
                    onChange={(e) => handleCompanyInfoChange('tpaManual', e.target.value)}
                    className="w-full p-2 border-2 border-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 mt-2"
                    placeholder="Specify TPA..."
                  />
                )}
              </div>
            </div>
          </div>

          {/* BASIC PLAN DETAILS */}
          {planType === 'BASIC' && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border-2 border-yellow-200">
              <h3 className="font-bold text-yellow-900 mb-3 text-sm">📊 BASIC PLAN DETAILS</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Annual Limit *</label>
                  <select
                    value={currentPlan.annualLimit}
                    onChange={(e) => handleAnnualLimitChange(e.target.value)}
                    className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select Annual Limit</option>
                    {BASIC_ANNUAL_LIMITS.map(limit => (
                      <option key={limit} value={limit}>{limit}</option>
                    ))}
                  </select>
                </div>

                {currentPlan.annualLimit && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">Select Categories *</label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-3">
                          {BASIC_CATEGORY_OPTIONS.map(category => (
                            <label key={category} className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 rounded-lg border-2 border-yellow-200 hover:border-yellow-400 transition">
                              <input
                                type="checkbox"
                                checked={currentPlan.selectedCategories.includes(category)}
                                onChange={(e) => {
                                  const newCategories = e.target.checked
                                    ? [...currentPlan.selectedCategories, category]
                                    : currentPlan.selectedCategories.filter(c => c !== category);
                                  handleCategoryChange(newCategories);
                                }}
                                className="w-4 h-4 text-yellow-600 focus:ring-2 focus:ring-yellow-500"
                              />
                              <span className="text-sm font-bold text-gray-700">{category}</span>
                            </label>
                          ))}
                        </div>
                        {currentPlan.selectedCategories.length > 0 && (
                          <div className="text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            ✓ Selected: {currentPlan.selectedCategories.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {currentPlan.selectedCategories.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Network *</label>
                        <select
                          value={currentPlan.categoriesData?.network?.[currentPlan.selectedCategories[0]] || ''}
                          onChange={(e) => {
                            const networkValue = e.target.value;
                            setCurrentPlan(prev => {
                              const networkData = {};
                              prev.selectedCategories.forEach(cat => {
                                networkData[cat] = networkValue;
                              });
                              return {
                                ...prev,
                                categoriesData: {
                                  ...prev.categoriesData,
                                  network: networkData
                                }
                              };
                            });
                          }}
                          className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="">Select Network</option>
                          {networkOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {currentPlan.categoriesData?.network?.[currentPlan.selectedCategories[0]] && (
                          <div className="text-xs text-green-600 mt-1 font-medium">
                            ✓ Network selected: {currentPlan.categoriesData.network[currentPlan.selectedCategories[0]]}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {currentPlan.selectedCategories.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Area of Cover * (Select Mode)</label>
                    <div className="flex gap-3 mb-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="areaOfCoverMode"
                          checked={currentPlan.areaOfCoverMode === 'dropdown'}
                          onChange={() => handleInputChange('areaOfCoverMode', 'dropdown')}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-xs font-medium">Use Dropdown</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="areaOfCoverMode"
                          checked={currentPlan.areaOfCoverMode === 'textarea'}
                          onChange={() => handleInputChange('areaOfCoverMode', 'textarea')}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-xs font-medium">Use Text Area</span>
                      </label>
                    </div>

                    {currentPlan.areaOfCoverMode === 'dropdown' ? (
                      <select
                        value={currentPlan.areaOfCoverDropdown}
                        onChange={(e) => handleInputChange('areaOfCoverDropdown', e.target.value)}
                        className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select Area of Cover</option>
                        {BASIC_AREA_OF_COVER_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <textarea
                        value={currentPlan.areaOfCoverTextarea}
                        onChange={(e) => handleInputChange('areaOfCoverTextarea', e.target.value)}
                        className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                        rows="3"
                        placeholder="Enter custom area of cover..."
                      />
                    )}
                    {(currentPlan.areaOfCoverDropdown || currentPlan.areaOfCoverTextarea) && (
                      <div className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Area of Cover entered
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BASIC PLAN BENEFITS TABLE */}
          {planType === 'BASIC' && currentPlan.selectedCategories.length > 0 && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border-2 border-teal-200">
              <BenefitSectionTable
                sectionTitle=""
                benefits={basicBenefits}
                categories={currentPlan.selectedCategories}
                categoriesData={currentPlan.categoriesData}
                onChange={handleCategoryDataChange}
                highlightedItems={highlightedItems}
                onHighlightChange={handleBenefitHighlight}
                currentPlanId={currentPlan.id || 'draft'}
                customFields={customFields}
              />
            </div>
          )}

          {/* ENHANCED BASIC PLAN - Show editable fields after template selection */}
          {showEditableEnhancedBasicFields()}

          {/* PROVIDER DETAILS SECTION - Hide provider dropdown for DHA Enhanced, show for others */}
          {planType !== 'ENHANCED_BASIC' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="font-bold text-purple-800 mb-3 text-sm">🏢 PROVIDER DETAILS</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Provider Name *</label>
                  <select
                    value={currentPlan.providerName}
                    onChange={(e) => handleInputChange('providerName', e.target.value)}
                    className="w-full p-2 border-2 border-purple-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Provider</option>
                    {PROVIDER_OPTIONS.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>

              {planType === 'SME' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Categories *</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_OPTIONS.map(category => (
                          <label key={category} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentPlan.selectedCategories.includes(category)}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...currentPlan.selectedCategories, category]
                                  : currentPlan.selectedCategories.filter(c => c !== category);
                                handleCategoryChange(newCategories);
                              }}
                              className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-medium text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                      {currentPlan.selectedCategories.length > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          Selected: {currentPlan.selectedCategories.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {currentPlan.selectedCategories.length > 0 && (
                    <BenefitSectionTable
                      sectionTitle="Company Coverage Details"
                      benefits={companyInfoBenefits}
                      categories={currentPlan.selectedCategories}
                      categoriesData={currentPlan.categoriesData}
                      onChange={handleCategoryDataChange}
                      highlightedItems={highlightedItems}
                      onHighlightChange={handleBenefitHighlight}
                      currentPlanId={currentPlan.id || 'draft'}
                    />
                  )}
                </>
              )}

              {/* Recommended and Renewal checkboxes - Available for both SME and BASIC */}
              <div className="flex gap-3 mt-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPlan.isRecommended}
                    onChange={(e) => handleInputChange('isRecommended', e.target.checked)}
                    className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs font-bold text-green-700">⭐ Recommended</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPlan.isRenewal}
                    onChange={(e) => handleInputChange('isRenewal', e.target.checked)}
                    className="w-4 h-4 text-yellow-600 focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-xs font-bold text-yellow-700">🔄 Renewal</span>
                </label>
              </div>
              </div>
            </div>
          )}


          {/* SME PLAN BENEFITS */}
          {planType === 'SME' && currentPlan.selectedCategories.length > 0 && (
            <>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                <BenefitSectionTable
                  sectionTitle="🏥 INPATIENT BENEFITS"
                  benefits={inpatientBenefits}
                  categories={currentPlan.selectedCategories}
                  categoriesData={currentPlan.categoriesData}
                  onChange={handleCategoryDataChange}
                  highlightedItems={highlightedItems}
                  onHighlightChange={handleBenefitHighlight}
                  currentPlanId={currentPlan.id || 'draft'}
                  customFields={customFields}
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-200">
                <BenefitSectionTable
                  sectionTitle="👨‍⚕️ OUTPATIENT BENEFITS"
                  benefits={outpatientBenefits}
                  categories={currentPlan.selectedCategories}
                  categoriesData={currentPlan.categoriesData}
                  onChange={handleCategoryDataChange}
                  highlightedItems={highlightedItems}
                  onHighlightChange={handleBenefitHighlight}
                  currentPlanId={currentPlan.id || 'draft'}
                  customFields={customFields}
                />
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border-2 border-pink-200">
                <BenefitSectionTable
                  sectionTitle="🏅 OTHER BENEFITS"
                  benefits={otherBenefits}
                  categories={currentPlan.selectedCategories}
                  categoriesData={currentPlan.categoriesData}
                  onChange={handleCategoryDataChange}
                  highlightedItems={highlightedItems}
                  onHighlightChange={handleBenefitHighlight}
                  currentPlanId={currentPlan.id || 'draft'}
                  customFields={customFields}
                />
              </div>
            </>
          )}

          {/* PREMIUM DETAILS */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border-2 border-yellow-300">
            <h3 className="font-bold text-yellow-900 mb-3 text-sm">💰 PREMIUM DETAILS</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {planType === 'BASIC' ? 'LSB Members' : (planType === 'ENHANCED_BASIC' ? 'CAT A Members' : 'Cat A Members')}
                </label>
                <input
                  type="number"
                  value={currentPlan.catAMembers || ''}
                  onChange={(e) => handleNumberChange('catAMembers', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500 no-spinner"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {planType === 'BASIC' ? 'LSB Premium (AED)' : (planType === 'ENHANCED_BASIC' ? 'CAT A Premium (AED)' : 'Cat A Premium (AED)')}
                </label>
                <input
                  type="text"
                  value={currentPlan.catAPremium ? currentPlan.catAPremium.toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(value) && value !== '') {
                      handleNumberChange('catAPremium', parseFloat(value));
                    } else if (value === '') {
                      handleNumberChange('catAPremium', 0);
                    }
                  }}
                  className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                  placeholder="0"
                />
              </div>

              {/* Conditionally show CAT B fields only for ENHANCED_BASIC with dual premiums */}
              {(planType === 'ENHANCED_BASIC' && currentPlan.catBPremium > 0) || planType !== 'ENHANCED_BASIC' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {planType === 'BASIC' ? 'HSB Members' : (planType === 'ENHANCED_BASIC' ? 'CAT B Members' : 'Cat B Members')}
                    </label>
                    <input
                      type="number"
                      value={currentPlan.catBMembers || ''}
                      onChange={(e) => handleNumberChange('catBMembers', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500 no-spinner"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {planType === 'BASIC' ? 'HSB Premium (AED)' : (planType === 'ENHANCED_BASIC' ? 'CAT B Premium (AED)' : 'Cat B Premium (AED)')}
                    </label>
                    <input
                      type="text"
                      value={currentPlan.catBPremium ? currentPlan.catBPremium.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(value) && value !== '') {
                          handleNumberChange('catBPremium', parseFloat(value));
                        } else if (value === '') {
                          handleNumberChange('catBPremium', 0);
                        }
                      }}
                      className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                      placeholder="0"
                    />
                  </div>
                </>
              ) : null}

              {planType === 'SME' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cat C Members</label>
                    <input
                      type="number"
                      value={currentPlan.catCMembers || ''}
                      onChange={(e) => handleNumberChange('catCMembers', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500 no-spinner"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cat C Premium (AED)</label>
                    <input
                      type="text"
                      value={currentPlan.catCPremium ? currentPlan.catCPremium.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(value) && value !== '') {
                          handleNumberChange('catCPremium', parseFloat(value));
                        } else if (value === '') {
                          handleNumberChange('catCPremium', 0);
                        }
                      }}
                      className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cat D Members</label>
                    <input
                      type="number"
                      value={currentPlan.catDMembers || ''}
                      onChange={(e) => handleNumberChange('catDMembers', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500 no-spinner"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cat D Premium (AED)</label>
                    <input
                      type="text"
                      value={currentPlan.catDPremium ? currentPlan.catDPremium.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(value) && value !== '') {
                          handleNumberChange('catDPremium', parseFloat(value));
                        } else if (value === '') {
                          handleNumberChange('catDPremium', 0);
                        }
                      }}
                      className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                      placeholder="0"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Dubai Members</label>
                <input
                  type="number"
                  value={currentPlan.dubaiMembers || ''}
                  onChange={(e) => handleNumberChange('dubaiMembers', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500 no-spinner"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Northern Emirates Members</label>
                <input
                  type="number"
                  value={currentPlan.northernEmiratesMembers || ''}
                  onChange={(e) => handleNumberChange('northernEmiratesMembers', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500 no-spinner"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Policy Fee (AED)</label>
              <input
                type="text"
                value={currentPlan.policyFee ? currentPlan.policyFee.toLocaleString() : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(value) && value !== '') {
                    handleNumberChange('policyFee', parseFloat(value));
                  } else if (value === '') {
                    handleNumberChange('policyFee', 0);
                  }
                }}
                className="w-full p-2 border-2 border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={addOrUpdatePlan}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition"
            >
              {currentPlan.id ? '🔄 Update Plan' : '✅ Add Plan'}
            </button>
            
            {currentPlan.id && (
              <button
                onClick={() => setCurrentPlan({
                  id: null,
                  planType,
                  providerName: '',
                  selectedCategories: [],
                  categoriesData: {},
                  catAMembers: 0,
                  catAPremium: 0,
                  catBMembers: 0,
                  catBPremium: 0,
                  catCMembers: 0,
                  catCPremium: 0,
                  catDMembers: 0,
                  catDPremium: 0,
                  dubaiMembers: 0,
                  northernEmiratesMembers: 0,
                  policyFee: 0,
                  isRecommended: false,
                  isRenewal: false,
                  annualLimit: '',
                  areaOfCoverMode: 'dropdown',
                  areaOfCoverDropdown: '',
                  areaOfCoverTextarea: ''
                })}
                className="bg-gray-500 text-white p-3 rounded-lg font-bold hover:bg-gray-600 transition"
              >
                ✗ Cancel Edit
              </button>
            )}
          </div>
        </div>
      )}

      {/* ADVISOR COMMENT SECTION */}
      <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-2 border-orange-200">
        <h3 className="font-bold text-orange-800 mb-3 text-sm flex items-center gap-2">
          <span className="text-lg">💬</span> ADVISOR COMMENT
        </h3>
        <textarea
          value={advisorComment}
          onChange={(e) => setAdvisorComment(e.target.value)}
          className="w-full p-3 border-2 border-orange-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500"
          rows="4"
          placeholder="Enter your comments, recommendations, or notes for the client..."
        />
      </div>

      {/* CUSTOM FIELDS SECTION */}
      <div className="mt-6 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border-2 border-cyan-200">
        <h3 className="font-bold text-cyan-800 mb-3 text-sm flex items-center gap-2">
          <span className="text-lg">✏️</span> CUSTOM FIELDS
        </h3>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="flex-1 p-2 border-2 border-cyan-300 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter new field name..."
            />
            <button
              onClick={addCustomField}
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-cyan-700 transition text-xs"
            >
              Add Field
            </button>
          </div>
          
          {customFields.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <h4 className="text-sm font-bold text-green-800 mb-3">Custom Fields ({customFields.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="bg-green-600 text-white p-2 border border-green-700 text-left min-w-[150px]">Field</th>
                      {plans.map(plan => (
                        <th key={plan.id} className="bg-green-500 text-white p-2 border border-green-600 text-center min-w-[120px]">
                          {plan.providerName.substring(0, 20)}
                        </th>
                      ))}
                      <th className="bg-red-600 text-white p-2 border border-red-700 text-center w-[80px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customFields.map(field => (
                      <tr key={field.key}>
                        <td className="p-2 border border-green-300 font-bold bg-green-100 text-green-800">{field.label}</td>
                        {plans.map(plan => (
                          <td key={plan.id} className={`p-1 border border-green-300 text-center bg-white ${plan.id === highlightedPlanId ? 'bg-amber-100' : ''}`}>
                            <textarea
                              value={formatCategoryData(plan.categoriesData?.[field.key] || {})}
                              onChange={(e) => updateCustomFieldValue(plan.id, field.key, e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded text-xs"
                              rows="2"
                            />
                          </td>
                        ))}
                        <td className="p-1 border border-red-300 text-center bg-red-50">
                          <button
                            onClick={() => removeCustomField(field.key)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-600 transition"
                            title="Delete this field"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* END OF LEFT COLUMN */}

    {/* RIGHT COLUMN - PLANS LIST & ACTIONS */}
    <div className="bg-white rounded-xl p-5 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-indigo-700">📊 COMPARISON PLANS ({plans.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistoryManager(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition text-sm"
          >
            📋 Saved
          </button>
          <button
            onClick={previewComparison}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition text-sm"
          >
            👁️ Preview
          </button>
          <button
            onClick={saveAndDownload}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm"
          >
            💾 Save & Download
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No plans added yet. Start by adding a plan using the form on the left.
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`border-2 rounded-lg p-4 transition ${
                plan.id === highlightedPlanId 
                  ? 'border-yellow-400 bg-yellow-50' 
                  : plan.isRecommended 
                    ? 'border-green-400 bg-green-50' 
                    : plan.isRenewal 
                      ? 'border-orange-400 bg-orange-50' 
                      : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-800">{plan.providerName}</h3>
                    {plan.isRecommended && (
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">⭐ Recommended</span>
                    )}
                    {plan.isRenewal && (
                      <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">🔄 Renewal</span>
                    )}
                    {plan.id === highlightedPlanId && (
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">🌟 Highlighted</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <strong>Type:</strong> {plan.planType}
                    </div>
                    <div>
                      <strong>Categories:</strong> {plan.selectedCategories?.join(', ')}
                    </div>
                    <div>
                      <strong>Total Premium:</strong> AED {plan.totalPremium?.toLocaleString()}
                    </div>
                    <div>
                      <strong>Grand Total:</strong> AED {plan.grandTotal?.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleHighlightPlan(plan.id)}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      plan.id === highlightedPlanId
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {plan.id === highlightedPlanId ? '★ Highlighted' : '☆ Highlight'}
                  </button>
                  <button
                    onClick={() => editPlan(plan)}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    {/* END OF RIGHT COLUMN */}

    {/* HISTORY MANAGER MODAL */}
    <HistoryManager
      isOpen={showHistoryManager}
      onClose={() => setShowHistoryManager(false)}
      history={history}
      onLoadComparison={loadSavedComparison}
      onDeleteComparison={deleteComparison}
      onNewComparison={startNewComparison}
      onBackToNormal={handleBackToNormal}
    />

    {/* DHA ENHANCED SELECTOR MODAL */}
    {showDHAEnhancedSelector && (
      <DHAEnhancedSelector
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowDHAEnhancedSelector(false)}
      />
    )}
  </div>
);
}
export default PlanGenerator;