/**
 * IBIS RICE Operations Portal — Printable Report Translations Architecture
 * Supports future dynamic English / Khmer language toggle across all printed documents.
 */

export type SupportedLanguage = 'en' | 'km';

export interface ReportTranslationDict {
  companyName: string;
  receiptTitle: string;
  receiptSubtitle: string;
  transportTitle: string;
  transportSubtitle: string;
  warehouseTitle: string;
  warehouseSubtitle: string;
  financeTitle: string;
  financeSubtitle: string;
  
  receiptNo: string;
  dateTime: string;
  purchasingStaff: string;
  familyCode: string;
  farmerName: string;
  village: string;
  varietyGrade: string;
  sacks: string;
  weightKg: string;
  unitPriceKhr: string;
  grossTotalKhr: string;
  grossPaddyValue: string;
  seedDeduction: string;
  netPaymentToFarmer: string;
  farmerSignature: string;
  staffSignature: string;

  transportId: string;
  truckPlate: string;
  driverName: string;
  mobileNumber: string;
  loadingStation: string;
  destinationWarehouse: string;
  totalFieldWeight: string;

  receivingId: string;
  warehouseGross: string;
  warehouseTare: string;
  warehouseNet: string;
  weightDiff: string;
  variancePercent: string;

  totalLoadedFarmers: string;
  totalDisbursementAmount: string;
  accountHolderName: string;
  relationship: string;
  bankAccount: string;
  netPaymentKhr: string;
  financeOfficer: string;
  treasuryApprover: string;
}

