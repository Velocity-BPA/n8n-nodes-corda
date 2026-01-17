/**
 * Node Resource Actions
 * 
 * Operations for querying Corda node information and status.
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

/**
 * Node resource properties for n8n UI
 */
export const nodeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['node'],
			},
		},
		options: [
			{
				name: 'Get Node Info',
				value: 'getNodeInfo',
				description: 'Get information about the connected Corda node',
				action: 'Get node info',
			},
			{
				name: 'Get Node Time',
				value: 'getNodeTime',
				description: 'Get the current time from the node',
				action: 'Get node time',
			},
			{
				name: 'Get Network Parameters',
				value: 'getNetworkParameters',
				description: 'Get the network parameters the node is operating with',
				action: 'Get network parameters',
			},
			{
				name: 'Get Notary Identities',
				value: 'getNotaryIdentities',
				description: 'Get all notary identities on the network',
				action: 'Get notary identities',
			},
			{
				name: 'Get Network Map Snapshot',
				value: 'getNetworkMapSnapshot',
				description: 'Get a snapshot of all nodes on the network',
				action: 'Get network map snapshot',
			},
			{
				name: 'Get Platform Version',
				value: 'getPlatformVersion',
				description: 'Get the Corda platform version of the node',
				action: 'Get platform version',
			},
			{
				name: 'Get Registered Flows',
				value: 'getRegisteredFlows',
				description: 'Get all flows registered on the node',
				action: 'Get registered flows',
			},
			{
				name: 'Clear Network Map Cache',
				value: 'clearNetworkMapCache',
				description: 'Clear the local network map cache',
				action: 'Clear network map cache',
			},
			{
				name: 'Get Node Health',
				value: 'getNodeHealth',
				description: 'Check the health status of the node',
				action: 'Get node health',
			},
			{
				name: 'Test Connection',
				value: 'testConnection',
				description: 'Test connectivity to the Corda node',
				action: 'Test connection',
			},
		],
		default: 'getNodeInfo',
	},
];

/**
 * Execute node operations
 */
export async function executeNodeOperation(
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

	let result: IDataObject = {};

	switch (operation) {
		case 'getNodeInfo': {
			const response = await client.getNodeInfo();
			if ((response as any).success) {
				result = (response as any).data as IDataObject;
			} else {
				throw new Error(`Failed to get node info: ${(response as any).error}`);
			}
			break;
		}

		case 'getNodeTime': {
			const response = await client.getCurrentTime();
			if ((response as any).success) {
				result = { time: (response as any).data };
			} else {
				throw new Error(`Failed to get node time: ${(response as any).error}`);
			}
			break;
		}

		case 'getNetworkParameters': {
			const response = await client.getNetworkParameters();
			if ((response as any).success) {
				result = (response as any).data as IDataObject;
			} else {
				throw new Error(`Failed to get network parameters: ${(response as any).error}`);
			}
			break;
		}

		case 'getNotaryIdentities': {
			const response = await client.getNotaryIdentities();
			if ((response as any).success) {
				result = { notaries: (response as any).data };
			} else {
				throw new Error(`Failed to get notary identities: ${(response as any).error}`);
			}
			break;
		}

		case 'getNetworkMapSnapshot': {
			const response = await client.getNetworkMapSnapshot();
			if ((response as any).success) {
				result = { nodes: (response as any).data };
			} else {
				throw new Error(`Failed to get network map snapshot: ${(response as any).error}`);
			}
			break;
		}

		case 'getPlatformVersion': {
			const response = await client.getPlatformVersion();
			if ((response as any).success) {
				result = { platformVersion: (response as any).data };
			} else {
				throw new Error(`Failed to get platform version: ${(response as any).error}`);
			}
			break;
		}

		case 'getRegisteredFlows': {
			const response = await client.getRegisteredFlows();
			if ((response as any).success) {
				result = { flows: (response as any).data };
			} else {
				throw new Error(`Failed to get registered flows: ${(response as any).error}`);
			}
			break;
		}

		case 'clearNetworkMapCache': {
			const response = await client.clearNetworkMapCache();
			if ((response as any).success) {
				result = { cleared: (response as any).data };
			} else {
				throw new Error(`Failed to clear network map cache: ${(response as any).error}`);
			}
			break;
		}

		case 'getNodeHealth': {
			const response = await client.testConnection();
			result = {
				healthy: (response as any).success,
				error: (response as any).error,
			};
			break;
		}

		case 'testConnection': {
			const response = await client.testConnection();
			result = {
				connected: (response as any).success,
				error: (response as any).error,
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return result;
}
