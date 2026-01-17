/**
 * Vault Query Utilities
 * 
 * Utilities for building Corda vault queries.
 * 
 * The Corda vault stores all known states and provides a query API
 * that supports filtering by various criteria including:
 * - State status (consumed/unconsumed)
 * - State type (contract class)
 * - Time windows
 * - Custom schema attributes
 * - Pagination and sorting
 */

import {
	STATE_STATUS,
	QUERY_OPERATORS,
	SORT_DIRECTION,
	LOGICAL_OPERATORS,
	DEFAULT_PAGINATION,
	RELEVANCY_STATUS,
} from '../constants/networks';

/**
 * Query criteria for vault queries
 */
export interface VaultQueryCriteria {
	status?: keyof typeof STATE_STATUS;
	contractStateTypes?: string[];
	stateRefs?: string[];
	notary?: string[];
	softLockingCondition?: SoftLockingCondition;
	timeCondition?: TimeCondition;
	relevancyStatus?: keyof typeof RELEVANCY_STATUS;
	constraintTypes?: string[];
	constraints?: string[];
	participants?: string[];
	externalIds?: string[];
}

/**
 * Soft locking condition for queries
 */
export interface SoftLockingCondition {
	type: 'LOCKED_ONLY' | 'UNLOCKED_ONLY' | 'UNLOCKED_AND_SPECIFIED' | 'SPECIFIED';
	lockIds?: string[];
}

/**
 * Time-based query condition
 */
export interface TimeCondition {
	type: 'RECORDED' | 'CONSUMED';
	predicate: TimeQueryPredicate;
}

/**
 * Time query predicate
 */
export interface TimeQueryPredicate {
	operator: 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN';
	value?: string;
	from?: string;
	to?: string;
}

/**
 * Pagination settings
 */
export interface PageSpecification {
	pageNumber: number;
	pageSize: number;
}

/**
 * Sort column specification
 */
export interface SortColumn {
	sortAttribute: string;
	direction: keyof typeof SORT_DIRECTION;
}

/**
 * Complete vault query specification
 */
export interface VaultQuerySpec {
	criteria?: VaultQueryCriteria;
	paging?: PageSpecification;
	sorting?: SortColumn[];
	contractStateType?: string;
}

/**
 * Query builder for creating vault queries
 */
export class VaultQueryBuilder {
	private criteria: VaultQueryCriteria = {};
	private paging: PageSpecification = {
		pageNumber: DEFAULT_PAGINATION.pageNumber,
		pageSize: DEFAULT_PAGINATION.pageSize,
	};
	private sorting: SortColumn[] = [];
	private contractStateType?: string;

	/**
	 * Set the state status filter
	 */
	withStatus(status: keyof typeof STATE_STATUS): VaultQueryBuilder {
		this.criteria.status = status;
		return this;
	}

	/**
	 * Filter by contract state types
	 */
	withContractStateTypes(types: string[]): VaultQueryBuilder {
		this.criteria.contractStateTypes = types;
		return this;
	}

	/**
	 * Filter by specific state references
	 */
	withStateRefs(refs: string[]): VaultQueryBuilder {
		this.criteria.stateRefs = refs;
		return this;
	}

	/**
	 * Filter by notary
	 */
	withNotary(notaries: string[]): VaultQueryBuilder {
		this.criteria.notary = notaries;
		return this;
	}

	/**
	 * Filter by participants
	 */
	withParticipants(participants: string[]): VaultQueryBuilder {
		this.criteria.participants = participants;
		return this;
	}

	/**
	 * Filter by external IDs
	 */
	withExternalIds(ids: string[]): VaultQueryBuilder {
		this.criteria.externalIds = ids;
		return this;
	}

	/**
	 * Add time condition
	 */
	withTimeCondition(condition: TimeCondition): VaultQueryBuilder {
		this.criteria.timeCondition = condition;
		return this;
	}

	/**
	 * Filter by recorded time (after)
	 */
	recordedAfter(timestamp: string): VaultQueryBuilder {
		this.criteria.timeCondition = {
			type: 'RECORDED',
			predicate: {
				operator: 'GREATER_THAN',
				value: timestamp,
			},
		};
		return this;
	}

