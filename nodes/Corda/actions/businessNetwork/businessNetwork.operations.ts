/**
 * Business Network Operations
 *
 * Operations for managing business network membership and roles.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';
import { BUSINESS_NETWORK_FLOWS } from '../../constants/flows';

export const businessNetworkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['businessNetwork'] } },
		options: [
			{ name: 'Get BN Membership', value: 'getBNMembership', description: 'Get business network membership', action: 'Get BN membership' },
			{ name: 'Request Membership', value: 'requestMembership', description: 'Request membership in business network', action: 'Request membership' },
			{ name: 'Activate Membership', value: 'activateMembership', description: 'Activate a membership', action: 'Activate membership' },
			{ name: 'Suspend Membership', value: 'suspendMembership', description: 'Suspend a membership', action: 'Suspend membership' },
			{ name: 'Get Member Info', value: 'getMemberInfo', description: 'Get member information', action: 'Get member info' },
			{ name: 'Get BN Participants', value: 'getBNParticipants', description: 'Get all participants', action: 'Get BN participants' },
			{ name: 'Get BN Roles', value: 'getBNRoles', description: 'Get available roles', action: 'Get BN roles' },
			{ name: 'Assign Role', value: 'assignRole', description: 'Assign role to member', action: 'Assign role' },
			{ name: 'Revoke Role', value: 'revokeRole', description: 'Revoke role from member', action: 'Revoke role' },
			{ name: 'Get BN Metadata', value: 'getBNMetadata', description: 'Get network metadata', action: 'Get BN metadata' },
			{ name: 'Update BN Metadata', value: 'updateBNMetadata', description: 'Update network metadata', action: 'Update BN metadata' },
		],
		default: 'getBNMembership',
	},
	{
		displayName: 'Network ID',
		name: 'networkId',
		type: 'string',
		default: '',
		description: 'The business network ID',
		displayOptions: { show: { resource: ['businessNetwork'], operation: ['getBNMembership', 'requestMembership', 'getBNParticipants', 'getBNRoles', 'getBNMetadata', 'updateBNMetadata'] } },
	},
	{
		displayName: 'Member Party',
		name: 'memberParty',
		type: 'string',
		default: '',
		placeholder: 'O=PartyA, L=London, C=GB',
		description: 'X.500 name of the member',
		displayOptions: { show: { resource: ['businessNetwork'], operation: ['activateMembership', 'suspendMembership', 'getMemberInfo', 'assignRole', 'revokeRole'] } },
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'string',
		default: '',
		placeholder: 'e.g., MEMBER, OPERATOR',
		description: 'Role to assign or revoke',
		displayOptions: { show: { resource: ['businessNetwork'], operation: ['assignRole', 'revokeRole'] } },
	},
	{
		displayName: 'Metadata (JSON)',
		name: 'metadata',
		type: 'json',
		default: '{}',
		description: 'Network metadata as JSON',
		displayOptions: { show: { resource: ['businessNetwork'], operation: ['updateBNMetadata'] } },
	},
];

export async function executeBusinessNetworkOperation(
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
		case 'getBNMembership': {
			const networkId = this.getNodeParameter('networkId', itemIndex) as string;
			const result = await client.executeRpc('getBNMembership', [networkId]);
			return { success: result.success, membership: (result.data as any) };
		}

		case 'requestMembership': {
			const networkId = this.getNodeParameter('networkId', itemIndex) as string;
			const result = await client.startFlow(BUSINESS_NETWORK_FLOWS.REQUEST_MEMBERSHIP, [networkId]);
			const data = (result.data as any);
			return { success: result.success, flowId: data?.flowId, membership: data?.result };
		}

		case 'activateMembership': {
			const memberParty = this.getNodeParameter('memberParty', itemIndex) as string;
			const result = await client.startFlow(BUSINESS_NETWORK_FLOWS.ACTIVATE_MEMBERSHIP, [memberParty]);
			const data = (result.data as any);
			return { success: result.success, flowId: data?.flowId, activated: true };
		}

		case 'suspendMembership': {
			const memberParty = this.getNodeParameter('memberParty', itemIndex) as string;
			const result = await client.startFlow(BUSINESS_NETWORK_FLOWS.SUSPEND_MEMBERSHIP, [memberParty]);
			const data = (result.data as any);
			return { success: result.success, flowId: data?.flowId, suspended: true };
		}

		case 'getMemberInfo': {
			const memberParty = this.getNodeParameter('memberParty', itemIndex) as string;
			const result = await client.executeRpc('getMemberInfo', [memberParty]);
			return { success: result.success, member: (result.data as any) };
		}

		case 'getBNParticipants': {
			const networkId = this.getNodeParameter('networkId', itemIndex) as string;
			const result = await client.executeRpc('getBNParticipants', [networkId]);
			const data = (result.data as any);
			return { success: result.success, participants: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'getBNRoles': {
			const networkId = this.getNodeParameter('networkId', itemIndex) as string;
			const result = await client.executeRpc('getBNRoles', [networkId]);
			return { success: result.success, roles: (result.data as any) };
		}

		case 'assignRole': {
			const memberParty = this.getNodeParameter('memberParty', itemIndex) as string;
			const role = this.getNodeParameter('role', itemIndex) as string;
			const result = await client.startFlow(BUSINESS_NETWORK_FLOWS.ASSIGN_ROLE, [memberParty, role]);
			const data = (result.data as any);
			return { success: result.success, flowId: data?.flowId, assigned: true };
		}

		case 'revokeRole': {
			const memberParty = this.getNodeParameter('memberParty', itemIndex) as string;
			const role = this.getNodeParameter('role', itemIndex) as string;
			const result = await client.startFlow(BUSINESS_NETWORK_FLOWS.REVOKE_ROLE, [memberParty, role]);
			const data = (result.data as any);
			return { success: result.success, flowId: data?.flowId, revoked: true };
		}

		case 'getBNMetadata': {
			const networkId = this.getNodeParameter('networkId', itemIndex) as string;
			const result = await client.executeRpc('getBNMetadata', [networkId]);
			return { success: result.success, metadata: (result.data as any) };
		}

		case 'updateBNMetadata': {
			const networkId = this.getNodeParameter('networkId', itemIndex) as string;
			const metadata = this.getNodeParameter('metadata', itemIndex) as object;
			const result = await client.startFlow(BUSINESS_NETWORK_FLOWS.UPDATE_NETWORK_METADATA, [networkId, metadata]);
			const data = (result.data as any);
			return { success: result.success, flowId: data?.flowId, updated: true };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
