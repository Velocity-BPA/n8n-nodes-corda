/**
 * Network Map Operations
 *
 * Operations for Corda network map.
 * Network map is registry of all nodes on the network.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

export const networkMapOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['networkMap'] } },
		options: [
			{ name: 'Get Network Map', value: 'getNetworkMap', description: 'Get full network map', action: 'Get network map' },
			{ name: 'Get Network Parameters', value: 'getNetworkParameters', description: 'Get network parameters', action: 'Get network parameters' },
			{ name: 'Get All Node Info', value: 'getAllNodeInfo', description: 'Get info for all nodes', action: 'Get all node info' },
			{ name: 'Get Node Info by Name', value: 'getNodeInfoByName', description: 'Get node info by X.500 name', action: 'Get node info by name' },
			{ name: 'Get Node Info by Host', value: 'getNodeInfoByHost', description: 'Get node info by host address', action: 'Get node info by host' },
			{ name: 'Get Modified Time', value: 'getModifiedTime', description: 'Get network map modified time', action: 'Get modified time' },
			{ name: 'Get Minimum Platform Version', value: 'getMinimumPlatformVersion', description: 'Get minimum platform version', action: 'Get minimum platform version' },
			{ name: 'Track Network Map Changes', value: 'trackNetworkMapChanges', description: 'Subscribe to network map updates', action: 'Track network map changes' },
			{ name: 'Get Notary List', value: 'getNotaryList', description: 'Get list of notaries from network', action: 'Get notary list' },
			{ name: 'Get Compatibility Zone Info', value: 'getCompatibilityZoneInfo', description: 'Get compatibility zone details', action: 'Get compatibility zone info' },
		],
		default: 'getNetworkMap',
	},

	// Node X.500 Name
	{
		displayName: 'Node X.500 Name',
		name: 'nodeX500Name',
		type: 'string',
		default: '',
		placeholder: 'O=PartyA, L=London, C=GB',
		description: 'X.500 name of the node',
		displayOptions: { show: { resource: ['networkMap'], operation: ['getNodeInfoByName'] } },
	},

	// Host Address
	{
		displayName: 'Host Address',
		name: 'hostAddress',
		type: 'string',
		default: '',
		placeholder: 'party-a.example.com:10002',
		description: 'Host address of the node',
		displayOptions: { show: { resource: ['networkMap'], operation: ['getNodeInfoByHost'] } },
	},
];

export async function executeNetworkMapOperation(
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
		case 'getNetworkMap': {
			const response = await client.getNetworkMapSnapshot();
			return {
				networkMap: (response as any).success ? (response as any).data : [],
				nodeCount: Array.isArray((response as any).data) ? (response as any).data.length : 0,
			};
		}

		case 'getNetworkParameters': {
			const response = await client.getNetworkParameters();
			return {
				parameters: (response as any).success ? (response as any).data : null,
				success: (response as any).success,
			};
		}

		case 'getAllNodeInfo': {
			const response = await client.getNetworkMapSnapshot();
			const nodes = (response as any).success ? (response as any).data : [];
			return {
				nodes: Array.isArray(nodes) ? nodes.map((node: any) => ({
					legalIdentities: node.legalIdentities,
					addresses: node.addresses,
					platformVersion: node.platformVersion,
					serial: node.serial,
				})) : [],
				count: Array.isArray(nodes) ? nodes.length : 0,
			};
		}

		case 'getNodeInfoByName': {
			const nodeX500Name = this.getNodeParameter('nodeX500Name', itemIndex) as string;

			const response = await client.executeRpc('nodeInfoFromParty', { x500Name: nodeX500Name });
			return {
				nodeInfo: response,
				nodeX500Name,
				found: response !== null,
			};
		}

		case 'getNodeInfoByHost': {
			const hostAddress = this.getNodeParameter('hostAddress', itemIndex) as string;

			const response = await client.executeRpc('nodeInfoByHostAndPort', { hostAddress });
			return {
				nodeInfo: response,
				hostAddress,
				found: response !== null,
			};
		}

		case 'getModifiedTime': {
			const response = await client.executeRpc('getNetworkMapModifiedTime', {});
			return {
				modifiedTime: response,
			};
		}

		case 'getMinimumPlatformVersion': {
			const response = await client.getNetworkParameters();
			return {
				minimumPlatformVersion: (response as any).success ? ((response as any).data as any)?.minimumPlatformVersion : null,
			};
		}

		case 'trackNetworkMapChanges': {
			// Returns subscription info - actual streaming handled by trigger node
			return {
				subscriptionId: `network-map-${Date.now()}`,
				message: 'Use Corda Trigger node for real-time network map updates',
			};
		}

		case 'getNotaryList': {
			const response = await client.getNotaryIdentities();
			return {
				notaries: (response as any).success ? (response as any).data : [],
				count: Array.isArray((response as any).data) ? (response as any).data.length : 0,
			};
		}

		case 'getCompatibilityZoneInfo': {
			const response = await client.getNetworkParameters();
			const params = (response as any).success ? (response as any).data : null;
			return {
				compatibilityZone: {
					networkParameters: params,
					modifiedTime: (params as any)?.modifiedTime,
					epoch: (params as any)?.epoch,
					whitelistedContractImplementations: (params as any)?.whitelistedContractImplementations,
				},
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
