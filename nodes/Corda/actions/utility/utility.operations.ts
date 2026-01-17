import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';

import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * Utility operations for helper functions, hashing, parsing, and connection management
 */
export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Close RPC Connection',
				value: 'closeRpcConnection',
				description: 'Close an RPC connection to the Corda node',
				action: 'Close RPC connection',
			},
			{
				name: 'Create External ID',
				value: 'createExternalId',
				description: 'Create a new external ID for use with linear states',
				action: 'Create external ID',
			},
			{
				name: 'Create Linear ID',
				value: 'createLinearId',
				description: 'Create a new unique linear ID (UUID)',
				action: 'Create linear ID',
			},
			{
				name: 'Get State Ref',
				value: 'getStateRef',
				description: 'Create a StateRef object from transaction hash and index',
				action: 'Get state ref',
			},
			{
				name: 'Parse Party',
				value: 'parseParty',
				description: 'Parse a party from X.500 name string',
				action: 'Parse party',
			},
			{
				name: 'Parse State Ref',
				value: 'parseStateRef',
				description: 'Parse a StateRef string into components',
				action: 'Parse state ref',
			},
			{
				name: 'Parse X500 Name',
				value: 'parseX500Name',
				description: 'Parse an X.500 name string into components',
				action: 'Parse X500 name',
			},
			{
				name: 'Secure Hash',
				value: 'secureHash',
				description: 'Generate a SHA-256 hash of input data',
				action: 'Generate secure hash',
			},
			{
				name: 'Test Connection',
				value: 'testConnection',
				description: 'Test the RPC connection to the Corda node',
				action: 'Test connection',
			},
			{
				name: 'Validate X500 Name',
				value: 'validateX500Name',
				description: 'Validate an X.500 name string format',
				action: 'Validate X500 name',
			},
		],
		default: 'testConnection',
	},
	// Parameters for secureHash
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['secureHash'],
			},
		},
		description: 'The data to hash (string or hex-encoded bytes)',
	},
	{
		displayName: 'Algorithm',
		name: 'algorithm',
		type: 'options',
		default: 'SHA-256',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['secureHash'],
			},
		},
		options: [
			{ name: 'SHA-256', value: 'SHA-256' },
			{ name: 'SHA-384', value: 'SHA-384' },
			{ name: 'SHA-512', value: 'SHA-512' },
		],
		description: 'The hash algorithm to use',
	},
	{
		displayName: 'Input Format',
		name: 'inputFormat',
		type: 'options',
		default: 'string',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['secureHash'],
			},
		},
		options: [
			{ name: 'String', value: 'string' },
			{ name: 'Hex', value: 'hex' },
			{ name: 'Base64', value: 'base64' },
		],
		description: 'The format of the input data',
	},
	// Parameters for parseParty and parseX500Name
	{
		displayName: 'X.500 Name',
		name: 'x500Name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['parseParty', 'parseX500Name', 'validateX500Name'],
			},
		},
		placeholder: 'O=PartyA, L=London, C=GB',
		description: 'The X.500 name string to parse or validate',
	},
	// Parameters for getStateRef
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getStateRef'],
			},
		},
		placeholder: '0x1234...',
		description: 'The transaction hash (SecureHash)',
	},
	{
		displayName: 'Output Index',
		name: 'outputIndex',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getStateRef'],
			},
		},
		description: 'The output index within the transaction',
	},
	// Parameters for parseStateRef
	{
		displayName: 'State Ref String',
		name: 'stateRefString',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['parseStateRef'],
			},
		},
		placeholder: 'txHash:index or txHash(index)',
		description: 'The StateRef string to parse (format: hash:index or hash(index))',
	},
	// Parameters for createExternalId
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['createExternalId'],
			},
		},
		placeholder: 'Leave empty to auto-generate',
		description: 'The external ID to use, or leave empty to auto-generate a UUID',
	},
];

/**
 * Execute utility operations
 */
