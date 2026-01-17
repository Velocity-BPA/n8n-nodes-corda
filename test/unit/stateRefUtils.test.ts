/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	parseStateRef,
	toStateRefString,
	isValidStateRef,
	stateRefsEqual,
	createStateRef,
	extractStateRefs,
	shortStateRef,
	sortStateRefs,
	hasDuplicateStateRefs,
} from '../../nodes/Corda/utils/stateRefUtils';

describe('stateRefUtils', () => {
	const validTxHash = 'ABC123DEF456ABC123DEF456ABC123DEF456ABC123DEF456ABC123DEF456ABC123';
	const validStateRef = `${validTxHash}:0`;

	describe('parseStateRef', () => {
		it('should parse a valid state reference', () => {
			const result = parseStateRef(validStateRef);
			
			expect(result.txhash).toBe(validTxHash);
			expect(result.index).toBe(0);
		});

		it('should parse state reference with higher index', () => {
			const stateRef = `${validTxHash}:5`;
			const result = parseStateRef(stateRef);
			
			expect(result.txhash).toBe(validTxHash);
			expect(result.index).toBe(5);
		});

		it('should throw for invalid format', () => {
			expect(() => parseStateRef('invalid')).toThrow();
		});

		it('should throw for missing index', () => {
			expect(() => parseStateRef(validTxHash)).toThrow();
		});

		it('should throw for negative index', () => {
			expect(() => parseStateRef(`${validTxHash}:-1`)).toThrow();
		});

		it('should throw for non-numeric index', () => {
			expect(() => parseStateRef(`${validTxHash}:abc`)).toThrow();
		});
	});

	describe('toStateRefString', () => {
		it('should convert StateRef to string', () => {
			const stateRef = { txhash: validTxHash, index: 0 };
			expect(toStateRefString(stateRef)).toBe(validStateRef);
		});

		it('should handle any index value', () => {
			const stateRef = { txhash: validTxHash, index: 10 };
			expect(toStateRefString(stateRef)).toBe(`${validTxHash}:10`);
		});
	});

	describe('isValidStateRef', () => {
		it('should return true for valid state reference', () => {
			expect(isValidStateRef(validStateRef)).toBe(true);
		});

		it('should return false for invalid format', () => {
			expect(isValidStateRef('invalid')).toBe(false);
		});

		it('should return false for negative index', () => {
			expect(isValidStateRef(`${validTxHash}:-1`)).toBe(false);
		});

		it('should return false for non-numeric index', () => {
			expect(isValidStateRef(`${validTxHash}:abc`)).toBe(false);
		});
	});

	describe('stateRefsEqual', () => {
		it('should return true for equal StateRefs', () => {
			const ref1 = { txhash: validTxHash, index: 0 };
			const ref2 = { txhash: validTxHash, index: 0 };
			expect(stateRefsEqual(ref1, ref2)).toBe(true);
		});

		it('should return true for case-insensitive hash match', () => {
			const ref1 = { txhash: validTxHash.toLowerCase(), index: 0 };
			const ref2 = { txhash: validTxHash.toUpperCase(), index: 0 };
			expect(stateRefsEqual(ref1, ref2)).toBe(true);
		});

		it('should return false for different hashes', () => {
			const ref1 = { txhash: validTxHash, index: 0 };
			const ref2 = { txhash: 'DEF456ABC123DEF456ABC123DEF456ABC123DEF456ABC123DEF456ABC123DEF456', index: 0 };
			expect(stateRefsEqual(ref1, ref2)).toBe(false);
		});

		it('should return false for different indices', () => {
			const ref1 = { txhash: validTxHash, index: 0 };
			const ref2 = { txhash: validTxHash, index: 1 };
			expect(stateRefsEqual(ref1, ref2)).toBe(false);
		});
	});

	describe('createStateRef', () => {
		it('should create a valid StateRef', () => {
			const ref = createStateRef(validTxHash, 0);
			expect(ref.txhash).toBe(validTxHash);
			expect(ref.index).toBe(0);
		});

		it('should throw for negative index', () => {
			expect(() => createStateRef(validTxHash, -1)).toThrow();
		});
	});

	describe('extractStateRefs', () => {
		it('should parse string inputs', () => {
			const inputs = [validStateRef, `${validTxHash}:1`];
			const refs = extractStateRefs(inputs);
			
			expect(refs).toHaveLength(2);
			expect(refs[0].index).toBe(0);
			expect(refs[1].index).toBe(1);
		});

		it('should pass through StateRef objects', () => {
			const ref = { txhash: validTxHash, index: 0 };
			const refs = extractStateRefs([ref]);
			
			expect(refs).toHaveLength(1);
			expect(refs[0]).toBe(ref);
		});
	});

	describe('shortStateRef', () => {
		it('should return shortened representation', () => {
			const short = shortStateRef(validStateRef);
			expect(short).toMatch(/^[A-F0-9]{8}\.\.\.:0$/i);
		});

		it('should accept custom hash length', () => {
			const short = shortStateRef(validStateRef, 4);
			expect(short).toMatch(/^[A-F0-9]{4}\.\.\.:0$/i);
		});
	});

	describe('sortStateRefs', () => {
		it('should sort by hash then index', () => {
			const refs = [
				{ txhash: 'BBB', index: 1 },
				{ txhash: 'AAA', index: 0 },
				{ txhash: 'AAA', index: 1 },
			];
			const sorted = sortStateRefs(refs);
			
			expect(sorted[0].txhash).toBe('AAA');
			expect(sorted[0].index).toBe(0);
			expect(sorted[1].txhash).toBe('AAA');
			expect(sorted[1].index).toBe(1);
			expect(sorted[2].txhash).toBe('BBB');
		});
	});

	describe('hasDuplicateStateRefs', () => {
		it('should return false for unique refs', () => {
			const refs = [
				{ txhash: validTxHash, index: 0 },
				{ txhash: validTxHash, index: 1 },
			];
			expect(hasDuplicateStateRefs(refs)).toBe(false);
		});

		it('should return true for duplicate refs', () => {
			const refs = [
				{ txhash: validTxHash, index: 0 },
				{ txhash: validTxHash, index: 0 },
			];
			expect(hasDuplicateStateRefs(refs)).toBe(true);
		});
	});
});
