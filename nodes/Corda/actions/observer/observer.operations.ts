/**
 * Observer Operations
 *
 * Operations for working with Corda observable feeds.
 * Provides access to real-time data streams for vault updates,
 * network map changes, and state machine events.
 */

import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';

import { CordaRpcClient } from '../../transport/cordaRpcClient';

/**
 * Observer Operations - Properties for n8n UI
 */
export const observerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['observer'],
			},
		},
		options: [
			{
				name: 'Get Observable Vault',
				value: 'getObservableVault',
				description: 'Get vault observable feed snapshot',
				action: 'Get observable vault',
			},
			{
				name: 'Get Observable Network Map',
				value: 'getObservableNetworkMap',
				description: 'Get network map observable feed snapshot',
				action: 'Get observable network map',
			},
			{
				name: 'Get Observable State Machine',
				value: 'getObservableStateMachine',
				description: 'Get state machine observable feed snapshot',
				action: 'Get observable state machine',
			},
			{
				name: 'Track Transaction Updates',
				value: 'trackTransactionUpdates',
				description: 'Get recent transaction updates',
				action: 'Track transaction updates',
			},
			{
				name: 'Track Vault Updates',
				value: 'trackVaultUpdates',
				description: 'Get recent vault updates',
				action: 'Track vault updates',
			},
			{
				name: 'Track Network Updates',
				value: 'trackNetworkUpdates',
				description: 'Get recent network map updates',
				action: 'Track network updates',
			},
			{
				name: 'Subscribe to Feed',
				value: 'subscribeToFeed',
				description: 'Subscribe to an observable feed',
				action: 'Subscribe to feed',
			},
			{
				name: 'Unsubscribe from Feed',
				value: 'unsubscribeFromFeed',
				description: 'Unsubscribe from an observable feed',
				action: 'Unsubscribe from feed',
			},
		],
		default: 'getObservableVault',
	},
	{
		displayName: 'Contract State Class',
		name: 'contractStateClass',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['observer'],
				operation: ['getObservableVault', 'trackVaultUpdates'],
			},
		},
		default: '',
		description: 'Fully qualified class name of the contract state to observe',
		placeholder: 'e.g., com.example.states.IOUState',
	},
	{
		displayName: 'State Status',
		name: 'stateStatus',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['observer'],
				operation: ['getObservableVault', 'trackVaultUpdates'],
			},
		},
		options: [
			{ name: 'All', value: 'ALL' },
			{ name: 'Unconsumed', value: 'UNCONSUMED' },
			{ name: 'Consumed', value: 'CONSUMED' },
		],
		default: 'ALL',
		description: 'Filter states by consumption status',
	},
	{
		displayName: 'Flow Run ID',
		name: 'flowRunId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['observer'],
				operation: ['getObservableStateMachine'],
			},
		},
		default: '',
		description: 'Optional flow run ID to filter state machine events',
	},
	{
		displayName: 'Look Back (Seconds)',
		name: 'lookBackSeconds',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['observer'],
				operation: ['trackTransactionUpdates', 'trackVaultUpdates', 'trackNetworkUpdates'],
			},
		},
		default: 60,
		description: 'How far back in time to look for updates',
	},
	{
		displayName: 'Max Events',
		name: 'maxEvents',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['observer'],
				operation: ['trackTransactionUpdates', 'trackVaultUpdates', 'trackNetworkUpdates'],
			},
		},
		default: 100,
		description: 'Maximum number of events to return',
	},
	{
		displayName: 'Feed Type',
		name: 'feedType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['observer'],
				operation: ['subscribeToFeed'],
			},
		},
		options: [
			{ name: 'Vault Updates', value: 'vaultUpdates' },
			{ name: 'Network Map', value: 'networkMap' },
			{ name: 'State Machine', value: 'stateMachine' },
			{ name: 'Transactions', value: 'transactions' },
		],
		default: 'vaultUpdates',
		description: 'Type of feed to subscribe to',
	},
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['observer'],
				operation: ['unsubscribeFromFeed'],
			},
		},
		default: '',
		description: 'ID of the subscription to cancel',
	},
];

/**
 * Execute Observer operation
 */
