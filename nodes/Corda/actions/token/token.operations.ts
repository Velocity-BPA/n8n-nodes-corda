/**
 * Token Operations (Token SDK)
 *
 * Operations for managing fungible and non-fungible tokens.
 * Uses Corda Token SDK for token issuance, movement, and redemption.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { TOKEN_SDK_FLOWS } from '../../constants/flows';

export const tokenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['token'] } },
		options: [
			{ name: 'Issue Tokens', value: 'issueTokens', description: 'Issue new tokens', action: 'Issue tokens' },
			{ name: 'Move Tokens', value: 'moveTokens', description: 'Transfer tokens to another party', action: 'Move tokens' },
			{ name: 'Redeem Tokens', value: 'redeemTokens', description: 'Redeem tokens with issuer', action: 'Redeem tokens' },
			{ name: 'Get Token Balance', value: 'getTokenBalance', description: 'Get balance for a token type', action: 'Get token balance' },
			{ name: 'Get All Token Balances', value: 'getAllTokenBalances', description: 'Get all token balances', action: 'Get all token balances' },
			{ name: 'Query Tokens by Type', value: 'queryTokensByType', description: 'Query tokens by token type', action: 'Query tokens by type' },
			{ name: 'Query Tokens by Holder', value: 'queryTokensByHolder', description: 'Query tokens by holder', action: 'Query tokens by holder' },
			{ name: 'Query Tokens by Issuer', value: 'queryTokensByIssuer', description: 'Query tokens by issuer', action: 'Query tokens by issuer' },
			{ name: 'Get Fungible Token States', value: 'getFungibleTokenStates', description: 'Get fungible token states', action: 'Get fungible token states' },
			{ name: 'Get Non-Fungible Token States', value: 'getNonFungibleTokenStates', description: 'Get non-fungible token states', action: 'Get non-fungible token states' },
			{ name: 'Create Evolvable Token Type', value: 'createEvolvableTokenType', description: 'Create an evolvable token type', action: 'Create evolvable token type' },
			{ name: 'Update Evolvable Token Type', value: 'updateEvolvableTokenType', description: 'Update an evolvable token type', action: 'Update evolvable token type' },
			{ name: 'Get Token Type', value: 'getTokenType', description: 'Get token type information', action: 'Get token type' },
			{ name: 'Hold Tokens', value: 'holdTokens', description: 'Place tokens on hold', action: 'Hold tokens' },
			{ name: 'Release Held Tokens', value: 'releaseHeldTokens', description: 'Release held tokens', action: 'Release held tokens' },
			{ name: 'Get Held Token Balance', value: 'getHeldTokenBalance', description: 'Get held token balance', action: 'Get held token balance' },
		],
		default: 'getTokenBalance',
	},

	// Token Type
	{
		displayName: 'Token Type',
		name: 'tokenType',
		type: 'string',
		default: '',
		placeholder: 'USD or com.example.tokens.MyToken',
		description: 'Token type identifier or class',
		displayOptions: { show: { resource: ['token'], operation: ['issueTokens', 'moveTokens', 'redeemTokens', 'getTokenBalance', 'queryTokensByType', 'getTokenType', 'holdTokens', 'releaseHeldTokens', 'getHeldTokenBalance'] } },
	},

	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 0,
		description: 'Token amount',
		displayOptions: { show: { resource: ['token'], operation: ['issueTokens', 'moveTokens', 'redeemTokens', 'holdTokens'] } },
	},

	// Recipient X.500 Name
	{
		displayName: 'Recipient',
		name: 'recipient',
		type: 'string',
		default: '',
		placeholder: 'O=PartyB, L=New York, C=US',
		description: 'X.500 name of token recipient',
		displayOptions: { show: { resource: ['token'], operation: ['issueTokens', 'moveTokens'] } },
	},

	// Holder X.500 Name
	{
		displayName: 'Holder',
		name: 'holder',
		type: 'string',
		default: '',
		placeholder: 'O=PartyA, L=London, C=GB',
		description: 'X.500 name of token holder',
		displayOptions: { show: { resource: ['token'], operation: ['queryTokensByHolder', 'getTokenBalance'] } },
	},

	// Issuer X.500 Name
	{
		displayName: 'Issuer',
		name: 'issuer',
		type: 'string',
		default: '',
		placeholder: 'O=Bank, L=London, C=GB',
		description: 'X.500 name of token issuer',
		displayOptions: { show: { resource: ['token'], operation: ['queryTokensByIssuer', 'redeemTokens'] } },
	},

	// Token ID (for non-fungible)
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		default: '',
		placeholder: 'UUID or unique identifier',
		description: 'Unique token identifier (for non-fungible tokens)',
		displayOptions: { show: { resource: ['token'], operation: ['getNonFungibleTokenStates', 'moveTokens'] } },
	},

	// Evolvable Token Type Name
	{
		displayName: 'Token Type Name',
		name: 'tokenTypeName',
		type: 'string',
		default: '',
		placeholder: 'MyAssetToken',
		description: 'Name for evolvable token type',
		displayOptions: { show: { resource: ['token'], operation: ['createEvolvableTokenType', 'updateEvolvableTokenType'] } },
	},

	// Token Type Properties (JSON)
	{
		displayName: 'Token Properties',
		name: 'tokenProperties',
		type: 'json',
		default: '{}',
		description: 'Additional token type properties as JSON',
		displayOptions: { show: { resource: ['token'], operation: ['createEvolvableTokenType', 'updateEvolvableTokenType'] } },
	},

	// Linear ID for evolvable tokens
	{
		displayName: 'Linear ID',
		name: 'linearId',
		type: 'string',
		default: '',
		placeholder: 'UUID',
		description: 'Linear ID of evolvable token type',
		displayOptions: { show: { resource: ['token'], operation: ['updateEvolvableTokenType', 'getTokenType'] } },
	},

	// Hold ID
	{
		displayName: 'Hold ID',
		name: 'holdId',
		type: 'string',
		default: '',
		placeholder: 'UUID',
		description: 'Hold identifier for releasing tokens',
		displayOptions: { show: { resource: ['token'], operation: ['releaseHeldTokens', 'getHeldTokenBalance'] } },
	},

	// Fractional Digits
	{
		displayName: 'Fractional Digits',
		name: 'fractionalDigits',
		type: 'number',
		default: 2,
		description: 'Number of fractional digits for token',
		displayOptions: { show: { resource: ['token'], operation: ['createEvolvableTokenType'] } },
	},

	// Is Fungible
	{
		displayName: 'Is Fungible',
		name: 'isFungible',
		type: 'boolean',
		default: true,
		description: 'Whether the token is fungible',
		displayOptions: { show: { resource: ['token'], operation: ['createEvolvableTokenType'] } },
	},

	// Notary
	{
		displayName: 'Notary',
		name: 'notary',
		type: 'string',
		default: '',
		placeholder: 'O=Notary, L=London, C=GB',
		description: 'Notary for token transactions',
		displayOptions: { show: { resource: ['token'], operation: ['issueTokens', 'createEvolvableTokenType'] } },
	},
];

export async function executeTokenOperation(
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
		case 'issueTokens': {
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as number;
			const recipient = this.getNodeParameter('recipient', itemIndex) as string;
			const notary = this.getNodeParameter('notary', itemIndex, '') as string;

			const response = await client.startFlow(TOKEN_SDK_FLOWS.ISSUE_FUNGIBLE_TOKENS, {
				tokenType,
				amount,
				recipient,
				notary: notary || undefined,
			});

			return {
				transactionId: ((response as any).data as any)?.result?.txHash,
				tokenType,
				amount,
				recipient,
				success: (response as any).success,
			};
		}

		case 'moveTokens': {
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as number;
			const recipient = this.getNodeParameter('recipient', itemIndex) as string;
			const tokenId = this.getNodeParameter('tokenId', itemIndex, '') as string;

			const flowClass = tokenId ? TOKEN_SDK_FLOWS.MOVE_NON_FUNGIBLE_TOKENS : TOKEN_SDK_FLOWS.MOVE_FUNGIBLE_TOKENS;
			const response = await client.startFlow(flowClass, {
				tokenType,
				amount: tokenId ? undefined : amount,
				tokenId: tokenId || undefined,
				recipient,
			});

			return {
				transactionId: ((response as any).data as any)?.result?.txHash,
				tokenType,
				amount: tokenId ? 1 : amount,
				recipient,
				success: (response as any).success,
			};
		}

		case 'redeemTokens': {
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as number;
			const issuer = this.getNodeParameter('issuer', itemIndex, '') as string;

			const response = await client.startFlow(TOKEN_SDK_FLOWS.REDEEM_FUNGIBLE_TOKENS, {
				tokenType,
				amount,
				issuer: issuer || undefined,
			});

			return {
				transactionId: ((response as any).data as any)?.result?.txHash,
				tokenType,
				amount,
				success: (response as any).success,
			};
		}

		case 'getTokenBalance': {
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;
			const holder = this.getNodeParameter('holder', itemIndex, '') as string;

			const response = await client.executeRpc('getTokenBalance', {
				tokenType,
				holder: holder || undefined,
			});

			return {
				tokenType,
				balance: response?.balance || 0,
				holder: holder || 'self',
			};
		}

		case 'getAllTokenBalances': {
			const response = await client.executeRpc('getAllTokenBalances', {});
			return {
				balances: response || [],
				count: Object.keys(response || {}).length,
			};
		}

		case 'queryTokensByType': {
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;

			const response = await client.executeRpc('queryTokensByType', { tokenType });
			return {
				tokens: response || [],
				tokenType,
				count: response?.length || 0,
			};
		}

		case 'queryTokensByHolder': {
			const holder = this.getNodeParameter('holder', itemIndex) as string;

			const response = await client.executeRpc('queryTokensByHolder', { holder });
			return {
				tokens: response || [],
				holder,
				count: response?.length || 0,
			};
		}

		case 'queryTokensByIssuer': {
			const issuer = this.getNodeParameter('issuer', itemIndex) as string;

			const response = await client.executeRpc('queryTokensByIssuer', { issuer });
			return {
				tokens: response || [],
				issuer,
				count: response?.length || 0,
			};
		}

		case 'getFungibleTokenStates': {
			const response = await client.executeRpc('getFungibleTokenStates', {});
			return {
				states: response || [],
				count: response?.length || 0,
				type: 'FungibleToken',
			};
		}

		case 'getNonFungibleTokenStates': {
			const tokenId = this.getNodeParameter('tokenId', itemIndex, '') as string;

			const response = await client.executeRpc('getNonFungibleTokenStates', {
				tokenId: tokenId || undefined,
			});
			return {
				states: response || [],
				count: response?.length || 0,
				type: 'NonFungibleToken',
			};
		}

		case 'createEvolvableTokenType': {
			const tokenTypeName = this.getNodeParameter('tokenTypeName', itemIndex) as string;
			const tokenProperties = this.getNodeParameter('tokenProperties', itemIndex, {}) as object;
			const fractionalDigits = this.getNodeParameter('fractionalDigits', itemIndex, 2) as number;
			const isFungible = this.getNodeParameter('isFungible', itemIndex, true) as boolean;
			const notary = this.getNodeParameter('notary', itemIndex, '') as string;

			const response = await client.startFlow(TOKEN_SDK_FLOWS.CREATE_EVOLVABLE_TOKEN, {
				name: tokenTypeName,
				fractionalDigits,
				isFungible,
				properties: tokenProperties,
				notary: notary || undefined,
			});

			return {
				linearId: (response as any).data?.result?.linearId,
				tokenTypeName,
				success: (response as any).success,
			};
		}

		case 'updateEvolvableTokenType': {
			const linearId = this.getNodeParameter('linearId', itemIndex) as string;
			const tokenTypeName = this.getNodeParameter('tokenTypeName', itemIndex, '') as string;
			const tokenProperties = this.getNodeParameter('tokenProperties', itemIndex, {}) as object;

			const response = await client.startFlow(TOKEN_SDK_FLOWS.UPDATE_EVOLVABLE_TOKEN, {
				linearId,
				name: tokenTypeName || undefined,
				properties: tokenProperties,
			});

			return {
				linearId,
				updated: (response as any).success,
			};
		}

		case 'getTokenType': {
			const tokenType = this.getNodeParameter('tokenType', itemIndex, '') as string;
			const linearId = this.getNodeParameter('linearId', itemIndex, '') as string;

			const response = await client.executeRpc('getTokenType', {
				tokenType: tokenType || undefined,
				linearId: linearId || undefined,
			});

			return {
				tokenType: response,
				found: response !== null,
			};
		}

		case 'holdTokens': {
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as number;

			const response = await client.executeRpc('holdTokens', { tokenType, amount });
			return {
				holdId: response?.holdId,
				tokenType,
				amount,
				success: response?.success || false,
			};
		}

		case 'releaseHeldTokens': {
			const holdId = this.getNodeParameter('holdId', itemIndex) as string;
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;

			const response = await client.executeRpc('releaseHeldTokens', { holdId, tokenType });
			return {
				holdId,
				released: response?.success || false,
			};
		}

		case 'getHeldTokenBalance': {
			const holdId = this.getNodeParameter('holdId', itemIndex, '') as string;
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;

			const response = await client.executeRpc('getHeldTokenBalance', {
				holdId: holdId || undefined,
				tokenType,
			});

			return {
				heldBalance: response?.balance || 0,
				tokenType,
				holdId: holdId || 'all',
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
