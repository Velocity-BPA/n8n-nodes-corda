/**
 * Query Builder Utilities
 * 
 * Utilities for building various types of Corda queries.
 */

import { QUERY_OPERATORS, LOGICAL_OPERATORS } from '../constants/networks';

/**
 * Query expression for custom criteria
 */
export interface QueryExpression {
	column: string;
	operator: keyof typeof QUERY_OPERATORS;
	value: unknown;
}

/**
 * Compound query with logical operators
 */
export interface CompoundQuery {
	operator: keyof typeof LOGICAL_OPERATORS;
	expressions: (QueryExpression | CompoundQuery)[];
}

/**
 * Linear state query builder
 */
export interface LinearStateQuery {
	uuid?: string;
	externalId?: string;
	participants?: string[];
}

/**
 * Fungible state query builder
 */
export interface FungibleStateQuery {
	issuer?: string;
	owner?: string;
	minQuantity?: number;
	maxQuantity?: number;
}

/**
 * Token query builder for Token SDK queries
 */
export interface TokenQuery {
	tokenType?: string;
	tokenIdentifier?: string;
	holder?: string;
	issuer?: string;
	minAmount?: number;
	maxAmount?: number;
}

/**
 * Build a query expression
 * 
 * @param column - Column name
 * @param operator - Query operator
 * @param value - Comparison value
 * @returns Query expression
 */
export function expression(
	column: string,
	operator: keyof typeof QUERY_OPERATORS,
	value: unknown
): QueryExpression {
	return { column, operator, value };
}

/**
 * Create an AND compound query
 * 
 * @param expressions - Expressions to combine
 * @returns Compound query with AND operator
 */
export function and(...expressions: (QueryExpression | CompoundQuery)[]): CompoundQuery {
	return {
		operator: 'AND',
		expressions,
	};
}

/**
 * Create an OR compound query
 * 
 * @param expressions - Expressions to combine
 * @returns Compound query with OR operator
 */
export function or(...expressions: (QueryExpression | CompoundQuery)[]): CompoundQuery {
	return {
		operator: 'OR',
		expressions,
	};
}

/**
 * Build a linear state query
 * 
 * @param params - Query parameters
 * @returns Linear state query object
 */
export function linearStateQuery(params: LinearStateQuery): object {
	const criteria: Record<string, unknown> = {};
	
	if (params.uuid) {
		criteria.uuid = params.uuid;
	}
	
	if (params.externalId) {
		criteria.externalId = params.externalId;
	}
	
	if (params.participants && params.participants.length > 0) {
		criteria.participants = params.participants;
	}
	
	return {
		linearStateQueryCriteria: criteria,
	};
}

/**
 * Build a fungible state query
 * 
 * @param params - Query parameters
 * @returns Fungible state query object
 */
export function fungibleStateQuery(params: FungibleStateQuery): object {
	const criteria: Record<string, unknown> = {};
	
	if (params.issuer) {
		criteria.issuer = params.issuer;
	}
	
	if (params.owner) {
		criteria.owner = params.owner;
	}
	
	if (params.minQuantity !== undefined) {
		criteria.minQuantity = params.minQuantity;
	}
	
	if (params.maxQuantity !== undefined) {
		criteria.maxQuantity = params.maxQuantity;
	}
	
	return {
		fungibleStateQueryCriteria: criteria,
	};
}

/**
 * Build a token query for Token SDK
 * 
 * @param params - Query parameters
 * @returns Token query object
 */
export function tokenQuery(params: TokenQuery): object {
	const criteria: Record<string, unknown> = {};
	
	if (params.tokenType) {
		criteria.tokenType = params.tokenType;
	}
	
	if (params.tokenIdentifier) {
		criteria.tokenIdentifier = params.tokenIdentifier;
	}
	
	if (params.holder) {
		criteria.holder = params.holder;
	}
	
	if (params.issuer) {
		criteria.issuer = params.issuer;
	}
	
	if (params.minAmount !== undefined) {
		criteria.minAmount = params.minAmount;
	}
	
	if (params.maxAmount !== undefined) {
		criteria.maxAmount = params.maxAmount;
	}
	
	return {
		tokenQueryCriteria: criteria,
	};
}

/**
 * Convert a query expression to SQL-like syntax (for debugging)
 * 
 * @param expr - Query expression
 * @returns SQL-like string
 */
export function expressionToSql(expr: QueryExpression): string {
	const operatorMap: Record<keyof typeof QUERY_OPERATORS, string> = {
		EQUAL: '=',
		NOT_EQUAL: '!=',
		GREATER_THAN: '>',
		GREATER_THAN_OR_EQUAL: '>=',
		LESS_THAN: '<',
		LESS_THAN_OR_EQUAL: '<=',
		LIKE: 'LIKE',
		NOT_LIKE: 'NOT LIKE',
		IN: 'IN',
		NOT_IN: 'NOT IN',
		IS_NULL: 'IS NULL',
		NOT_NULL: 'IS NOT NULL',
		BETWEEN: 'BETWEEN',
	};
	
	const op = operatorMap[expr.operator];
	
	if (expr.operator === 'IS_NULL' || expr.operator === 'NOT_NULL') {
		return `${expr.column} ${op}`;
	}
	
	if (expr.operator === 'IN' || expr.operator === 'NOT_IN') {
		const values = Array.isArray(expr.value) ? expr.value.join(', ') : expr.value;
		return `${expr.column} ${op} (${values})`;
	}
	
	return `${expr.column} ${op} ${JSON.stringify(expr.value)}`;
}

/**
 * Convert a compound query to SQL-like syntax (for debugging)
 * 
 * @param query - Compound query
 * @returns SQL-like string
 */
export function compoundQueryToSql(query: CompoundQuery): string {
	const parts = query.expressions.map((expr) => {
		if ('operator' in expr && 'expressions' in expr) {
			return `(${compoundQueryToSql(expr as CompoundQuery)})`;
		}
		return expressionToSql(expr as QueryExpression);
	});
	
	return parts.join(` ${String(query.operator)} `);
}

/**
 * Build an attachment query
 * 
 * @param params - Query parameters
 * @returns Attachment query object
 */
export function attachmentQuery(params: {
	uploadedBy?: string;
	uploadedAfter?: string;
	uploadedBefore?: string;
	contractClassNames?: string[];
	signers?: string[];
}): object {
	const criteria: Record<string, unknown> = {};
	
	if (params.uploadedBy) {
		criteria.uploadedBy = params.uploadedBy;
	}
	
	if (params.uploadedAfter) {
		criteria.uploadedAfter = params.uploadedAfter;
	}
	
	if (params.uploadedBefore) {
		criteria.uploadedBefore = params.uploadedBefore;
	}
	
	if (params.contractClassNames && params.contractClassNames.length > 0) {
		criteria.contractClassNames = params.contractClassNames;
	}
	
	if (params.signers && params.signers.length > 0) {
		criteria.signers = params.signers;
	}
	
	return {
		attachmentQueryCriteria: criteria,
	};
}
