/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	VaultQueryBuilder,
	createQueryBuilder,
	queryUnconsumed,
	queryConsumed,
	queryAll,
} from '../../nodes/Corda/utils/vaultQueryUtils';

describe('vaultQueryUtils', () => {
	describe('VaultQueryBuilder', () => {
		it('should create a builder with default values', () => {
			const builder = new VaultQueryBuilder();
			const query = builder.build();
			
			expect(query.paging).toBeDefined();
			expect(query.paging?.pageNumber).toBe(1);
			expect(query.paging?.pageSize).toBe(200);
		});

		it('should set status filter', () => {
			const builder = new VaultQueryBuilder();
			const query = builder.withStatus('UNCONSUMED').build();
			
			expect(query.criteria?.status).toBe('UNCONSUMED');
		});

		it('should set contract state types', () => {
			const builder = new VaultQueryBuilder();
			const query = builder
				.withContractStateTypes(['com.example.IOUState'])
				.build();
			
			expect(query.criteria?.contractStateTypes).toContain('com.example.IOUState');
		});

		it('should set pagination', () => {
			const builder = new VaultQueryBuilder();
			const query = builder.withPaging(2, 50).build();
			
			expect(query.paging?.pageNumber).toBe(2);
			expect(query.paging?.pageSize).toBe(50);
		});

		it('should throw for page size exceeding max', () => {
			const builder = new VaultQueryBuilder();
			expect(() => builder.withPaging(1, 20000)).toThrow();
		});

		it('should add sorting', () => {
			const builder = new VaultQueryBuilder();
			const query = builder
				.orderBy('recordedTime', 'DESC')
				.build();
			
			expect(query.sorting).toBeDefined();
			expect(query.sorting?.length).toBe(1);
			expect(query.sorting?.[0].sortAttribute).toBe('recordedTime');
			expect(query.sorting?.[0].direction).toBe('DESC');
		});

		it('should chain multiple filters', () => {
			const builder = new VaultQueryBuilder();
			const query = builder
				.withStatus('UNCONSUMED')
				.withContractStateTypes(['com.example.IOUState'])
				.withPaging(1, 100)
				.orderBy('recordedTime', 'ASC')
				.build();
			
			expect(query.criteria?.status).toBe('UNCONSUMED');
			expect(query.criteria?.contractStateTypes).toContain('com.example.IOUState');
			expect(query.paging?.pageSize).toBe(100);
			expect(query.sorting?.[0].direction).toBe('ASC');
		});

		it('should set notary filter', () => {
			const builder = new VaultQueryBuilder();
			const query = builder
				.withNotary(['O=Notary, L=London, C=GB'])
				.build();
			
			expect(query.criteria?.notary).toContain('O=Notary, L=London, C=GB');
		});

		it('should set participants filter', () => {
			const builder = new VaultQueryBuilder();
			const query = builder
				.withParticipants(['O=PartyA, L=London, C=GB'])
				.build();
			
			expect(query.criteria?.participants).toContain('O=PartyA, L=London, C=GB');
		});

		it('should set time condition - recorded after', () => {
			const builder = new VaultQueryBuilder();
			const timestamp = '2024-01-01T00:00:00Z';
			const query = builder.recordedAfter(timestamp).build();
			
			expect(query.criteria?.timeCondition?.type).toBe('RECORDED');
			expect(query.criteria?.timeCondition?.predicate.operator).toBe('GREATER_THAN');
			expect(query.criteria?.timeCondition?.predicate.value).toBe(timestamp);
		});

		it('should set time condition - recorded between', () => {
			const builder = new VaultQueryBuilder();
			const from = '2024-01-01T00:00:00Z';
			const to = '2024-12-31T23:59:59Z';
			const query = builder.recordedBetween(from, to).build();
			
			expect(query.criteria?.timeCondition?.type).toBe('RECORDED');
			expect(query.criteria?.timeCondition?.predicate.operator).toBe('BETWEEN');
			expect(query.criteria?.timeCondition?.predicate.from).toBe(from);
			expect(query.criteria?.timeCondition?.predicate.to).toBe(to);
		});

		it('should reset builder state', () => {
			const builder = new VaultQueryBuilder();
			builder.withStatus('CONSUMED').withPaging(5, 500);
			builder.reset();
			const query = builder.build();
			
			expect(query.criteria?.status).toBeUndefined();
			expect(query.paging?.pageNumber).toBe(1);
			expect(query.paging?.pageSize).toBe(200);
		});
	});

	describe('createQueryBuilder', () => {
		it('should create a new VaultQueryBuilder instance', () => {
			const builder = createQueryBuilder();
			expect(builder).toBeInstanceOf(VaultQueryBuilder);
		});
	});

	describe('queryUnconsumed', () => {
		it('should create unconsumed states query', () => {
			const query = queryUnconsumed();
			expect(query.criteria?.status).toBe('UNCONSUMED');
		});

		it('should create unconsumed query with contract type', () => {
			const query = queryUnconsumed('com.example.IOUState');
			expect(query.criteria?.status).toBe('UNCONSUMED');
			expect(query.contractStateType).toBe('com.example.IOUState');
		});
	});

	describe('queryConsumed', () => {
		it('should create consumed states query', () => {
			const query = queryConsumed();
			expect(query.criteria?.status).toBe('CONSUMED');
		});

		it('should create consumed query with contract type', () => {
			const query = queryConsumed('com.example.IOUState');
			expect(query.criteria?.status).toBe('CONSUMED');
			expect(query.contractStateType).toBe('com.example.IOUState');
		});
	});

	describe('queryAll', () => {
		it('should create all states query', () => {
			const query = queryAll();
			expect(query.criteria?.status).toBe('ALL');
		});

		it('should create all states query with contract type', () => {
			const query = queryAll('com.example.IOUState');
			expect(query.criteria?.status).toBe('ALL');
			expect(query.contractStateType).toBe('com.example.IOUState');
		});
	});
});
