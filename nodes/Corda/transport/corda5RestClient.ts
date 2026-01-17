/**
 * Corda 5 REST API Client
 * 
 * Client for interacting with Corda 5 clusters via the REST API.
 * 
 * Corda 5 introduces a new architecture with:
 * - Virtual Nodes: Logical nodes running on shared infrastructure
 * - REST API: HTTP-based API for all external interactions
 * - MGM (Membership Group Manager): Decentralized membership management
 * - CPI/CPB: New CorDapp packaging format
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';

/**
 * Corda 5 REST API configuration
 */
export interface Corda5RestConfig {
	restApiUrl: string;
	authMethod: 'basic' | 'mtls' | 'oauth2';
	username?: string;
	password?: string;
	clientCertificate?: string;
	clientKey?: string;
	caCertificate?: string;
	oauthTokenUrl?: string;
	oauthClientId?: string;
	oauthClientSecret?: string;
	clusterId?: string;
	virtualNodeId?: string;
	requestTimeout?: number;
	ignoreSslErrors?: boolean;
}

/**
 * REST API result
 */
export interface RestResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	statusCode?: number;
}

/**
 * Virtual Node information
 */
export interface VirtualNode {
	holdingIdentity: {
		x500Name: string;
		groupId: string;
	};
	cpiIdentifier: {
		cpiName: string;
		cpiVersion: string;
		signerSummaryHash: string;
	};
	vaultDdlConnectionId: string;
	vaultDmlConnectionId: string;
	cryptoDdlConnectionId: string;
	cryptoDmlConnectionId: string;
	hsmConnectionId: string;
	flowP2pOperationalStatus: string;
	flowStartOperationalStatus: string;
	flowOperationalStatus: string;
	vaultDbOperationalStatus: string;
}

/**
 * CPI (Corda Package Installer) information
 */
export interface CpiInfo {
	id: {
		cpiName: string;
		cpiVersion: string;
		signerSummaryHash: string;
	};
	cpiFileChecksum: string;
	cpiFileFullChecksum: string;
	cpks: CpkInfo[];
	groupPolicy: string;
	timestamp: string;
}

/**
 * CPK (Corda Package) information
 */
export interface CpkInfo {
	id: {
		cpkName: string;
		cpkVersion: string;
		cpkSignerSummaryHash: string;
	};
	cpkFileChecksum: string;
	cpkFileFullChecksum: string;
	mainBundle: string;
	libraries: string[];
	type: string;
}

/**
 * Flow status from Corda 5
 */
export interface Corda5FlowStatus {
	holdingIdentityShortHash: string;
	clientRequestId: string;
	flowId: string;
	flowStatus: 'START_REQUESTED' | 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'KILLED';
	result?: string;
	flowError?: {
		type: string;
		message: string;
	};
	timestamp: string;
}

/**
 * Corda 5 REST API Client
 */
export class Corda5RestClient {
	private httpClient: AxiosInstance;
	private oauthToken?: string;
	private tokenExpiry?: Date;

	constructor(private config: Corda5RestConfig) {
		const httpsAgent = config.ignoreSslErrors
			? new https.Agent({ rejectUnauthorized: false })
			: undefined;

		this.httpClient = axios.create({
			baseURL: config.restApiUrl,
			timeout: config.requestTimeout || 30000,
			httpsAgent,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
		});

		// Add auth interceptor
		this.httpClient.interceptors.request.use(async (requestConfig) => {
			if (config.authMethod === 'basic' && config.username && config.password) {
				requestConfig.auth = {
					username: config.username,
					password: config.password,
				};
			} else if (config.authMethod === 'oauth2') {
				const token = await this.getOAuthToken();
				if (token) {
					requestConfig.headers.Authorization = `Bearer ${token}`;
				}
			}
			return requestConfig;
		});
	}

	/**
	 * Get OAuth token (if using OAuth authentication)
	 */
	private async getOAuthToken(): Promise<string | undefined> {
		if (this.oauthToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
			return this.oauthToken;
		}

		if (!this.config.oauthTokenUrl || !this.config.oauthClientId || !this.config.oauthClientSecret) {
			return undefined;
		}

		try {
			const response = await axios.post(
				this.config.oauthTokenUrl,
				new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: this.config.oauthClientId,
					client_secret: this.config.oauthClientSecret,
				}),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);

