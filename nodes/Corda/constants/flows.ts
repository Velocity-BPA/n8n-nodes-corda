/**
 * Corda Flow Constants
 * 
 * Common flow class names and flow-related constants.
 */

/**
 * Token SDK Flow Classes
 */
export const TOKEN_SDK_FLOWS = {
	// Issuance flows
	ISSUE_FUNGIBLE_TOKENS: 'com.r3.corda.lib.tokens.workflows.flows.issue.IssueTokensFlow',
	ISSUE_NON_FUNGIBLE_TOKENS: 'com.r3.corda.lib.tokens.workflows.flows.issue.IssueNonFungibleTokensFlow',
	
	// Movement flows
	MOVE_FUNGIBLE_TOKENS: 'com.r3.corda.lib.tokens.workflows.flows.move.MoveFungibleTokensFlow',
	MOVE_NON_FUNGIBLE_TOKENS: 'com.r3.corda.lib.tokens.workflows.flows.move.MoveNonFungibleTokensFlow',
	MOVE_TOKEN_NON_INTERACTIVE: 'com.r3.corda.lib.tokens.workflows.flows.move.MoveTokensFlowHandler',
	
	// Redemption flows
	REDEEM_FUNGIBLE_TOKENS: 'com.r3.corda.lib.tokens.workflows.flows.redeem.RedeemFungibleTokensFlow',
	REDEEM_NON_FUNGIBLE_TOKENS: 'com.r3.corda.lib.tokens.workflows.flows.redeem.RedeemNonFungibleTokensFlow',
	
	// Evolvable token flows
	CREATE_EVOLVABLE_TOKEN: 'com.r3.corda.lib.tokens.workflows.flows.evolvable.CreateEvolvableTokensFlow',
	UPDATE_EVOLVABLE_TOKEN: 'com.r3.corda.lib.tokens.workflows.flows.evolvable.UpdateEvolvableTokenFlow',
	
	// Query flows
	GET_TOKEN_BALANCE: 'com.r3.corda.lib.tokens.workflows.flows.query.GetTokenBalanceFlow',
	
	// Selection flows
	TOKEN_SELECTION: 'com.r3.corda.lib.tokens.selection.TokenSelection',
	LOCAL_TOKEN_SELECTOR: 'com.r3.corda.lib.tokens.selection.memory.selector.LocalTokenSelector',
	
	// Confidential tokens
	CONFIDENTIAL_ISSUE: 'com.r3.corda.lib.tokens.workflows.flows.confidential.ConfidentialIssueTokensFlow',
	CONFIDENTIAL_MOVE: 'com.r3.corda.lib.tokens.workflows.flows.confidential.ConfidentialMoveFungibleTokensFlow',
} as const;

/**
 * Accounts SDK Flow Classes
 */
export const ACCOUNTS_SDK_FLOWS = {
	// Account management
	CREATE_ACCOUNT: 'com.r3.corda.lib.accounts.workflows.flows.CreateAccount',
	REQUEST_ACCOUNT_INFO: 'com.r3.corda.lib.accounts.workflows.flows.RequestAccountInfo',
	SHARE_ACCOUNT_INFO: 'com.r3.corda.lib.accounts.workflows.flows.ShareAccountInfo',
	
	// State routing
	SHARE_STATE_WITH_ACCOUNT: 'com.r3.corda.lib.accounts.workflows.flows.ShareStateWithAccount',
	
	// Key management
	REQUEST_KEY_FOR_ACCOUNT: 'com.r3.corda.lib.accounts.workflows.flows.RequestKeyForAccount',
	NEW_KEY_FOR_ACCOUNT: 'com.r3.corda.lib.accounts.workflows.flows.NewKeyForAccount',
	
	// Account queries
	ACCOUNTS_FOR_HOST: 'com.r3.corda.lib.accounts.workflows.flows.AccountsForHost',
	ALL_ACCOUNTS: 'com.r3.corda.lib.accounts.workflows.flows.AllAccounts',
	ACCOUNT_INFO_BY_NAME: 'com.r3.corda.lib.accounts.workflows.flows.AccountInfoByName',
	ACCOUNT_INFO_BY_UUID: 'com.r3.corda.lib.accounts.workflows.flows.AccountInfoByUUID',
} as const;

/**
 * Confidential Identity Flow Classes
 */
