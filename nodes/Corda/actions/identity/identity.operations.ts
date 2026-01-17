/**
 * Identity Operations
 *
 * Operations for managing identities and parties on the Corda network.
 * Includes X.500 name resolution, party lookup, and identity verification.
 */

import {
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';

import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { parseX500Name, toX500String, validateX500Name } from '../../utils/x500Utils';

export const identityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['identity'],
			},
		},
		options: [
			{ name: 'Get My Identity', value: 'getMyIdentity', description: 'Get this node\'s legal identity', action: 'Get my identity' },
			{ name: 'Get My Legal Identities', value: 'getMyLegalIdentities', description: 'Get all legal identities for this node', action: 'Get my legal identities' },
			{ name: 'Get Well-Known Party (Name)', value: 'getWellKnownPartyByName', description: 'Get party from X.500 name', action: 'Get well known party by name' },
			{ name: 'Get Well-Known Party (Key)', value: 'getWellKnownPartyByKey', description: 'Get party from public key', action: 'Get well known party by key' },
			{ name: 'Party From X500 Name', value: 'partyFromX500Name', description: 'Resolve party from X.500 name string', action: 'Party from X500 name' },
			{ name: 'Get All Parties', value: 'getAllParties', description: 'Get all known parties on the network', action: 'Get all parties' },
			{ name: 'Get All Notaries', value: 'getAllNotaries', description: 'Get all notary identities', action: 'Get all notaries' },
			{ name: 'Resolve Party', value: 'resolveParty', description: 'Resolve abstract party to concrete', action: 'Resolve party' },
			{ name: 'Get Certificate Chain', value: 'getCertificateChain', description: 'Get certificate chain for a party', action: 'Get certificate chain' },
			{ name: 'Verify Identity', value: 'verifyIdentity', description: 'Verify a party identity', action: 'Verify identity' },
			{ name: 'Get Node Signers', value: 'getNodeSigners', description: 'Get signing keys for this node', action: 'Get node signers' },
			{ name: 'Get Anonymous Party', value: 'getAnonymousParty', description: 'Get anonymous party wrapper', action: 'Get anonymous party' },
			{ name: 'Register Identity', value: 'registerIdentity', description: 'Register external identity mapping', action: 'Register identity' },
			{ name: 'Validate X500 Name', value: 'validateX500Name', description: 'Validate X.500 name format', action: 'Validate X500 name' },
		],
		default: 'getMyIdentity',
	},

	// X.500 Name input
	{
		displayName: 'X.500 Name',
		name: 'x500Name',
		type: 'string',
		default: '',
		placeholder: 'O=PartyA, L=London, C=GB',
		description: 'X.500 name of the party',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['getWellKnownPartyByName', 'partyFromX500Name', 'resolveParty', 'getCertificateChain', 'verifyIdentity', 'validateX500Name'],
			},
		},
	},

	// Public Key input
	{
		displayName: 'Public Key',
		name: 'publicKey',
		type: 'string',
		default: '',
		placeholder: 'Base58 or hex encoded public key',
		description: 'Public key of the party',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['getWellKnownPartyByKey', 'getAnonymousParty'],
			},
		},
	},

	// Party Key for registration
	{
		displayName: 'Party Public Key',
		name: 'partyPublicKey',
		type: 'string',
		default: '',
		description: 'Public key for identity registration',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['registerIdentity'],
			},
		},
	},

	// Include notaries filter
	{
		displayName: 'Include Notaries',
		name: 'includeNotaries',
		type: 'boolean',
		default: false,
		description: 'Whether to include notary identities in results',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['getAllParties'],
			},
		},
	},

	// Exact match option
	{
		displayName: 'Exact Match',
		name: 'exactMatch',
		type: 'boolean',
		default: true,
		description: 'Whether to require exact X.500 name match',
		displayOptions: {
			show: {
				resource: ['identity'],
				operation: ['getWellKnownPartyByName', 'partyFromX500Name'],
			},
		},
	},
];

/**
 * Execute identity operations
 */
