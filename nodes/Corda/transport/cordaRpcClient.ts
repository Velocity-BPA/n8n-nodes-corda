/**
 * Corda RPC Client
 * 
 * HTTP-based client for interacting with Corda nodes via RPC proxy.
 * 
 * This client provides a REST-like interface to Corda node RPC operations.
 * It supports both Corda 4.x and can be adapted for different RPC proxy implementations.
 * 
 * Note: This implementation uses HTTP/REST as JavaScript doesn't have native
 * support for Corda's AMQP-based RPC protocol. You'll need a Corda RPC proxy
 * (such as Braid or a custom Spring Boot server) to use this client.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * Corda RPC client configuration
 */
export interface CordaRpcConfig {
	host: string;
	port: number;
	username: string;
	password: string;
	ssl?: boolean;
	sslTrustStorePath?: string;
	sslTrustStorePassword?: string;
	connectionTimeout?: number;
	requestTimeout?: number;
}

/**
 * RPC operation result
 */
export interface RpcResult<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	errorCode?: string;
	[key: string]: any;
}

/**
 * Flow invocation result
 */
export interface FlowResult<T = unknown> {
	flowId: string;
	status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'KILLED';
	result?: T;
	exception?: string;
	progress?: string[];
}

/**
 * Corda RPC Client for node interactions
 */
export class CordaRpcClient {
	private httpClient: AxiosInstance;
	private baseUrl: string;
	private isConnected: boolean = false;

	constructor(private config: CordaRpcConfig) {
		const protocol = config.ssl ? 'https' : 'http';
		this.baseUrl = `${protocol}://${config.host}:${config.port}`;
		
		this.httpClient = axios.create({
			baseURL: this.baseUrl,
			timeout: config.requestTimeout || 30000,
			auth: {
				username: config.username,
				password: config.password,
			},
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
		});
	}

	/**
	 * Test connection to the Corda node
	 */
	async testConnection(): Promise<RpcResult<boolean>> {
		try {
			const response = await this.httpClient.get('/api/status');
			this.isConnected = response.status === 200;
			return { success: true, data: this.isConnected };
		} catch (error) {
			const axiosError = error as AxiosError;
			return {
				success: false,
				error: axiosError.message,
				errorCode: axiosError.code,
			};
		}
	}

	/**
	 * Get node information
	 */
	async getNodeInfo(): Promise<RpcResult> {
		return this.executeRpc('nodeInfo', []);
	}

	/**
	 * Get network parameters
	 */
	async getNetworkParameters(): Promise<RpcResult> {
		return this.executeRpc('networkParameters', []);
	}

	/**
	 * Get registered flows
	 */
	async getRegisteredFlows(): Promise<RpcResult<string[]>> {
		return this.executeRpc('registeredFlows', []);
	}

	/**
	 * Get notary identities
	 */
	async getNotaryIdentities(): Promise<RpcResult> {
		return this.executeRpc('notaryIdentities', []);
	}

	/**
	 * Get the node's legal identities
	 */
	async getMyLegalIdentities(): Promise<RpcResult> {
		return this.executeRpc('nodeInfoFromParty', []);
	}

	/**
	 * Query the vault
	 */
	async queryVault(
		contractStateTypeOrSpec: string | object,
		criteria?: object,
		paging?: { pageNumber: number; pageSize: number },
		sorting?: { column: string; direction: string }[]
	): Promise<RpcResult> {
		// If first argument is an object, treat it as VaultQuerySpec
		if (typeof contractStateTypeOrSpec === 'object') {
			return this.executeRpc('vaultQuery', [contractStateTypeOrSpec]);
		}
		// Otherwise use the original signature
		return this.executeRpc('vaultQuery', [
			contractStateTypeOrSpec,
			criteria,
			paging,
			sorting,
		]);
	}

	/**
	 * Query vault by state type with all available states
	 */
	async queryVaultAll(contractStateType: string): Promise<RpcResult> {
		return this.executeRpc('vaultQueryAll', [contractStateType]);
	}

	/**
	 * Track vault updates (returns observable subscription info)
	 */
	async trackVaultUpdates(contractStateType: string): Promise<RpcResult> {
		return this.executeRpc('vaultTrack', [contractStateType]);
	}

	/**
	 * Start a flow
	 */
	async startFlow(
		flowClass: string,
		flowArgs: unknown[] | object
	): Promise<RpcResult<FlowResult>> {
		const argsArray = Array.isArray(flowArgs) ? flowArgs : [flowArgs];
		return this.executeRpc('startFlow', [flowClass, ...argsArray]);
	}

