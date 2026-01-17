/**
 * Vault Operations
 *
 * Operations for querying and managing the Corda vault.
 * The vault is the node's database of known contract states.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { VaultQueryBuilder } from '../../utils/vaultQueryUtils';

export const vaultOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['vault'] } },
		options: [
			{ name: 'Query Vault', value: 'queryVault', description: 'Query vault states with criteria', action: 'Query vault' },
			{ name: 'Query Unconsumed', value: 'queryUnconsumed', description: 'Query only unconsumed (active) states', action: 'Query unconsumed' },
			{ name: 'Query Consumed', value: 'queryConsumed', description: 'Query only consumed (spent) states', action: 'Query consumed' },
			{ name: 'Query All States', value: 'queryAll', description: 'Query all states regardless of status', action: 'Query all states' },
			{ name: 'Query by Contract Type', value: 'queryByContractType', description: 'Query states by contract class', action: 'Query by contract type' },
			{ name: 'Query by Notary', value: 'queryByNotary', description: 'Query states by notary', action: 'Query by notary' },
			{ name: 'Query by Participants', value: 'queryByParticipants', description: 'Query states by participants', action: 'Query by participants' },
			{ name: 'Query by Time Window', value: 'queryByTimeWindow', description: 'Query states recorded within a time window', action: 'Query by time window' },
			{ name: 'Query by External ID', value: 'queryByExternalId', description: 'Query linear states by external ID', action: 'Query by external ID' },
			{ name: 'Get State by Ref', value: 'getStateByRef', description: 'Get a specific state by StateRef', action: 'Get state by ref' },
			{ name: 'Query with Pagination', value: 'queryWithPagination', description: 'Query with pagination controls', action: 'Query with pagination' },
			{ name: 'Query with Sorting', value: 'queryWithSorting', description: 'Query with custom sorting', action: 'Query with sorting' },
			{ name: 'Query Linear States', value: 'queryLinearStates', description: 'Query LinearState types', action: 'Query linear states' },
			{ name: 'Query Fungible States', value: 'queryFungibleStates', description: 'Query FungibleState types', action: 'Query fungible states' },
			{ name: 'Get Soft Locked States', value: 'getSoftLockedStates', description: 'Get states soft-locked by flows', action: 'Get soft locked states' },
			{ name: 'Track Vault Updates', value: 'trackVaultUpdates', description: 'Subscribe to vault updates (returns subscription ID)', action: 'Track vault updates' },
			{ name: 'Get Vault Schema', value: 'getVaultSchema', description: 'Get queryable schema information', action: 'Get vault schema' },
		],
		default: 'queryVault',
	},

	// Contract State Type
	{
		displayName: 'Contract State Type',
		name: 'contractStateType',
		type: 'string',
		default: '',
		placeholder: 'com.example.states.MyState',
		description: 'Fully qualified contract state class name',
		displayOptions: { show: { resource: ['vault'], operation: ['queryVault', 'queryByContractType', 'queryLinearStates', 'queryFungibleStates', 'trackVaultUpdates'] } },
	},

	// State Status
	{
		displayName: 'State Status',
		name: 'stateStatus',
		type: 'options',
		options: [
			{ name: 'Unconsumed', value: 'UNCONSUMED' },
			{ name: 'Consumed', value: 'CONSUMED' },
			{ name: 'All', value: 'ALL' },
		],
		default: 'UNCONSUMED',
		description: 'Filter by state consumption status',
		displayOptions: { show: { resource: ['vault'], operation: ['queryVault', 'queryByContractType'] } },
	},

	// StateRef
	{
		displayName: 'State Reference',
		name: 'stateRef',
		type: 'string',
		default: '',
		placeholder: 'TXHASH:0',
		description: 'State reference in format txHash:index',
		displayOptions: { show: { resource: ['vault'], operation: ['getStateByRef'] } },
	},

	// Notary X.500 Name
	{
		displayName: 'Notary X.500 Name',
		name: 'notaryX500Name',
		type: 'string',
		default: '',
		placeholder: 'O=Notary, L=London, C=GB',
		description: 'X.500 name of the notary',
		displayOptions: { show: { resource: ['vault'], operation: ['queryByNotary'] } },
	},

	// Participants
	{
		displayName: 'Participant X.500 Names',
		name: 'participantNames',
		type: 'string',
		default: '',
		placeholder: 'O=PartyA, L=London, C=GB',
		description: 'Comma-separated X.500 names of participants',
		displayOptions: { show: { resource: ['vault'], operation: ['queryByParticipants'] } },
	},

	// External ID
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		description: 'External ID for linear state lookup',
		displayOptions: { show: { resource: ['vault'], operation: ['queryByExternalId'] } },
	},

	// Time Window Start
	{
		displayName: 'Recorded After',
		name: 'recordedAfter',
		type: 'dateTime',
		default: '',
		description: 'Query states recorded after this time',
		displayOptions: { show: { resource: ['vault'], operation: ['queryByTimeWindow'] } },
	},

	// Time Window End
	{
		displayName: 'Recorded Before',
		name: 'recordedBefore',
		type: 'dateTime',
		default: '',
		description: 'Query states recorded before this time',
		displayOptions: { show: { resource: ['vault'], operation: ['queryByTimeWindow'] } },
	},

	// Pagination - Page Number
	{
		displayName: 'Page Number',
		name: 'pageNumber',
		type: 'number',
		default: 1,
		description: 'Page number (1-based)',
		displayOptions: { show: { resource: ['vault'], operation: ['queryWithPagination', 'queryVault'] } },
	},

	// Pagination - Page Size
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 200,
		description: 'Number of results per page (max 200)',
		displayOptions: { show: { resource: ['vault'], operation: ['queryWithPagination', 'queryVault'] } },
	},

	// Sort Column
	{
		displayName: 'Sort By',
		name: 'sortColumn',
		type: 'options',
		options: [
			{ name: 'Recorded Time', value: 'recordedTime' },
			{ name: 'Consumed Time', value: 'consumedTime' },
			{ name: 'State Status', value: 'stateStatus' },
			{ name: 'Contract State Class', value: 'contractStateClassName' },
		],
		default: 'recordedTime',
		description: 'Column to sort by',
		displayOptions: { show: { resource: ['vault'], operation: ['queryWithSorting'] } },
	},

	// Sort Direction
	{
		displayName: 'Sort Direction',
		name: 'sortDirection',
		type: 'options',
		options: [
			{ name: 'Ascending', value: 'ASC' },
			{ name: 'Descending', value: 'DESC' },
		],
		default: 'DESC',
		description: 'Sort direction',
		displayOptions: { show: { resource: ['vault'], operation: ['queryWithSorting'] } },
	},

	// Linear ID
	{
		displayName: 'Linear ID',
		name: 'linearId',
		type: 'string',
		default: '',
		placeholder: 'UUID',
		description: 'Linear state unique identifier',
		displayOptions: { show: { resource: ['vault'], operation: ['queryLinearStates'] } },
	},
];

export async function executeVaultOperation(
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
		case 'queryVault': {
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex, '') as string;
			const stateStatus = this.getNodeParameter('stateStatus', itemIndex, 'UNCONSUMED') as string;
			const pageNumber = this.getNodeParameter('pageNumber', itemIndex, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', itemIndex, 200) as number;

			const builder = new VaultQueryBuilder()
				.withStatus(stateStatus as any)
				.withPaging(pageNumber, pageSize);

			if (contractStateType) {
				builder.withContractStateTypes([contractStateType]);
			}

			const response = await client.queryVault(builder.build());
			return {
				states: (response as any).success ? (response as any).data : [],
				totalResults: ((response as any).data as any)?.totalStatesAvailable || 0,
				statesMetadata: ((response as any).data as any)?.statesMetadata || [],
			};
		}

		case 'queryUnconsumed': {
			const builder = new VaultQueryBuilder().withStatus('UNCONSUMED');
			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], status: 'UNCONSUMED' };
		}

		case 'queryConsumed': {
			const builder = new VaultQueryBuilder().withStatus('CONSUMED');
			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], status: 'CONSUMED' };
		}

		case 'queryAll': {
			const builder = new VaultQueryBuilder().withStatus('ALL');
			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], status: 'ALL' };
		}

		case 'queryByContractType': {
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex) as string;
			const stateStatus = this.getNodeParameter('stateStatus', itemIndex, 'UNCONSUMED') as string;

			const builder = new VaultQueryBuilder()
				.withContractStateTypes([contractStateType])
				.withStatus(stateStatus as any);

			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], contractStateType };
		}

		case 'queryByNotary': {
			const notaryX500Name = this.getNodeParameter('notaryX500Name', itemIndex) as string;

			const builder = new VaultQueryBuilder().withNotary([notaryX500Name]);
			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], notary: notaryX500Name };
		}

		case 'queryByParticipants': {
			const participantNames = this.getNodeParameter('participantNames', itemIndex) as string;
			const participants = participantNames.split(',').map(p => p.trim());

			const builder = new VaultQueryBuilder().withParticipants(participants);
			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], participants };
		}

		case 'queryByTimeWindow': {
			const recordedAfter = this.getNodeParameter('recordedAfter', itemIndex, '') as string;
			const recordedBefore = this.getNodeParameter('recordedBefore', itemIndex, '') as string;

			const builder = new VaultQueryBuilder();
			if (recordedAfter && recordedBefore) {
				builder.recordedBetween(recordedAfter, recordedBefore);
			} else if (recordedAfter) {
				builder.recordedAfter(recordedAfter);
			} else if (recordedBefore) {
				builder.recordedBefore(recordedBefore);
			}

			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], recordedAfter, recordedBefore };
		}

		case 'queryByExternalId': {
			const externalId = this.getNodeParameter('externalId', itemIndex) as string;

			const response = await client.executeRpc('vaultQueryByExternalId', { externalId });
			return { states: response || [], externalId };
		}

		case 'getStateByRef': {
			const stateRef = this.getNodeParameter('stateRef', itemIndex) as string;

			const builder = new VaultQueryBuilder()
				.withStateRefs([stateRef])
				.withStatus('ALL');

			const response = await client.queryVault(builder.build());
			const states = (response as any).success ? ((response as any).data as any)?.states || [] : [];
			return { state: states[0] || null, found: states.length > 0, stateRef };
		}

		case 'queryWithPagination': {
			const pageNumber = this.getNodeParameter('pageNumber', itemIndex, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', itemIndex, 200) as number;

			const builder = new VaultQueryBuilder().withPaging(pageNumber, pageSize);
			const response = await client.queryVault(builder.build());
			return {
				states: (response as any).success ? (response as any).data : [],
				pagination: { pageNumber, pageSize },
			};
		}

		case 'queryWithSorting': {
			const sortColumn = this.getNodeParameter('sortColumn', itemIndex, 'recordedTime') as string;
			const sortDirection = this.getNodeParameter('sortDirection', itemIndex, 'DESC') as string;

			const builder = new VaultQueryBuilder().orderBy(sortColumn, sortDirection as any);
			const response = await client.queryVault(builder.build());
			return { states: (response as any).success ? (response as any).data : [], sorting: { sortColumn, sortDirection } };
		}

		case 'queryLinearStates': {
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex, '') as string;
			const linearId = this.getNodeParameter('linearId', itemIndex, '') as string;

			const params: any = { stateType: 'LinearState' };
			if (contractStateType) params.contractStateType = contractStateType;
			if (linearId) params.linearId = linearId;

			const response = await client.executeRpc('vaultQueryLinearStates', params);
			return { states: response || [], type: 'LinearState' };
		}

		case 'queryFungibleStates': {
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex, '') as string;

			const params: any = { stateType: 'FungibleState' };
			if (contractStateType) params.contractStateType = contractStateType;

			const response = await client.executeRpc('vaultQueryFungibleStates', params);
			return { states: response || [], type: 'FungibleState' };
		}

		case 'getSoftLockedStates': {
			const response = await client.executeRpc('getSoftLockedStates', {});
			return { lockedStates: response || [], count: response?.length || 0 };
		}

		case 'trackVaultUpdates': {
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex, '') as string;
			// Returns subscription info - actual streaming handled by trigger node
			return {
				subscriptionId: `vault-${Date.now()}`,
				contractStateType: contractStateType || 'ALL',
				message: 'Use Corda Trigger node for real-time updates',
			};
		}

		case 'getVaultSchema': {
			const response = await client.executeRpc('getVaultSchema', {});
			return { schema: response || {}, availableColumns: ['stateRef', 'recordedTime', 'consumedTime', 'stateStatus', 'contractStateClassName', 'notary'] };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
