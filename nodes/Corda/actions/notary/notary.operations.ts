/**
 * Notary Operations
 *
 * Operations for Corda notary services.
 * Notaries provide consensus and prevent double-spending.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

export const notaryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['notary'] } },
		options: [
			{ name: 'Get Notary Identities', value: 'getNotaryIdentities', description: 'Get all notaries on network', action: 'Get notary identities' },
			{ name: 'Get Notary Info', value: 'getNotaryInfo', description: 'Get detailed notary information', action: 'Get notary info' },
			{ name: 'Get Notary Service Type', value: 'getNotaryServiceType', description: 'Get notary service type', action: 'Get notary service type' },
			{ name: 'Get Notary Cluster', value: 'getNotaryCluster', description: 'Get notary cluster members', action: 'Get notary cluster' },
			{ name: 'Is Validating Notary', value: 'isValidatingNotary', description: 'Check if notary is validating', action: 'Is validating notary' },
			{ name: 'Get Notary Whitelist', value: 'getNotaryWhitelist', description: 'Get notary contract whitelist', action: 'Get notary whitelist' },
			{ name: 'Get Notary Back Pressure', value: 'getNotaryBackPressure', description: 'Get notary back pressure status', action: 'Get notary back pressure' },
			{ name: 'Get Notary Health', value: 'getNotaryHealth', description: 'Check notary health status', action: 'Get notary health' },
			{ name: 'Get Notary Flow', value: 'getNotaryFlow', description: 'Get notary flow class', action: 'Get notary flow' },
		],
		default: 'getNotaryIdentities',
	},

	// Notary X.500 Name
	{
		displayName: 'Notary X.500 Name',
		name: 'notaryX500Name',
		type: 'string',
		default: '',
		placeholder: 'O=Notary, L=London, C=GB',
		description: 'X.500 name of the notary',
		displayOptions: { show: { resource: ['notary'], operation: ['getNotaryInfo', 'getNotaryServiceType', 'getNotaryCluster', 'isValidatingNotary', 'getNotaryWhitelist', 'getNotaryBackPressure', 'getNotaryHealth', 'getNotaryFlow'] } },
	},
];

export async function executeNotaryOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number
): Promise<IDataObject> {
	const credentials = await this.getCredentials('cordaNodeCredentials');
	const client = new CordaRpcClient({
		host: credentials.host as string,
		port: credentials.port as number,
		username: credentials.username as string,
		password: credentials.password as string,
		ssl: credentials.sslEnabled as boolean,
	});

	switch (operation) {
		case 'getNotaryIdentities': {
			const response = await client.getNotaryIdentities();
			return {
				notaries: (response as any).success ? (response as any).data : [],
				count: Array.isArray((response as any).data) ? (response as any).data.length : 0,
			};
		}

		case 'getNotaryInfo': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('getNotaryInfo', { notaryX500Name });
			return {
				notary: response,
				notaryX500Name,
				found: response !== null,
			};
		}

		case 'getNotaryServiceType': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('getNotaryServiceType', { notaryX500Name });
			return {
				notaryX500Name,
				serviceType: response?.serviceType,
				isValidating: response?.isValidating,
			};
		}

		case 'getNotaryCluster': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('getNotaryCluster', { notaryX500Name });
			return {
				notaryX500Name,
				clusterMembers: response || [],
				clusterSize: response?.length || 0,
			};
		}

		case 'isValidatingNotary': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('isValidatingNotary', { notaryX500Name });
			return {
				notaryX500Name,
				isValidating: response || false,
			};
		}

		case 'getNotaryWhitelist': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('getNotaryWhitelist', { notaryX500Name });
			return {
				notaryX500Name,
				whitelist: response || [],
				count: response?.length || 0,
			};
		}

		case 'getNotaryBackPressure': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('getNotaryBackPressure', { notaryX500Name });
			return {
				notaryX500Name,
				backPressure: response?.enabled || false,
				queueSize: response?.queueSize,
				maxQueueSize: response?.maxQueueSize,
			};
		}

		case 'getNotaryHealth': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('getNotaryHealth', { notaryX500Name });
			return {
				notaryX500Name,
				healthy: response?.healthy || false,
				status: response?.status,
				latency: response?.latency,
			};
		}

		case 'getNotaryFlow': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const response = await client.executeRpc('getNotaryFlow', { notaryX500Name });
			return {
				notaryX500Name,
				flowClass: response?.flowClass,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
