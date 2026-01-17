/**
 * Corda Network Configuration Constants
 * 
 * Default configurations for different Corda network types and versions.
 */

/**
 * Default RPC port for Corda nodes
 */
export const DEFAULT_RPC_PORT = 10006;

/**
 * Default P2P port for Corda nodes
 */
export const DEFAULT_P2P_PORT = 10002;

/**
 * Default web server port for Corda nodes
 */
export const DEFAULT_WEB_PORT = 10007;

/**
 * Corda version configurations
 */
export const CORDA_VERSIONS = {
	CORDA_4_OS: {
		name: 'Corda 4.x Open Source',
		value: 'corda4os',
		minPlatformVersion: 4,
		maxPlatformVersion: 13,
		supportsRpc: true,
		supportsRest: false,
	},
	CORDA_4_ENT: {
		name: 'Corda 4.x Enterprise',
		value: 'corda4ent',
		minPlatformVersion: 4,
		maxPlatformVersion: 13,
		supportsRpc: true,
		supportsRest: false,
	},
	CORDA_5: {
		name: 'Corda 5.x',
		value: 'corda5',
		minPlatformVersion: 50000,
		supportsRpc: false,
		supportsRest: true,
	},
} as const;

/**
 * Common Corda network endpoints
 */
export const NETWORK_ENDPOINTS = {
	CORDA_NETWORK_PRODUCTION: {
		networkMap: 'https://netmap.cordanetwork.io',
		doorman: 'https://doorman.cordanetwork.io',
	},
	CORDA_NETWORK_UAT: {
		networkMap: 'https://netmap.uat.cordanetwork.io',
		doorman: 'https://doorman.uat.cordanetwork.io',
	},
} as const;

/**
 * State statuses for vault queries
 */
export const STATE_STATUS = {
	UNCONSUMED: 'UNCONSUMED',
	CONSUMED: 'CONSUMED',
	ALL: 'ALL',
} as const;

/**
 * Vault query operators
 */
export const QUERY_OPERATORS = {
	EQUAL: 'EQUAL',
	NOT_EQUAL: 'NOT_EQUAL',
	GREATER_THAN: 'GREATER_THAN',
	GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
	LESS_THAN: 'LESS_THAN',
	LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
	LIKE: 'LIKE',
	NOT_LIKE: 'NOT_LIKE',
	IN: 'IN',
	NOT_IN: 'NOT_IN',
	IS_NULL: 'IS_NULL',
	NOT_NULL: 'NOT_NULL',
	BETWEEN: 'BETWEEN',
} as const;

/**
 * Sorting directions
 */
export const SORT_DIRECTION = {
	ASC: 'ASC',
	DESC: 'DESC',
} as const;

/**
 * Notary service types
 */
export const NOTARY_SERVICE_TYPES = {
	VALIDATING: 'validating',
	NON_VALIDATING: 'non-validating',
	RAFT: 'raft',
	BFT: 'bft-smart',
} as const;

/**
 * Flow status values
 */
export const FLOW_STATUS = {
	RUNNING: 'RUNNING',
	COMPLETED: 'COMPLETED',
	FAILED: 'FAILED',
	KILLED: 'KILLED',
	HOSPITALIZED: 'HOSPITALIZED',
} as const;

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
	pageNumber: 1,
	pageSize: 200,
	maxPageSize: 10000,
} as const;

/**
 * Connection pool defaults
 */
export const CONNECTION_POOL_DEFAULTS = {
	minSize: 1,
	maxSize: 10,
	idleTimeout: 30000,
	connectionTimeout: 30000,
} as const;

/**
 * Logical operators for combining query criteria
 */
export const LOGICAL_OPERATORS = {
	AND: 'AND',
	OR: 'OR',
} as const;

/**
 * Relevancy status for vault queries
 */
export const RELEVANCY_STATUS = {
	RELEVANT: 'RELEVANT',
	NOT_RELEVANT: 'NOT_RELEVANT',
	ALL: 'ALL',
} as const;
