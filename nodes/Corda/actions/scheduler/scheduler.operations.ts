import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';

import { CordaRpcClient } from '../../transport/cordaRpcClient';

/**
 * Scheduler Resource Operations
 * 
 * Corda supports scheduled states (SchedulableState) that can trigger
 * automatic flow execution at a specific time. This resource manages
 * scheduled activities and their execution status.
 */

export const schedulerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['scheduler'],
			},
		},
		options: [
			{
				name: 'Get Scheduled States',
				value: 'getScheduledStates',
				description: 'Get all states with scheduled activities',
				action: 'Get scheduled states',
			},
			{
				name: 'Get Scheduled Activities',
				value: 'getScheduledActivities',
				description: 'Get all pending scheduled activities',
				action: 'Get scheduled activities',
			},
			{
				name: 'Cancel Scheduled Activity',
				value: 'cancelScheduledActivity',
				description: 'Cancel a pending scheduled activity',
				action: 'Cancel scheduled activity',
			},
			{
				name: 'Get Schedule for State',
				value: 'getScheduleForState',
				description: 'Get the scheduled activity for a specific state',
				action: 'Get schedule for state',
			},
			{
				name: 'Get Schedule History',
				value: 'getScheduleHistory',
				description: 'Get history of executed scheduled activities',
				action: 'Get schedule history',
			},
		],
		default: 'getScheduledStates',
	},

	// Parameters for cancelScheduledActivity
	{
		displayName: 'State Reference',
		name: 'stateRef',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['scheduler'],
				operation: ['cancelScheduledActivity', 'getScheduleForState'],
			},
		},
		default: '',
		placeholder: 'ABCD1234567890...:0',
		description: 'The StateRef of the scheduled state (format: txHash:outputIndex)',
	},

	// Parameters for filtering
	{
		displayName: 'Contract State Class',
		name: 'contractStateClass',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['scheduler'],
				operation: ['getScheduledStates', 'getScheduledActivities'],
			},
		},
		default: '',
		placeholder: 'com.example.states.ScheduledPaymentState',
		description: 'Filter by contract state class name (optional)',
	},
	{
		displayName: 'Time Range',
		name: 'timeRange',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				resource: ['scheduler'],
				operation: ['getScheduledActivities', 'getScheduleHistory'],
			},
		},
		default: {},
		options: [
			{
				name: 'range',
				displayName: 'Time Range',
				values: [
					{
						displayName: 'From',
						name: 'from',
						type: 'dateTime',
						default: '',
						description: 'Start of time range',
					},
					{
						displayName: 'Until',
						name: 'until',
						type: 'dateTime',
						default: '',
						description: 'End of time range',
					},
				],
			},
		],
		description: 'Filter activities by scheduled time range',
	},
	{
		displayName: 'Include Executed',
		name: 'includeExecuted',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['scheduler'],
				operation: ['getScheduledActivities'],
			},
		},
		default: false,
		description: 'Whether to include already executed activities',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['scheduler'],
				operation: ['getScheduledActivities', 'getScheduleHistory'],
			},
		},
		default: 100,
		description: 'Maximum number of results to return',
	},
];

