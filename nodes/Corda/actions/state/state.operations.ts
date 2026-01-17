/**
 * State Operations
 *
 * Operations for managing Corda states.
 * States are immutable data objects representing facts on the ledger.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { parseStateRef } from '../../utils/stateRefUtils';

export const stateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['state'] } },
		options: [
			{ name: 'Get State', value: 'getState', description: 'Get state by StateRef', action: 'Get state' },
			{ name: 'Get State History', value: 'getStateHistory', description: 'Get history of a linear state', action: 'Get state history' },
			{ name: 'Get State Participants', value: 'getStateParticipants', description: 'Get participants of a state', action: 'Get state participants' },
			{ name: 'Get State Contract', value: 'getStateContract', description: 'Get contract class of a state', action: 'Get state contract' },
			{ name: 'Get State Notary', value: 'getStateNotary', description: 'Get notary for a state', action: 'Get state notary' },
			{ name: 'Query Linear State by ID', value: 'queryLinearStateById', description: 'Query linear state by UUID', action: 'Query linear state by ID' },
			{ name: 'Query Linear State by External ID', value: 'queryLinearStateByExternalId', description: 'Query linear state by external ID', action: 'Query linear state by external ID' },
			{ name: 'Get State Constraints', value: 'getStateConstraints', description: 'Get attachment constraints for state', action: 'Get state constraints' },
			{ name: 'Verify State', value: 'verifyState', description: 'Verify state validity', action: 'Verify state' },
			{ name: 'Get State Encumbrance', value: 'getStateEncumbrance', description: 'Get encumbrance for state', action: 'Get state encumbrance' },
			{ name: 'Track State Updates', value: 'trackStateUpdates', description: 'Subscribe to state updates', action: 'Track state updates' },
		],
		default: 'getState',
	},

	// State Reference
	{
		displayName: 'State Reference',
		name: 'stateRef',
		type: 'string',
		default: '',
		placeholder: 'TXHASH:0',
		description: 'State reference in format txHash:index',
		displayOptions: { show: { resource: ['state'], operation: ['getState', 'getStateHistory', 'getStateParticipants', 'getStateContract', 'getStateNotary', 'getStateConstraints', 'verifyState', 'getStateEncumbrance'] } },
	},

	// Linear ID
	{
		displayName: 'Linear ID',
		name: 'linearId',
		type: 'string',
		default: '',
		placeholder: 'UUID',
		description: 'Unique identifier for linear state',
		displayOptions: { show: { resource: ['state'], operation: ['queryLinearStateById', 'trackStateUpdates'] } },
	},

	// External ID
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		description: 'External identifier for linear state',
		displayOptions: { show: { resource: ['state'], operation: ['queryLinearStateByExternalId'] } },
	},

	// Contract State Type for tracking
	{
		displayName: 'Contract State Type',
		name: 'contractStateType',
		type: 'string',
		default: '',
		placeholder: 'com.example.states.MyState',
		description: 'Contract state type to track',
		displayOptions: { show: { resource: ['state'], operation: ['trackStateUpdates'] } },
	},

	// Include consumed states in history
	{
		displayName: 'Include Consumed',
		name: 'includeConsumed',
		type: 'boolean',
		default: true,
		description: 'Whether to include consumed states in history',
		displayOptions: { show: { resource: ['state'], operation: ['getStateHistory'] } },
	},
];

export async function executeStateOperation(
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
		case 'getState': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('getStateByRef', {
				txHash: stateRef.txhash,
				index: stateRef.index,
			});

			return {
				state: response?.state,
				stateRef: stateRefStr,
				found: response?.state !== null,
				contractState: response?.contractState,
			};
		}

		case 'getStateHistory': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const includeConsumed = this.getNodeParameter('includeConsumed', itemIndex, true) as boolean;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('getStateHistory', {
				txHash: stateRef.txhash,
				index: stateRef.index,
				includeConsumed,
			});

			return {
				history: response || [],
				stateRef: stateRefStr,
				count: response?.length || 0,
			};
		}

		case 'getStateParticipants': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('getStateParticipants', {
				txHash: stateRef.txhash,
				index: stateRef.index,
			});

			return {
				participants: response || [],
				stateRef: stateRefStr,
				count: response?.length || 0,
			};
		}

		case 'getStateContract': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('getStateContract', {
				txHash: stateRef.txhash,
				index: stateRef.index,
			});

			return {
				contractClass: response?.contractClass,
				stateRef: stateRefStr,
			};
		}

		case 'getStateNotary': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('getStateNotary', {
				txHash: stateRef.txhash,
				index: stateRef.index,
			});

			return {
				notary: response,
				stateRef: stateRefStr,
			};
		}

		case 'queryLinearStateById': {
			const linearId = this.getNodeParameter('linearId', itemIndex) as string;

			const response = await client.executeRpc('queryLinearStateById', { linearId });
			return {
				states: response?.states || [],
				linearId,
				found: response?.states?.length > 0,
			};
		}

		case 'queryLinearStateByExternalId': {
			const externalId = this.getNodeParameter('externalId', itemIndex) as string;

			const response = await client.executeRpc('queryLinearStateByExternalId', { externalId });
			return {
				states: response?.states || [],
				externalId,
				found: response?.states?.length > 0,
			};
		}

		case 'getStateConstraints': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('getStateConstraints', {
				txHash: stateRef.txhash,
				index: stateRef.index,
			});

			return {
				constraints: response,
				stateRef: stateRefStr,
				constraintType: response?.type,
			};
		}

		case 'verifyState': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('verifyState', {
				txHash: stateRef.txhash,
				index: stateRef.index,
			});

			return {
				valid: response?.valid || false,
				stateRef: stateRefStr,
				errors: response?.errors || [],
			};
		}

		case 'getStateEncumbrance': {
			const stateRefStr = this.getNodeParameter('stateRef', itemIndex) as string;
			const stateRef = parseStateRef(stateRefStr);

			const response = await client.executeRpc('getStateEncumbrance', {
				txHash: stateRef.txhash,
				index: stateRef.index,
			});

			return {
				encumbrance: response?.encumbrance,
				hasEncumbrance: response?.encumbrance !== null,
				stateRef: stateRefStr,
			};
		}

		case 'trackStateUpdates': {
			const linearId = this.getNodeParameter('linearId', itemIndex, '') as string;
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex, '') as string;

			// Returns subscription info - actual streaming handled by trigger node
			return {
				subscriptionId: `state-${Date.now()}`,
				linearId: linearId || undefined,
				contractStateType: contractStateType || undefined,
				message: 'Use Corda Trigger node for real-time state updates',
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
