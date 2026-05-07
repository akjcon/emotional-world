// FIPS 10-4 country code → ISO 3166-1 alpha-3 mapping.
//
// GDELT V2Locations uses FIPS 10-4 codes; the frontend uses ISO 3166-1
// alpha-3 (matching Natural Earth's ISO_A3_EH property). This is the
// translation layer.
//
// Sourced from the US Census FIPS 10-4 reference and cross-checked
// against ISO 3166-1. Some codes are deprecated/edge cases — extend
// or correct here as needed.

export const FIPS_TO_ISO = {
  AF: 'AFG', AL: 'ALB', AG: 'DZA', AN: 'AND', AO: 'AGO', AC: 'ATG',
  AR: 'ARG', AM: 'ARM', AS: 'AUS', AU: 'AUT', AJ: 'AZE', BF: 'BHS',
  BA: 'BHR', BG: 'BGD', BB: 'BRB', BO: 'BLR', BE: 'BEL', BH: 'BLZ',
  BN: 'BEN', BT: 'BTN', BL: 'BOL', BK: 'BIH', BC: 'BWA', BR: 'BRA',
  BX: 'BRN', BU: 'BGR', UV: 'BFA', BY: 'BDI', CB: 'KHM', CM: 'CMR',
  CA: 'CAN', CV: 'CPV', CT: 'CAF', CD: 'TCD', CI: 'CHL', CH: 'CHN',
  CO: 'COL', CN: 'COM', CG: 'COD', CF: 'COG', CS: 'CRI', IV: 'CIV',
  HR: 'HRV', CU: 'CUB', CY: 'CYP', EZ: 'CZE', DA: 'DNK', DJ: 'DJI',
  DO: 'DMA', DR: 'DOM', EC: 'ECU', EG: 'EGY', ES: 'SLV', EK: 'GNQ',
  ER: 'ERI', EN: 'EST', ET: 'ETH', FJ: 'FJI', FI: 'FIN', FR: 'FRA',
  GB: 'GAB', GA: 'GMB', GG: 'GEO', GM: 'DEU', GH: 'GHA', GR: 'GRC',
  GJ: 'GRD', GT: 'GTM', GV: 'GIN', PU: 'GNB', GY: 'GUY', HA: 'HTI',
  HO: 'HND', HK: 'HKG', HU: 'HUN', IC: 'ISL', IN: 'IND', ID: 'IDN',
  IR: 'IRN', IZ: 'IRQ', EI: 'IRL', IS: 'ISR', IT: 'ITA', JM: 'JAM',
  JA: 'JPN', JO: 'JOR', KZ: 'KAZ', KE: 'KEN', KR: 'KIR', KN: 'PRK',
  KS: 'KOR', KU: 'KWT', KG: 'KGZ', LA: 'LAO', LG: 'LVA', LE: 'LBN',
  LT: 'LSO', LI: 'LBR', LY: 'LBY', LS: 'LIE', LH: 'LTU', LU: 'LUX',
  MK: 'MKD', MA: 'MDG', MI: 'MWI', MY: 'MYS', MV: 'MDV', ML: 'MLI',
  MT: 'MLT', RM: 'MHL', MR: 'MRT', MP: 'MUS', MX: 'MEX', FM: 'FSM',
  MD: 'MDA', MN: 'MCO', MG: 'MNG', MJ: 'MNE', MO: 'MAR', MZ: 'MOZ',
  BM: 'MMR', WA: 'NAM', NR: 'NRU', NP: 'NPL', NL: 'NLD', NZ: 'NZL',
  NU: 'NIC', NG: 'NER', NI: 'NGA', NO: 'NOR', MU: 'OMN', PK: 'PAK',
  PS: 'PLW', PM: 'PAN', PP: 'PNG', PA: 'PRY', PE: 'PER', RP: 'PHL',
  PL: 'POL', PO: 'PRT', QA: 'QAT', RO: 'ROU', RS: 'RUS', RW: 'RWA',
  SC: 'KNA', ST: 'LCA', VC: 'VCT', WS: 'WSM', SM: 'SMR', TP: 'STP',
  SA: 'SAU', SG: 'SEN', RI: 'SRB', SE: 'SYC', SL: 'SLE', SN: 'SGP',
  LO: 'SVK', SI: 'SVN', BP: 'SLB', SO: 'SOM', SF: 'ZAF', OD: 'SSD',
  SP: 'ESP', CE: 'LKA', SU: 'SDN', NS: 'SUR', WZ: 'SWZ', SW: 'SWE',
  SZ: 'CHE', SY: 'SYR', TW: 'TWN', TI: 'TJK', TZ: 'TZA', TH: 'THA',
  TT: 'TLS', TO: 'TGO', TN: 'TON', TD: 'TTO', TS: 'TUN', TU: 'TUR',
  TX: 'TKM', TV: 'TUV', UG: 'UGA', UP: 'UKR', TC: 'ARE', UK: 'GBR',
  US: 'USA', UY: 'URY', UZ: 'UZB', NH: 'VUT', VT: 'VAT', VE: 'VEN',
  VM: 'VNM', YM: 'YEM', ZA: 'ZMB', ZI: 'ZWE',
};
