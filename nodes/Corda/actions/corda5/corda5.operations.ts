/**
 * Corda 5 Operations
 *
 * Operations for interacting with Corda 5 REST API.
 * Corda 5 uses a fundamentally different architecture with virtual nodes,
 * CPIs (Corda Package Installer), and REST-based communication.
 */

import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';

import { Corda5RestClient, Corda5RestConfig } from '../../transport/corda5RestClient';

/**
 * Corda 5 Operations - Properties for n8n UI
 */
export const corda5Operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
			},
		},
		options: [
			// Virtual Node Operations
			{
				name: 'Get Virtual Nodes',
				value: 'getVirtualNodes',
				description: 'Get all virtual nodes in the cluster',
				action: 'Get virtual nodes',
			},
			{
				name: 'Get Virtual Node',
				value: 'getVirtualNode',
				description: 'Get a specific virtual node by short hash',
				action: 'Get virtual node',
			},
			{
				name: 'Create Virtual Node',
				value: 'createVirtualNode',
				description: 'Create a new virtual node',
				action: 'Create virtual node',
			},
			// CPI Operations
			{
				name: 'Get CPIs',
				value: 'getCPIs',
				description: 'Get all uploaded CPIs (Corda Package Installers)',
				action: 'Get CP is',
			},
			{
				name: 'Upload CPI',
				value: 'uploadCPI',
				description: 'Upload a CPI to the cluster',
				action: 'Upload CPI',
			},
			{
				name: 'Get CPI Info',
				value: 'getCPIInfo',
				description: 'Get information about a specific CPI',
				action: 'Get CPI info',
			},
			// Flow Operations
			{
				name: 'Get Flow Classes',
				value: 'getFlowClasses',
				description: 'Get available flow classes for a virtual node',
				action: 'Get flow classes',
			},
			{
				name: 'Start REST Flow',
				value: 'startRESTFlow',
				description: 'Start a flow via REST API',
				action: 'Start REST flow',
			},
			{
				name: 'Get REST Flow Status',
				value: 'getRESTFlowStatus',
				description: 'Get the status of a running flow',
				action: 'Get REST flow status',
			},
			// Cluster Operations
			{
				name: 'Get Cluster Status',
				value: 'getClusterStatus',
				description: 'Get the status of the Corda cluster',
				action: 'Get cluster status',
			},
			// Member Operations
			{
				name: 'Get Members',
				value: 'getMembers',
				description: 'Get members visible to a virtual node',
				action: 'Get members',
			},
			{
				name: 'Register Member',
				value: 'registerMember',
				description: 'Register a member with the MGM',
				action: 'Register member',
			},
			// Key Operations
			{
				name: 'Get Keys',
				value: 'getKeys',
				description: 'Get keys for a virtual node',
				action: 'Get keys',
			},
			{
				name: 'Generate Key Pair',
				value: 'generateKeyPair',
				description: 'Generate a new key pair',
				action: 'Generate key pair',
			},
		],
		default: 'getVirtualNodes',
	},

	// ===========================================
	// Virtual Node Parameters
	// ===========================================
	{
		displayName: 'Virtual Node Short Hash',
		name: 'virtualNodeShortHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: [
					'getVirtualNode',
					'getFlowClasses',
					'startRESTFlow',
					'getRESTFlowStatus',
					'getMembers',
					'registerMember',
					'getKeys',
					'generateKeyPair',
				],
			},
		},
		default: '',
		description: 'The short hash identifier of the virtual node (12 hex characters)',
		placeholder: 'e.g., A1B2C3D4E5F6',
	},
	{
		displayName: 'CPI File Checksum',
		name: 'cpiFileChecksum',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['createVirtualNode'],
			},
		},
		default: '',
		description: 'The checksum of the CPI file to use for the virtual node',
	},
	{
		displayName: 'X.500 Name',
		name: 'x500Name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['createVirtualNode'],
			},
		},
		default: '',
		description: 'The X.500 distinguished name for the virtual node',
		placeholder: 'e.g., CN=Alice, OU=Test, O=R3, L=London, C=GB',
	},

	// ===========================================
	// CPI Parameters
	// ===========================================
	{
		displayName: 'CPI Checksum',
		name: 'cpiChecksum',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['getCPIInfo'],
			},
		},
		default: '',
		description: 'The checksum of the CPI to get information for',
	},
	{
		displayName: 'CPI File (Base64)',
		name: 'cpiFileBase64',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['uploadCPI'],
			},
		},
		default: '',
		description: 'The CPI file content encoded as Base64',
		typeOptions: {
			rows: 4,
		},
	},

	// ===========================================
	// Flow Parameters
	// ===========================================
	{
		displayName: 'Flow Class Name',
		name: 'flowClassName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['startRESTFlow'],
			},
		},
		default: '',
		description: 'Fully qualified class name of the flow to start',
		placeholder: 'e.g., com.example.flows.TransferFlow',
	},
	{
		displayName: 'Flow Request Body (JSON)',
		name: 'flowRequestBody',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['startRESTFlow'],
			},
		},
		default: '{}',
		description: 'JSON request body for the flow',
	},
	{
		displayName: 'Client Request ID',
		name: 'clientRequestId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['startRESTFlow', 'getRESTFlowStatus'],
			},
		},
		default: '',
		description: 'Client-provided request ID for idempotent flow execution. If empty, one will be generated.',
	},
	{
		displayName: 'Wait for Completion',
		name: 'waitForCompletion',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['startRESTFlow'],
			},
		},
		default: false,
		description: 'Whether to wait for the flow to complete before returning',
	},
	{
		displayName: 'Timeout (Seconds)',
		name: 'timeout',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['startRESTFlow'],
				waitForCompletion: [true],
			},
		},
		default: 60,
		description: 'Maximum time to wait for flow completion',
	},

	// ===========================================
	// Member Parameters
	// ===========================================
	{
		displayName: 'Registration Context (JSON)',
		name: 'registrationContext',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['registerMember'],
			},
		},
		default: '{}',
		description: 'Additional registration context as JSON',
	},

	// ===========================================
	// Key Parameters
	// ===========================================
	{
		displayName: 'Key Alias',
		name: 'keyAlias',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['generateKeyPair'],
			},
		},
		default: '',
		description: 'Alias for the new key pair',
	},
	{
		displayName: 'Key Scheme',
		name: 'keyScheme',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['corda5'],
				operation: ['generateKeyPair'],
			},
		},
		options: [
			{ name: 'CORDA.ECDSA.SECP256R1', value: 'CORDA.ECDSA.SECP256R1' },
			{ name: 'CORDA.ECDSA.SECP256K1', value: 'CORDA.ECDSA.SECP256K1' },
			{ name: 'CORDA.RSA', value: 'CORDA.RSA' },
			{ name: 'CORDA.SPHINCS-256', value: 'CORDA.SPHINCS-256' },
			{ name: 'CORDA.EDDSA.ED25519', value: 'CORDA.EDDSA.ED25519' },
		],
		default: 'CORDA.ECDSA.SECP256R1',
		description: 'Cryptographic scheme for the key pair',
	},
];

