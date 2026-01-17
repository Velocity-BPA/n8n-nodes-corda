import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Corda Node Credentials
 * 
 * Credentials for connecting to a Corda node via RPC.
 * Supports Corda 4.x (Open Source and Enterprise) and Corda 5.x.
 * 
 * Corda nodes expose an RPC interface (typically on port 10006) that allows
 * external applications to interact with the node, query the vault, start flows,
 * and subscribe to state updates.
 */
export class CordaNodeCredentials implements ICredentialType {
	name = 'cordaNodeCredentials';
	displayName = 'Corda Node Credentials';
	documentationUrl = 'https://docs.corda.net/docs/corda-os/4.9/clientrpc.html';
	icon = 'file:corda.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Corda Version',
			name: 'cordaVersion',
			type: 'options',
			options: [
				{
					name: 'Corda 4.x (Open Source)',
					value: 'corda4os',
				},
				{
					name: 'Corda 4.x (Enterprise)',
					value: 'corda4ent',
				},
				{
					name: 'Corda 5.x',
					value: 'corda5',
				},
				{
					name: 'Local Development (Bootstrapper)',
					value: 'local',
				},
				{
					name: 'Custom Endpoint',
					value: 'custom',
				},
			],
			default: 'corda4os',
			description: 'The version of Corda running on the target node',
		},
		{
			displayName: 'Node RPC Host',
			name: 'rpcHost',
			type: 'string',
			default: 'localhost',
			placeholder: 'e.g., corda-node.example.com',
			description: 'The hostname or IP address of the Corda node RPC endpoint',
		},
		{
			displayName: 'Node RPC Port',
			name: 'rpcPort',
			type: 'number',
			default: 10006,
			description: 'The RPC port of the Corda node (default: 10006)',
		},
		{
			displayName: 'RPC Username',
			name: 'rpcUsername',
			type: 'string',
			default: '',
			placeholder: 'e.g., user1',
			description: 'The RPC username configured on the Corda node',
		},
		{
			displayName: 'RPC Password',
			name: 'rpcPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The RPC password for the specified username',
		},
		{
			displayName: 'SSL Enabled',
			name: 'sslEnabled',
			type: 'boolean',
			default: false,
			description: 'Whether to use SSL/TLS for the RPC connection',
		},
		{
			displayName: 'SSL Trust Store Path',
			name: 'sslTrustStorePath',
			type: 'string',
			default: '',
			placeholder: '/path/to/truststore.jks',
			description: 'Path to the SSL trust store file (JKS format)',
			displayOptions: {
				show: {
					sslEnabled: [true],
				},
			},
		},
		{
			displayName: 'SSL Trust Store Password',
			name: 'sslTrustStorePassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Password for the SSL trust store',
			displayOptions: {
				show: {
					sslEnabled: [true],
				},
			},
		},
		{
			displayName: 'Connection Pool Size',
			name: 'connectionPoolSize',
			type: 'number',
			default: 4,
			description: 'Number of RPC connections to maintain in the pool (for high-throughput scenarios)',
		},
		{
			displayName: 'Connection Timeout (ms)',
			name: 'connectionTimeout',
			type: 'number',
			default: 30000,
			description: 'Connection timeout in milliseconds',
		},
		{
			displayName: 'Custom RPC Endpoint',
			name: 'customEndpoint',
			type: 'string',
			default: '',
			placeholder: 'e.g., https://custom-corda-proxy.example.com/rpc',
			description: 'Custom RPC endpoint URL (for proxy or gateway configurations)',
			displayOptions: {
				show: {
					cordaVersion: ['custom'],
				},
			},
		},
	];

	// Test the credentials by attempting to connect to the node
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.customEndpoint || "http://" + $credentials.rpcHost + ":" + $credentials.rpcPort}}',
			url: '/health',
			method: 'GET',
			timeout: 5000,
		},
	};
}