	/**
	 * Start a flow with client ID for idempotency
	 */
	async startFlowWithClientId(
		clientId: string,
		flowClass: string,
		flowArgs: unknown[]
	): Promise<RpcResult<FlowResult>> {
		return this.executeRpc('startFlowWithClientId', [clientId, flowClass, ...flowArgs]);
	}

	/**
	 * Start a tracked flow (with progress updates)
	 */
	async startTrackedFlow(
		flowClass: string,
		flowArgs: unknown[]
	): Promise<RpcResult<FlowResult>> {
		return this.executeRpc('startTrackedFlow', [flowClass, ...flowArgs]);
	}

	/**
	 * Kill a running flow
	 */
	async killFlow(flowId: string): Promise<RpcResult<boolean>> {
		return this.executeRpc('killFlow', [flowId]);
	}

	/**
	 * Get running flows
	 */
	async getStateMachineRunning(): Promise<RpcResult> {
		return this.executeRpc('stateMachinesSnapshot', []);
	}

	/**
	 * Get transaction by ID
	 */
	async getTransaction(txHash: string): Promise<RpcResult> {
		return this.executeRpc('transactionById', [txHash]);
	}

	/**
	 * Upload an attachment
	 */
	async uploadAttachment(
		data: Buffer,
		uploader: string,
		filename: string
	): Promise<RpcResult<string>> {
		try {
			const formData = new FormData();
			const blob = new Blob([data]);
			formData.append('file', blob, filename);
			formData.append('uploader', uploader);
			
			const response = await this.httpClient.post('/api/attachments', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			
			return { success: true, data: response.data };
		} catch (error) {
			const axiosError = error as AxiosError;
			return {
				success: false,
				error: axiosError.message,
				errorCode: axiosError.code,
			};
		}
	}

	/**
	 * Download an attachment
	 */
	async downloadAttachment(attachmentId: string): Promise<RpcResult<Buffer>> {
		try {
			const response = await this.httpClient.get(`/api/attachments/${attachmentId}`, {
				responseType: 'arraybuffer',
			});
			
			return { success: true, data: Buffer.from(response.data) };
		} catch (error) {
			const axiosError = error as AxiosError;
			return {
				success: false,
				error: axiosError.message,
				errorCode: axiosError.code,
			};
		}
	}

	/**
	 * Get attachment metadata
	 */
	async getAttachmentMetadata(attachmentId: string): Promise<RpcResult> {
		return this.executeRpc('attachmentMetadata', [attachmentId]);
	}

	/**
	 * Well-known party from X.500 name
	 */
	async wellKnownPartyFromX500Name(x500Name: string): Promise<RpcResult> {
		return this.executeRpc('wellKnownPartyFromX500Name', [x500Name]);
	}

	/**
	 * Party from key
	 */
	async partyFromKey(publicKey: string): Promise<RpcResult> {
		return this.executeRpc('partyFromKey', [publicKey]);
	}

	/**
	 * Get network map snapshot
	 */
	async getNetworkMapSnapshot(): Promise<RpcResult> {
		return this.executeRpc('networkMapSnapshot', []);
	}

	/**
	 * Get current node time
	 */
	async getCurrentTime(): Promise<RpcResult<string>> {
		return this.executeRpc('currentNodeTime', []);
	}

	/**
	 * Clear network map cache
	 */
	async clearNetworkMapCache(): Promise<RpcResult<boolean>> {
		return this.executeRpc('clearNetworkMapCache', []);
	}

	/**
	 * Get platform version
	 */
	async getPlatformVersion(): Promise<RpcResult<number>> {
		return this.executeRpc('platformVersion', []);
	}

	/**
	 * Execute a generic RPC operation
	 */
	async executeRpc<T = unknown>(
		operation: string,
		args: unknown[] | object
	): Promise<RpcResult<T>> {
		try {
			const argsArray = Array.isArray(args) ? args : [args];
			const response = await this.httpClient.post('/api/rpc', {
				operation,
				arguments: argsArray,
			});
			
			return { success: true, data: response.data as T };
		} catch (error) {
			const axiosError = error as AxiosError;
			return {
				success: false,
				error: axiosError.message,
				errorCode: axiosError.code,
			};
		}
	}

	/**
	 * Close the RPC connection
	 */
	async close(): Promise<void> {
		this.isConnected = false;
		// HTTP connections are stateless, nothing to close
	}

	/**
	 * Check if connected
	 */
	get connected(): boolean {
		return this.isConnected;
	}
}

/**
 * Create a Corda RPC client instance
 */
export function createCordaRpcClient(config: CordaRpcConfig): CordaRpcClient {
	return new CordaRpcClient(config);
}
