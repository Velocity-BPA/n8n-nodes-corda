/**
 * Connection Pool Manager
 * 
 * Manages a pool of Corda RPC connections for improved performance
 * in high-throughput scenarios.
 */

import { CordaRpcClient, CordaRpcConfig, createCordaRpcClient } from './cordaRpcClient';
import { CONNECTION_POOL_DEFAULTS } from '../constants/networks';

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
	minSize?: number;
	maxSize?: number;
	idleTimeout?: number;
	acquireTimeout?: number;
}

/**
 * Pooled connection wrapper
 */
interface PooledConnection {
	client: CordaRpcClient;
	inUse: boolean;
	lastUsed: number;
	createdAt: number;
}

/**
 * Connection pool for Corda RPC clients
 */
export class ConnectionPool {
	private connections: PooledConnection[] = [];
	private config: Required<ConnectionPoolConfig>;
	private rpcConfig: CordaRpcConfig;
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor(rpcConfig: CordaRpcConfig, poolConfig?: ConnectionPoolConfig) {
		this.rpcConfig = rpcConfig;
		this.config = {
			minSize: poolConfig?.minSize ?? CONNECTION_POOL_DEFAULTS.minSize,
			maxSize: poolConfig?.maxSize ?? CONNECTION_POOL_DEFAULTS.maxSize,
			idleTimeout: poolConfig?.idleTimeout ?? CONNECTION_POOL_DEFAULTS.idleTimeout,
			acquireTimeout: poolConfig?.acquireTimeout ?? CONNECTION_POOL_DEFAULTS.connectionTimeout,
		};

		// Start cleanup interval
		this.startCleanup();
	}

	/**
	 * Initialize the pool with minimum connections
	 */
	async initialize(): Promise<void> {
		const promises: Promise<void>[] = [];
		for (let i = 0; i < this.config.minSize; i++) {
			promises.push(this.createConnection());
		}
		await Promise.all(promises);
	}

	/**
	 * Create a new connection
	 */
	private async createConnection(): Promise<void> {
		const client = createCordaRpcClient(this.rpcConfig);
		const result = await client.testConnection();

		if (result.success) {
			this.connections.push({
				client,
				inUse: false,
				lastUsed: Date.now(),
				createdAt: Date.now(),
			});
		}
	}

	/**
	 * Acquire a connection from the pool
	 */
	async acquire(): Promise<CordaRpcClient> {
		const startTime = Date.now();

		while (Date.now() - startTime < this.config.acquireTimeout) {
			// Find an available connection
			const available = this.connections.find((conn) => !conn.inUse);
			if (available) {
				available.inUse = true;
				available.lastUsed = Date.now();
				return available.client;
			}

			// Create new connection if pool not at max
			if (this.connections.length < this.config.maxSize) {
				await this.createConnection();
				const newConn = this.connections[this.connections.length - 1];
				if (newConn) {
					newConn.inUse = true;
					return newConn.client;
				}
			}

			// Wait briefly before retrying
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		throw new Error('Connection pool timeout: unable to acquire connection');
	}

	/**
	 * Release a connection back to the pool
	 */
	release(client: CordaRpcClient): void {
		const conn = this.connections.find((c) => c.client === client);
		if (conn) {
			conn.inUse = false;
			conn.lastUsed = Date.now();
		}
	}

	/**
	 * Execute an operation with automatic connection management
	 */
	async withConnection<T>(
		operation: (client: CordaRpcClient) => Promise<T>
	): Promise<T> {
		const client = await this.acquire();
		try {
			return await operation(client);
		} finally {
			this.release(client);
		}
	}

	/**
	 * Start the cleanup interval
	 */
	private startCleanup(): void {
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, this.config.idleTimeout / 2);
	}

	/**
	 * Cleanup idle connections
	 */
	private cleanup(): void {
		const now = Date.now();
		const minConnections = this.config.minSize;

		// Remove idle connections (keeping minimum)
		while (this.connections.length > minConnections) {
			const idleIndex = this.connections.findIndex(
				(conn) => !conn.inUse && now - conn.lastUsed > this.config.idleTimeout
			);

			if (idleIndex === -1) break;

			const [removed] = this.connections.splice(idleIndex, 1);
			removed.client.close();
		}
	}

	/**
	 * Get pool statistics
	 */
	getStats(): {
		total: number;
		active: number;
		idle: number;
		maxSize: number;
	} {
		const active = this.connections.filter((c) => c.inUse).length;
		return {
			total: this.connections.length,
			active,
			idle: this.connections.length - active,
			maxSize: this.config.maxSize,
		};
	}

	/**
	 * Close all connections and shutdown the pool
	 */
	async shutdown(): Promise<void> {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		const closePromises = this.connections.map((conn) => conn.client.close());
		await Promise.all(closePromises);
		this.connections = [];
	}
}

/**
 * Create a connection pool
 */
export function createConnectionPool(
	rpcConfig: CordaRpcConfig,
	poolConfig?: ConnectionPoolConfig
): ConnectionPool {
	return new ConnectionPool(rpcConfig, poolConfig);
}
