/**
 * Serialization Utilities
 * 
 * Utilities for serializing and deserializing Corda-specific data structures.
 * 
 * Corda uses AMQP serialization internally, but for REST API and external
 * integrations, JSON is typically used. These utilities help convert between
 * different formats.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Corda amount representation
 */
export interface CordaAmount {
	quantity: number;
	token: {
		tokenIdentifier: string;
		tokenType?: string;
		fractionDigits?: number;
	};
}

/**
 * Corda party representation
 */
export interface CordaParty {
	name: string;
	owningKey?: string;
}

/**
 * Corda secure hash representation
 */
export interface SecureHash {
	algorithm: string;
	bytes: string;
}

/**
 * Linear ID representation
 */
export interface LinearId {
	externalId?: string;
	id: string;
}

/**
 * Create a new LinearId
 * 
 * @param externalId - Optional external ID
 * @returns New LinearId
 */
export function createLinearId(externalId?: string): LinearId {
	return {
		externalId,
		id: uuidv4(),
	};
}

/**
 * Parse a LinearId from a string
 * 
 * @param linearIdString - String representation (format: "externalId_uuid" or just "uuid")
 * @returns Parsed LinearId
 */
export function parseLinearId(linearIdString: string): LinearId {
	const parts = linearIdString.split('_');
	
	if (parts.length === 2) {
		return {
			externalId: parts[0],
			id: parts[1],
		};
	}
	
	return {
		id: linearIdString,
	};
}

/**
 * Serialize a LinearId to string
 * 
 * @param linearId - The LinearId to serialize
 * @returns String representation
 */
export function serializeLinearId(linearId: LinearId): string {
	if (linearId.externalId) {
		return `${linearId.externalId}_${linearId.id}`;
	}
	return linearId.id;
}

/**
 * Parse a Corda amount from various formats
 * 
 * @param value - Amount value
 * @param tokenIdentifier - Token identifier (e.g., "USD", "GBP")
 * @param fractionDigits - Number of decimal places (default: 2)
 * @returns CordaAmount object
 */
export function createAmount(
	value: number | string,
	tokenIdentifier: string,
	fractionDigits: number = 2
): CordaAmount {
	const numValue = typeof value === 'string' ? parseFloat(value) : value;
	const quantity = Math.round(numValue * Math.pow(10, fractionDigits));
	
	return {
		quantity,
		token: {
			tokenIdentifier,
			fractionDigits,
		},
	};
}

/**
 * Format a Corda amount for display
 * 
 * @param amount - The CordaAmount to format
 * @returns Formatted string (e.g., "100.00 USD")
 */
export function formatAmount(amount: CordaAmount): string {
	const fractionDigits = amount.token.fractionDigits || 2;
	const displayValue = amount.quantity / Math.pow(10, fractionDigits);
	return `${displayValue.toFixed(fractionDigits)} ${amount.token.tokenIdentifier}`;
}

/**
 * Create a secure hash from a hex string
 * 
 * @param hexString - The hex-encoded hash
 * @param algorithm - Hash algorithm (default: "SHA-256")
 * @returns SecureHash object
 */
export function createSecureHash(hexString: string, algorithm: string = 'SHA-256'): SecureHash {
	// Remove any '0x' prefix
	const cleanHex = hexString.replace(/^0x/, '');
	
	return {
		algorithm,
		bytes: cleanHex,
	};
}

/**
 * Serialize a SecureHash to string
 * 
 * @param hash - The SecureHash to serialize
 * @returns Hex string representation
 */
export function serializeSecureHash(hash: SecureHash): string {
	return hash.bytes.toUpperCase();
}

/**
 * Serialize a date to Corda timestamp format
 * 
 * @param date - Date to serialize
 * @returns ISO 8601 timestamp string
 */
export function serializeTimestamp(date: Date): string {
	return date.toISOString();
}

/**
 * Parse a Corda timestamp
 * 
 * @param timestamp - Timestamp string
 * @returns Date object
 */
export function parseTimestamp(timestamp: string): Date {
	return new Date(timestamp);
}

/**
 * Serialize a party to Corda format
 * 
 * @param x500Name - X.500 name string
 * @param owningKey - Optional public key
 * @returns CordaParty object
 */
export function createParty(x500Name: string, owningKey?: string): CordaParty {
	return {
		name: x500Name,
		owningKey,
	};
}

/**
 * Convert camelCase to snake_case
 * 
 * @param str - CamelCase string
 * @returns snake_case string
 */
export function toSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 * 
 * @param str - snake_case string
 * @returns camelCase string
 */
export function toCamelCase(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Deep convert object keys from camelCase to snake_case
 * 
 * @param obj - Object to convert
 * @returns Converted object
 */
export function keysToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	
	for (const [key, value] of Object.entries(obj)) {
		const newKey = toSnakeCase(key);
		
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			result[newKey] = keysToSnakeCase(value as Record<string, unknown>);
		} else if (Array.isArray(value)) {
			result[newKey] = value.map((item) =>
				typeof item === 'object' && item !== null
					? keysToSnakeCase(item as Record<string, unknown>)
					: item
			);
		} else {
			result[newKey] = value;
		}
	}
	
	return result;
}

/**
 * Deep convert object keys from snake_case to camelCase
 * 
 * @param obj - Object to convert
 * @returns Converted object
 */
export function keysToCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	
	for (const [key, value] of Object.entries(obj)) {
		const newKey = toCamelCase(key);
		
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			result[newKey] = keysToCamelCase(value as Record<string, unknown>);
		} else if (Array.isArray(value)) {
			result[newKey] = value.map((item) =>
				typeof item === 'object' && item !== null
					? keysToCamelCase(item as Record<string, unknown>)
					: item
			);
		} else {
			result[newKey] = value;
		}
	}
	
	return result;
}

/**
 * Safely parse JSON with error handling
 * 
 * @param jsonString - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
	try {
		return JSON.parse(jsonString) as T;
	} catch {
		return defaultValue;
	}
}

/**
 * Create a flow invocation payload
 * 
 * @param flowClass - Fully qualified flow class name
 * @param flowArgs - Flow constructor arguments
 * @returns Flow invocation payload
 */
export function createFlowPayload(flowClass: string, flowArgs: unknown[]): object {
	return {
		rpcStartFlowRequest: {
			clientId: uuidv4(),
			flowName: flowClass,
			parameters: {
				parametersInJson: JSON.stringify(flowArgs),
			},
		},
	};
}
