/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	expression,
	and,
	or,
	linearStateQuery,
	fungibleStateQuery,
	tokenQuery,
	expressionToSql,
	compoundQueryToSql,
} from '../../nodes/Corda/utils/queryBuilder';

describe('queryBuilder', () => {
	describe('expression', () => {
		it('should create an EQUAL expression', () => {
			const expr = expression('amount', 'EQUAL', 100);
			
			expect(expr.column).toBe('amount');
			expect(expr.operator).toBe('EQUAL');
			expect(expr.value).toBe(100);
		});

		it('should create a GREATER_THAN expression', () => {
			const expr = expression('quantity', 'GREATER_THAN', 50);
			
			expect(expr.column).toBe('quantity');
			expect(expr.operator).toBe('GREATER_THAN');
			expect(expr.value).toBe(50);
		});

		it('should create an IN expression', () => {
			const expr = expression('status', 'IN', ['ACTIVE', 'PENDING']);
			
			expect(expr.column).toBe('status');
			expect(expr.operator).toBe('IN');
			expect(expr.value).toEqual(['ACTIVE', 'PENDING']);
		});
	});

	describe('and', () => {
		it('should create an AND compound query', () => {
			const expr1 = expression('amount', 'GREATER_THAN', 100);
			const expr2 = expression('status', 'EQUAL', 'ACTIVE');
			const compound = and(expr1, expr2);
			
			expect(compound.operator).toBe('AND');
			expect(compound.expressions).toHaveLength(2);
		});

		it('should support nested compound queries', () => {
			const expr1 = expression('a', 'EQUAL', 1);
			const expr2 = expression('b', 'EQUAL', 2);
			const expr3 = expression('c', 'EQUAL', 3);
			const nested = or(expr2, expr3);
			const compound = and(expr1, nested);
			
			expect(compound.operator).toBe('AND');
			expect(compound.expressions).toHaveLength(2);
		});
	});

	describe('or', () => {
		it('should create an OR compound query', () => {
			const expr1 = expression('type', 'EQUAL', 'A');
			const expr2 = expression('type', 'EQUAL', 'B');
			const compound = or(expr1, expr2);
			
			expect(compound.operator).toBe('OR');
			expect(compound.expressions).toHaveLength(2);
		});
	});

	describe('linearStateQuery', () => {
		it('should create query with UUID', () => {
			const query = linearStateQuery({ uuid: '123e4567-e89b-12d3-a456-426614174000' });
			
			expect(query).toHaveProperty('linearStateQueryCriteria');
			expect((query as any).linearStateQueryCriteria.uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
		});

		it('should create query with external ID', () => {
			const query = linearStateQuery({ externalId: 'EXT-001' });
			
			expect((query as any).linearStateQueryCriteria.externalId).toBe('EXT-001');
		});

		it('should create query with participants', () => {
			const participants = ['O=PartyA, L=London, C=GB'];
			const query = linearStateQuery({ participants });
			
			expect((query as any).linearStateQueryCriteria.participants).toEqual(participants);
		});
	});

	describe('fungibleStateQuery', () => {
		it('should create query with issuer', () => {
			const query = fungibleStateQuery({ issuer: 'O=Bank, L=London, C=GB' });
			
			expect(query).toHaveProperty('fungibleStateQueryCriteria');
			expect((query as any).fungibleStateQueryCriteria.issuer).toBe('O=Bank, L=London, C=GB');
		});

		it('should create query with quantity range', () => {
			const query = fungibleStateQuery({ minQuantity: 100, maxQuantity: 1000 });
			
			expect((query as any).fungibleStateQueryCriteria.minQuantity).toBe(100);
			expect((query as any).fungibleStateQueryCriteria.maxQuantity).toBe(1000);
		});
	});

	describe('tokenQuery', () => {
		it('should create query with token type', () => {
			const query = tokenQuery({ tokenType: 'USD' });
			
			expect(query).toHaveProperty('tokenQueryCriteria');
			expect((query as any).tokenQueryCriteria.tokenType).toBe('USD');
		});

		it('should create query with holder and issuer', () => {
			const query = tokenQuery({
				holder: 'O=PartyA, L=London, C=GB',
				issuer: 'O=Bank, L=London, C=GB',
			});
			
			expect((query as any).tokenQueryCriteria.holder).toBe('O=PartyA, L=London, C=GB');
			expect((query as any).tokenQueryCriteria.issuer).toBe('O=Bank, L=London, C=GB');
		});

		it('should create query with amount range', () => {
			const query = tokenQuery({ minAmount: 50, maxAmount: 500 });
			
			expect((query as any).tokenQueryCriteria.minAmount).toBe(50);
			expect((query as any).tokenQueryCriteria.maxAmount).toBe(500);
		});
	});

	describe('expressionToSql', () => {
		it('should convert EQUAL expression to SQL', () => {
			const expr = expression('amount', 'EQUAL', 100);
			expect(expressionToSql(expr)).toBe('amount = 100');
		});

		it('should convert GREATER_THAN expression to SQL', () => {
			const expr = expression('quantity', 'GREATER_THAN', 50);
			expect(expressionToSql(expr)).toBe('quantity > 50');
		});

		it('should convert IS_NULL expression to SQL', () => {
			const expr = expression('deletedAt', 'IS_NULL', null);
			expect(expressionToSql(expr)).toBe('deletedAt IS NULL');
		});

		it('should convert IN expression to SQL', () => {
			const expr = expression('status', 'IN', ['A', 'B', 'C']);
			expect(expressionToSql(expr)).toBe('status IN (A, B, C)');
		});

		it('should convert LIKE expression to SQL', () => {
			const expr = expression('name', 'LIKE', '%test%');
			expect(expressionToSql(expr)).toBe('name LIKE "%test%"');
		});
	});

	describe('compoundQueryToSql', () => {
		it('should convert AND compound query to SQL', () => {
			const expr1 = expression('a', 'EQUAL', 1);
			const expr2 = expression('b', 'EQUAL', 2);
			const compound = and(expr1, expr2);
			
			expect(compoundQueryToSql(compound)).toBe('a = 1 AND b = 2');
		});

		it('should convert OR compound query to SQL', () => {
			const expr1 = expression('x', 'EQUAL', 'A');
			const expr2 = expression('x', 'EQUAL', 'B');
			const compound = or(expr1, expr2);
			
			expect(compoundQueryToSql(compound)).toBe('x = "A" OR x = "B"');
		});

		it('should handle nested compound queries', () => {
			const expr1 = expression('a', 'EQUAL', 1);
			const expr2 = expression('b', 'EQUAL', 2);
			const expr3 = expression('c', 'EQUAL', 3);
			const nested = or(expr2, expr3);
			const compound = and(expr1, nested);
			
			const sql = compoundQueryToSql(compound);
			expect(sql).toContain('a = 1 AND');
			expect(sql).toContain('b = 2 OR c = 3');
		});
	});
});