export async function executeIdentityOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number
): Promise<any> {
	const credentials = await this.getCredentials('cordaNodeCredentials');

	const client = new CordaRpcClient({
		host: credentials.host as string,
		port: credentials.port as number,
		username: credentials.username as string,
		password: credentials.password as string,
		ssl: credentials.sslEnabled as boolean,
	});

	try {
		switch (operation) {
			case 'getMyIdentity': {
				const nodeInfo = await client.getNodeInfo();
				return {
					identity: nodeInfo.legalIdentities?.[0] || null,
					legalName: nodeInfo.legalIdentities?.[0]?.name || null,
				};
			}

			case 'getMyLegalIdentities': {
				const nodeInfo = await client.getNodeInfo();
				return {
					identities: nodeInfo.legalIdentities || [],
					count: nodeInfo.legalIdentities?.length || 0,
				};
			}

			case 'getWellKnownPartyByName': {
				const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;
				const exactMatch = this.getNodeParameter('exactMatch', itemIndex, true) as boolean;

				// Validate X.500 name
				const validation = validateX500Name(x500Name);
				if (!validation.valid) {
					throw new Error(`Invalid X.500 name: ${validation.errors.join(', ')}`);
				}

				const party = await client.wellKnownPartyFromX500Name(x500Name);
				return {
					party,
					x500Name,
					found: party !== null,
				};
			}

			case 'getWellKnownPartyByKey': {
				const publicKey = this.getNodeParameter('publicKey', itemIndex) as string;

				const result = await client.executeRpc('wellKnownPartyFromAnonymous', {
					publicKey,
				});

				return {
					party: result,
					publicKey,
					found: result !== null,
				};
			}

			case 'partyFromX500Name': {
				const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;
				const exactMatch = this.getNodeParameter('exactMatch', itemIndex, true) as boolean;

				const parsed = parseX500Name(x500Name);
				const canonical = toX500String(parsed);

				const party = await client.wellKnownPartyFromX500Name(exactMatch ? x500Name : canonical);

				return {
					party,
					inputName: x500Name,
					canonicalName: canonical,
					parsed,
					found: party !== null,
				};
			}

			case 'getAllParties': {
				const includeNotaries = this.getNodeParameter('includeNotaries', itemIndex, false) as boolean;

				const result = await client.executeRpc('networkMapSnapshot', {});
				let parties = result?.map((nodeInfo: any) => ({
					legalIdentities: nodeInfo.legalIdentities,
					addresses: nodeInfo.addresses,
					platformVersion: nodeInfo.platformVersion,
				})) || [];

				if (!includeNotaries) {
					const notaries = await client.executeRpc('notaryIdentities', {});
					const notaryNames = new Set(notaries?.map((n: any) => n.name) || []);
					parties = parties.filter((p: any) =>
						!p.legalIdentities?.some((id: any) => notaryNames.has(id.name))
					);
				}

				return {
					parties,
					count: parties.length,
				};
			}

			case 'getAllNotaries': {
				const notaries = await client.executeRpc('notaryIdentities', {});
				return {
					notaries: notaries || [],
					count: notaries?.length || 0,
				};
			}

			case 'resolveParty': {
				const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;

				const party = await client.wellKnownPartyFromX500Name(x500Name);
				if (!party) {
					return {
						resolved: false,
						message: `Party not found: ${x500Name}`,
					};
				}

				return {
					resolved: true,
					party,
					x500Name,
				};
			}

			case 'getCertificateChain': {
				const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;

				const result = await client.executeRpc('partyFromX500Name', { x500Name });
				if (!result) {
					return {
						found: false,
						message: `Party not found: ${x500Name}`,
					};
				}

				// Get certificate chain
				const certChain = await client.executeRpc('getCertificateChain', {
					party: result,
				});

				return {
					party: result,
					certificateChain: certChain || [],
					chainLength: certChain?.length || 0,
				};
			}

			case 'verifyIdentity': {
				const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;

				// First validate the name format
				const validation = validateX500Name(x500Name);
				if (!validation.valid) {
					return {
						valid: false,
						verified: false,
						errors: validation.errors,
					};
				}

				// Then check if party exists on network
				const party = await client.wellKnownPartyFromX500Name(x500Name);

				return {
					valid: true,
					verified: party !== null,
					x500Name,
					party,
				};
			}

			case 'getNodeSigners': {
				const nodeInfo = await client.getNodeInfo();
				const keys = nodeInfo.legalIdentities?.map((id: any) => ({
					name: id.name,
					owningKey: id.owningKey,
				})) || [];

				return {
					signers: keys,
					count: keys.length,
				};
			}

			case 'getAnonymousParty': {
				const publicKey = this.getNodeParameter('publicKey', itemIndex) as string;

				return {
					anonymousParty: {
						owningKey: publicKey,
					},
					type: 'AnonymousParty',
				};
			}

			case 'registerIdentity': {
				const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;
				const partyPublicKey = this.getNodeParameter('partyPublicKey', itemIndex) as string;

				const result = await client.executeRpc('registerIdentity', {
					x500Name,
					publicKey: partyPublicKey,
				});

				return {
					registered: true,
					x500Name,
					publicKey: partyPublicKey,
					result,
				};
			}

			case 'validateX500Name': {
				const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;

				const validation = validateX500Name(x500Name);
				const parsed = validation.valid ? parseX500Name(x500Name) : null;
				const canonical = parsed ? toX500String(parsed) : null;

				return {
					input: x500Name,
					valid: validation.valid,
					errors: validation.errors,
					warnings: validation.warnings,
					parsed,
					canonicalForm: canonical,
				};
			}

			default:
				throw new Error(`Unknown operation: ${operation}`);
		}
	} finally {
		// Connection cleanup handled by client
	}
}
