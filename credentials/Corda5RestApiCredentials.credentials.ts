import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Corda 5 REST API Credentials
 * 
 * Credentials for connecting to Corda 5.x clusters via the REST API.
 * 
 * Corda 5 introduces a new architecture with:
 * - Virtual Nodes: Logical nodes running on a shared cluster
 * - REST API: HTTP-based API replacing RPC for external interactions
 * - CPIs (Corda Package Installer): New packaging format for CorDapps
 * - MGM (Membership Group Manager): Decentralized membership management
 */
export class Corda5RestApiCredentials implements ICredentialType {
	name = 'corda5RestApiCredentials';
	displayName = 'Corda 5 REST API Credentials';
	documentationUrl = 'https://docs.r3.com/en/platform/corda/5.0/developing-applications/api/rest-api.html';
	icon = 'file:corda.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'REST API Endpoint URL',
			name: 'restApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://corda5-cluster.example.com:8888',
			required: true,
			description: 'The base URL of the Corda 5 REST API endpoint',
		},
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'Basic Authentication',
					value: 'basic',
				},
				{
					name: 'mTLS (Mutual TLS)',
					value: 'mtls',
				},
				{
					name: 'OAuth 2.0',
					value: 'oauth2',
				},
			],
			default: 'basic',
			description: 'Authentication method for the REST API',
		},
		{
			displayName: 'API Username',
			name: 'apiUsername',
			type: 'string',
			default: '',
			placeholder: 'admin',
			description: 'Username for REST API authentication',
			displayOptions: {
				show: {
					authMethod: ['basic'],
				},
			},
		},
		{
			displayName: 'API Password',
			name: 'apiPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Password for REST API authentication',
			displayOptions: {
				show: {
					authMethod: ['basic'],
				},
			},
		},
		{
			displayName: 'Client Certificate (PEM)',
			name: 'clientCertificate',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 5,
			},
			default: '',
			placeholder: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
			description: 'Client certificate in PEM format for mTLS authentication',
			displayOptions: {
				show: {
					authMethod: ['mtls'],
				},
			},
		},
		{
			displayName: 'Client Private Key (PEM)',
			name: 'clientKey',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 5,
			},
			default: '',
			placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
			description: 'Client private key in PEM format for mTLS authentication',
			displayOptions: {
				show: {
					authMethod: ['mtls'],
				},
			},
		},
		{
			displayName: 'CA Certificate (PEM)',
			name: 'caCertificate',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 5,
			},
			default: '',
			placeholder: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
			description: 'Certificate Authority certificate for verifying the server',
			displayOptions: {
				show: {
					authMethod: ['mtls'],
				},
			},
		},
		{
			displayName: 'OAuth Token URL',
			name: 'oauthTokenUrl',
			type: 'string',
			default: '',
			placeholder: 'https://auth.example.com/oauth/token',
			description: 'OAuth 2.0 token endpoint URL',
			displayOptions: {
				show: {
					authMethod: ['oauth2'],
				},
			},
		},
		{
			displayName: 'OAuth Client ID',
			name: 'oauthClientId',
			type: 'string',
			default: '',
			description: 'OAuth 2.0 client ID',
			displayOptions: {
				show: {
					authMethod: ['oauth2'],
				},
			},
		},
		{
			displayName: 'OAuth Client Secret',
			name: 'oauthClientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'OAuth 2.0 client secret',
			displayOptions: {
				show: {
					authMethod: ['oauth2'],
				},
			},
		},
		{
			displayName: 'Cluster ID',
			name: 'clusterId',
			type: 'string',
			default: '',
			placeholder: 'e.g., cluster-01',
			description: 'Identifier of the Corda 5 cluster',
		},
		{
			displayName: 'Default Virtual Node ID',
			name: 'virtualNodeId',
			type: 'string',
			default: '',
			placeholder: 'e.g., 3B5AF2D1...',
			description: 'Default Virtual Node short hash ID to use for operations (can be overridden per request)',
		},
		{
			displayName: 'Request Timeout (ms)',
			name: 'requestTimeout',
			type: 'number',
			default: 30000,
			description: 'Request timeout in milliseconds for REST API calls',
		},
		{
			displayName: 'Ignore SSL Errors',
			name: 'ignoreSslErrors',
			type: 'boolean',
			default: false,
			description: 'Whether to ignore SSL certificate validation errors (not recommended for production)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.apiUsername}}',
				password: '={{$credentials.apiPassword}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.restApiUrl}}',
			url: '/api/v1/cluster',
			method: 'GET',
			timeout: 10000,
		},
	};
}