export async function executeObserverOperation(
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

	try {
		switch (operation) {
			case 'getObservableVault': {
				const contractStateClass = this.getNodeParameter('contractStateClass', itemIndex, '') as string;
				const stateStatus = this.getNodeParameter('stateStatus', itemIndex, 'ALL') as string;

				const criteria: IDataObject = {
					status: stateStatus,
				};

				if (contractStateClass) {
					criteria.contractStateTypes = [contractStateClass];
				}

				const result = await client.executeRpc('vaultTrack', [criteria]);
				const data = result.data as IDataObject;

				return {
					success: true,
					snapshot: {
						states: data?.states || [],
						statesMetadata: data?.statesMetadata || [],
						totalStatesAvailable: data?.totalStatesAvailable || 0,
					},
					observableStatus: 'active',
					feedType: 'vaultUpdates',
				};
			}

			case 'getObservableNetworkMap': {
				const result = await client.executeRpc('networkMapFeed', []);
				const data = result.data as IDataObject;
				const snapshot = data?.snapshot as IDataObject[] || [];

				return {
					success: true,
					snapshot: {
						nodeInfos: snapshot,
						count: snapshot.length,
					},
					observableStatus: 'active',
					feedType: 'networkMap',
				};
			}

			case 'getObservableStateMachine': {
				const flowRunId = this.getNodeParameter('flowRunId', itemIndex, '') as string;

				const params: IDataObject = {};
				if (flowRunId) {
					params.flowRunId = flowRunId;
				}

				const result = await client.executeRpc('stateMachinesFeed', [params]);
				const data = result.data as IDataObject;
				const snapshot = data?.snapshot as IDataObject[] || [];

				return {
					success: true,
					snapshot: {
						stateMachines: snapshot,
						count: snapshot.length,
					},
					observableStatus: 'active',
					feedType: 'stateMachine',
				};
			}

			case 'trackTransactionUpdates': {
				const lookBackSeconds = this.getNodeParameter('lookBackSeconds', itemIndex, 60) as number;
				const maxEvents = this.getNodeParameter('maxEvents', itemIndex, 100) as number;

				const now = new Date();
				const fromTime = new Date(now.getTime() - lookBackSeconds * 1000);

				const result = await client.executeRpc('getTransactionRecordingEvents', [
					{
						from: fromTime.toISOString(),
						limit: maxEvents,
					},
				]);
				const data = result.data as IDataObject;
				const events = data?.events as IDataObject[] || [];

				return {
					success: true,
					events,
					count: events.length,
					timeRange: {
						from: fromTime.toISOString(),
						to: now.toISOString(),
					},
				};
			}

			case 'trackVaultUpdates': {
				const contractStateClass = this.getNodeParameter('contractStateClass', itemIndex, '') as string;
				const stateStatus = this.getNodeParameter('stateStatus', itemIndex, 'ALL') as string;
				const lookBackSeconds = this.getNodeParameter('lookBackSeconds', itemIndex, 60) as number;
				const maxEvents = this.getNodeParameter('maxEvents', itemIndex, 100) as number;

				const now = new Date();
				const fromTime = new Date(now.getTime() - lookBackSeconds * 1000);

				const criteria: IDataObject = {
					status: stateStatus,
					timeCondition: {
						type: 'RECORDED',
						from: fromTime.toISOString(),
					},
				};

				if (contractStateClass) {
					criteria.contractStateTypes = [contractStateClass];
				}

				const result = await client.queryVault(
					contractStateClass || 'net.corda.core.contracts.ContractState',
					criteria,
					{ pageNumber: 1, pageSize: maxEvents }
				);
				const data = result.data as IDataObject;
				const states = data?.states as IDataObject[] || [];

				const updates: IDataObject[] = [];
				for (const stateAndRef of states) {
					updates.push({
						type: 'produced',
						stateRef: stateAndRef.ref,
						state: stateAndRef.state,
						recordedTime: (stateAndRef.state as IDataObject)?.recordedTime,
					});
				}

				return {
					success: true,
					updates,
					count: updates.length,
					timeRange: {
						from: fromTime.toISOString(),
						to: now.toISOString(),
					},
				};
			}

			case 'trackNetworkUpdates': {
				const lookBackSeconds = this.getNodeParameter('lookBackSeconds', itemIndex, 60) as number;
				const maxEvents = this.getNodeParameter('maxEvents', itemIndex, 100) as number;

				const now = new Date();
				const fromTime = new Date(now.getTime() - lookBackSeconds * 1000);

				const result = await client.executeRpc('getNetworkMapUpdateEvents', [
					{
						from: fromTime.toISOString(),
						limit: maxEvents,
					},
				]);
				const data = result.data as IDataObject;
				const events = data?.events as IDataObject[] || [];

				return {
					success: true,
					events,
					count: events.length,
					timeRange: {
						from: fromTime.toISOString(),
						to: now.toISOString(),
					},
				};
			}

			case 'subscribeToFeed': {
				const feedType = this.getNodeParameter('feedType', itemIndex) as string;
				const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

				const result = await client.executeRpc('createFeedSubscription', [
					{
						feedType,
						subscriptionId,
					},
				]);
				const data = result.data as IDataObject;

				return {
					success: true,
					subscriptionId,
					feedType,
					status: 'subscribed',
					createdAt: new Date().toISOString(),
					message: data?.message || `Subscribed to ${feedType} feed`,
				};
			}

			case 'unsubscribeFromFeed': {
				const subscriptionId = this.getNodeParameter('subscriptionId', itemIndex) as string;

				const result = await client.executeRpc('cancelFeedSubscription', [
					{ subscriptionId },
				]);
				const data = result.data as IDataObject;

				return {
					success: true,
					subscriptionId,
					status: 'unsubscribed',
					cancelledAt: new Date().toISOString(),
					message: data?.message || 'Subscription cancelled',
				};
			}

			default:
				throw new Error(`Unknown operation: ${operation}`);
		}
	} finally {
		await client.close();
	}
}