	/**
	 * Filter by recorded time (before)
	 */
	recordedBefore(timestamp: string): VaultQueryBuilder {
		this.criteria.timeCondition = {
			type: 'RECORDED',
			predicate: {
				operator: 'LESS_THAN',
				value: timestamp,
			},
		};
		return this;
	}

	/**
	 * Filter by recorded time (between)
	 */
	recordedBetween(from: string, to: string): VaultQueryBuilder {
		this.criteria.timeCondition = {
			type: 'RECORDED',
			predicate: {
				operator: 'BETWEEN',
				from,
				to,
			},
		};
		return this;
	}

	/**
	 * Set soft locking condition
	 */
	withSoftLocking(condition: SoftLockingCondition): VaultQueryBuilder {
		this.criteria.softLockingCondition = condition;
		return this;
	}

	/**
	 * Set relevancy status
	 */
	withRelevancyStatus(status: keyof typeof RELEVANCY_STATUS): VaultQueryBuilder {
		this.criteria.relevancyStatus = status;
		return this;
	}

	/**
	 * Set pagination
	 */
	withPaging(pageNumber: number, pageSize: number): VaultQueryBuilder {
		if (pageSize > DEFAULT_PAGINATION.maxPageSize) {
			throw new Error(`Page size ${pageSize} exceeds maximum of ${DEFAULT_PAGINATION.maxPageSize}`);
		}
		this.paging = { pageNumber, pageSize };
		return this;
	}

	/**
	 * Add sorting
	 */
	orderBy(attribute: string, direction: keyof typeof SORT_DIRECTION = 'ASC'): VaultQueryBuilder {
		this.sorting.push({ sortAttribute: attribute, direction });
		return this;
	}

	/**
	 * Set the contract state type to query
	 */
	forContractState(stateType: string): VaultQueryBuilder {
		this.contractStateType = stateType;
		return this;
	}

	/**
	 * Build the query specification
	 */
	build(): VaultQuerySpec {
		return {
			criteria: this.criteria,
			paging: this.paging,
			sorting: this.sorting.length > 0 ? this.sorting : undefined,
			contractStateType: this.contractStateType,
		};
	}

	/**
	 * Reset the builder
	 */
	reset(): VaultQueryBuilder {
		this.criteria = {};
		this.paging = {
			pageNumber: DEFAULT_PAGINATION.pageNumber,
			pageSize: DEFAULT_PAGINATION.pageSize,
		};
		this.sorting = [];
		this.contractStateType = undefined;
		return this;
	}
}

/**
 * Create a new vault query builder
 */
export function createQueryBuilder(): VaultQueryBuilder {
	return new VaultQueryBuilder();
}

/**
 * Build a simple unconsumed states query
 */
export function queryUnconsumed(contractStateType?: string): VaultQuerySpec {
	const builder = createQueryBuilder().withStatus('UNCONSUMED');
	if (contractStateType) {
		builder.forContractState(contractStateType);
	}
	return builder.build();
}

/**
 * Build a simple consumed states query
 */
export function queryConsumed(contractStateType?: string): VaultQuerySpec {
	const builder = createQueryBuilder().withStatus('CONSUMED');
	if (contractStateType) {
		builder.forContractState(contractStateType);
	}
	return builder.build();
}

/**
 * Build a query for all states
 */
export function queryAll(contractStateType?: string): VaultQuerySpec {
	const builder = createQueryBuilder().withStatus('ALL');
	if (contractStateType) {
		builder.forContractState(contractStateType);
	}
	return builder.build();
}

/**
 * Convert query spec to Corda RPC format
 */
export function toRpcQueryCriteria(spec: VaultQuerySpec): object {
	return {
		status: spec.criteria?.status || 'UNCONSUMED',
		contractStateTypes: spec.criteria?.contractStateTypes || [],
		stateRefs: spec.criteria?.stateRefs || [],
		notary: spec.criteria?.notary || [],
		softLockingCondition: spec.criteria?.softLockingCondition,
		timeCondition: spec.criteria?.timeCondition,
		relevancyStatus: spec.criteria?.relevancyStatus || 'ALL',
		constraintTypes: spec.criteria?.constraintTypes || [],
		constraints: spec.criteria?.constraints || [],
		participants: spec.criteria?.participants || [],
	};
}
