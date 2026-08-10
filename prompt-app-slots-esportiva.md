# Prompt - app isolado de slots da Esportiva

Execute esta tarefa em um clone ou diretorio de projeto separado. O resultado deve ser um app Nuxt 4
independente, com `package.json`, build, variaveis de ambiente e deploy proprios. Nao transforme nem
quebre o app Clube da BB existente.

## Objetivo

Criar um app web/PWA exclusivo para jogos de slot, usando o mesmo login, conta, saldo e integracao da
Esportiva que ja funcionam no Clube da BB. O app deve abrir os jogos reais fornecidos pela API Cactus
em um player responsivo, sem carregar as telas e regras de sinais do app atual.

## Decisoes ja definidas

- A unica marca aceita e `esportiva`.
- API base: `https://routes-eb.grupoautoma.com`.
- Base domain: `bet.br`.
- O login aceita e-mail ou CPF e senha, exatamente como no app atual.
- Reutilizar a mesma aparencia da tela de login atual.
- Copiar e reutilizar a mesma `public/logo.png`.
- Copiar e reutilizar os mesmos favicons: `favicon.ico`, `favicon.png`, `favicon-32x32.png`,
  `favicon-16x16.png` se existir, e `apple-touch-icon.png`.
- Nao incluir Bateu Bet, seletor de marcas, Bac Bo, Baccarat, Aviator, jogos ao vivo, catalogador,
  sinais, WebSocket de sinais, estrategias ou painel de estatisticas.
- `fortune-tiger` e o primeiro slot candidato porque e o unico slot explicitamente documentado em
  `api.md`. Outros slots so podem entrar no catalogo depois que seus slugs forem fornecidos ou
  confirmados pela API da Esportiva. Nao inventar slugs.

## Referencias do app atual

Use estes arquivos apenas como fonte para extrair o necessario:

- `app/pages/auth/login.vue`: estrutura, textos, estados e CSS da tela de login.
- `app/composables/useAuth.ts`: login, persistencia da sessao, perfil, saldo e logout.
- `app/composables/useGame.ts`: contrato da chamada `GET /api/start-game`.
- `app/composables/useDeposit.ts` e `app/components/DepositModal.vue`: deposito, se for mantido no MVP.
- `shared/brands.ts`: configuracao da Esportiva.
- `app/middleware/auth.global.ts`: protecao de rotas.
- `public/logo.png` e arquivos de favicon: identidade visual.
- `api.md`, secao "Iniciar Jogo": contrato oficial disponivel no repositorio.

Nao copie `app/pages/jogo/[id].vue`. Essa pagina possui logica especifica de sinais e jogos de mesa.

## Arquitetura esperada

Mantenha o novo app pequeno e explicito. Estrutura sugerida:

```text
app/
  components/
    AppHeader.vue
    DepositModal.vue
    GameCard.vue
    GamePlayer.vue
  composables/
    useAuth.ts
    useDeposit.ts
    useSlots.ts
  constants/
    slots.ts
  middleware/
    auth.global.ts
  pages/
    auth/login.vue
    index.vue
    slot/[id].vue
  app.vue
public/
  slots/
  logo.png
  favicon.ico
  favicon.png
  favicon-32x32.png
  apple-touch-icon.png
```

O catalogo deve ter tipagem e uma unica fonte de verdade, por exemplo:

```ts
export interface SlotDefinition {
  id: string
  name: string
  provider?: string
  slug: string
  image: string
  enabled: boolean
  featured?: boolean
}
```

Nao use fallback que abra outro jogo quando o ID solicitado for desconhecido. ID ou slug inexistente
deve produzir estado de "Jogo indisponivel" e nunca iniciar Fortune Tiger silenciosamente.

## Autenticacao Esportiva

1. Preserve o comportamento comprovado do `useAuth.ts` atual.
2. Envie o identificador no campo `email`; para CPF, remova caracteres nao numericos antes do envio.
3. Envie no login:
   - `brand_slug: 'esportiva'`
   - `base_domain: 'bet.br'`
   - `app_source: 'web'`
   - `save_cookies: true`
4. Envie os headers `X-Brand-Slug: esportiva` e `X-Base-Domain: bet.br`.
5. Armazene token, `cookie_key`, usuario e saldo em uma chave de `localStorage` exclusiva do novo app,
   como `esportiva-slots_auth`. Nao use `club-da-bb_auth`, para impedir colisao entre os dois apps no
   mesmo dominio.
6. Nas chamadas autenticadas, envie `Authorization: Bearer <token>`, `X-Brand-Slug`,
   `X-Base-Domain` e `X-Cactus-Cookie-Key`.
7. Em resposta 401, limpe a sessao e redirecione para `/auth/login`.
8. Nao registre, imprima nem exponha token, senha ou cookie key.

