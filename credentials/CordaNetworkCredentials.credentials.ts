import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Corda Network Credentials
 * 
 * Credentials for connecting to Corda network services including:
 * - Network Map: Registry of all network participants
 * - Doorman: Identity registration and certificate issuance
 * - Business Network Operator (BNO): Business network membership management
 * 
 * These credentials are used for network-level operations rather than
 * individual node interactions.
 */
export class CordaNetworkCredentials implements ICredentialType {
	name = 'cordaNetworkCredentials';
	displayName = 'Corda Network Credentials';
	documentationUrl = 'https://docs.corda.net/docs/corda-os/4.9/network-map.html';
	icon = 'file:corda.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Network Type',
			name: 'networkType',
			type: 'options',
			options: [
				{
					name: 'Corda Network (Production)',
					value: 'production',
				},
				{
					name: 'Corda Network (UAT)',
					value: 'uat',
				},
				{
					name: 'Private Network',
					value: 'private',
				},
				{
					name: 'Local Development',
					value: 'local',
				},
			],
			default: 'private',
			description: 'The type of Corda network to connect to',
		},
		{
			displayName: 'Network Map URL',
			name: 'networkMapUrl',
			type: 'string',
			default: '',
			placeholder: 'https://networkmap.example.com',
			description: 'URL of the Network Map service that maintains the registry of network participants',
		},
		{
			displayName: 'Doorman URL',
			name: 'doormanUrl',
			type: 'string',
			default: '',
			placeholder: 'https://doorman.example.com',
			description: 'URL of the Doorman service for identity registration and certificate issuance',
		},
		{
			displayName: 'Network Root Trust Store',
			name: 'networkRootTrustStore',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Base64-encoded network root trust store (JKS format)',
		},
		{
			displayName: 'Trust Store Password',
			name: 'trustStorePassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Password for the network root trust store',
		},
		{
			displayName: 'Node Info Hash',
			name: 'nodeInfoHash',
			type: 'string',
			default: '',
			placeholder: 'e.g., 3B5A...F2D1',
			description: 'SHA-256 hash of the node info for verification purposes',
		},
		{
			displayName: 'Business Network Operator (BNO)',
			name: 'bnoEnabled',
			type: 'boolean',
			default: false,
			description: 'Whether this network uses a Business Network Operator for membership management',
		},
		{
			displayName: 'BNO Identity',
			name: 'bnoIdentity',
			type: 'string',
			default: '',
			placeholder: 'O=BNO, L=London, C=GB',
			description: 'X.500 name of the Business Network Operator',
			displayOptions: {
				show: {
					bnoEnabled: [true],
				},
			},
		},
		{
			displayName: 'BNO Endpoint URL',
			name: 'bnoEndpointUrl',
			type: 'string',
			default: '',
			placeholder: 'https://bno.example.com/api',
			description: 'API endpoint for BNO membership operations',
			displayOptions: {
				show: {
					bnoEnabled: [true],
				},
			},
		},
		{
			displayName: 'BNO API Key',
			name: 'bnoApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for authenticating with the BNO service',
			displayOptions: {
				show: {
					bnoEnabled: [true],
				},
			},
		},
		{
			displayName: 'Network Parameters Version',
			name: 'networkParametersVersion',
			type: 'number',
			default: 1,
			description: 'Expected version of network parameters (for compatibility checks)',
		},
	];
}
