/**
 * Corda Contract Constants
 * 
 * Common contract IDs and related constants for Corda SDK integrations.
 */

/**
 * Token SDK Contract IDs
 * These are the standard contract class names from the Corda Token SDK
 */
export const TOKEN_SDK_CONTRACTS = {
	// Fungible Token Contract
	FUNGIBLE_TOKEN: 'com.r3.corda.lib.tokens.contracts.FungibleTokenContract',
	
	// Non-Fungible Token Contract
	NON_FUNGIBLE_TOKEN: 'com.r3.corda.lib.tokens.contracts.NonFungibleTokenContract',
	
	// Evolvable Token Type Contract
	EVOLVABLE_TOKEN_TYPE: 'com.r3.corda.lib.tokens.contracts.EvolvableTokenContract',
	
	// Token Commands
	COMMANDS: {
		ISSUE: 'com.r3.corda.lib.tokens.contracts.commands.IssueTokenCommand',
		MOVE: 'com.r3.corda.lib.tokens.contracts.commands.MoveTokenCommand',
		REDEEM: 'com.r3.corda.lib.tokens.contracts.commands.RedeemTokenCommand',
		CREATE: 'com.r3.corda.lib.tokens.contracts.commands.Create',
		UPDATE: 'com.r3.corda.lib.tokens.contracts.commands.Update',
	},
} as const;

/**
 * Accounts SDK Contract IDs
 */
export const ACCOUNTS_SDK_CONTRACTS = {
	// Account Info State
	ACCOUNT_INFO: 'com.r3.corda.lib.accounts.contracts.states.AccountInfo',
	
	// Account Contract
	ACCOUNT_CONTRACT: 'com.r3.corda.lib.accounts.contracts.AccountInfoContract',
	
	// Commands
	COMMANDS: {
		CREATE: 'com.r3.corda.lib.accounts.contracts.commands.Create',
		SHARE: 'com.r3.corda.lib.accounts.contracts.commands.ShareStateWithAccount',
	},
} as const;

/**
 * Confidential Identity Contract IDs
 */
export const CONFIDENTIAL_IDENTITY_CONTRACTS = {
	// Anonymous Party state
	ANONYMOUS_PARTY: 'net.corda.core.identity.AnonymousParty',
	
	// Flows
	FLOWS: {
		SWAP_IDENTITIES: 'com.r3.corda.lib.ci.workflows.SwapIdentitiesFlow',
		REQUEST_KEY: 'com.r3.corda.lib.ci.workflows.RequestKeyFlow',
		SYNC_IDENTITIES: 'com.r3.corda.lib.ci.workflows.SyncKeyMappingFlow',
	},
} as const;

/**
 * Common Corda Core State Types
 */
export const CORE_STATE_TYPES = {
	// Base state interfaces
	CONTRACT_STATE: 'net.corda.core.contracts.ContractState',
	LINEAR_STATE: 'net.corda.core.contracts.LinearState',
	OWNABLE_STATE: 'net.corda.core.contracts.OwnableState',
	FUNGIBLE_STATE: 'net.corda.core.contracts.FungibleState',
	QUERYABLE_STATE: 'net.corda.core.schemas.QueryableState',
	SCHEDULABLE_STATE: 'net.corda.core.contracts.SchedulableState',
	
	// Cash state (Finance module)
	CASH_STATE: 'net.corda.finance.contracts.asset.Cash$State',
	
	// Obligation state
	OBLIGATION_STATE: 'net.corda.finance.contracts.asset.Obligation$State',
} as const;

/**
 * Common Corda Core Contracts
 */
export const CORE_CONTRACTS = {
	// Cash Contract
	CASH: 'net.corda.finance.contracts.asset.Cash',
	
	// Commercial Paper
	COMMERCIAL_PAPER: 'net.corda.finance.contracts.CommercialPaper',
	
	// Obligation
	OBLIGATION: 'net.corda.finance.contracts.asset.Obligation',
} as const;

/**
 * State constraint types
 */
export const CONSTRAINT_TYPES = {
	ALWAYS_ACCEPT: 'AlwaysAcceptAttachmentConstraint',
	HASH: 'HashAttachmentConstraint',
	WHITELIST: 'WhitelistedByZoneAttachmentConstraint',
	SIGNATURE: 'SignatureAttachmentConstraint',
	AUTO: 'AutomaticPlaceholderConstraint',
} as const;

/**
 * Transaction component types
 */
export const TRANSACTION_COMPONENTS = {
	INPUT: 'INPUT',
	OUTPUT: 'OUTPUT',
	COMMAND: 'COMMAND',
	ATTACHMENT: 'ATTACHMENT',
	NOTARY: 'NOTARY',
	TIME_WINDOW: 'TIME_WINDOW',
	REFERENCE: 'REFERENCE',
} as const;