## Tela de login

- Reproduza a tela atual: fundo preto, painel central, logo, campos de e-mail/CPF e senha, botao para
  mostrar/ocultar senha, mensagens de erro e botao "Entrar" com estado de carregamento.
- Mostre apenas "Criar conta na Esportiva", usando o link de afiliado ja configurado em
  `shared/brands.ts`.
- Preserve acessibilidade: labels associados, foco visivel, `autocomplete`, envio por Enter e
  `aria-label` no botao de visibilidade da senha.
- A tela deve funcionar sem corte ou sobreposicao em 360 px de largura e em desktop.

## Home de slots

- A primeira tela autenticada e o catalogo real, nao uma landing page.
- Header compacto com logo, saldo, botao de deposito e menu do usuario com logout.
- Conteudo com destaque do slot principal, busca por nome e grade responsiva de slots.
- Cards devem mostrar imagem real do jogo, nome e provider quando conhecido.
- Busca sem resultado, carregamento, erro e catalogo vazio devem ter estados claros.
- Nao exibir RTP, jackpot, bonus, popularidade ou provider quando esses dados nao forem conhecidos.
- Favoritos e categorias so entram se funcionarem de verdade; nao criar controles decorativos.

## Player do slot

1. A rota protegida `/slot/[id]` resolve o jogo em `slots.ts`.
2. Detecte `WEB` ou `MOBILE` de forma consistente.
3. Chame `GET /api/start-game` com `slug`, `platform` e `use_demo=0`.
4. Aceite a URL em `game_url` ou `payload.gameURL`, conforme o contrato atual.
5. Renderize a URL em iframe com `allow="autoplay; fullscreen"` e suporte a tela cheia.
6. Inclua voltar, recarregar e fechar jogo, usando icones do `@nuxt/icon` com tooltips.
7. Mostre loading, erro autenticado, jogo indisponivel e acao de tentar novamente.
8. Nunca coloque token ou credenciais na URL do frontend.

## Assets dos jogos

- Nao reutilize imagens dos jogos ao vivo como placeholders de slots.
- Para Fortune Tiger, use uma imagem oficial/licenciada fornecida pelo projeto ou pelo operador.
- Se o asset ainda nao estiver disponivel, use um placeholder neutro com o nome do jogo e marque a
  pendencia; nao use imagem enganosa nem busque/copiar asset sem licenca.

## Identidade, PWA e isolamento

- Copie a logo e os favicons definidos acima sem redesenha-los.
- Atualize titulo, description, manifest e metadados para o nome definido para o novo app, sem alterar
  os arquivos do Clube da BB.
- Use uma chave de cache/versionamento e nome de service worker exclusivos. Um deploy nao pode servir
  cache, manifest ou sessao do outro app.
- Parametrize `PORT`, origem da API e nome do app por ambiente quando fizer sentido.
- Nao copie banco, painel admin, webhooks, scheduler de notificacao ou collections do app atual sem
  uma necessidade comprovada do produto de slots.

## Seguranca e conformidade

- Nao incluir credenciais de teste ou segredos em codigo, documentacao ou commit.
- Remover exemplos com dados pessoais/reais de qualquer documentacao copiada.
- Nao prometer ganhos, criar sinais, simular saldo ou apresentar resultados fabricados.
- Manter mensagens de jogo responsavel e acesso apenas a maiores de idade conforme as exigencias do
  operador e da jurisdicao aplicavel.

## Validacao obrigatoria

1. Rodar instalacao e `npm run build` sem erros.
2. Iniciar o servidor local em uma porta livre e informar a URL.
3. Validar visualmente com Playwright em desktop e mobile:
   - login sem overflow;
   - catalogo sem sobreposicoes;
   - player ocupando corretamente a area disponivel;
   - estados de loading e erro legiveis.
4. Testar login por e-mail e por CPF com uma conta Esportiva fornecida pelo responsavel, sem registrar
   as credenciais.
5. Confirmar perfil e saldo apos recarregar a pagina.
6. Confirmar logout e expiracao por 401.
7. Testar `fortune-tiger` com sessao autenticada. Se a API rejeitar o slug, desabilitar o card e
   registrar a resposta sanitizada como bloqueio; nao declarar o jogo disponivel.
8. Confirmar que uma rota de slot desconhecida nao abre outro jogo por fallback.
9. Confirmar que o app original continua sem alteracoes funcionais.

## Entrega

Entregue o app implementado, nao apenas um plano. Ao final, informe:

- diretorio do novo app;
- URL local;
- slots efetivamente validados na Esportiva;
- comandos de build/teste executados;
- pendencias reais, especialmente slugs ou assets ainda nao fornecidos.