/**
 * Execute Corda 5 operation
 */
export async function executeCorda5Operation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number
): Promise<IDataObject> {
	// Get credentials
	const credentials = await this.getCredentials('corda5RestApiCredentials');

	// Create Corda 5 REST client configuration
	const config: Corda5RestConfig = {
		restApiUrl: credentials.apiEndpoint as string,
		authMethod: 'basic',
		username: credentials.username as string,
		password: credentials.password as string,
		clusterId: credentials.clusterId as string | undefined,
		virtualNodeId: credentials.virtualNodeId as string | undefined,
		clientCertificate: credentials.clientCertificate as string | undefined,
		clientKey: credentials.clientKey as string | undefined,
	};

	// Create Corda 5 REST client
	const client = new Corda5RestClient(config);

	switch (operation) {
		// ===========================================
		// Virtual Node Operations
		// ===========================================
		case 'getVirtualNodes': {
			const result = await client.getVirtualNodes();
			return result as unknown as IDataObject;
		}

		case 'getVirtualNode': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const result = await client.getVirtualNode(shortHash);
			return result as unknown as IDataObject;
		}

		case 'createVirtualNode': {
			const cpiFileChecksum = this.getNodeParameter('cpiFileChecksum', itemIndex) as string;
			const x500Name = this.getNodeParameter('x500Name', itemIndex) as string;
			const result = await client.createVirtualNode({
				x500Name,
				cpiFileChecksum,
			});
			return result as unknown as IDataObject;
		}

		// ===========================================
		// CPI Operations
		// ===========================================
		case 'getCPIs': {
			const result = await client.getCpis();
			return result as unknown as IDataObject;
		}

		case 'uploadCPI': {
			const cpiFileBase64 = this.getNodeParameter('cpiFileBase64', itemIndex) as string;
			const cpiBuffer = Buffer.from(cpiFileBase64, 'base64');
			const result = await client.uploadCpi(cpiBuffer);
			return result as unknown as IDataObject;
		}

		case 'getCPIInfo': {
			const cpiChecksum = this.getNodeParameter('cpiChecksum', itemIndex) as string;
			const result = await client.getCpiInfo(cpiChecksum);
			return result as unknown as IDataObject;
		}

		// ===========================================
		// Flow Operations
		// ===========================================
		case 'getFlowClasses': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const result = await client.getFlowClasses(shortHash);
			return result as unknown as IDataObject;
		}

		case 'startRESTFlow': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const flowClassName = this.getNodeParameter('flowClassName', itemIndex) as string;
			const flowRequestBody = this.getNodeParameter('flowRequestBody', itemIndex) as IDataObject;
			const clientRequestId = this.getNodeParameter('clientRequestId', itemIndex, '') as string;
			const waitForCompletion = this.getNodeParameter('waitForCompletion', itemIndex, false) as boolean;

			// Generate client request ID if not provided
			const requestId = clientRequestId || `n8n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			const startResult = await client.startFlow(shortHash, requestId, flowClassName, flowRequestBody);

			if (waitForCompletion && startResult.success) {
				const timeout = this.getNodeParameter('timeout', itemIndex, 60) as number;
				const endTime = Date.now() + timeout * 1000;

				// Poll for completion
				while (Date.now() < endTime) {
					const statusResult = await client.getFlowStatus(shortHash, requestId);
					if (statusResult.success && statusResult.data) {
						const status = statusResult.data;
						if (status.flowStatus === 'COMPLETED') {
							return {
								clientRequestId: requestId,
								flowStatus: 'COMPLETED',
								result: status.result,
							};
						} else if (status.flowStatus === 'FAILED') {
							return {
								clientRequestId: requestId,
								flowStatus: 'FAILED',
								error: status.flowError,
							};
						}
					}
					// Wait before polling again
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
				return {
					clientRequestId: requestId,
					flowStatus: 'TIMEOUT',
					message: `Flow did not complete within ${timeout} seconds`,
				};
			}

			return {
				clientRequestId: requestId,
				...(startResult as unknown as IDataObject),
			};
		}

		case 'getRESTFlowStatus': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const clientRequestId = this.getNodeParameter('clientRequestId', itemIndex) as string;
			const result = await client.getFlowStatus(shortHash, clientRequestId);
			return result as unknown as IDataObject;
		}

		// ===========================================
		// Cluster Operations
		// ===========================================
		case 'getClusterStatus': {
			const result = await client.getClusterStatus();
			return result as unknown as IDataObject;
		}

		// ===========================================
		// Member Operations
		// ===========================================
		case 'getMembers': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const result = await client.getMembers(shortHash);
			return result as unknown as IDataObject;
		}

		case 'registerMember': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const registrationContext = this.getNodeParameter('registrationContext', itemIndex, {}) as IDataObject;
			const result = await client.registerMember(shortHash, registrationContext);
			return result as unknown as IDataObject;
		}

		// ===========================================
		// Key Operations
		// ===========================================
		case 'getKeys': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const result = await client.getKeys(shortHash);
			return result as unknown as IDataObject;
		}

		case 'generateKeyPair': {
			const shortHash = this.getNodeParameter('virtualNodeShortHash', itemIndex) as string;
			const keyAlias = this.getNodeParameter('keyAlias', itemIndex) as string;
			const keyScheme = this.getNodeParameter('keyScheme', itemIndex) as string;
			const result = await client.generateKey(shortHash, keyAlias, keyScheme);
			return result as unknown as IDataObject;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
