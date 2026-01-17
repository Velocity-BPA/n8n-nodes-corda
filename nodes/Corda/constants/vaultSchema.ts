/**
 * Corda Vault Schema Constants
 * 
 * Schema definitions and column names for vault queries.
 */

/**
 * Core vault schema columns
 */
export const VAULT_SCHEMA = {
	// State metadata columns
	STATE_REF: 'stateRef',
	RECORDED_TIME: 'recordedTime',
	CONSUMED_TIME: 'consumedTime',
	LOCK_ID: 'lockId',
	LOCK_UPDATE_TIME: 'lockUpdateTime',
	CONTRACT_STATE_CLASS_NAME: 'contractStateClassName',
	NOTARY_NAME: 'notary',
	
	// State status
	STATE_STATUS: 'stateStatus',
	
	// Relevancy
	RELEVANCY_STATUS: 'relevancyStatus',
	
	// Constraints
	CONSTRAINT_TYPE: 'constraintType',
	CONSTRAINT_DATA: 'constraintData',
} as const;

/**
 * Linear state schema columns
 */
export const LINEAR_STATE_SCHEMA = {
	UUID: 'uuid',
	EXTERNAL_ID: 'externalId',
	PARTICIPANTS: 'participants',
} as const;

/**
 * Fungible state schema columns
 */
export const FUNGIBLE_STATE_SCHEMA = {
	QUANTITY: 'quantity',
	ISSUER: 'issuer',
	ISSUER_REF: 'issuerRef',
	OWNER: 'owner',
} as const;

/**
 * Token SDK schema columns
 */
export const TOKEN_SCHEMA = {
	// Fungible token columns
	AMOUNT: 'amount',
	TOKEN_TYPE: 'tokenType',
	TOKEN_TYPE_ID: 'tokenTypeId',
	TOKEN_ISSUER: 'issuer',
	TOKEN_HOLDER: 'holder',
	
	// Non-fungible token columns
	TOKEN_ID: 'tokenId',
	
	// Evolvable token columns
	MAINTAINERS: 'maintainers',
	FRACTION_DIGITS: 'fractionDigits',
	LINEAR_ID: 'linearId',
} as const;

/**
 * Accounts SDK schema columns
 */
export const ACCOUNTS_SCHEMA = {
	ACCOUNT_UUID: 'accountId',
	ACCOUNT_NAME: 'name',
	ACCOUNT_HOST: 'host',
	ACCOUNT_STATUS: 'status',
} as const;

/**
 * Common queryable state mapping names
 */
export const SCHEMA_MAPPING_NAMES = {
	VAULT_STATES: 'vault_states',
	VAULT_LINEAR_STATES: 'vault_linear_states',
	VAULT_FUNGIBLE_STATES: 'vault_fungible_states',
	VAULT_TRANSACTION_NOTES: 'vault_transaction_notes',
} as const;

/**
 * Sort columns commonly available
 */
export const SORT_COLUMNS = {
	RECORDED_TIME: 'recordedTime',
	CONSUMED_TIME: 'consumedTime',
	STATE_REF: 'stateRef',
	LOCK_UPDATE_TIME: 'lockUpdateTime',
	UUID: 'uuid',
} as const;

/**
 * Aggregate functions for vault queries
 */
export const AGGREGATE_FUNCTIONS = {
	COUNT: 'COUNT',
	SUM: 'SUM',
	AVG: 'AVG',
	MIN: 'MIN',
	MAX: 'MAX',
} as const;
