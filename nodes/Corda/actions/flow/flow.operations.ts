/**
 * Flow Operations
 *
 * Operations for flow lifecycle management.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

export const flowOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['flow'] } },
		options: [
			{ name: 'List Registered Flows', value: 'listRegisteredFlows', description: 'Get all registered flows', action: 'List registered flows' },
			{ name: 'Start Flow', value: 'startFlow', description: 'Start a flow', action: 'Start flow' },
			{ name: 'Start Flow Tracked', value: 'startFlowTracked', description: 'Start flow with progress tracking', action: 'Start flow tracked' },
			{ name: 'Get Flow Result', value: 'getFlowResult', description: 'Get flow result', action: 'Get flow result' },
			{ name: 'Get Flow Progress', value: 'getFlowProgress', description: 'Get flow progress', action: 'Get flow progress' },
			{ name: 'Get Flow Exceptions', value: 'getFlowExceptions', description: 'Get flow exceptions', action: 'Get flow exceptions' },
			{ name: 'Kill Flow', value: 'killFlow', description: 'Kill a running flow', action: 'Kill flow' },
			{ name: 'Get Flow Snapshot', value: 'getFlowSnapshot', description: 'Get flow snapshot', action: 'Get flow snapshot' },
			{ name: 'Get Hospitalized Flows', value: 'getHospitalizedFlows', description: 'Get hospitalized flows', action: 'Get hospitalized flows' },
			{ name: 'Retry Hospitalized Flow', value: 'retryHospitalizedFlow', description: 'Retry hospitalized flow', action: 'Retry hospitalized flow' },
			{ name: 'Get Flow Draining Mode', value: 'getFlowDrainingMode', description: 'Get draining mode', action: 'Get flow draining mode' },
			{ name: 'Set Flow Draining Mode', value: 'setFlowDrainingMode', description: 'Set draining mode', action: 'Set flow draining mode' },
			{ name: 'Get Flow Metadata', value: 'getFlowMetadata', description: 'Get flow metadata', action: 'Get flow metadata' },
			{ name: 'Get Flow Parameters', value: 'getFlowParameters', description: 'Get flow parameters', action: 'Get flow parameters' },
		],
		default: 'listRegisteredFlows',
	},
	{
		displayName: 'Flow Class Name',
		name: 'flowClassName',
		type: 'string',
		default: '',
		placeholder: 'e.g., com.example.flows.MyFlow',
		description: 'Fully qualified flow class name',
		displayOptions: { show: { resource: ['flow'], operation: ['startFlow', 'startFlowTracked', 'getFlowMetadata', 'getFlowParameters'] } },
	},
	{
		displayName: 'Flow Arguments (JSON)',
		name: 'flowArgs',
		type: 'json',
		default: '[]',
		description: 'Flow constructor arguments as JSON array',
		displayOptions: { show: { resource: ['flow'], operation: ['startFlow', 'startFlowTracked'] } },
	},
	{
		displayName: 'Flow ID',
		name: 'flowId',
		type: 'string',
		default: '',
		description: 'The flow run ID',
		displayOptions: { show: { resource: ['flow'], operation: ['getFlowResult', 'getFlowProgress', 'getFlowExceptions', 'killFlow', 'getFlowSnapshot', 'retryHospitalizedFlow'] } },
	},
	{
		displayName: 'Wait for Completion',
		name: 'waitForCompletion',
		type: 'boolean',
		default: true,
		description: 'Whether to wait for flow completion',
		displayOptions: { show: { resource: ['flow'], operation: ['startFlow', 'startFlowTracked'] } },
	},
	{
		displayName: 'Timeout (ms)',
		name: 'timeout',
		type: 'number',
		default: 60000,
		description: 'Timeout in milliseconds',
		displayOptions: { show: { resource: ['flow'], operation: ['startFlow', 'startFlowTracked'], waitForCompletion: [true] } },
	},
	{
		displayName: 'Draining Mode',
		name: 'drainingMode',
		type: 'boolean',
		default: false,
		description: 'Enable or disable draining mode',
		displayOptions: { show: { resource: ['flow'], operation: ['setFlowDrainingMode'] } },
	},
];

export async function executeFlowOperation(
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
		case 'listRegisteredFlows': {
			const result = await client.getRegisteredFlows();
			const data = (result.data as any);
			return { success: result.success, flows: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'startFlow': {
			const flowClassName = this.getNodeParameter('flowClassName', itemIndex) as string;
			const flowArgsJson = this.getNodeParameter('flowArgs', itemIndex) as string;
			const waitForCompletion = this.getNodeParameter('waitForCompletion', itemIndex) as boolean;
			const timeout = this.getNodeParameter('timeout', itemIndex, 60000) as number;

			const flowArgs = typeof flowArgsJson === 'string' ? JSON.parse(flowArgsJson) : flowArgsJson;
			const result = await client.startFlow(flowClassName, Array.isArray(flowArgs) ? flowArgs : [flowArgs]);
			const data = (result.data as any);

			if (waitForCompletion && data?.flowId) {
				const startTime = Date.now();
				while (Date.now() - startTime < timeout) {
					const statusResult = await client.executeRpc('flowStatus', [data.flowId]);
					const statusData = statusResult.data as any;
					if (statusData?.status === 'COMPLETED') {
						return { success: true, flowId: data.flowId, status: 'COMPLETED', result: statusData.result };
					}
					if (statusData?.status === 'FAILED') {
						return { success: false, flowId: data.flowId, status: 'FAILED', error: statusData.exception };
					}
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}

			return { success: result.success, flowId: data?.flowId, status: data?.status || 'RUNNING' };
		}

		case 'startFlowTracked': {
			const flowClassName = this.getNodeParameter('flowClassName', itemIndex) as string;
			const flowArgsJson = this.getNodeParameter('flowArgs', itemIndex) as string;
			const flowArgs = typeof flowArgsJson === 'string' ? JSON.parse(flowArgsJson) : flowArgsJson;

			const result = await client.startTrackedFlow(flowClassName, Array.isArray(flowArgs) ? flowArgs : [flowArgs]);
			const data = (result.data as any);

			return {
				success: result.success,
				flowId: data?.flowId,
				progressSteps: data?.progress || [],
				result: data?.result,
				status: data?.status,
			};
		}

		case 'getFlowResult': {
			const flowId = this.getNodeParameter('flowId', itemIndex) as string;
			const result = await client.executeRpc('flowResult', [flowId]);
			return { success: result.success, flowId, result: (result.data as any) };
		}

		case 'getFlowProgress': {
			const flowId = this.getNodeParameter('flowId', itemIndex) as string;
			const result = await client.executeRpc('flowProgress', [flowId]);
			return { success: result.success, flowId, progress: (result.data as any) };
		}

		case 'getFlowExceptions': {
			const flowId = this.getNodeParameter('flowId', itemIndex) as string;
			const result = await client.executeRpc('flowExceptions', [flowId]);
			return { success: result.success, flowId, exceptions: (result.data as any) };
		}

		case 'killFlow': {
			const flowId = this.getNodeParameter('flowId', itemIndex) as string;
			const result = await client.killFlow(flowId);
			return { success: result.success, flowId, killed: (result.data as any) };
		}

		case 'getFlowSnapshot': {
			const flowId = this.getNodeParameter('flowId', itemIndex) as string;
			const result = await client.executeRpc('flowSnapshot', [flowId]);
			return { success: result.success, flowId, snapshot: (result.data as any) };
		}

		case 'getHospitalizedFlows': {
			const result = await client.executeRpc('hospitalizedFlows', []);
			const data = (result.data as any);
			return { success: result.success, flows: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'retryHospitalizedFlow': {
			const flowId = this.getNodeParameter('flowId', itemIndex) as string;
			const result = await client.executeRpc('retryHospitalizedFlow', [flowId]);
			return { success: result.success, flowId, retried: (result.data as any) };
		}

		case 'getFlowDrainingMode': {
			const result = await client.executeRpc('flowDrainingMode', []);
			return { success: result.success, drainingMode: (result.data as any) };
		}

		case 'setFlowDrainingMode': {
			const drainingMode = this.getNodeParameter('drainingMode', itemIndex) as boolean;
			const result = await client.executeRpc('setFlowDrainingMode', [drainingMode]);
			return { success: result.success, drainingMode, set: (result.data as any) };
		}

		case 'getFlowMetadata': {
			const flowClassName = this.getNodeParameter('flowClassName', itemIndex) as string;
			const result = await client.executeRpc('flowMetadata', [flowClassName]);
			return { success: result.success, metadata: (result.data as any) };
		}

		case 'getFlowParameters': {
			const flowClassName = this.getNodeParameter('flowClassName', itemIndex) as string;
			const result = await client.executeRpc('flowParameters', [flowClassName]);
			return { success: result.success, parameters: (result.data as any) };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
