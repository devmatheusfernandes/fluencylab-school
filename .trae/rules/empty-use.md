# Guia de Uso: Componente Empty

Padroniza estados vazios na aplicação, garantindo consistência visual e semântica entre páginas e listas.

---

## 1. Quando usar

- Listas, tabelas ou grids sem dados (filtros/busca retornando zero itens).
- Páginas de histórico sem registros.
- Seções com conteúdo não disponível ainda.

---

## 2. Estrutura obrigatória

- Container raiz: `Empty` com padding vertical padrão (`className="py-24"`).
- Ícone semântico: `EmptyMedia` com um ícone do `lucide-react` (sem hover).
- Texto: `EmptyHeader` sempre presente.
- Traduções: todo texto via `next-intl`.
- Cores: usar tokens de tema (`text-primary`, etc.) conforme `design-layout-use.md`.

---

## 3. Padrões aceitos

### A) Estilo Mínimo (Descrição simples)

Use quando um título seria redundante e uma frase curta basta.

```tsx
<Empty className="py-24">
  <EmptyMedia>
    <HistoryIcon size={48} className="text-primary" />
  </EmptyMedia>
  <EmptyHeader>
    <EmptyDescription>{t("noHistory")}</EmptyDescription>
  </EmptyHeader>
</Empty>
```

### B) Estilo Completo (Título + Descrição + Ação opcional)

Use quando há contexto adicional e/ou ação principal (ex.: limpar busca).

```tsx
<Empty className="py-24">
  <EmptyMedia>
    <BookmarkIcon size={48} className="text-primary" />
  </EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>{t("noCoursesFound")}</EmptyTitle>
    <EmptyDescription>
      {search ? t("trySearching") : t("comingSoon")}
    </EmptyDescription>
  </EmptyHeader>
  {search && (
    <EmptyContent>
      <Button variant="link" onClick={() => setSearch("")}>
        {t("clearSearch")}
      </Button>
    </EmptyContent>
  )}
</Empty>
```

---

## 4. Boas práticas

- Ícones: tamanho 40–48px, cor `text-primary` quando fizer sentido.
- Texto: curto e objetivo; evitar parágrafos longos.
- Ações: no máximo uma ação principal (link ou button) dentro de `EmptyContent`.
- Variantes: quando desejar fundo de ícone, use `EmptyMedia` com `variant="icon"`.
- Layout: evitar bordas/containers extras; se necessário, aplicar `className="border"` no `Empty`.

---

## 5. Antipadrões

- Não renderizar textos soltos sem `Empty`.
- Não usar cores hardcoded fora dos tokens de tema.
- Não inserir múltiplos botões de ação concorrentes no estado vazio.

---

## 6. Checklist rápido

1. [ ] `Empty` com `py-24` aplicado.
2. [ ] `EmptyMedia` com ícone semântico (`lucide-react`).
3. [ ] `EmptyHeader` com `EmptyDescription` e, quando necessário, `EmptyTitle`.
4. [ ] Textos traduzidos com `next-intl`.
5. [ ] Ação opcional em `EmptyContent` (quando fizer sentido).
6. [ ] Cores e classes conforme `design-layout-use.md`.

