/**
 * Observable Manager
 * 
 * Manages subscriptions to Corda observables for real-time event streaming.
 * 
 * Corda provides observable feeds for various events:
 * - Vault updates (state changes)
 * - Network map updates (node changes)
 * - State machine updates (flow progress)
 * - Transaction updates
 */

import { Subject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import WebSocket from 'ws';

/**
 * Event types for Corda observables
 */
export type CordaEventType =
	| 'VAULT_UPDATE'
	| 'STATE_PRODUCED'
	| 'STATE_CONSUMED'
	| 'NETWORK_MAP_UPDATE'
	| 'STATE_MACHINE_UPDATE'
	| 'TRANSACTION_RECORDED'
	| 'FLOW_PROGRESS';

/**
 * Corda event payload
 */
export interface CordaEvent<T = unknown> {
	type: CordaEventType;
	timestamp: string;
	data: T;
}

/**
 * Vault update event data
 */
export interface VaultUpdateEvent {
	produced: StateAndRef[];
	consumed: StateAndRef[];
	flowId?: string;
}

/**
 * State and reference
 */
export interface StateAndRef {
	state: {
		data: unknown;
		contract: string;
		notary: string;
	};
	ref: {
		txhash: string;
		index: number;
	};
}

/**
 * Network map update event data
 */
export interface NetworkMapUpdateEvent {
	nodeInfos: NodeInfo[];
	networkParameters: object;
}

/**
 * Node info
 */
export interface NodeInfo {
	legalIdentities: string[];
	addresses: string[];
	platformVersion: number;
}

/**
 * State machine update event data
 */
export interface StateMachineUpdateEvent {
	id: string;
	flowClass: string;
	status: string;
	progress?: string;
}

/**
 * Observable subscription configuration
 */
export interface SubscriptionConfig {
	type: CordaEventType;
	contractStateType?: string;
	stateStatus?: 'UNCONSUMED' | 'CONSUMED' | 'ALL';
	notary?: string;
}

/**
 * Observable Manager for Corda events
 */
export class ObservableManager {
	private eventSubject: Subject<CordaEvent> = new Subject();
	private subscriptions: Map<string, Subscription> = new Map();
	private websocket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 5000;

	constructor(
		private wsUrl: string,
		private credentials: { username: string; password: string }
	) {}

	/**
	 * Connect to the WebSocket endpoint
	 */
	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			const authHeader = Buffer.from(
				`${this.credentials.username}:${this.credentials.password}`
			).toString('base64');

			this.websocket = new WebSocket(this.wsUrl, {
				headers: {
					Authorization: `Basic ${authHeader}`,
				},
			});

			this.websocket.on('open', () => {
				this.reconnectAttempts = 0;
				resolve();
			});

			this.websocket.on('message', (data) => {
				try {
					const event = JSON.parse(data.toString()) as CordaEvent;
					this.eventSubject.next(event);
				} catch {
					// Ignore malformed messages
				}
			});

			this.websocket.on('error', (error) => {
				reject(error);
			});

			this.websocket.on('close', () => {
				this.handleDisconnect();
			});
		});
	}

	/**
	 * Handle disconnection
	 */
	private handleDisconnect(): void {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			setTimeout(() => {
				this.connect().catch(() => {
					// Reconnection failed, will retry
				});
			}, this.reconnectDelay);
		}
	}

	/**
	 * Subscribe to events
	 */
	subscribe<T = unknown>(
		config: SubscriptionConfig,
		callback: (event: CordaEvent<T>) => void
	): string {
		const subscriptionId = `${config.type}-${Date.now()}-${Math.random()}`;

		const observable = this.getEventStream<T>(config);
		const subscription = observable.subscribe(callback);

		this.subscriptions.set(subscriptionId, subscription);

		// Send subscription request to server
		this.sendSubscriptionRequest(config);

		return subscriptionId;
	}

	/**
	 * Get an observable event stream
	 */
	getEventStream<T = unknown>(config: SubscriptionConfig): Observable<CordaEvent<T>> {
		return this.eventSubject.pipe(
			filter((event) => event.type === config.type),
			filter((event) => {
				if (config.contractStateType && event.type === 'VAULT_UPDATE') {
					const vaultEvent = event as CordaEvent<VaultUpdateEvent>;
					const states = [...vaultEvent.data.produced, ...vaultEvent.data.consumed];
					return states.some((s) => s.state.contract === config.contractStateType);
				}
				return true;
			}),
			map((event) => event as CordaEvent<T>)
		);
	}

	/**
	 * Send subscription request to server
	 */
	private sendSubscriptionRequest(config: SubscriptionConfig): void {
		if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
			this.websocket.send(
				JSON.stringify({
					action: 'subscribe',
					config,
				})
			);
		}
	}

	/**
	 * Unsubscribe from events
	 */
	unsubscribe(subscriptionId: string): void {
		const subscription = this.subscriptions.get(subscriptionId);
		if (subscription) {
			subscription.unsubscribe();
			this.subscriptions.delete(subscriptionId);
		}
	}

	/**
	 * Unsubscribe from all events
	 */
	unsubscribeAll(): void {
		for (const subscription of this.subscriptions.values()) {
			subscription.unsubscribe();
		}
		this.subscriptions.clear();
	}

	/**
	 * Get all active subscription IDs
	 */
	getActiveSubscriptions(): string[] {
		return Array.from(this.subscriptions.keys());
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.websocket !== null && this.websocket.readyState === WebSocket.OPEN;
	}

	/**
	 * Disconnect and cleanup
	 */
	disconnect(): void {
		this.unsubscribeAll();
		this.eventSubject.complete();

		if (this.websocket) {
			this.websocket.close();
			this.websocket = null;
		}
	}
}

/**
 * Create an observable manager instance
 */
export function createObservableManager(
	wsUrl: string,
	credentials: { username: string; password: string }
): ObservableManager {
	return new ObservableManager(wsUrl, credentials);
}

/**
 * Vault update filter options
 */
export interface VaultUpdateFilter {
	contractStateType?: string;
	stateStatus?: 'UNCONSUMED' | 'CONSUMED' | 'ALL';
	notary?: string;
	participants?: string[];
}

/**
 * Create a filtered vault update subscription
 */
export function createVaultUpdateSubscription(
	manager: ObservableManager,
	filterOptions: VaultUpdateFilter,
	callback: (event: CordaEvent<VaultUpdateEvent>) => void
): string {
	return manager.subscribe<VaultUpdateEvent>(
		{
			type: 'VAULT_UPDATE',
			...filterOptions,
		},
		callback
	);
}

/**
 * Create a state machine update subscription
 */
export function createStateMachineSubscription(
	manager: ObservableManager,
	callback: (event: CordaEvent<StateMachineUpdateEvent>) => void
): string {
	return manager.subscribe<StateMachineUpdateEvent>(
		{
			type: 'STATE_MACHINE_UPDATE',
		},
		callback
	);
}

/**
 * Create a network map update subscription
 */
export function createNetworkMapSubscription(
	manager: ObservableManager,
	callback: (event: CordaEvent<NetworkMapUpdateEvent>) => void
): string {
	return manager.subscribe<NetworkMapUpdateEvent>(
		{
			type: 'NETWORK_MAP_UPDATE',
		},
		callback
	);
}
