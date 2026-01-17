/**
 * SSL Configuration
 * 
 * Utilities for configuring SSL/TLS connections to Corda nodes.
 */

import https from 'https';
import fs from 'fs';

/**
 * SSL configuration options
 */
export interface SslConfig {
	enabled: boolean;
	trustStorePath?: string;
	trustStorePassword?: string;
	keyStorePath?: string;
	keyStorePassword?: string;
	clientCertificate?: string;
	clientKey?: string;
	caCertificate?: string;
	rejectUnauthorized?: boolean;
}

/**
 * HTTPS agent options
 */
export interface HttpsAgentOptions {
	rejectUnauthorized: boolean;
	ca?: Buffer | string;
	cert?: Buffer | string;
	key?: Buffer | string;
	passphrase?: string;
}

/**
 * Create HTTPS agent options from SSL config
 */
export function createHttpsAgentOptions(config: SslConfig): HttpsAgentOptions {
	const options: HttpsAgentOptions = {
		rejectUnauthorized: config.rejectUnauthorized !== false,
	};

	// Load CA certificate
	if (config.caCertificate) {
		options.ca = config.caCertificate;
	} else if (config.trustStorePath && fs.existsSync(config.trustStorePath)) {
		// Note: JKS trust stores would need to be converted to PEM format
		// This is a placeholder for PEM-based trust stores
		options.ca = fs.readFileSync(config.trustStorePath);
	}

	// Load client certificate
	if (config.clientCertificate) {
		options.cert = config.clientCertificate;
	} else if (config.keyStorePath && fs.existsSync(config.keyStorePath)) {
		// Note: JKS key stores would need to be converted to PEM format
		options.cert = fs.readFileSync(config.keyStorePath);
	}

	// Load client key
	if (config.clientKey) {
		options.key = config.clientKey;
	}

	// Key store password (if needed for encrypted keys)
	if (config.keyStorePassword) {
		options.passphrase = config.keyStorePassword;
	}

	return options;
}

/**
 * Create an HTTPS agent with SSL configuration
 */
export function createHttpsAgent(config: SslConfig): https.Agent {
	const options = createHttpsAgentOptions(config);
	return new https.Agent(options);
}

/**
 * Validate SSL configuration
 */
export function validateSslConfig(config: SslConfig): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!config.enabled) {
		return { valid: true, errors: [] };
	}

	// Check trust store
	if (config.trustStorePath && !fs.existsSync(config.trustStorePath)) {
		errors.push(`Trust store not found: ${config.trustStorePath}`);
	}

	// Check key store
	if (config.keyStorePath && !fs.existsSync(config.keyStorePath)) {
		errors.push(`Key store not found: ${config.keyStorePath}`);
	}

	// mTLS requires both cert and key
	if (config.clientCertificate && !config.clientKey) {
		errors.push('Client certificate provided without client key');
	}

	if (config.clientKey && !config.clientCertificate) {
		errors.push('Client key provided without client certificate');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Parse PEM certificate from string
 */
export function parsePemCertificate(pemString: string): string {
	// Normalize line endings
	let normalized = pemString.replace(/\r\n/g, '\n').trim();

	// Ensure proper PEM format
	if (!normalized.startsWith('-----BEGIN')) {
		normalized = `-----BEGIN CERTIFICATE-----\n${normalized}\n-----END CERTIFICATE-----`;
	}

	return normalized;
}

/**
 * Parse PEM private key from string
 */
export function parsePemPrivateKey(pemString: string): string {
	// Normalize line endings
	let normalized = pemString.replace(/\r\n/g, '\n').trim();

	// Ensure proper PEM format
	if (!normalized.startsWith('-----BEGIN')) {
		normalized = `-----BEGIN PRIVATE KEY-----\n${normalized}\n-----END PRIVATE KEY-----`;
	}

	return normalized;
}

/**
 * Extract certificate info (basic parsing)
 */
export function extractCertificateInfo(pemCert: string): {
	subject?: string;
	issuer?: string;
	validFrom?: string;
	validTo?: string;
} {
	// This is a simplified extraction
	// For full parsing, use a proper X.509 library
	const info: {
		subject?: string;
		issuer?: string;
		validFrom?: string;
		validTo?: string;
	} = {};

	// Basic regex extraction (limited functionality)
	const subjectMatch = pemCert.match(/Subject:\s*(.+)/);
	if (subjectMatch) {
		info.subject = subjectMatch[1];
	}

	const issuerMatch = pemCert.match(/Issuer:\s*(.+)/);
	if (issuerMatch) {
		info.issuer = issuerMatch[1];
	}

	return info;
}

/**
 * Check if certificate is self-signed
 */
export function isSelfSigned(subject: string, issuer: string): boolean {
	return subject === issuer;
}

/**
 * SSL/TLS protocol versions
 */
export const TLS_VERSIONS = {
	TLS_1_0: 'TLSv1',
	TLS_1_1: 'TLSv1.1',
	TLS_1_2: 'TLSv1.2',
	TLS_1_3: 'TLSv1.3',
} as const;

/**
 * Recommended cipher suites for Corda
 */
export const RECOMMENDED_CIPHERS = [
	'TLS_AES_256_GCM_SHA384',
	'TLS_CHACHA20_POLY1305_SHA256',
	'TLS_AES_128_GCM_SHA256',
	'ECDHE-ECDSA-AES256-GCM-SHA384',
	'ECDHE-RSA-AES256-GCM-SHA384',
	'ECDHE-ECDSA-AES128-GCM-SHA256',
	'ECDHE-RSA-AES128-GCM-SHA256',
];

/**
 * Create a secure SSL configuration for production
 */
export function createProductionSslConfig(
	caCert: string,
	clientCert?: string,
	clientKey?: string
): SslConfig {
	return {
		enabled: true,
		caCertificate: caCert,
		clientCertificate: clientCert,
		clientKey: clientKey,
		rejectUnauthorized: true,
	};
}

/**
 * Create a development SSL configuration (less strict)
 */
export function createDevelopmentSslConfig(): SslConfig {
	return {
		enabled: true,
		rejectUnauthorized: false,
	};
}
