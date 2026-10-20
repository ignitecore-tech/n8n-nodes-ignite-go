import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Ignite GO credential.
 *
 * The key is sent in the `apikey` header. The test calls GET /auth/check, which accepts both an
 * instance token and a company API key: 200 for a valid key, 401 for an invalid one and 403 when
 * the account is suspended. n8n 2.10 loses the HTTP response before it checks the rules below and
 * then shows its default 401/403 messages, which are still clear.
 */
export class IgniteGoApi implements ICredentialType {
	name = 'igniteGoApi';

	displayName = 'Ignite GO API';

	icon: Icon = {
		light: 'file:../nodes/IgniteGo/ignitego.svg',
		dark: 'file:../nodes/IgniteGo/ignitego.dark.svg',
	};

	documentationUrl = 'https://www.npmjs.com/package/n8n-nodes-ignite-go';

	properties: INodeProperties[] = [
		{
			displayName: 'Server URL',
			name: 'serverUrl',
			type: 'string',
			default: 'https://api.ignitecore.com.br',
			placeholder: 'https://api.ignitecore.com.br',
			required: true,
			description:
				'Address of the Ignite GO server, without a trailing slash. Change it only if your account uses a different address.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Instance token from the Ignite GO panel (instance Dashboard, Token button), which works only with that instance. The company API key is also accepted and works with any instance of the company.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				apikey: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.serverUrl.trim().replace(new RegExp("/+$"), "")}}/auth/check',
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message:
						'Invalid API key. Copy the instance token or the company API key again from the Ignite GO panel.',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 403,
					message: 'This Ignite GO account is suspended. Contact Ignite Core support.',
				},
			},
		],
	};
}
