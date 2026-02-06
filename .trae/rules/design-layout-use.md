---
alwaysApply: true
---

# Guia de Design e Layout (UI)

Este guia consolida padrões de **layout**, **componentização** e **estilo visual** para manter a experiência da aplicação consistente.

Use sempre estes princípios ao criar ou atualizar telas.

---

## 1. Estrutura Geral de Páginas

- **Container principal**
  - Use sempre espaçamento padrão: `container-padding space-y-6`.
  - Quando existir limite de largura, siga o padrão:
    - `max-w-4xl mx-auto` / `max-w-5xl mx-auto` / `max-w-7xl mx-auto` conforme o contexto.
  - Exemplos atuais:
    - Páginas de curso/aluno utilizam `Container` com `p-4 md:p-8 space-y-6/8`.
- **Header da página**
  - Use o componente [`Header`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/components/ui/header.tsx) em todas as páginas de hub que tenham título de seção.
  - Páginas secundárias devem usar `backHref` para exibir o botão de voltar.
  - Títulos e subtítulos devem ser traduzidos via `next-intl` (veja `usetranslations-use.md`).
- **Hierarquia visual**
  - Use o padrão:
    - Header da página
    - Seção de filtros/ações principais
    - Conteúdo (tabelas, cards, listas, formulários)
    - Estados (loading, erro, vazio)

---

## 2. Componentes Reutilizáveis (sempre verificar antes de criar algo novo)

Antes de criar qualquer componente de UI novo, **verifique primeiro** em:

- Pasta [`components/ui`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/components/ui)
  - Botões, inputs, select, modais, headers, alerts, etc.
- Classes utilitárias definidas em [`app/globals.css`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/app/globals.css)
  - `.card-base`, `.input-base`, `.skeleton-base`, `.container-base`, `.header-base`, `.title-base`, `.subtitle-base`, `.paragraph-base`.

Regras:

- **Nunca** duplicar um componente que já existe em `components/ui`.
- Ao ajustar apenas o layout/design de uma página, **não altere a lógica** (fetch de dados, estados, chamadas de ação). Mantenha modificações focadas em classes/tags estruturais.

---

## 3. Cores e Temas

