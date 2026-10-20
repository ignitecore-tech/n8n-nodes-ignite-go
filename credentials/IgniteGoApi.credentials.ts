import type { IAuthenticateGeneric, Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * Credencial do Ignite GO.
 *
 * A autenticação vai no header `apikey`. Não há teste de credencial: a única rota que valida
 * chave sem instância (/auth/me) aceita só a chave de organização e recusa o token de
 * instância, que é a credencial mais comum. Um teste ali daria falso erro para quem usa o token.
 */
export class IgniteGoApi implements ICredentialType {
	name = 'igniteGoApi';

	displayName = 'Ignite GO API';

	icon: Icon = 'file:../nodes/IgniteGo/ignitego.svg';

	documentationUrl = 'https://www.npmjs.com/package/n8n-nodes-ignite-go';

	properties: INodeProperties[] = [
		{
			displayName: 'URL Do Servidor',
			name: 'serverUrl',
			type: 'string',
			default: 'https://api.ignitecore.com.br',
			placeholder: 'https://api.ignitecore.com.br',
			required: true,
			description:
				'Endereço do servidor Ignite GO, sem barra no final. Troque só se a sua conta usar outro endereço.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Token da instância, que aparece no painel do GO (Dashboard, botão Token) e opera só aquela instância. Também aceita a api_key da organização, que opera qualquer instância da org.',
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
}
