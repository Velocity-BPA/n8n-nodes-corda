/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	parseX500Name,
	toX500String,
	validateX500Name,
	compareX500Names,
	buildX500Name,
	getOrganization,
	isNotaryName,
} from '../../nodes/Corda/utils/x500Utils';

describe('x500Utils', () => {
	describe('parseX500Name', () => {
		it('should parse a valid X.500 name', () => {
			const name = 'O=PartyA, L=London, C=GB';
			const result = parseX500Name(name);
			
			expect(result.organization).toBe('PartyA');
			expect(result.locality).toBe('London');
			expect(result.country).toBe('GB');
		});

		it('should parse X.500 name with CN and OU', () => {
			const name = 'CN=Admin, OU=IT, O=PartyA, L=London, C=GB';
			const result = parseX500Name(name);
			
			expect(result.commonName).toBe('Admin');
			expect(result.organizationalUnit).toBe('IT');
			expect(result.organization).toBe('PartyA');
			expect(result.locality).toBe('London');
			expect(result.country).toBe('GB');
		});

		it('should handle whitespace variations', () => {
			const name = 'O=PartyA,L=London,C=GB';
			const result = parseX500Name(name);
			
			expect(result.organization).toBe('PartyA');
			expect(result.locality).toBe('London');
			expect(result.country).toBe('GB');
		});
	});

	describe('toX500String', () => {
		it('should convert X500Name to string', () => {
			const name = {
				organization: 'PartyA',
				locality: 'London',
				country: 'GB',
			};
			const result = toX500String(name);
			
			expect(result).toContain('O=PartyA');
			expect(result).toContain('L=London');
			expect(result).toContain('C=GB');
		});

		it('should include optional components when provided', () => {
			const name = {
				commonName: 'Admin',
				organizationalUnit: 'IT',
				organization: 'PartyA',
				locality: 'London',
				country: 'GB',
			};
			const result = toX500String(name);
			
			expect(result).toContain('CN=Admin');
			expect(result).toContain('OU=IT');
		});
	});

	describe('buildX500Name', () => {
		it('should build a valid X.500 name from components', () => {
			const result = buildX500Name('PartyA', 'London', 'GB');
			
			expect(result).toContain('O=PartyA');
			expect(result).toContain('L=London');
			expect(result).toContain('C=GB');
		});

		it('should include optional components when provided', () => {
			const result = buildX500Name('PartyA', 'London', 'GB', {
				commonName: 'Admin',
				organizationalUnit: 'IT',
			});
			
			expect(result).toContain('CN=Admin');
			expect(result).toContain('OU=IT');
		});
	});

	describe('validateX500Name', () => {
		it('should return valid for proper X.500 name', () => {
			const result = validateX500Name('O=PartyA, L=London, C=GB');
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should return invalid for missing required fields', () => {
			const result = validateX500Name('O=PartyA');
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should return invalid for invalid country code', () => {
			const result = validateX500Name('O=PartyA, L=London, C=GBR');
			expect(result.valid).toBe(false);
		});
	});

	describe('compareX500Names', () => {
		it('should return true for equivalent names', () => {
			const name1 = 'O=PartyA, L=London, C=GB';
			const name2 = 'O=PartyA,L=London,C=GB';
			expect(compareX500Names(name1, name2)).toBe(true);
		});

		it('should return true for case-insensitive match', () => {
			const name1 = 'O=PartyA, L=London, C=GB';
			const name2 = 'O=partya, L=london, C=gb';
			expect(compareX500Names(name1, name2)).toBe(true);
		});

		it('should return false for different names', () => {
			const name1 = 'O=PartyA, L=London, C=GB';
			const name2 = 'O=PartyB, L=London, C=GB';
			expect(compareX500Names(name1, name2)).toBe(false);
		});
	});

	describe('getOrganization', () => {
		it('should extract organization name', () => {
			const name = 'O=PartyA, L=London, C=GB';
			expect(getOrganization(name)).toBe('PartyA');
		});
	});

	describe('isNotaryName', () => {
		it('should return true for notary names', () => {
			expect(isNotaryName('O=Notary, L=London, C=GB')).toBe(true);
			expect(isNotaryName('O=Network Notarisation Service, L=London, C=GB')).toBe(true);
		});

		it('should return false for non-notary names', () => {
			expect(isNotaryName('O=PartyA, L=London, C=GB')).toBe(false);
		});
	});
});