- Use sempre as **cores de tema** definidas em `globals.css`:
  - `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `text-primary`, etc.
  - Prefira `primary`, `secondary`, `accent`, `muted`, `destructive` em vez de cores hardcoded.
- Preferências de cor semântica ao usar classes Tailwind diretas:
  - Use **indigo** no lugar de `blue` (ex.: `text-indigo-600` em vez de `text-blue-600`).
  - Use **emerald** no lugar de `green`.
  - Use **rose** no lugar de `red`.
  - Use **amber** no lugar de `yellow`.
- Para estados destrutivos/erro:
  - Prefira `bg-destructive`, `text-destructive-foreground` ou tons `rose` quando precisar de cor direta.
- Para destaques positivos/sucesso:
  - Prefira tons `emerald` ou o token `primary` (quando fizer sentido).

---

## 4. Modais e Ações Críticas

Para confirmações e ações críticas (excluir, arquivar, alterar status sensível), **sempre** use o componente de modal padronizado:

- Componente: [`components/ui/modal.tsx`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/components/ui/modal.tsx)
- Regras detalhadas: [`modal-use.md`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/.trae/rules/modal-use.md)

Pontos principais:

- Estrutura obrigatória: `ModalIcon` → `ModalHeader` (com `ModalTitle` e `ModalDescription`) → `ModalFooter`.
- Use:
  - `ModalPrimaryButton` para ação principal (com `variant="destructive"` quando for uma ação perigosa).
  - `ModalSecondaryButton` para cancelar/voltar.
- Evite usar o `Button` padrão dentro do footer do modal.

---

## 5. Estados de Erro, Vazio e Loading

- **Erros**
  - Use o componente [`ErrorAlert`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/components/ui/error-alert.tsx) para exibir mensagens de erro em páginas principais.
  - Mantenha mensagens curtas, claras e traduzidas (utilizando `next-intl`).
- **Sem resultados**
  - Use o componente [`NoResults`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/components/ui/no-results.tsx) para listas/tabelas filtráveis sem dados.
  - Sempre que houver busca/filtros, prefira `NoResults` em vez de apenas um texto simples.
- **Loading / Skeletons**
  - Use `Skeleton` e as classes `.skeleton-base` e `.skeleton-sub` definidas em `globals.css` ao invés de loaders improvisados.
  - Skeletons devem respeitar a estrutura final (cards, linhas de tabela, etc.) para evitar “jump” visual.

---

## 6. Tabelas x Cards (Responsividade)

Para listas complexas (ex.: finanças, histórico, catálogos):

- Em **desktop**:
  - Pode usar `Table` dentro de `Card` ou container com `overflow-x-auto`.
  - Cabeçalhos claros, alinhamento consistente e ícones de ação alinhados à direita.
- Em **mobile**:
  - Evite forçar scroll horizontal como única opção.
  - Prefira:
    - Converter linhas da tabela em **cards** com informações principais empilhadas.
    - Ou disponibilizar uma versão alternativa em grid/lista (ex.: `grid grid-cols-1 gap-4` com `Card`).

Boas práticas:

- Agrupar informações em blocos com `space-y-2/3`.
- Destacar título principal em `font-semibold` e subtítulos em `text-muted-foreground`.

---

## 7. Layouts do Hub

- Use os utilitários de layout já existentes:
  - `.sidebar-base`, `.container-base`, `.header-base` para manter a identidade visual do hub.
  - Respeitar o padrão da estrutura em [`app/[locale]/hub/layout.tsx`](file:///c:/Users/Mathe/OneDrive/Documentos/Projetos%20de%20Programação/Em%20progresso/fluencylab-school/app/%5Blocale%5D/hub/layout.tsx).
- Quando estiver dentro do hub:
  - Evite containers que conflitem com o espaçamento do layout principal.
  - Prefira ajustar o conteúdo dentro da área já disponibilizada pelo layout (por exemplo, usando `Container`/`SubContainer` quando já existirem).

---

## 8. Formulários e Inputs

- Inputs:
  - Sempre que possível, aplique a classe `.input-base` ou reutilize o componente `Input` de `components/ui`.
  - Use `space-y-2` para agrupar label + input + mensagem de erro.
- Labels:
  - Sempre associados via `htmlFor` e id do input.
  - Texto traduzido via `next-intl`.
- Erros de validação:
  - Mensagens em texto pequeno (`text-xs` ou `text-sm`) abaixo do campo.
  - Cores seguindo o padrão de erro (tokens de `destructive` ou tons `rose`).

---

## 9. Princípios Gerais ao Ajustar Design

- **Não mexer na lógica**:
  - Ajustes de design/layout não devem alterar regras de negócio, hooks, chamadas de ação ou manipulação de dados.
  - Se precisar alterar lógica, faça em um passo separado, com objetivo claro.
- **Consistência antes de criatividade**:
  - Priorize repetir padrões existentes (cards, headers, modais, skeletons) ao invés de criar variações novas.
- **Responsividade sempre**:
  - Testar mentalmente (ou no código) os breakpoints principais:
    - `sm`, `md`, `lg`.
  - Para grids, use combinações como:
    - `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4/6`.
- **Traduções**:
  - Nunca deixar textos estáticos em português/inglês sem passar pelo sistema de i18n.
  - Seguir o guia de traduções em `usetranslations-use.md`.

---

## 10. Checklist Rápido para Novas Páginas

Antes de finalizar uma nova página, verifique:

1. [ ] Página usando `container-padding space-y-6` (ou padrão equivalente do Container).
2. [ ] `Header` utilizado com `heading`/`subheading` traduzidos e `backHref` quando for página secundária.
3. [ ] Cores seguindo tokens de tema + preferências (indigo/emerald/rose/amber).
4. [ ] Estados de erro usam `ErrorAlert`.
5. [ ] Estados de vazio usam `NoResults` (quando fizer sentido).
6. [ ] Ações críticas usam o modal padrão conforme `modal-use.md`.
7. [ ] Componentes reaproveitados de `components/ui` sempre que possível.
8. [ ] Layout responsivo verificado (mobile, tablet, desktop).
9. [ ] Nenhuma alteração desnecessária na lógica da página/arquivo.