export const reportTranslations: Record<SupportedLanguage, ReportTranslationDict> = {
  en: {
    companyName: 'IBIS RICE CONSERVATION CO., LTD',
    receiptTitle: 'OFFICIAL PADDY PURCHASE RECEIPT',
    receiptSubtitle: 'Chhaeb & Kulen Field Operations Center · Preah Vihear Province',
    transportTitle: 'TRUCK TRANSPORT DISPATCH MANIFEST',
    transportSubtitle: 'Multi-Purchase Farmer Paddy Truckload Transport Document',
    warehouseTitle: 'WEIGHBRIDGE SCALE RECEIVING REPORT',
    warehouseSubtitle: 'Central Mill Warehouse Intake & Weighbridge Audit',
    financeTitle: 'COMMERCIAL BANK BULK PAYMENT DISBURSEMENT MANIFEST',
    financeSubtitle: 'Phnom Penh Finance Treasury · Preah Vihear Organic Procurement',

    receiptNo: 'Receipt No:',
    dateTime: 'Date & Time:',
    purchasingStaff: 'Purchasing Staff:',
    familyCode: 'Family Code:',
    farmerName: 'Farmer Name:',
    village: 'Village:',
    varietyGrade: 'Variety / Grade',
    sacks: 'Sacks',
    weightKg: 'Weight (kg)',
    unitPriceKhr: 'Unit Price (KHR)',
    grossTotalKhr: 'Gross Total (KHR)',
    grossPaddyValue: 'Gross Paddy Value:',
    seedDeduction: 'Seed Repayment Deduction (10%):',
    netPaymentToFarmer: 'NET PAYMENT TO FARMER:',
    farmerSignature: 'Farmer Signature (Seller)',
    staffSignature: 'Purchasing Staff Signature (Buyer)',

    transportId: 'Transport ID:',
    truckPlate: 'Truck Plate Number:',
    driverName: 'Driver Name:',
    mobileNumber: 'Driver Mobile:',
    loadingStation: 'Loading Station:',
    destinationWarehouse: 'Destination Warehouse:',
    totalFieldWeight: 'Total Loaded Field Weight:',

    receivingId: 'Warehouse Receiving ID:',
    warehouseGross: 'Warehouse Gross Weight:',
    warehouseTare: 'Warehouse Tare Weight:',
    warehouseNet: 'Warehouse Net Weight:',
    weightDiff: 'Weight Difference (kg):',
    variancePercent: 'Variance (%):',

    totalLoadedFarmers: 'Total Loaded Farmers:',
    totalDisbursementAmount: 'Total Disbursement Amount:',
    accountHolderName: 'Account Holder Name',
    relationship: 'Relationship',
    bankAccount: 'Bank & Account Number',
    netPaymentKhr: 'Net Payment (KHR)',
    financeOfficer: 'Finance Verification',
    treasuryApprover: 'Payment Approver',
  },

  km: {
    companyName: 'ក្រុមហ៊ុន អាយប៊ីស រ៉ាយស៍ ខនសើវេសិន ខូអិលធីឌី',
    receiptTitle: 'វិក្កយបត្រទិញស្រូវផ្លូវការ',
    receiptSubtitle: 'មជ្ឈមណ្ឌលប្រតិបត្តិការវាលស្រែឆែប និងគូលែន · ខេត្តព្រះវិហារ',
    transportTitle: 'ផ្ទាំងព័ត៌មានដឹកជញ្ជូនស្រូវតាមរថយន្ត',
    transportSubtitle: 'ឯកសារដឹកជញ្ជូនស្រូវពីកសិករច្រើនគ្រួសារតាមរថយន្ត',
    warehouseTitle: 'របាយការណ៍ទទួលស្រូវនៅជញ្ជីងថ្លឹងឃ្លាំង',
    warehouseSubtitle: 'ការពិនិត្យជញ្ជីងថ្លឹង និងការទទួលស្រូវនៅឃ្លាំងម៉ាស៊ីនកិនស្រូវកណ្តាល',
    financeTitle: 'របាយការណ៍បង់ប្រាក់ស្រូវតាមធនាគារពាណិជ្ជ',
    financeSubtitle: 'បេឡាប្រាក់ហិរញ្ញវត្ថុភ្នំពេញ · ការរៀបចំទិញស្រូវសរីរាង្គខេត្តព្រះវិហារ',

    receiptNo: 'លេខវិក្កយបត្រ:',
    dateTime: 'កាលបរិច្ឆេទ និងម៉ោង:',
    purchasingStaff: 'បុគ្គលិកទិញស្រូវ:',
    familyCode: 'លេខកូដគ្រួសារ:',
    farmerName: 'ឈ្មោះកសិករ:',
    village: 'ភូមិ:',
    varietyGrade: 'ប្រភេទស្រូវ / កម្រិត',
    sacks: 'ចំនួនបាវ',
    weightKg: 'ទម្ងន់ (គីឡូក្រាម)',
    unitPriceKhr: 'តម្លៃឯកតា (រៀល)',
    grossTotalKhr: 'តម្លៃសរុប (រៀល)',
    grossPaddyValue: 'តម្លៃស្រូវសរុប:',
    seedDeduction: 'ការកាត់ប្រាក់ពូជស្រូវ (១០%):',
    netPaymentToFarmer: 'ប្រាក់ត្រូវទូទាត់ជូនកសិករ:',
    farmerSignature: 'ហត្ថលេខាកសិករ (អ្នកលក់)',
    staffSignature: 'ហត្ថលេខាបុគ្គលិកទិញស្រូវ (អ្នកទិញ)',

    transportId: 'លេខកូដដឹកជញ្ជូន:',
    truckPlate: 'ស្លាកលេខរថយន្ត:',
    driverName: 'ឈ្មោះអ្នកបើកបរ:',
    mobileNumber: 'លេខទូរស័ព្ទ:',
    loadingStation: 'ទីតាំងផ្ទុកស្រូវ:',
    destinationWarehouse: 'ឃ្លាំងគោលដៅ:',
    totalFieldWeight: 'ទម្ងន់សរុបនៅវាល:',

    receivingId: 'លេខកូដទទួលនៅឃ្លាំង:',
    warehouseGross: 'ទម្ងន់សរុបនៅឃ្លាំង:',
    warehouseTare: 'ទម្ងន់ឡានទទេ:',
    warehouseNet: 'ទម្ងន់ស្រូវសុទ្ធនៅឃ្លាំង:',
    weightDiff: 'ផលខុសគ្នានៃទម្ងន់ (គីឡូក្រាម):',
    variancePercent: 'ភាគរយប្រែប្រួល (%):',

    totalLoadedFarmers: 'ចំនួនកសិករសរុប:',
    totalDisbursementAmount: 'ចំនួនប្រាក់ត្រូវទូទាត់សរុប:',
    accountHolderName: 'ឈ្មោះម្ចាស់គណនី',
    relationship: 'ទំនាក់ទំនង',
    bankAccount: 'ធនាគារ និងលេខគណនី',
    netPaymentKhr: 'ប្រាក់ទូទាត់សុទ្ធ (រៀល)',
    financeOfficer: 'ការផ្ទៀងផ្ទាត់ហិរញ្ញវត្ថុ',
    treasuryApprover: 'អ្នកអនុម័តការទូទាត់',
  },
};

/**
 * Get report translation dictionary for current active language (default: 'en')
 */
export function getReportTranslation(lang: SupportedLanguage = 'en'): ReportTranslationDict {
  return reportTranslations[lang] || reportTranslations.en;
}