			this.oauthToken = response.data.access_token;
			const expiresIn = response.data.expires_in || 3600;
			this.tokenExpiry = new Date(Date.now() + (expiresIn - 60) * 1000);
			return this.oauthToken;
		} catch {
			return undefined;
		}
	}

	/**
	 * Get cluster status
	 */
	async getClusterStatus(): Promise<RestResult> {
		return this.executeRequest('GET', '/api/v1/cluster');
	}

	/**
	 * Get all virtual nodes
	 */
	async getVirtualNodes(): Promise<RestResult<{ virtualNodes: VirtualNode[] }>> {
		return this.executeRequest('GET', '/api/v1/virtualnode');
	}

	/**
	 * Get a specific virtual node
	 */
	async getVirtualNode(holdingIdShortHash: string): Promise<RestResult<VirtualNode>> {
		return this.executeRequest('GET', `/api/v1/virtualnode/${holdingIdShortHash}`);
	}

	/**
	 * Create a virtual node
	 */
	async createVirtualNode(params: {
		x500Name: string;
		cpiFileChecksum: string;
		vaultDdlConnection?: string;
		vaultDmlConnection?: string;
		cryptoDdlConnection?: string;
		cryptoDmlConnection?: string;
	}): Promise<RestResult<VirtualNode>> {
		return this.executeRequest('POST', '/api/v1/virtualnode', params);
	}

	/**
	 * Get all CPIs
	 */
	async getCpis(): Promise<RestResult<{ cpis: CpiInfo[] }>> {
		return this.executeRequest('GET', '/api/v1/cpi');
	}

	/**
	 * Upload a CPI
	 */
	async uploadCpi(cpiFile: Buffer): Promise<RestResult<{ id: string }>> {
		try {
			const formData = new FormData();
			const blob = new Blob([cpiFile]);
			formData.append('upload', blob, 'cordapp.cpi');

			const response = await this.httpClient.post('/api/v1/cpi', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});

			return { success: true, data: response.data, statusCode: response.status };
		} catch (error) {
			return this.handleError(error) as RestResult<{ id: string }>;
		}
	}

	/**
	 * Get CPI info
	 */
	async getCpiInfo(cpiFileChecksum: string): Promise<RestResult<CpiInfo>> {
		return this.executeRequest('GET', `/api/v1/cpi/${cpiFileChecksum}`);
	}

	/**
	 * Get flow classes available for a virtual node
	 */
	async getFlowClasses(holdingIdShortHash: string): Promise<RestResult<{ flowClassNames: string[] }>> {
		return this.executeRequest('GET', `/api/v1/virtualnode/${holdingIdShortHash}/flowclass`);
	}

	/**
	 * Start a flow
	 */
	async startFlow(
		holdingIdShortHash: string,
		clientRequestId: string,
		flowClassName: string,
		requestBody: object
	): Promise<RestResult<Corda5FlowStatus>> {
		return this.executeRequest(
			'POST',
			`/api/v1/flow/${holdingIdShortHash}`,
			{
				clientRequestId,
				flowClassName,
				requestBody: JSON.stringify(requestBody),
			}
		);
	}

	/**
	 * Get flow status
	 */
	async getFlowStatus(
		holdingIdShortHash: string,
		clientRequestId: string
	): Promise<RestResult<Corda5FlowStatus>> {
		return this.executeRequest(
			'GET',
			`/api/v1/flow/${holdingIdShortHash}/${clientRequestId}`
		);
	}

	/**
	 * Get all flows for a virtual node
	 */
	async getFlows(holdingIdShortHash: string): Promise<RestResult<{ flowStatusResponses: Corda5FlowStatus[] }>> {
		return this.executeRequest('GET', `/api/v1/flow/${holdingIdShortHash}`);
	}

	/**
	 * Get members visible to a virtual node (via MGM)
	 */
	async getMembers(holdingIdShortHash: string): Promise<RestResult> {
		return this.executeRequest('GET', `/api/v1/members/${holdingIdShortHash}`);
	}

	/**
	 * Register a member with MGM
	 */
	async registerMember(
		holdingIdShortHash: string,
		context: object
	): Promise<RestResult> {
		return this.executeRequest(
			'POST',
			`/api/v1/membership/${holdingIdShortHash}`,
			{ context }
		);
	}

	/**
	 * Get registration status
	 */
	async getRegistrationStatus(
		holdingIdShortHash: string,
		registrationId: string
	): Promise<RestResult> {
		return this.executeRequest(
			'GET',
			`/api/v1/membership/${holdingIdShortHash}/${registrationId}`
		);
	}

	/**
	 * Get keys for a virtual node
	 */
	async getKeys(holdingIdShortHash: string): Promise<RestResult> {
		return this.executeRequest('GET', `/api/v1/key/${holdingIdShortHash}`);
	}

	/**
	 * Generate a new key
	 */
	async generateKey(
		holdingIdShortHash: string,
		alias: string,
		scheme: string
	): Promise<RestResult> {
		return this.executeRequest(
			'POST',
			`/api/v1/key/${holdingIdShortHash}`,
			{ alias, scheme }
		);
	}

	/**
	 * Get RBAC permissions
	 */
	async getPermissions(): Promise<RestResult> {
		return this.executeRequest('GET', '/api/v1/permission');
	}

	/**
	 * Get RBAC roles
	 */
	async getRoles(): Promise<RestResult> {
		return this.executeRequest('GET', '/api/v1/role');
	}

	/**
	 * Get users
	 */
	async getUsers(): Promise<RestResult> {
		return this.executeRequest('GET', '/api/v1/user');
	}

	/**
	 * Execute a generic request
	 */
	private async executeRequest<T = unknown>(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		path: string,
		data?: object
	): Promise<RestResult<T>> {
		try {
			const response = await this.httpClient.request({
				method,
				url: path,
				data,
			});

			return {
				success: true,
				data: response.data as T,
				statusCode: response.status,
			};
		} catch (error) {
			return this.handleError(error) as RestResult<T>;
		}
	}

	/**
	 * Handle request errors
	 */
	private handleError(error: unknown): RestResult {
		const axiosError = error as AxiosError;
		return {
			success: false,
			error: axiosError.message,
			statusCode: axiosError.response?.status,
		};
	}
}

/**
 * Create a Corda 5 REST API client instance
 */
export function createCorda5RestClient(config: Corda5RestConfig): Corda5RestClient {
	return new Corda5RestClient(config);
}
