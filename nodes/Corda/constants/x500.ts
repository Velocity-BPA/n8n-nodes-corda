/**
 * X.500 Name Constants
 * 
 * Standard X.500 distinguished name attributes used in Corda for identity management.
 * Corda uses X.500 names to uniquely identify legal entities on the network.
 */

/**
 * X.500 Attribute Types (OIDs and short names)
 */
export const X500_ATTRIBUTES = {
	// Common Name
	CN: {
		oid: '2.5.4.3',
		shortName: 'CN',
		longName: 'commonName',
		description: 'Common name of the entity',
	},
	
	// Organization
	O: {
		oid: '2.5.4.10',
		shortName: 'O',
		longName: 'organizationName',
		description: 'Legal name of the organization',
		required: true, // Required in Corda
	},
	
	// Organizational Unit
	OU: {
		oid: '2.5.4.11',
		shortName: 'OU',
		longName: 'organizationalUnitName',
		description: 'Organizational unit or department',
	},
	
	// Locality (City)
	L: {
		oid: '2.5.4.7',
		shortName: 'L',
		longName: 'localityName',
		description: 'City or locality',
		required: true, // Required in Corda
	},
	
	// State or Province
	ST: {
		oid: '2.5.4.8',
		shortName: 'ST',
		longName: 'stateOrProvinceName',
		description: 'State or province',
	},
	
	// Country
	C: {
		oid: '2.5.4.6',
		shortName: 'C',
		longName: 'countryName',
		description: 'Two-letter ISO 3166-1 country code',
		required: true, // Required in Corda
	},
} as const;

/**
 * X.500 name parsing regex
 */
export const X500_REGEX = /([A-Za-z]+)=([^,]+)/g;

/**
 * X.500 name validation rules for Corda
 */
export const X500_VALIDATION = {
	// Maximum length for organization name
	MAX_ORG_LENGTH: 128,
	
	// Maximum length for locality
	MAX_LOCALITY_LENGTH: 64,
	
	// Country code must be exactly 2 characters
	COUNTRY_CODE_LENGTH: 2,
	
	// Maximum total X.500 name length
	MAX_TOTAL_LENGTH: 256,
	
	// Allowed characters pattern (Corda restriction)
	ALLOWED_CHARS_PATTERN: /^[a-zA-Z0-9\s\-'.@#&()]+$/,
	
	// Reserved keywords that cannot be used
	RESERVED_KEYWORDS: [
		'Notary',
		'Network Map',
		'Doorman',
	],
} as const;

/**
 * Common country codes
 */
export const COUNTRY_CODES = {
	US: 'United States',
	GB: 'United Kingdom',
	DE: 'Germany',
	FR: 'France',
	JP: 'Japan',
	CN: 'China',
	SG: 'Singapore',
	HK: 'Hong Kong',
	CH: 'Switzerland',
	AU: 'Australia',
	CA: 'Canada',
	NL: 'Netherlands',
	IE: 'Ireland',
	LU: 'Luxembourg',
} as const;

/**
 * Example X.500 names for common network roles
 */
export const EXAMPLE_X500_NAMES = {
	// Bank example
	BANK: 'O=Bank of Example, L=London, C=GB',
	
	// Corporation example
	CORPORATION: 'O=Example Corp, OU=Trading, L=New York, C=US',
	
	// Notary example
	NOTARY: 'O=Notary Service, L=Zurich, C=CH',
	
	// Regulator example
	REGULATOR: 'O=Financial Authority, L=Frankfurt, C=DE',
} as const;

/**
 * X.500 name order for canonical representation
 * Corda requires attributes in this specific order
 */
export const X500_CANONICAL_ORDER = ['CN', 'OU', 'O', 'L', 'ST', 'C'] as const;

/**
 * Common organization types
 */
export const ORGANIZATION_TYPES = {
	BANK: 'Bank',
	INSURANCE: 'Insurance',
	ASSET_MANAGER: 'Asset Manager',
	CUSTODIAN: 'Custodian',
	EXCHANGE: 'Exchange',
	CLEARING_HOUSE: 'Clearing House',
	REGULATOR: 'Regulator',
	CENTRAL_BANK: 'Central Bank',
	CORPORATION: 'Corporation',
	NOTARY: 'Notary Service',
	ORACLE: 'Oracle Service',
} as const;
