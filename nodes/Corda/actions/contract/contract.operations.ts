/**
 * Contract Operations
 *
 * Operations for contract inspection and verification.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

export const contractOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['contract'] } },
		options: [
			{ name: 'Get Contract Info', value: 'getContractInfo', description: 'Get contract information', action: 'Get contract info' },
			{ name: 'Get Contract Attachment', value: 'getContractAttachment', description: 'Get contract attachment', action: 'Get contract attachment' },
			{ name: 'Verify Contract', value: 'verifyContract', description: 'Verify contract', action: 'Verify contract' },
			{ name: 'Get Constraint Info', value: 'getConstraintInfo', description: 'Get constraint information', action: 'Get constraint info' },
			{ name: 'Get Contract Signers', value: 'getContractSigners', description: 'Get contract signers', action: 'Get contract signers' },
			{ name: 'Get Contract Upgrades', value: 'getContractUpgrades', description: 'Get available upgrades', action: 'Get contract upgrades' },
			{ name: 'Get Legacy Contracts', value: 'getLegacyContracts', description: 'Get legacy contracts', action: 'Get legacy contracts' },
			{ name: 'Get Contract State Types', value: 'getContractStateTypes', description: 'Get state types', action: 'Get contract state types' },
		],
		default: 'getContractInfo',
	},
	{
		displayName: 'Contract Class Name',
		name: 'contractClassName',
		type: 'string',
		default: '',
		placeholder: 'e.g., com.example.contracts.MyContract',
		description: 'Fully qualified contract class name',
		displayOptions: { show: { resource: ['contract'] } },
	},
	{
		displayName: 'Constraint Type',
		name: 'constraintType',
		type: 'options',
		default: 'hash',
		options: [
			{ name: 'Hash', value: 'hash' },
			{ name: 'Signature', value: 'signature' },
			{ name: 'Whitelist', value: 'whitelist' },
			{ name: 'Always Accept', value: 'alwaysAccept' },
		],
		displayOptions: { show: { resource: ['contract'], operation: ['getConstraintInfo'] } },
	},
];

export async function executeContractOperation(
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

	const contractClassName = this.getNodeParameter('contractClassName', itemIndex, '') as string;

	switch (operation) {
		case 'getContractInfo': {
			const result = await client.executeRpc('contractInfo', [contractClassName]);
			return { success: result.success, contract: (result.data as any) };
		}

		case 'getContractAttachment': {
			const result = await client.executeRpc('contractAttachment', [contractClassName]);
			const data = (result.data as any);
			return { success: result.success, attachmentId: data?.attachmentId || data };
		}

		case 'verifyContract': {
			const result = await client.executeRpc('verifyContract', [contractClassName]);
			const data = (result.data as any);
			return { success: result.success, valid: data?.valid ?? true, errors: data?.errors || [] };
		}

		case 'getConstraintInfo': {
			const constraintType = this.getNodeParameter('constraintType', itemIndex) as string;
			const result = await client.executeRpc('constraintInfo', [constraintType]);
			return { success: result.success, constraint: (result.data as any) };
		}

		case 'getContractSigners': {
			const result = await client.executeRpc('contractSigners', [contractClassName]);
			const data = (result.data as any);
			return { success: result.success, signers: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'getContractUpgrades': {
			const result = await client.executeRpc('contractUpgrades', [contractClassName]);
			const data = (result.data as any);
			return { success: result.success, upgrades: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'getLegacyContracts': {
			const result = await client.executeRpc('legacyContracts', [contractClassName]);
			const data = (result.data as any);
			return { success: result.success, contracts: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'getContractStateTypes': {
			const result = await client.executeRpc('contractStateTypes', [contractClassName]);
			const data = (result.data as any);
			return { success: result.success, stateTypes: data, count: Array.isArray(data) ? data.length : 0 };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
