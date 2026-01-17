/**
 * Corda Node
 *
 * n8n community node for R3 Corda distributed ledger platform.
 * Supports Corda 4.x (Open Source/Enterprise) and Corda 5.x
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { nodeOperations, executeNodeOperation } from './actions/node/node.operations';
import { identityOperations, executeIdentityOperation } from './actions/identity/identity.operations';
import { vaultOperations, executeVaultOperation } from './actions/vault/vault.operations';
import { transactionOperations, executeTransactionOperation } from './actions/transaction/transaction.operations';
import { flowOperations, executeFlowOperation } from './actions/flow/flow.operations';
import { stateOperations, executeStateOperation } from './actions/state/state.operations';
import { contractOperations, executeContractOperation } from './actions/contract/contract.operations';
import { attachmentOperations, executeAttachmentOperation } from './actions/attachment/attachment.operations';
import { tokenOperations, executeTokenOperation } from './actions/token/token.operations';
import { accountOperations, executeAccountOperation } from './actions/account/account.operations';
import { confidentialIdentityOperations, executeConfidentialIdentityOperation } from './actions/confidentialIdentity/confidentialIdentity.operations';
import { notaryOperations, executeNotaryOperation } from './actions/notary/notary.operations';
import { timeWindowOperations, executeTimeWindowOperation } from './actions/timeWindow/timeWindow.operations';
import { networkMapOperations, executeNetworkMapOperation } from './actions/networkMap/networkMap.operations';
import { schedulerOperations, executeSchedulerOperation } from './actions/scheduler/scheduler.operations';
import { observerOperations, executeObserverOperation } from './actions/observer/observer.operations';
import { businessNetworkOperations, executeBusinessNetworkOperation } from './actions/businessNetwork/businessNetwork.operations';
import { corda5Operations, executeCorda5Operation } from './actions/corda5/corda5.operations';
import { utilityOperations, executeUtilityOperation } from './actions/utility/utility.operations';

export class Corda implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Corda',
		name: 'corda',
		icon: 'file:corda.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with R3 Corda distributed ledger - manage vault, execute flows, handle tokens and accounts',
		defaults: {
			name: 'Corda',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'cordaNodeCredentials',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'node', 'identity', 'vault', 'transaction', 'flow', 'state',
							'contract', 'attachment', 'token', 'account', 'confidentialIdentity',
							'notary', 'timeWindow', 'networkMap', 'scheduler', 'observer',
							'businessNetwork', 'utility',
						],
					},
				},
			},
			{
				name: 'corda5RestApiCredentials',
				required: true,
				displayOptions: {
					show: {
						resource: ['corda5'],
					},
				},
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Node', value: 'node', description: 'Node information and management' },
					{ name: 'Identity', value: 'identity', description: 'Identity and party operations' },
					{ name: 'Vault', value: 'vault', description: 'Vault queries and state management' },
					{ name: 'Transaction', value: 'transaction', description: 'Transaction operations' },
					{ name: 'Flow', value: 'flow', description: 'Flow execution and management' },
					{ name: 'State', value: 'state', description: 'State operations' },
					{ name: 'Contract', value: 'contract', description: 'Contract information' },
					{ name: 'Attachment', value: 'attachment', description: 'Attachment operations' },
					{ name: 'Token', value: 'token', description: 'Token SDK operations' },
					{ name: 'Account', value: 'account', description: 'Accounts SDK operations' },
					{ name: 'Confidential Identity', value: 'confidentialIdentity', description: 'Confidential identity operations' },
					{ name: 'Notary', value: 'notary', description: 'Notary operations' },
					{ name: 'Time Window', value: 'timeWindow', description: 'Time window operations' },
					{ name: 'Network Map', value: 'networkMap', description: 'Network map operations' },
					{ name: 'Scheduler', value: 'scheduler', description: 'Scheduler operations' },
					{ name: 'Observer', value: 'observer', description: 'Observable feeds' },
					{ name: 'Business Network', value: 'businessNetwork', description: 'Business network operations' },
					{ name: 'Corda 5', value: 'corda5', description: 'Corda 5 REST API operations' },
					{ name: 'Utility', value: 'utility', description: 'Utility functions' },
				],
				default: 'node',
			},

			// Node operations
			...nodeOperations,
			// Identity operations
			...identityOperations,
			// Vault operations
			...vaultOperations,
			// Transaction operations
			...transactionOperations,
			// Flow operations
			...flowOperations,
			// State operations
			...stateOperations,
			// Contract operations
			...contractOperations,
			// Attachment operations
			...attachmentOperations,
			// Token operations
			...tokenOperations,
			// Account operations
			...accountOperations,
			// Confidential Identity operations
			...confidentialIdentityOperations,
			// Notary operations
			...notaryOperations,
			// Time Window operations
			...timeWindowOperations,
			// Network Map operations
			...networkMapOperations,
			// Scheduler operations
			...schedulerOperations,
			// Observer operations
			...observerOperations,
			// Business Network operations
			...businessNetworkOperations,
			// Corda 5 operations
			...corda5Operations,
			// Utility operations
			...utilityOperations,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: any;

				switch (resource) {
					case 'node':
						result = await executeNodeOperation.call(this, operation, i);
						break;
					case 'identity':
						result = await executeIdentityOperation.call(this, operation, i);
						break;
					case 'vault':
						result = await executeVaultOperation.call(this, operation, i);
						break;
					case 'transaction':
						result = await executeTransactionOperation.call(this, operation, i);
						break;
					case 'flow':
						result = await executeFlowOperation.call(this, operation, i);
						break;
					case 'state':
						result = await executeStateOperation.call(this, operation, i);
						break;
					case 'contract':
						result = await executeContractOperation.call(this, operation, i);
						break;
					case 'attachment':
						result = await executeAttachmentOperation.call(this, operation, i);
						break;
					case 'token':
						result = await executeTokenOperation.call(this, operation, i);
						break;
					case 'account':
						result = await executeAccountOperation.call(this, operation, i);
						break;
					case 'confidentialIdentity':
						result = await executeConfidentialIdentityOperation.call(this, operation, i);
						break;
					case 'notary':
						result = await executeNotaryOperation.call(this, operation, i);
						break;
					case 'timeWindow':
						result = await executeTimeWindowOperation.call(this, operation, i);
						break;
					case 'networkMap':
						result = await executeNetworkMapOperation.call(this, operation, i);
						break;
					case 'scheduler':
						result = await executeSchedulerOperation.call(this, operation, i);
						break;
					case 'observer':
						result = await executeObserverOperation.call(this, operation, i);
						break;
					case 'businessNetwork':
						result = await executeBusinessNetworkOperation.call(this, operation, i);
						break;
					case 'corda5':
						result = await executeCorda5Operation.call(this, operation, i);
						break;
					case 'utility':
						result = await executeUtilityOperation.call(this, operation, i);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown resource: ${resource}`,
							{ itemIndex: i }
						);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(result),
					{ itemData: { item: i } }
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: i } }
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
