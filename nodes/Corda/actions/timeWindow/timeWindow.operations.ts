/**
 * Time Window Operations
 *
 * Operations for Corda time windows.
 * Time windows define transaction validity periods.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

export const timeWindowOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['timeWindow'] } },
		options: [
			{ name: 'Create Time Window (From/Until)', value: 'createTimeWindowFromUntil', description: 'Create time window with start and end', action: 'Create time window from until' },
			{ name: 'Create Time Window (From Only)', value: 'createTimeWindowFromOnly', description: 'Create time window with start only', action: 'Create time window from only' },
			{ name: 'Create Time Window (Until Only)', value: 'createTimeWindowUntilOnly', description: 'Create time window with end only', action: 'Create time window until only' },
			{ name: 'Create Time Window (Tolerance)', value: 'createTimeWindowTolerance', description: 'Create time window around time with tolerance', action: 'Create time window tolerance' },
			{ name: 'Get Time Window Duration', value: 'getTimeWindowDuration', description: 'Calculate time window duration', action: 'Get time window duration' },
			{ name: 'Validate Time Window', value: 'validateTimeWindow', description: 'Check if time window is valid', action: 'Validate time window' },
			{ name: 'Get Current Node Time', value: 'getCurrentNodeTime', description: 'Get current time from node', action: 'Get current node time' },
		],
		default: 'getCurrentNodeTime',
	},

	// From Time
	{
		displayName: 'From Time',
		name: 'fromTime',
		type: 'dateTime',
		default: '',
		description: 'Start of time window',
		displayOptions: { show: { resource: ['timeWindow'], operation: ['createTimeWindowFromUntil', 'createTimeWindowFromOnly', 'getTimeWindowDuration', 'validateTimeWindow'] } },
	},

	// Until Time
	{
		displayName: 'Until Time',
		name: 'untilTime',
		type: 'dateTime',
		default: '',
		description: 'End of time window',
		displayOptions: { show: { resource: ['timeWindow'], operation: ['createTimeWindowFromUntil', 'createTimeWindowUntilOnly', 'getTimeWindowDuration', 'validateTimeWindow'] } },
	},

	// Midpoint Time
	{
		displayName: 'Midpoint Time',
		name: 'midpointTime',
		type: 'dateTime',
		default: '',
		description: 'Center time for tolerance-based window',
		displayOptions: { show: { resource: ['timeWindow'], operation: ['createTimeWindowTolerance'] } },
	},

	// Tolerance (seconds)
	{
		displayName: 'Tolerance (seconds)',
		name: 'tolerance',
		type: 'number',
		default: 30,
		description: 'Tolerance in seconds around midpoint',
		displayOptions: { show: { resource: ['timeWindow'], operation: ['createTimeWindowTolerance'] } },
	},
];

export async function executeTimeWindowOperation(
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
		case 'createTimeWindowFromUntil': {
			const fromTime = this.getNodeParameter('fromTime', itemIndex) as string;
			const untilTime = this.getNodeParameter('untilTime', itemIndex) as string;

			const from = new Date(fromTime);
			const until = new Date(untilTime);

			return {
				timeWindow: {
					fromTime: from.toISOString(),
					untilTime: until.toISOString(),
				},
				durationMs: until.getTime() - from.getTime(),
				type: 'FROM_UNTIL',
			};
		}

		case 'createTimeWindowFromOnly': {
			const fromTime = this.getNodeParameter('fromTime', itemIndex) as string;

			const from = new Date(fromTime);

			return {
				timeWindow: {
					fromTime: from.toISOString(),
					untilTime: null,
				},
				type: 'FROM_ONLY',
			};
		}

		case 'createTimeWindowUntilOnly': {
			const untilTime = this.getNodeParameter('untilTime', itemIndex) as string;

			const until = new Date(untilTime);

			return {
				timeWindow: {
					fromTime: null,
					untilTime: until.toISOString(),
				},
				type: 'UNTIL_ONLY',
			};
		}

		case 'createTimeWindowTolerance': {
			const midpointTime = this.getNodeParameter('midpointTime', itemIndex) as string;
			const tolerance = this.getNodeParameter('tolerance', itemIndex, 30) as number;

			const midpoint = new Date(midpointTime);
			const from = new Date(midpoint.getTime() - tolerance * 1000);
			const until = new Date(midpoint.getTime() + tolerance * 1000);

			return {
				timeWindow: {
					fromTime: from.toISOString(),
					untilTime: until.toISOString(),
					midpoint: midpoint.toISOString(),
					tolerance: tolerance,
				},
				durationMs: tolerance * 2 * 1000,
				type: 'TOLERANCE',
			};
		}

		case 'getTimeWindowDuration': {
			const fromTime = this.getNodeParameter('fromTime', itemIndex) as string;
			const untilTime = this.getNodeParameter('untilTime', itemIndex) as string;

			const from = new Date(fromTime);
			const until = new Date(untilTime);
			const durationMs = until.getTime() - from.getTime();

			return {
				fromTime: from.toISOString(),
				untilTime: until.toISOString(),
				durationMs,
				durationSeconds: durationMs / 1000,
				durationMinutes: durationMs / 60000,
				durationHours: durationMs / 3600000,
			};
		}

		case 'validateTimeWindow': {
			const fromTime = this.getNodeParameter('fromTime', itemIndex, '') as string;
			const untilTime = this.getNodeParameter('untilTime', itemIndex, '') as string;

			const errors: string[] = [];
			const now = new Date();

			if (fromTime && untilTime) {
				const from = new Date(fromTime);
				const until = new Date(untilTime);

				if (from >= until) {
					errors.push('From time must be before until time');
				}

				if (until < now) {
					errors.push('Time window has already expired');
				}
			}

			return {
				valid: errors.length === 0,
				errors,
				fromTime: fromTime || null,
				untilTime: untilTime || null,
				currentTime: now.toISOString(),
			};
		}

		case 'getCurrentNodeTime': {
			const response = await client.getCurrentTime();
			return {
				nodeTime: (response as any).success ? (response as any).data : null,
				localTime: new Date().toISOString(),
				success: (response as any).success,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
