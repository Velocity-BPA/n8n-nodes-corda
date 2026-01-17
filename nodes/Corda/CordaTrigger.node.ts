/**
 * Corda Trigger Node
 *
 * Real-time event monitoring for Corda via RPC observables.
 * Listens for vault updates, transaction events, flow progress, and network changes.
 */

import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';

import { ObservableManager, CordaEventType, SubscriptionConfig } from './transport/observableManager';

export class CordaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Corda Trigger',
		name: 'cordaTrigger',
		icon: 'file:corda.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["eventCategory"]}}',
		description: 'Trigger workflows on Corda events - vault updates, transactions, flows, network changes',
		defaults: {
			name: 'Corda Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'cordaNodeCredentials',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event Category',
				name: 'eventCategory',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Vault Events', value: 'vault', description: 'State changes in the vault' },
					{ name: 'Transaction Events', value: 'transaction', description: 'Transaction lifecycle events' },
					{ name: 'Flow Events', value: 'flow', description: 'Flow execution events' },
					{ name: 'Network Events', value: 'network', description: 'Network map changes' },
				],
				default: 'vault',
			},
			{
				displayName: 'Vault Event',
				name: 'vaultEvent',
				type: 'options',
				displayOptions: { show: { eventCategory: ['vault'] } },
				options: [
					{ name: 'State Produced', value: 'stateProduced', description: 'New state added to vault' },
					{ name: 'State Consumed', value: 'stateConsumed', description: 'State consumed from vault' },
					{ name: 'State Updated', value: 'stateUpdated', description: 'Any vault state change' },
				],
				default: 'stateUpdated',
			},
			{
				displayName: 'Transaction Event',
				name: 'transactionEvent',
				type: 'options',
				displayOptions: { show: { eventCategory: ['transaction'] } },
				options: [
					{ name: 'Transaction Recorded', value: 'transactionRecorded', description: 'Transaction recorded to ledger' },
					{ name: 'Transaction Verified', value: 'transactionVerified', description: 'Transaction verified' },
					{ name: 'Transaction Failed', value: 'transactionFailed', description: 'Transaction failed' },
				],
				default: 'transactionRecorded',
			},
			{
				displayName: 'Flow Event',
				name: 'flowEvent',
				type: 'options',
				displayOptions: { show: { eventCategory: ['flow'] } },
				options: [
					{ name: 'Flow Started', value: 'flowStarted', description: 'Flow started' },
					{ name: 'Flow Completed', value: 'flowCompleted', description: 'Flow completed successfully' },
					{ name: 'Flow Failed', value: 'flowFailed', description: 'Flow failed' },
					{ name: 'Flow Progress', value: 'flowProgress', description: 'Flow progress update' },
				],
				default: 'flowCompleted',
			},
			{
				displayName: 'Network Event',
				name: 'networkEvent',
				type: 'options',
				displayOptions: { show: { eventCategory: ['network'] } },
				options: [
					{ name: 'Network Map Updated', value: 'networkMapUpdated', description: 'Network map changed' },
					{ name: 'Node Added', value: 'nodeAdded', description: 'New node added to network' },
					{ name: 'Node Removed', value: 'nodeRemoved', description: 'Node removed from network' },
				],
				default: 'networkMapUpdated',
			},
			{
				displayName: 'Contract State Type',
				name: 'contractStateType',
				type: 'string',
				default: '',
				placeholder: 'e.g., com.example.states.MyState',
				description: 'Filter by contract state type (optional)',
				displayOptions: { show: { eventCategory: ['vault'] } },
			},
			{
				displayName: 'Flow Class Name',
				name: 'flowClassName',
				type: 'string',
				default: '',
				placeholder: 'e.g., com.example.flows.MyFlow',
				description: 'Filter by flow class name (optional)',
				displayOptions: { show: { eventCategory: ['flow'] } },
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('cordaNodeCredentials');
		const eventCategory = this.getNodeParameter('eventCategory') as string;

		// Get specific event based on category
		let specificEvent: string;
		switch (eventCategory) {
			case 'vault':
				specificEvent = this.getNodeParameter('vaultEvent') as string;
				break;
			case 'transaction':
				specificEvent = this.getNodeParameter('transactionEvent') as string;
				break;
			case 'flow':
				specificEvent = this.getNodeParameter('flowEvent') as string;
				break;
			case 'network':
				specificEvent = this.getNodeParameter('networkEvent') as string;
				break;
			default:
				specificEvent = 'unknown';
		}

		// Get filters
		const contractStateType = eventCategory === 'vault'
			? this.getNodeParameter('contractStateType', '') as string
			: undefined;
		const flowClassName = eventCategory === 'flow'
			? this.getNodeParameter('flowClassName', '') as string
			: undefined;

		// Build WebSocket URL
		const host = credentials.rpcHost as string;
		const port = credentials.rpcPort as number;
		const protocol = (credentials.sslEnabled as boolean) ? 'wss' : 'ws';
		const wsUrl = `${protocol}://${host}:${port}/ws`;

		// Create observable manager
		const observableManager = new ObservableManager(wsUrl, {
			username: credentials.rpcUsername as string,
			password: credentials.rpcPassword as string,
		});

		// Map event to CordaEventType
		let eventType: CordaEventType;
		switch (eventCategory) {
			case 'vault':
				eventType = 'VAULT_UPDATE';
				break;
			case 'transaction':
				eventType = 'TRANSACTION_RECORDED';
				break;
			case 'flow':
				eventType = 'STATE_MACHINE_UPDATE';
				break;
			case 'network':
				eventType = 'NETWORK_MAP_UPDATE';
				break;
			default:
				eventType = 'VAULT_UPDATE';
		}

		// Build subscription config
		const subscriptionConfig: SubscriptionConfig = {
			type: eventType,
			contractStateType: contractStateType || undefined,
		};

		// Subscribe to events
		const subscriptionId = observableManager.subscribe(subscriptionConfig, (event: any) => {
			// Filter events based on specific event type
			const shouldEmit = filterCordaEvent(
				event.data,
				eventCategory,
				specificEvent,
				contractStateType,
				flowClassName
			);

			if (shouldEmit) {
				this.emit([
					this.helpers.returnJsonArray({
						eventCategory,
						event: specificEvent,
						timestamp: new Date().toISOString(),
						data: event.data,
					}),
				]);
			}
		});

		// Connect to WebSocket
		await observableManager.connect();

		// Return close function
		const closeFunction = async () => {
			observableManager.unsubscribe(subscriptionId);
			observableManager.disconnect();
		};

		return {
			closeFunction,
		};
	}
}

/**
 * Filter events based on category, type, and additional filters
 */
function filterCordaEvent(
	data: any,
	eventCategory: string,
	specificEvent: string,
	contractStateType?: string,
	flowClassName?: string
): boolean {
	if (!data) return false;

	switch (eventCategory) {
		case 'vault':
			if (specificEvent === 'stateProduced' && !data.produced?.length) return false;
			if (specificEvent === 'stateConsumed' && !data.consumed?.length) return false;
			if (contractStateType && data.contractStateType !== contractStateType) {
				return false;
			}
			break;

		case 'flow':
			if (specificEvent === 'flowStarted' && data.status !== 'STARTED') return false;
			if (specificEvent === 'flowCompleted' && data.status !== 'COMPLETED') return false;
			if (specificEvent === 'flowFailed' && data.status !== 'FAILED') return false;
			if (flowClassName && data.flowClass !== flowClassName) {
				return false;
			}
			break;
	}

	return true;
}
