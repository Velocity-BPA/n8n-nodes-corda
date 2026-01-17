/**
 * X.500 Name Utilities
 * 
 * Utilities for parsing, validating, and manipulating X.500 distinguished names.
 * Corda uses X.500 names as the standard format for identifying legal entities.
 */

import { X500_ATTRIBUTES, X500_VALIDATION, X500_CANONICAL_ORDER, X500_REGEX } from '../constants/x500';

/**
 * Represents a parsed X.500 name
 */
export interface X500Name {
	commonName?: string;
	organizationalUnit?: string;
	organization: string;
	locality: string;
	state?: string;
	country: string;
}

/**
 * Validation result for X.500 names
 */
export interface X500ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Parse an X.500 name string into its component parts
 * 
 * @param x500String - The X.500 name string (e.g., "O=Bank, L=London, C=GB")
 * @returns Parsed X500Name object
 */
export function parseX500Name(x500String: string): X500Name {
	const parts: Record<string, string> = {};
	
	// Reset regex lastIndex
	const regex = new RegExp(X500_REGEX);
	let match;
	
	while ((match = regex.exec(x500String)) !== null) {
		const key = match[1].toUpperCase();
		const value = match[2].trim();
		parts[key] = value;
	}
	
	return {
		commonName: parts.CN,
		organizationalUnit: parts.OU,
		organization: parts.O || '',
		locality: parts.L || '',
		state: parts.ST,
		country: parts.C || '',
	};
}

/**
 * Convert an X500Name object to a canonical string representation
 * 
 * @param name - The X500Name object
 * @returns Canonical X.500 name string
 */
export function toX500String(name: X500Name): string {
	const parts: string[] = [];
	
	for (const attr of X500_CANONICAL_ORDER) {
		let value: string | undefined;
		
		switch (attr) {
			case 'CN':
				value = name.commonName;
				break;
			case 'OU':
				value = name.organizationalUnit;
				break;
			case 'O':
				value = name.organization;
				break;
			case 'L':
				value = name.locality;
				break;
			case 'ST':
				value = name.state;
				break;
			case 'C':
				value = name.country;
				break;
		}
		
		if (value) {
			// Escape special characters
			const escapedValue = value.replace(/([,+="\\<>#;])/g, '\\$1');
			parts.push(`${attr}=${escapedValue}`);
		}
	}
	
	return parts.join(', ');
}

/**
 * Validate an X.500 name string according to Corda requirements
 * 
 * @param x500String - The X.500 name string to validate
 * @returns Validation result with errors and warnings
 */
export function validateX500Name(x500String: string): X500ValidationResult {
	const result: X500ValidationResult = {
		valid: true,
		errors: [],
		warnings: [],
	};
	
	const parsed = parseX500Name(x500String);
	
	// Check required fields
	if (!parsed.organization) {
		result.errors.push('Organization (O) is required');
		result.valid = false;
	}
	
	if (!parsed.locality) {
		result.errors.push('Locality (L) is required');
		result.valid = false;
	}
	
	if (!parsed.country) {
		result.errors.push('Country (C) is required');
		result.valid = false;
	}
	
	// Validate country code length
	if (parsed.country && parsed.country.length !== X500_VALIDATION.COUNTRY_CODE_LENGTH) {
		result.errors.push(`Country code must be exactly ${X500_VALIDATION.COUNTRY_CODE_LENGTH} characters`);
		result.valid = false;
	}
	
	// Validate organization length
	if (parsed.organization && parsed.organization.length > X500_VALIDATION.MAX_ORG_LENGTH) {
		result.errors.push(`Organization name exceeds maximum length of ${X500_VALIDATION.MAX_ORG_LENGTH}`);
		result.valid = false;
	}
	
	// Validate locality length
	if (parsed.locality && parsed.locality.length > X500_VALIDATION.MAX_LOCALITY_LENGTH) {
		result.errors.push(`Locality name exceeds maximum length of ${X500_VALIDATION.MAX_LOCALITY_LENGTH}`);
		result.valid = false;
	}
	
	// Validate total length
	if (x500String.length > X500_VALIDATION.MAX_TOTAL_LENGTH) {
		result.errors.push(`Total X.500 name exceeds maximum length of ${X500_VALIDATION.MAX_TOTAL_LENGTH}`);
		result.valid = false;
	}
	
	// Check for allowed characters
	const allValues = [
		parsed.commonName,
		parsed.organizationalUnit,
		parsed.organization,
		parsed.locality,
		parsed.state,
	].filter(Boolean);
	
	for (const value of allValues) {
		if (value && !X500_VALIDATION.ALLOWED_CHARS_PATTERN.test(value)) {
			result.warnings.push(`Value "${value}" contains characters that may not be allowed`);
		}
	}
	
	// Check for reserved keywords
	for (const keyword of X500_VALIDATION.RESERVED_KEYWORDS) {
		if (parsed.organization && parsed.organization.toLowerCase().includes(keyword.toLowerCase())) {
			result.warnings.push(`Organization name contains reserved keyword: ${keyword}`);
		}
	}
	
	return result;
}

/**
 * Compare two X.500 names for equality
 * 
 * @param name1 - First X.500 name
 * @param name2 - Second X.500 name
 * @returns True if the names are equivalent
 */
export function compareX500Names(name1: string, name2: string): boolean {
	const parsed1 = parseX500Name(name1);
	const parsed2 = parseX500Name(name2);
	
	return (
		parsed1.organization?.toLowerCase() === parsed2.organization?.toLowerCase() &&
		parsed1.locality?.toLowerCase() === parsed2.locality?.toLowerCase() &&
		parsed1.country?.toUpperCase() === parsed2.country?.toUpperCase() &&
		parsed1.organizationalUnit?.toLowerCase() === parsed2.organizationalUnit?.toLowerCase() &&
		parsed1.commonName?.toLowerCase() === parsed2.commonName?.toLowerCase() &&
		parsed1.state?.toLowerCase() === parsed2.state?.toLowerCase()
	);
}

/**
 * Build an X.500 name from individual components
 * 
 * @param organization - Organization name
 * @param locality - Locality (city)
 * @param country - Two-letter country code
 * @param options - Optional additional attributes
 * @returns X.500 name string
 */
export function buildX500Name(
	organization: string,
	locality: string,
	country: string,
	options?: {
		commonName?: string;
		organizationalUnit?: string;
		state?: string;
	}
): string {
	const name: X500Name = {
		organization,
		locality,
		country,
		...options,
	};
	
	return toX500String(name);
}

/**
 * Extract the organization name from an X.500 string
 * 
 * @param x500String - The X.500 name string
 * @returns The organization name
 */
export function getOrganization(x500String: string): string {
	const parsed = parseX500Name(x500String);
	return parsed.organization;
}

/**
 * Check if an X.500 name represents a notary
 * 
 * @param x500String - The X.500 name string
 * @returns True if the name appears to be a notary
 */
export function isNotaryName(x500String: string): boolean {
	const parsed = parseX500Name(x500String);
	const orgLower = parsed.organization.toLowerCase();
	return orgLower.includes('notary') || orgLower.includes('notarisation');
}
