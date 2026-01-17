/**
 * Attachment Operations
 *
 * Operations for managing attachments on a Corda node.
 * Attachments can be JAR files, documents, or other files attached to transactions.
 */

import { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { CordaRpcClient } from '../../transport/cordaRpcClient';

export const attachmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['attachment'] } },
		options: [
			{ name: 'Upload Attachment', value: 'uploadAttachment', description: 'Upload a new attachment', action: 'Upload attachment' },
			{ name: 'Download Attachment', value: 'downloadAttachment', description: 'Download an attachment', action: 'Download attachment' },
			{ name: 'Get Attachment', value: 'getAttachment', description: 'Get attachment by ID', action: 'Get attachment' },
			{ name: 'Query Attachments', value: 'queryAttachments', description: 'Query attachments', action: 'Query attachments' },
			{ name: 'Get Attachment Metadata', value: 'getAttachmentMetadata', description: 'Get attachment metadata', action: 'Get attachment metadata' },
			{ name: 'Has Attachment', value: 'hasAttachment', description: 'Check if attachment exists', action: 'Check attachment exists' },
			{ name: 'Open Attachment', value: 'openAttachment', description: 'Open attachment (get JAR info)', action: 'Open attachment' },
			{ name: 'Get Attachment Signers', value: 'getAttachmentSigners', description: 'Get signers of attachment', action: 'Get attachment signers' },
			{ name: 'Import Attachment', value: 'importAttachment', description: 'Import attachment from URL', action: 'Import attachment' },
			{ name: 'Get Attachment Contracts', value: 'getAttachmentContracts', description: 'Get contracts in attachment', action: 'Get attachment contracts' },
			{ name: 'Delete Attachment', value: 'deleteAttachment', description: 'Delete unused attachment', action: 'Delete attachment' },
		],
		default: 'queryAttachments',
	},
	{
		displayName: 'Attachment ID',
		name: 'attachmentId',
		type: 'string',
		default: '',
		placeholder: 'e.g., ABC123...',
		description: 'The secure hash ID of the attachment',
		displayOptions: { show: { resource: ['attachment'], operation: ['downloadAttachment', 'getAttachment', 'getAttachmentMetadata', 'hasAttachment', 'openAttachment', 'getAttachmentSigners', 'getAttachmentContracts', 'deleteAttachment'] } },
	},
	{
		displayName: 'File Content',
		name: 'fileContent',
		type: 'string',
		default: '',
		description: 'Base64 encoded file content',
		displayOptions: { show: { resource: ['attachment'], operation: ['uploadAttachment'] } },
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		placeholder: 'e.g., myfile.jar',
		description: 'Name of the file to upload',
		displayOptions: { show: { resource: ['attachment'], operation: ['uploadAttachment'] } },
	},
	{
		displayName: 'Uploader',
		name: 'uploader',
		type: 'string',
		default: '',
		placeholder: 'e.g., admin',
		description: 'Name of the uploader',
		displayOptions: { show: { resource: ['attachment'], operation: ['uploadAttachment'] } },
	},
	{
		displayName: 'Import URL',
		name: 'importUrl',
		type: 'string',
		default: '',
		placeholder: 'e.g., https://example.com/file.jar',
		description: 'URL to import attachment from',
		displayOptions: { show: { resource: ['attachment'], operation: ['importAttachment'] } },
	},
	{
		displayName: 'Return Binary',
		name: 'returnBinary',
		type: 'boolean',
		default: false,
		description: 'Whether to return raw binary data',
		displayOptions: { show: { resource: ['attachment'], operation: ['downloadAttachment'] } },
	},
];

export async function executeAttachmentOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number
): Promise<IDataObject> {
	const credentials = await this.getCredentials('cordaNodeCredentials');
	const client = new CordaRpcClient({
		host: credentials.rpcHost as string,
		port: credentials.rpcPort as number,
		username: credentials.rpcUsername as string,
		password: credentials.rpcPassword as string,
		ssl: credentials.sslEnabled as boolean,
	});

	switch (operation) {
		case 'uploadAttachment': {
			const fileContent = this.getNodeParameter('fileContent', itemIndex) as string;
			const fileName = this.getNodeParameter('fileName', itemIndex) as string;
			const uploader = this.getNodeParameter('uploader', itemIndex) as string;
			const buffer = Buffer.from(fileContent, 'base64');
			const result = await client.uploadAttachment(buffer, uploader, fileName);
			return { success: result.success, attachmentId: (result.data as any), fileName };
		}

		case 'downloadAttachment': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const returnBinary = this.getNodeParameter('returnBinary', itemIndex) as boolean;
			const result = await client.downloadAttachment(attachmentId);
			if (returnBinary && (result.data as any)) {
				return { success: result.success, data: (result.data as any).toString('base64'), attachmentId };
			}
			return { success: result.success, attachmentId, downloaded: result.success };
		}

		case 'getAttachment': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const result = await client.executeRpc('attachment', [attachmentId]);
			return { success: result.success, attachment: (result.data as any) };
		}

		case 'queryAttachments': {
			const result = await client.executeRpc('queryAttachments', [{}]);
			const data = (result.data as any);
			return { success: result.success, attachments: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'getAttachmentMetadata': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const result = await client.getAttachmentMetadata(attachmentId);
			return { success: result.success, metadata: (result.data as any) };
		}

		case 'hasAttachment': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const result = await client.executeRpc('hasAttachment', [attachmentId]);
			return { success: result.success, exists: (result.data as any) };
		}

		case 'openAttachment': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const result = await client.executeRpc('openAttachment', [attachmentId]);
			const data = (result.data as any);
			return { success: result.success, entries: data?.entries, manifest: data?.manifest };
		}

		case 'getAttachmentSigners': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const result = await client.executeRpc('attachmentSigners', [attachmentId]);
			const data = (result.data as any);
			return { success: result.success, signers: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'importAttachment': {
			const importUrl = this.getNodeParameter('importUrl', itemIndex) as string;
			const result = await client.executeRpc('importAttachment', [importUrl]);
			const data = (result.data as any);
			return { success: result.success, attachmentId: data?.attachmentId || data, imported: result.success };
		}

		case 'getAttachmentContracts': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const result = await client.executeRpc('attachmentContracts', [attachmentId]);
			const data = (result.data as any);
			return { success: result.success, contracts: data, count: Array.isArray(data) ? data.length : 0 };
		}

		case 'deleteAttachment': {
			const attachmentId = this.getNodeParameter('attachmentId', itemIndex) as string;
			const result = await client.executeRpc('deleteAttachment', [attachmentId]);
			const data = (result.data as any);
			return { success: result.success, deleted: result.success, message: data?.message || 'Deleted' };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
