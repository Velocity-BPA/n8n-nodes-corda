/**
 * Transaction Operations
 *
 * Operations for managing Corda transactions.
 * Transactions consume input states and produce output states.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

export const transactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['transaction'] } },
		options: [
			{ name: 'Start Flow', value: 'startFlow', description: 'Start a flow to create a transaction', action: 'Start flow' },
			{ name: 'Start Flow with Client ID', value: 'startFlowWithClientId', description: 'Start flow with idempotency key', action: 'Start flow with client ID' },
			{ name: 'Get Flow Outcome', value: 'getFlowOutcome', description: 'Get the result of a completed flow', action: 'Get flow outcome' },
			{ name: 'Track Flow Progress', value: 'trackFlowProgress', description: 'Get flow progress updates', action: 'Track flow progress' },
			{ name: 'Kill Flow', value: 'killFlow', description: 'Terminate a running flow', action: 'Kill flow' },
			{ name: 'Get Running Flows', value: 'getRunningFlows', description: 'List currently running flows', action: 'Get running flows' },
			{ name: 'Get Completed Flows', value: 'getCompletedFlows', description: 'List recently completed flows', action: 'Get completed flows' },
			{ name: 'Get Transaction', value: 'getTransaction', description: 'Get transaction by ID', action: 'Get transaction' },
			{ name: 'Get Transaction History', value: 'getTransactionHistory', description: 'Get transaction history for a state', action: 'Get transaction history' },
			{ name: 'Verify Transaction', value: 'verifyTransaction', description: 'Verify transaction validity', action: 'Verify transaction' },
			{ name: 'Get Transaction Signatures', value: 'getTransactionSignatures', description: 'Get signatures on a transaction', action: 'Get transaction signatures' },
			{ name: 'Get Transaction Attachments', value: 'getTransactionAttachments', description: 'Get attachments in transaction', action: 'Get transaction attachments' },
			{ name: 'Get Transaction Commands', value: 'getTransactionCommands', description: 'Get commands in transaction', action: 'Get transaction commands' },
			{ name: 'Get Transaction Inputs', value: 'getTransactionInputs', description: 'Get input states of transaction', action: 'Get transaction inputs' },
			{ name: 'Get Transaction Outputs', value: 'getTransactionOutputs', description: 'Get output states of transaction', action: 'Get transaction outputs' },
			{ name: 'Get Flow Checkpoints', value: 'getFlowCheckpoints', description: 'Get flow checkpoint data', action: 'Get flow checkpoints' },
		],
		default: 'startFlow',
	},

	// Flow Class Name
	{
		displayName: 'Flow Class Name',
		name: 'flowClassName',
		type: 'string',
		default: '',
		placeholder: 'com.example.flows.MyFlow',
		description: 'Fully qualified flow class name',
		displayOptions: { show: { resource: ['transaction'], operation: ['startFlow', 'startFlowWithClientId'] } },
	},

	// Flow Arguments (JSON)
	{
		displayName: 'Flow Arguments',
		name: 'flowArguments',
		type: 'json',
		default: '{}',
		description: 'Flow constructor arguments as JSON object',
		displayOptions: { show: { resource: ['transaction'], operation: ['startFlow', 'startFlowWithClientId'] } },
	},

	// Client ID
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'string',
		default: '',
		placeholder: 'unique-client-id',
		description: 'Unique client ID for idempotent flow execution',
		displayOptions: { show: { resource: ['transaction'], operation: ['startFlowWithClientId'] } },
	},

	// Flow Run ID
	{
		displayName: 'Flow Run ID',
		name: 'flowRunId',
		type: 'string',
		default: '',
		placeholder: 'UUID',
		description: 'Flow run identifier',
		displayOptions: { show: { resource: ['transaction'], operation: ['getFlowOutcome', 'trackFlowProgress', 'killFlow'] } },
	},

	// Transaction ID
	{
		displayName: 'Transaction ID',
		name: 'transactionId',
		type: 'string',
		default: '',
		placeholder: 'SHA-256 hash',
		description: 'Transaction secure hash ID',
		displayOptions: { show: { resource: ['transaction'], operation: ['getTransaction', 'verifyTransaction', 'getTransactionSignatures', 'getTransactionAttachments', 'getTransactionCommands', 'getTransactionInputs', 'getTransactionOutputs'] } },
	},

	// State Reference for history
	{
		displayName: 'State Reference',
		name: 'stateRef',
		type: 'string',
		default: '',
		placeholder: 'TXHASH:0',
		description: 'State reference to get history for',
		displayOptions: { show: { resource: ['transaction'], operation: ['getTransactionHistory'] } },
	},

	// Wait for completion
	{
		displayName: 'Wait for Completion',
		name: 'waitForCompletion',
		type: 'boolean',
		default: true,
		description: 'Whether to wait for flow to complete',
		displayOptions: { show: { resource: ['transaction'], operation: ['startFlow', 'startFlowWithClientId'] } },
	},

	// Timeout
	{
		displayName: 'Timeout (seconds)',
		name: 'timeout',
		type: 'number',
		default: 60,
		description: 'Maximum time to wait for flow completion',
		displayOptions: { show: { resource: ['transaction'], operation: ['startFlow', 'startFlowWithClientId'] } },
	},
];

export async function executeTransactionOperation(
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
		case 'startFlow': {
			const flowClassName = this.getNodeParameter('flowClassName', itemIndex) as string;
			const flowArguments = this.getNodeParameter('flowArguments', itemIndex, {}) as object;
			const waitForCompletion = this.getNodeParameter('waitForCompletion', itemIndex, true) as boolean;
			const timeout = this.getNodeParameter('timeout', itemIndex, 60) as number;

			// Wrap flow arguments in array if needed
			const argsArray = Array.isArray(flowArguments) ? flowArguments : [flowArguments];
			const response = await client.startFlow(flowClassName, argsArray);
			if (!(response as any).success) {
				throw new Error(`Failed to start flow: ${(response as any).error}`);
			}

			const result: IDataObject = {
				flowRunId: (response as any).data?.flowRunId,
				flowClassName,
				started: true,
			};

			if (waitForCompletion && (response as any).data?.flowRunId) {
				// Poll for completion
				const startTime = Date.now();
				let completed = false;
				while (!completed && (Date.now() - startTime) < timeout * 1000) {
					const statusResponse = await client.executeRpc('getFlowStatus', { flowRunId: (response as any).data.flowRunId });
					if (statusResponse?.status === 'COMPLETED' || statusResponse?.status === 'FAILED') {
						result.status = statusResponse.status;
						result.result = statusResponse.result;
						result.error = statusResponse.error;
						completed = true;
					} else {
						await new Promise(resolve => setTimeout(resolve, 500));
					}
				}
				if (!completed) {
					result.status = 'TIMEOUT';
					result.message = 'Flow did not complete within timeout';
				}
			}

			return result;
		}

		case 'startFlowWithClientId': {
			const flowClassName = this.getNodeParameter('flowClassName', itemIndex) as string;
			const flowArguments = this.getNodeParameter('flowArguments', itemIndex, {}) as object;
			const clientId = this.getNodeParameter('clientId', itemIndex) as string;
			const waitForCompletion = this.getNodeParameter('waitForCompletion', itemIndex, true) as boolean;

			const response = await client.executeRpc('startFlowWithClientId', {
				flowClassName,
				arguments: flowArguments,
				clientId,
			});

			return {
				flowRunId: response?.flowRunId,
				clientId,
				flowClassName,
				result: response?.result,
				status: response?.status || 'STARTED',
			};
		}

		case 'getFlowOutcome': {
			const flowRunId = this.getNodeParameter('flowRunId', itemIndex) as string;

			const response = await client.executeRpc('getFlowResult', { flowRunId });
			return {
				flowRunId,
				status: response?.status || 'UNKNOWN',
				result: response?.result,
				error: response?.error,
			};
		}

		case 'trackFlowProgress': {
			const flowRunId = this.getNodeParameter('flowRunId', itemIndex) as string;

			const response = await client.executeRpc('getFlowProgress', { flowRunId });
			return {
				flowRunId,
				progress: response?.progressSteps || [],
				currentStep: response?.currentStep,
			};
		}

		case 'killFlow': {
			const flowRunId = this.getNodeParameter('flowRunId', itemIndex) as string;

			const response = await client.executeRpc('killFlow', { flowRunId });
			return {
				flowRunId,
				killed: response?.success || false,
				message: response?.message,
			};
		}

		case 'getRunningFlows': {
			const response = await client.executeRpc('getRunningFlows', {});
			return {
				flows: response || [],
				count: response?.length || 0,
			};
		}

		case 'getCompletedFlows': {
			const response = await client.executeRpc('getCompletedFlows', {});
			return {
				flows: response || [],
				count: response?.length || 0,
			};
		}

		case 'getTransaction': {
			const transactionId = this.getNodeParameter('transactionId', itemIndex) as string;

			const response = await client.executeRpc('getTransaction', { txHash: transactionId });
			return {
				transaction: response,
				found: response !== null,
				transactionId,
			};
		}

		case 'getTransactionHistory': {
			const stateRef = this.getNodeParameter('stateRef', itemIndex) as string;
			const [txHash, index] = stateRef.split(':');

			const response = await client.executeRpc('getTransactionHistory', { txHash, index: parseInt(index, 10) });
			return {
				history: response || [],
				stateRef,
			};
		}

		case 'verifyTransaction': {
			const transactionId = this.getNodeParameter('transactionId', itemIndex) as string;

			const response = await client.executeRpc('verifyTransaction', { txHash: transactionId });
			return {
				transactionId,
				valid: response?.valid || false,
				errors: response?.errors || [],
			};
		}

		case 'getTransactionSignatures': {
			const transactionId = this.getNodeParameter('transactionId', itemIndex) as string;

			const response = await client.executeRpc('getTransactionSignatures', { txHash: transactionId });
			return {
				transactionId,
				signatures: response || [],
				count: response?.length || 0,
			};
		}

		case 'getTransactionAttachments': {
			const transactionId = this.getNodeParameter('transactionId', itemIndex) as string;

			const response = await client.executeRpc('getTransactionAttachments', { txHash: transactionId });
			return {
				transactionId,
				attachments: response || [],
				count: response?.length || 0,
			};
		}

		case 'getTransactionCommands': {
			const transactionId = this.getNodeParameter('transactionId', itemIndex) as string;

			const response = await client.executeRpc('getTransactionCommands', { txHash: transactionId });
			return {
				transactionId,
				commands: response || [],
			};
		}

		case 'getTransactionInputs': {
			const transactionId = this.getNodeParameter('transactionId', itemIndex) as string;

			const response = await client.executeRpc('getTransactionInputs', { txHash: transactionId });
			return {
				transactionId,
				inputs: response || [],
				count: response?.length || 0,
			};
		}

		case 'getTransactionOutputs': {
			const transactionId = this.getNodeParameter('transactionId', itemIndex) as string;

			const response = await client.executeRpc('getTransactionOutputs', { txHash: transactionId });
			return {
				transactionId,
				outputs: response || [],
				count: response?.length || 0,
			};
		}

		case 'getFlowCheckpoints': {
			const response = await client.executeRpc('getFlowCheckpoints', {});
			return {
				checkpoints: response || [],
				count: response?.length || 0,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