export async function executeUtilityOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject> {
	// Most utility operations don't need RPC, but some do
	let client: CordaRpcClient | null = null;

	const needsRpc = ['testConnection', 'parseParty', 'closeRpcConnection'];
	
	if (needsRpc.includes(operation)) {
		const credentials = await this.getCredentials('cordaNodeCredentials');
		client = new CordaRpcClient({
			host: credentials.rpcHost as string,
			port: credentials.rpcPort as number,
			username: credentials.rpcUsername as string,
			password: credentials.rpcPassword as string,
			ssl: credentials.sslEnabled as boolean,
			sslTrustStorePath: credentials.sslTrustStorePath as string,
			sslTrustStorePassword: credentials.sslTrustStorePassword as string,
		});
	}

	switch (operation) {
		case 'secureHash': {
			const data = this.getNodeParameter('data', itemIndex) as string;
			const algorithm = this.getNodeParameter('algorithm', itemIndex) as string;
			const inputFormat = this.getNodeParameter('inputFormat', itemIndex) as string;

			let buffer: Buffer;
			switch (inputFormat) {
				case 'hex':
					buffer = Buffer.from(data.replace(/^0x/, ''), 'hex');
					break;
				case 'base64':
					buffer = Buffer.from(data, 'base64');
					break;
				default:
					buffer = Buffer.from(data, 'utf-8');
			}

			const hashAlgorithm = algorithm.replace('-', '').toLowerCase();
			const hash = crypto.createHash(hashAlgorithm).update(buffer).digest('hex');

			return {
				success: true,
				algorithm,
				inputLength: buffer.length,
				hash: hash.toUpperCase(),
				hashBytes: Buffer.from(hash, 'hex').toString('base64'),
			};
		}

		case 'parseParty': {
			const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;
			
			// Use RPC to resolve the party
			const party = await client!.executeRpc('wellKnownPartyFromX500Name', { name: x500Name });
			
			return {
				success: party !== null,
				x500Name,
				party: party || null,
				resolved: party !== null,
			};
		}

		case 'parseX500Name': {
			const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;
			
			// Parse X.500 name into components
			const components: IDataObject = {};
			const regex = /([A-Z]+)\s*=\s*([^,]+)/g;
			let match;
			
			while ((match = regex.exec(x500Name)) !== null) {
				const key = match[1].trim();
				const value = match[2].trim();
				
				switch (key) {
					case 'CN':
						components.commonName = value;
						break;
					case 'O':
						components.organisation = value;
						break;
					case 'OU':
						components.organisationUnit = value;
						break;
					case 'L':
						components.locality = value;
						break;
					case 'ST':
						components.state = value;
						break;
					case 'C':
						components.country = value;
						break;
					default:
						components[key.toLowerCase()] = value;
				}
			}

			return {
				success: true,
				originalName: x500Name,
				components,
				isValid: Object.keys(components).length > 0,
			};
		}

		case 'validateX500Name': {
			const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;
			
			const errors: string[] = [];
			const warnings: string[] = [];
			
			// Check for required components (O, L, C are typical Corda requirements)
			const hasO = /O\s*=/.test(x500Name);
			const hasL = /L\s*=/.test(x500Name);
			const hasC = /C\s*=/.test(x500Name);
			
			if (!hasO) errors.push('Missing Organisation (O) component');
			if (!hasL) errors.push('Missing Locality (L) component');
			if (!hasC) errors.push('Missing Country (C) component');
			
			// Check country code format
			const countryMatch = x500Name.match(/C\s*=\s*([^,]+)/);
			if (countryMatch) {
				const country = countryMatch[1].trim();
				if (country.length !== 2) {
					warnings.push('Country code should be 2 characters (ISO 3166-1 alpha-2)');
				}
			}
			
			// Check for special characters
			if (/[<>]/.test(x500Name)) {
				errors.push('X.500 name contains invalid characters (< or >)');
			}
			
			// Check length constraints
			const oMatch = x500Name.match(/O\s*=\s*([^,]+)/);
			if (oMatch && oMatch[1].trim().length > 128) {
				errors.push('Organisation name exceeds 128 characters');
			}

			return {
				success: errors.length === 0,
				x500Name,
				isValid: errors.length === 0,
				errors,
				warnings,
			};
		}

		case 'getStateRef': {
			const txHash = this.getNodeParameter('txHash', itemIndex) as string;
			const outputIndex = this.getNodeParameter('outputIndex', itemIndex) as number;

			// Normalize the transaction hash
			const normalizedHash = txHash.replace(/^0x/, '').toUpperCase();

			return {
				success: true,
				stateRef: {
					txhash: normalizedHash,
					index: outputIndex,
				},
				stateRefString: `${normalizedHash}:${outputIndex}`,
				alternateFormat: `${normalizedHash}(${outputIndex})`,
			};
		}

		case 'parseStateRef': {
			const stateRefString = this.getNodeParameter('stateRefString', itemIndex) as string;
			
			// Parse StateRef in format "hash:index" or "hash(index)"
			let txHash: string;
			let index: number;
			
			const colonMatch = stateRefString.match(/^([A-Fa-f0-9]+):(\d+)$/);
			const parenMatch = stateRefString.match(/^([A-Fa-f0-9]+)\((\d+)\)$/);
			
			if (colonMatch) {
				txHash = colonMatch[1].toUpperCase();
				index = parseInt(colonMatch[2], 10);
			} else if (parenMatch) {
				txHash = parenMatch[1].toUpperCase();
				index = parseInt(parenMatch[2], 10);
			} else {
				throw new Error(`Invalid StateRef format: ${stateRefString}. Expected format: hash:index or hash(index)`);
			}

			return {
				success: true,
				originalString: stateRefString,
				stateRef: {
					txhash: txHash,
					index,
				},
				normalized: `${txHash}:${index}`,
			};
		}

		case 'createLinearId': {
			const uuid = uuidv4();
			
			return {
				success: true,
				linearId: {
					id: uuid,
					externalId: null,
				},
				uuid,
			};
		}

		case 'createExternalId': {
			const externalId = this.getNodeParameter('externalId', itemIndex) as string;
			const uuid = uuidv4();
			const finalExternalId = externalId || uuidv4();
			
			return {
				success: true,
				linearId: {
					id: uuid,
					externalId: finalExternalId,
				},
				uuid,
				externalId: finalExternalId,
			};
		}

		case 'testConnection': {
			try {
				const connected = await client!.testConnection();
				const nodeInfo = connected ? await client!.getNodeInfo() : null;
				
				return {
					success: connected,
					connected,
					nodeInfo: nodeInfo ? {
						legalIdentities: nodeInfo.legalIdentities,
						platformVersion: nodeInfo.platformVersion,
						addresses: nodeInfo.addresses,
					} : null,
					message: connected ? 'Connection successful' : 'Connection failed',
				};
			} catch (error) {
				return {
					success: false,
					connected: false,
					error: (error as Error).message,
					message: 'Connection failed',
				};
			}
		}

		case 'closeRpcConnection': {
			try {
				await client!.close();
				
				return {
					success: true,
					message: 'RPC connection closed successfully',
				};
			} catch (error) {
				return {
					success: false,
					error: (error as Error).message,
					message: 'Failed to close RPC connection',
				};
			}
		}

		default:
			throw new Error(`Unknown utility operation: ${operation}`);
	}
}
