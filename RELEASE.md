# Publicar o pacote

Passo a passo para colocar o `n8n-nodes-ignite-go` no npm e pedir a verificação do n8n.

## Uma vez só

1. **Repositório no GitHub.** Crie o repositório público `ignitecore-tech/n8n-nodes-ignite-go`, vazio (sem README nem licença), e suba o código:

   ```bash
   git remote add origin https://github.com/ignitecore-tech/n8n-nodes-ignite-go.git
   git push -u origin main
   ```

   Se o nome ou a organização mudarem, ajuste `repository`, `bugs` e `homepage` no `package.json`: o n8n confere que o repositório do pacote é o mesmo do GitHub.

2. **Conta no npm.** Use uma conta (ou organização) da Ignite com verificação em duas etapas ligada. Gere um token em npmjs.com, Access Tokens, do tipo Granular, com permissão de leitura e escrita para publicar pacotes.

3. **Segredo no GitHub.** No repositório, Settings, Secrets and variables, Actions, crie o segredo `NPM_TOKEN` com esse token.

## Publicar uma versão

1. Confira que `npm run build` e `npm run lint` passam.
2. Suba a versão e a tag juntas:

   ```bash
   npm version patch        # 0.1.0 vira 0.1.1 (use minor ou major quando fizer sentido)
   git push --follow-tags
   ```

   Para a primeira publicação, a versão do `package.json` já é `0.1.0`: basta `git tag v0.1.0` e `git push origin v0.1.0`.

3. A Action "Publicar no npm" roda sozinha com a tag, confere que a tag bate com o `package.json`, faz build e lint e publica com provenance. Na página do pacote no npm aparece o selo de origem (Provenance).

## Depois da primeira publicação

- **Conferir com o verificador do n8n:** `npx @n8n/scan-community-package n8n-nodes-ignite-go`.
- **Pedir a verificação** (necessária para aparecer no n8n Cloud) pelo Creator Portal do n8n, a partir da página "Submit community nodes" da documentação.
- **Opcional:** em npmjs.com, nas configurações do pacote, cadastrar o GitHub Actions deste repositório como Trusted Publisher. Com isso a Action publica sem o `NPM_TOKEN`.
- **Landing page do Ignite GO:** a seção dos nós do n8n só pode ir ao ar depois que o pacote estiver publicado.

## Regras do n8n que este pacote segue

- Sem dependências em tempo de execução (só `n8n-workflow` como peer).
- Sem leitura de variáveis de ambiente nem de arquivos no código dos nós.
- Licença MIT e README.
- Um serviço só (Ignite GO).
