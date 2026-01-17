/**
 * Confidential Identity Operations
 *
 * Operations for managing anonymous transaction parties.
 * Confidential identities provide privacy in Corda transactions.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { CONFIDENTIAL_IDENTITY_FLOWS } from '../../constants/flows';

export const confidentialIdentityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['confidentialIdentity'] } },
		options: [
			{ name: 'Create Confidential Identity', value: 'createConfidentialIdentity', description: 'Create new confidential identity', action: 'Create confidential identity' },
			{ name: 'Swap Confidential Identities', value: 'swapConfidentialIdentities', description: 'Exchange confidential identities with counterparty', action: 'Swap confidential identities' },
			{ name: 'Request Confidential Identity', value: 'requestConfidentialIdentity', description: 'Request identity from counterparty', action: 'Request confidential identity' },
			{ name: 'Verify Confidential Identity', value: 'verifyConfidentialIdentity', description: 'Verify a confidential identity', action: 'Verify confidential identity' },
			{ name: 'Get Confidential Owner', value: 'getConfidentialOwner', description: 'Get owner of anonymous party', action: 'Get confidential owner' },
			{ name: 'Synchronize Identities', value: 'synchronizeIdentities', description: 'Sync identity mappings', action: 'Synchronize identities' },
			{ name: 'Get Well-Known Identity', value: 'getWellKnownIdentity', description: 'Resolve anonymous to well-known', action: 'Get well-known identity' },
			{ name: 'Register Confidential Key', value: 'registerConfidentialKey', description: 'Register a confidential key', action: 'Register confidential key' },
		],
		default: 'createConfidentialIdentity',
	},
	{
		displayName: 'Counterparty',
		name: 'counterparty',
		type: 'string',
		default: '',
		placeholder: 'O=PartyB, L=New York, C=US',
		description: 'X.500 name of the counterparty',
		displayOptions: { show: { resource: ['confidentialIdentity'], operation: ['swapConfidentialIdentities', 'requestConfidentialIdentity', 'synchronizeIdentities'] } },
	},
	{
		displayName: 'Anonymous Public Key',
		name: 'anonymousPublicKey',
		type: 'string',
		default: '',
		description: 'The anonymous public key to verify or resolve',
		displayOptions: { show: { resource: ['confidentialIdentity'], operation: ['verifyConfidentialIdentity', 'getConfidentialOwner', 'getWellKnownIdentity'] } },
	},
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		description: 'External ID for the confidential identity',
		displayOptions: { show: { resource: ['confidentialIdentity'], operation: ['createConfidentialIdentity'] } },
	},
	{
		displayName: 'Public Key',
		name: 'publicKey',
		type: 'string',
		default: '',
		description: 'Public key to register',
		displayOptions: { show: { resource: ['confidentialIdentity'], operation: ['registerConfidentialKey'] } },
	},
];

export async function executeConfidentialIdentityOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number
): Promise<IDataObject> {
	const credentials = await this.getCredentials('cordaNodeCredentials');
	const client = new CordaRpcClient({
		host: credentials.rpcHost as string,
		port: credentials.rpcPort as number,
		username: credentials.rpcUsername as string,
		password: credentials.rpcPassword as string,
		ssl: credentials.sslEnabled as boolean,
	});

	switch (operation) {
		case 'createConfidentialIdentity': {
			const externalId = this.getNodeParameter('externalId', itemIndex, '') as string;
			const result = await client.executeRpc('createConfidentialIdentity', [externalId || null]);
			const data = (result.data as any);
			return {
				success: result.success,
				anonymousParty: data?.anonymousParty,
				publicKey: data?.publicKey,
			};
		}

		case 'swapConfidentialIdentities': {
			const counterparty = this.getNodeParameter('counterparty', itemIndex) as string;
			const result = await client.startFlow(CONFIDENTIAL_IDENTITY_FLOWS.SWAP_IDENTITIES, [counterparty]);
			const data = (result.data as any);
			return {
				success: result.success,
				ourIdentity: data?.result?.ourIdentity,
				theirIdentity: data?.result?.theirIdentity,
			};
		}

		case 'requestConfidentialIdentity': {
			const counterparty = this.getNodeParameter('counterparty', itemIndex) as string;
			const result = await client.startFlow(CONFIDENTIAL_IDENTITY_FLOWS.REQUEST_KEY, [counterparty]);
			const data = (result.data as any);
			return { success: result.success, identity: data?.result };
		}

		case 'verifyConfidentialIdentity': {
			const anonymousPublicKey = this.getNodeParameter('anonymousPublicKey', itemIndex) as string;
			const result = await client.executeRpc('verifyConfidentialIdentity', [anonymousPublicKey]);
			return { success: result.success, verified: (result.data as any) };
		}

		case 'getConfidentialOwner': {
			const anonymousPublicKey = this.getNodeParameter('anonymousPublicKey', itemIndex) as string;
			const result = await client.executeRpc('confidentialOwner', [anonymousPublicKey]);
			return { success: result.success, owner: (result.data as any) };
		}

		case 'synchronizeIdentities': {
			const counterparty = this.getNodeParameter('counterparty', itemIndex) as string;
			const result = await client.startFlow(CONFIDENTIAL_IDENTITY_FLOWS.SYNC_KEY_MAPPING, [counterparty]);
			const data = (result.data as any);
			return { success: result.success, synced: true, flowId: data?.flowId };
		}

		case 'getWellKnownIdentity': {
			const anonymousPublicKey = this.getNodeParameter('anonymousPublicKey', itemIndex) as string;
			const result = await client.executeRpc('wellKnownPartyFromAnonymous', [anonymousPublicKey]);
			return { success: result.success, party: (result.data as any) };
		}

		case 'registerConfidentialKey': {
			const publicKey = this.getNodeParameter('publicKey', itemIndex) as string;
			const result = await client.executeRpc('registerConfidentialKey', [publicKey]);
			return { success: result.success, registered: (result.data as any) };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