export async function executeSchedulerOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
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
		await client.testConnection();

		switch (operation) {
			case 'getScheduledStates': {
				const contractStateClass = this.getNodeParameter('contractStateClass', itemIndex, '') as string;
				
				// Query vault for SchedulableState implementations
				const queryParams: IDataObject = {
					contractStateTypes: contractStateClass ? [contractStateClass] : [],
					status: 'UNCONSUMED',
					relevancyStatus: 'ALL',
				};

				const result = await client.executeRpc('vaultQueryBy', [
					{
						criteria: {
							...queryParams,
							// Filter for states that implement SchedulableState
							interfaces: ['net.corda.core.contracts.SchedulableState'],
						},
					},
				]);

				// Extract schedule information from each state
				const scheduledStates = ((result as any).states || []).map((stateAndRef: IDataObject) => {
					const state = stateAndRef.state as IDataObject;
					const data = (state?.data || {}) as IDataObject;
					return {
						stateRef: stateAndRef.ref,
						contractState: data,
						scheduledAt: data.nextScheduledActivity,
						flowClass: data.scheduledActivityFlow,
					};
				});

				return {
					success: true,
					scheduledStates,
					count: scheduledStates.length,
				};
			}

			case 'getScheduledActivities': {
				const contractStateClass = this.getNodeParameter('contractStateClass', itemIndex, '') as string;
				const timeRange = this.getNodeParameter('timeRange', itemIndex, {}) as IDataObject;
				const includeExecuted = this.getNodeParameter('includeExecuted', itemIndex, false) as boolean;
				const limit = this.getNodeParameter('limit', itemIndex, 100) as number;

				// Get scheduled activities from the scheduler service
				const params: IDataObject = {
					contractStateType: contractStateClass || null,
					includeExecuted,
					limit,
				};

				if (timeRange.range) {
					const range = timeRange.range as IDataObject;
					if (range.from) {
						params.scheduledAfter = range.from;
					}
					if (range.until) {
						params.scheduledBefore = range.until;
					}
				}

				const result = await client.executeRpc('getScheduledActivities', [params]);

				return {
					success: true,
					activities: (result as any).activities || [],
					count: result.activities?.length || 0,
				};
			}

			case 'cancelScheduledActivity': {
				const stateRef = this.getNodeParameter('stateRef', itemIndex) as string;

				// Parse the state reference
				const [txHash, indexStr] = stateRef.split(':');
				const outputIndex = parseInt(indexStr, 10);

				if (!txHash || isNaN(outputIndex)) {
					throw new Error('Invalid StateRef format. Expected format: txHash:outputIndex');
				}

				const result = await client.executeRpc('cancelScheduledActivity', [
					{
						txhash: txHash,
						index: outputIndex,
					},
				]);

				return {
					success: true,
					stateRef,
					cancelled: (result as any).cancelled || true,
					message: (result as any).message || 'Scheduled activity cancelled',
				};
			}

			case 'getScheduleForState': {
				const stateRef = this.getNodeParameter('stateRef', itemIndex) as string;

				// Parse the state reference
				const [txHash, indexStr] = stateRef.split(':');
				const outputIndex = parseInt(indexStr, 10);

				if (!txHash || isNaN(outputIndex)) {
					throw new Error('Invalid StateRef format. Expected format: txHash:outputIndex');
				}

				// Get the state from vault
				const stateResult = await client.executeRpc('vaultQueryBy', [
					{
						criteria: {
							stateRefs: [{ txhash: txHash, index: outputIndex }],
						},
					},
				]);

				if (!stateResult.states || stateResult.states.length === 0) {
					throw new Error(`State not found: ${stateRef}`);
				}

				const stateAndRef = stateResult.states[0] as IDataObject;
				const state = stateAndRef.state as IDataObject;
				const data = (state?.data || {}) as IDataObject;

				// Get scheduled activity info
				const scheduleResult = await client.executeRpc('getScheduledActivityFor', [
					{ txhash: txHash, index: outputIndex },
				]);

				return {
					success: true,
					stateRef,
					state: data,
					scheduledActivity: scheduleResult.activity || null,
					scheduledAt: scheduleResult.scheduledAt || data.nextScheduledActivity,
					flowClass: scheduleResult.flowClass || data.scheduledActivityFlow,
					isScheduled: !!scheduleResult.activity,
				};
			}

			case 'getScheduleHistory': {
				const timeRange = this.getNodeParameter('timeRange', itemIndex, {}) as IDataObject;
				const limit = this.getNodeParameter('limit', itemIndex, 100) as number;

				const params: IDataObject = {
					limit,
					executedOnly: true,
				};

				if (timeRange.range) {
					const range = timeRange.range as IDataObject;
					if (range.from) {
						params.executedAfter = range.from;
					}
					if (range.until) {
						params.executedBefore = range.until;
					}
				}

				const result = await client.executeRpc('getScheduledActivityHistory', [params]);

				return {
					success: true,
					history: (result as any).history || [],
					count: result.history?.length || 0,
				};
			}

			default:
				throw new Error(`Unknown operation: ${operation}`);
		}
	} finally {
		await client.close();
	}
}
