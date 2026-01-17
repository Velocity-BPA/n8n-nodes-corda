/**
 * Account Operations (Accounts SDK)
 *
 * Operations for managing sub-identities within a Corda node.
 * Accounts SDK allows multiple logical identities per node.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { ACCOUNTS_SDK_FLOWS } from '../../constants/flows';

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['account'] } },
		options: [
			{ name: 'Create Account', value: 'createAccount', description: 'Create a new account', action: 'Create account' },
			{ name: 'Get Account Info', value: 'getAccountInfo', description: 'Get account information', action: 'Get account info' },
			{ name: 'Get Account by UUID', value: 'getAccountByUuid', description: 'Get account by UUID', action: 'Get account by UUID' },
			{ name: 'Get Account by Name', value: 'getAccountByName', description: 'Get account by name', action: 'Get account by name' },
			{ name: 'Get Accounts by Host', value: 'getAccountsByHost', description: 'Get accounts hosted on a node', action: 'Get accounts by host' },
			{ name: 'Get All Accounts', value: 'getAllAccounts', description: 'Get all known accounts', action: 'Get all accounts' },
			{ name: 'Share Account Info', value: 'shareAccountInfo', description: 'Share account with another node', action: 'Share account info' },
			{ name: 'Request Account Info', value: 'requestAccountInfo', description: 'Request account info from node', action: 'Request account info' },
			{ name: 'Move Account', value: 'moveAccount', description: 'Move account to another node', action: 'Move account' },
			{ name: 'Get Account Balance', value: 'getAccountBalance', description: 'Get token balance for account', action: 'Get account balance' },
			{ name: 'Get Account States', value: 'getAccountStates', description: 'Get states owned by account', action: 'Get account states' },
			{ name: 'Query by Account', value: 'queryByAccount', description: 'Query vault by account', action: 'Query by account' },
			{ name: 'Get Account Public Key', value: 'getAccountPublicKey', description: 'Get public key for account', action: 'Get account public key' },
			{ name: 'Get Account Party', value: 'getAccountParty', description: 'Get anonymous party for account', action: 'Get account party' },
			{ name: 'Get Account Host', value: 'getAccountHost', description: 'Get hosting node for account', action: 'Get account host' },
		],
		default: 'getAllAccounts',
	},
	{
		displayName: 'Account Name',
		name: 'accountName',
		type: 'string',
		default: '',
		placeholder: 'my-account',
		description: 'Name for the account',
		displayOptions: { show: { resource: ['account'], operation: ['createAccount', 'getAccountByName'] } },
	},
	{
		displayName: 'Account UUID',
		name: 'accountUuid',
		type: 'string',
		default: '',
		placeholder: 'e.g., 123e4567-e89b-12d3-a456-426614174000',
		description: 'UUID of the account',
		displayOptions: { show: { resource: ['account'], operation: ['getAccountInfo', 'getAccountByUuid', 'shareAccountInfo', 'moveAccount', 'getAccountBalance', 'getAccountStates', 'queryByAccount', 'getAccountPublicKey', 'getAccountParty', 'getAccountHost'] } },
	},
	{
		displayName: 'Host Party',
		name: 'hostParty',
		type: 'string',
		default: '',
		placeholder: 'O=PartyA, L=London, C=GB',
		description: 'X.500 name of the hosting node',
		displayOptions: { show: { resource: ['account'], operation: ['getAccountsByHost', 'requestAccountInfo', 'moveAccount'] } },
	},
	{
		displayName: 'Token Type',
		name: 'tokenType',
		type: 'string',
		default: '',
		placeholder: 'e.g., USD',
		description: 'Type of token to query balance',
		displayOptions: { show: { resource: ['account'], operation: ['getAccountBalance'] } },
	},
	{
		displayName: 'Contract State Type',
		name: 'contractStateType',
		type: 'string',
		default: '',
		placeholder: 'e.g., com.example.states.MyState',
		description: 'Fully qualified class name of the contract state',
		displayOptions: { show: { resource: ['account'], operation: ['getAccountStates', 'queryByAccount'] } },
	},
];

export async function executeAccountOperation(
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
		case 'createAccount': {
			const accountName = this.getNodeParameter('accountName', itemIndex) as string;
			const result = await client.startFlow(ACCOUNTS_SDK_FLOWS.CREATE_ACCOUNT, [accountName]);
			const data = (result.data as any);
			return {
				success: result.success,
				accountUuid: data?.result?.uuid,
				accountName,
				flowId: data?.flowId,
			};
		}

		case 'getAccountInfo': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const result = await client.executeRpc('accountInfo', [accountUuid]);
			return { success: result.success, account: (result.data as any) };
		}

		case 'getAccountByUuid': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const result = await client.executeRpc('accountByUuid', [accountUuid]);
			return { success: result.success, account: (result.data as any) };
		}

		case 'getAccountByName': {
			const accountName = this.getNodeParameter('accountName', itemIndex) as string;
			const result = await client.executeRpc('accountByName', [accountName]);
			return { success: result.success, account: (result.data as any) };
		}

		case 'getAccountsByHost': {
			const hostParty = this.getNodeParameter('hostParty', itemIndex) as string;
			const result = await client.executeRpc('accountsByHost', [hostParty]);
			const data = (result.data as any);
			return { success: result.success, accounts: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'getAllAccounts': {
			const result = await client.executeRpc('allAccounts', []);
			const data = (result.data as any);
			return { success: result.success, accounts: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'shareAccountInfo': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const hostParty = this.getNodeParameter('hostParty', itemIndex) as string;
			const result = await client.startFlow(ACCOUNTS_SDK_FLOWS.SHARE_ACCOUNT_INFO, [accountUuid, hostParty]);
			return { success: result.success, shared: true, flowResult: (result.data as any) };
		}

		case 'requestAccountInfo': {
			const hostParty = this.getNodeParameter('hostParty', itemIndex) as string;
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const result = await client.startFlow(ACCOUNTS_SDK_FLOWS.REQUEST_ACCOUNT_INFO, [hostParty, accountUuid]);
			return { success: result.success, account: (result.data as any) };
		}

		case 'moveAccount': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const hostParty = this.getNodeParameter('hostParty', itemIndex) as string;
			const result = await client.executeRpc('moveAccount', [accountUuid, hostParty]);
			return { success: result.success, moved: true, newHost: hostParty };
		}

		case 'getAccountBalance': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;
			const result = await client.executeRpc('accountBalance', [accountUuid, tokenType]);
			const data = (result.data as any);
			return { success: result.success, balance: data?.balance || data, tokenType };
		}

		case 'getAccountStates': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex) as string;
			const result = await client.executeRpc('accountStates', [accountUuid, contractStateType]);
			const data = (result.data as any);
			return { success: result.success, states: data?.states || data, count: Array.isArray(data?.states || data) ? (data?.states || data).length : 0 };
		}

		case 'queryByAccount': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const contractStateType = this.getNodeParameter('contractStateType', itemIndex) as string;
			const result = await client.executeRpc('queryByAccount', [accountUuid, contractStateType]);
			return { success: result.success, states: (result.data as any) };
		}

		case 'getAccountPublicKey': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const result = await client.executeRpc('accountPublicKey', [accountUuid]);
			return { success: result.success, publicKey: (result.data as any) };
		}

		case 'getAccountParty': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const result = await client.executeRpc('accountParty', [accountUuid]);
			return { success: result.success, party: (result.data as any) };
		}

		case 'getAccountHost': {
			const accountUuid = this.getNodeParameter('accountUuid', itemIndex) as string;
			const result = await client.executeRpc('accountHost', [accountUuid]);
			return { success: result.success, host: (result.data as any) };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
