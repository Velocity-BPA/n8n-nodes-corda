/**
 * StateRef Utilities
 * 
 * Utilities for working with Corda StateRef objects.
 * 
 * A StateRef is a reference to a specific state in the Corda vault, consisting of:
 * - Transaction Hash: The SHA-256 hash of the transaction that created the state
 * - Index: The position of the state in the transaction's output list
 * 
 * Format: "txHash:index" (e.g., "3B5AF2D1...A8B9:0")
 */

/**
 * Represents a reference to a state in the Corda vault
 */
export interface StateRef {
	/** SHA-256 hash of the transaction */
	txhash: string;
	/** Index of the state in the transaction outputs */
	index: number;
}

/**
 * Represents a state and its reference
 */
export interface StateAndRef<T = unknown> {
	state: {
		data: T;
		contract: string;
		notary: string;
		encumbrance?: number;
		constraint: {
			type: string;
			data?: string;
		};
	};
	ref: StateRef;
}

/**
 * Parse a StateRef string into its components
 * 
 * @param stateRefString - The StateRef string (format: "txHash:index")
 * @returns Parsed StateRef object
 */
export function parseStateRef(stateRefString: string): StateRef {
	const parts = stateRefString.split(':');
	
	if (parts.length !== 2) {
		throw new Error(`Invalid StateRef format: ${stateRefString}. Expected format: "txHash:index"`);
	}
	
	const txhash = parts[0].trim();
	const index = parseInt(parts[1].trim(), 10);
	
	if (isNaN(index) || index < 0) {
		throw new Error(`Invalid StateRef index: ${parts[1]}. Index must be a non-negative integer.`);
	}
	
	// Validate transaction hash format (should be hex string, typically 64 characters)
	if (!/^[0-9A-Fa-f]+$/.test(txhash)) {
		throw new Error(`Invalid transaction hash format: ${txhash}. Must be a hexadecimal string.`);
	}
	
	return { txhash, index };
}

/**
 * Convert a StateRef object to its string representation
 * 
 * @param stateRef - The StateRef object
 * @returns StateRef string
 */
export function toStateRefString(stateRef: StateRef): string {
	return `${stateRef.txhash}:${stateRef.index}`;
}

/**
 * Validate a StateRef string format
 * 
 * @param stateRefString - The StateRef string to validate
 * @returns True if the format is valid
 */
export function isValidStateRef(stateRefString: string): boolean {
	try {
		parseStateRef(stateRefString);
		return true;
	} catch {
		return false;
	}
}

/**
 * Compare two StateRefs for equality
 * 
 * @param ref1 - First StateRef
 * @param ref2 - Second StateRef
 * @returns True if the StateRefs are equal
 */
export function stateRefsEqual(ref1: StateRef, ref2: StateRef): boolean {
	return ref1.txhash.toLowerCase() === ref2.txhash.toLowerCase() && ref1.index === ref2.index;
}

/**
 * Create a StateRef from transaction hash and index
 * 
 * @param txhash - Transaction hash (hex string)
 * @param index - Output index
 * @returns StateRef object
 */
export function createStateRef(txhash: string, index: number): StateRef {
	if (index < 0) {
		throw new Error('Index must be non-negative');
	}
	
	return { txhash, index };
}

/**
 * Extract all StateRefs from an array of transaction inputs
 * 
 * @param inputs - Array of input state references (strings or objects)
 * @returns Array of parsed StateRef objects
 */
export function extractStateRefs(inputs: (string | StateRef)[]): StateRef[] {
	return inputs.map((input) => {
		if (typeof input === 'string') {
			return parseStateRef(input);
		}
		return input;
	});
}

/**
 * Get the short form of a StateRef (truncated hash)
 * 
 * @param stateRef - StateRef string or object
 * @param hashLength - Number of characters to show (default: 8)
 * @returns Short form string
 */
export function shortStateRef(stateRef: string | StateRef, hashLength: number = 8): string {
	const ref = typeof stateRef === 'string' ? parseStateRef(stateRef) : stateRef;
	const shortHash = ref.txhash.substring(0, hashLength);
	return `${shortHash}...:${ref.index}`;
}

/**
 * Sort StateRefs by transaction hash and then by index
 * 
 * @param refs - Array of StateRefs to sort
 * @returns Sorted array
 */
export function sortStateRefs(refs: StateRef[]): StateRef[] {
	return [...refs].sort((a, b) => {
		const hashCompare = a.txhash.localeCompare(b.txhash);
		if (hashCompare !== 0) return hashCompare;
		return a.index - b.index;
	});
}

/**
 * Check if a list of StateRefs contains duplicates
 * 
 * @param refs - Array of StateRefs to check
 * @returns True if duplicates exist
 */
export function hasDuplicateStateRefs(refs: StateRef[]): boolean {
	const seen = new Set<string>();
	for (const ref of refs) {
		const key = toStateRefString(ref).toLowerCase();
		if (seen.has(key)) return true;
		seen.add(key);
	}
	return false;
}