export const CONFIDENTIAL_IDENTITY_FLOWS = {
	// Identity swapping
	SWAP_IDENTITIES: 'com.r3.corda.lib.ci.workflows.SwapIdentitiesFlow',
	SWAP_IDENTITIES_HANDLER: 'com.r3.corda.lib.ci.workflows.SwapIdentitiesFlowHandler',
	
	// Key requests
	REQUEST_KEY: 'com.r3.corda.lib.ci.workflows.RequestKeyFlow',
	PROVIDE_KEY: 'com.r3.corda.lib.ci.workflows.ProvideKeyFlow',
	
	// Key mapping sync
	SYNC_KEY_MAPPING: 'com.r3.corda.lib.ci.workflows.SyncKeyMappingFlow',
	SYNC_KEY_MAPPING_HANDLER: 'com.r3.corda.lib.ci.workflows.SyncKeyMappingFlowHandler',
} as const;

/**
 * Business Network Flow Classes
 */
export const BUSINESS_NETWORK_FLOWS = {
	// Membership flows
	REQUEST_MEMBERSHIP: 'net.corda.bn.flows.RequestMembershipFlow',
	ACTIVATE_MEMBERSHIP: 'net.corda.bn.flows.ActivateMembershipFlow',
	SUSPEND_MEMBERSHIP: 'net.corda.bn.flows.SuspendMembershipFlow',
	REVOKE_MEMBERSHIP: 'net.corda.bn.flows.RevokeMembershipFlow',
	
	// Role management
	MODIFY_ROLES: 'net.corda.bn.flows.ModifyRolesFlow',
	ASSIGN_BN_ROLE: 'net.corda.bn.flows.AssignBNRoleFlow',
	ASSIGN_ROLE: 'net.corda.bn.flows.AssignRoleFlow',
	REVOKE_ROLE: 'net.corda.bn.flows.RevokeRoleFlow',
	
	// Group management
	CREATE_BN_GROUP: 'net.corda.bn.flows.CreateBusinessNetworkFlow',
	MODIFY_BN_GROUP: 'net.corda.bn.flows.ModifyBusinessNetworkFlow',
	UPDATE_NETWORK_METADATA: 'net.corda.bn.flows.UpdateNetworkMetadataFlow',
	
	// Membership queries
	GET_MEMBERSHIPS: 'net.corda.bn.flows.GetMembershipsFlow',
} as const;

/**
 * Core Corda Flow Classes
 */
export const CORE_FLOWS = {
	// Finality flows
	FINALITY_FLOW: 'net.corda.core.flows.FinalityFlow',
	RECEIVE_FINALITY_FLOW: 'net.corda.core.flows.ReceiveFinalityFlow',
	
	// Transaction verification
	RECEIVE_TRANSACTION_FLOW: 'net.corda.core.flows.ReceiveTransactionFlow',
	SEND_TRANSACTION_FLOW: 'net.corda.core.flows.SendTransactionFlow',
	
	// State collection
	COLLECT_SIGNATURES_FLOW: 'net.corda.core.flows.CollectSignaturesFlow',
	SIGN_TRANSACTION_FLOW: 'net.corda.core.flows.SignTransactionFlow',
	
	// Notarisation
	NOTARISE_FLOW: 'net.corda.core.flows.NotaryFlow$Client',
	
	// Contract upgrade
	CONTRACT_UPGRADE_FLOW: 'net.corda.core.flows.ContractUpgradeFlow',
} as const;

/**
 * Flow exception types
 */
export const FLOW_EXCEPTIONS = {
	FLOW_EXCEPTION: 'net.corda.core.flows.FlowException',
	INSUFFICIENT_BALANCE: 'com.r3.corda.lib.tokens.selection.InsufficientBalanceException',
	STATE_NOT_FOUND: 'net.corda.core.node.services.StatesNotAvailableException',
	NOTARY_EXCEPTION: 'net.corda.core.flows.NotaryException',
	TRANSACTION_VERIFICATION: 'net.corda.core.contracts.TransactionVerificationException',
} as const;

/**
 * Flow progress tracker stages
 */
export const FLOW_PROGRESS_STAGES = {
	GENERATING_TRANSACTION: 'Generating transaction',
	VERIFYING_TRANSACTION: 'Verifying transaction',
	SIGNING_TRANSACTION: 'Signing transaction',
	GATHERING_SIGNATURES: 'Gathering signatures',
	COLLECTING_SIGNATURES: 'Collecting signatures',
	RECORDING_TRANSACTION: 'Recording transaction',
	FINALISING_TRANSACTION: 'Finalising transaction',
	NOTARISING_TRANSACTION: 'Notarising transaction',
	BROADCASTING_TRANSACTION: 'Broadcasting transaction',
	DONE: 'Done',
} as const;
