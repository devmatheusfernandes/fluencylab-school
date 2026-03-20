# Guia de Padrão Mobile: Breadcrumb Actions & Drawers

Este guia estabelece o padrão para otimização de interfaces mobile, movendo componentes complexos ou secundários para **Drawers** (gavetas), acessíveis através de ícones injetados no **Breadcrumb**.

## 1. Objetivo

Melhorar a usabilidade em dispositivos móveis, economizando espaço vertical e reduzindo a carga cognitiva, transformando cards de listagem complexos em acessos rápidos via ícones no topo da página.

## 2. BreadcrumbActions (Portal)

O componente [`BreadcrumbActions`](file:///components/shared/Breadcrum/BreadcrumbActions.tsx) utiliza um **React Portal** para injetar botões na barra de navegação superior (Breadcrumb), garantindo que as ações fiquem visíveis e acessíveis sem ocupar espaço no corpo da página.

### Placement (start x end)

- Use `placement="start"` para injetar ações no **lado esquerdo** do Breadcrumb (recomendado no Hub/web, porque o lado direito normalmente está ocupado pelo ThemeSwitcher).
- Use `placement="end"` para injetar ações no **lado direito** do Breadcrumb (aparece no modo **standalone/PWA**, onde o Breadcrumb vira a barra principal e substitui o Header).

### Como usar:

1.  Importe os componentes:
    ```tsx
    import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
    import BreadcrumbActionIcon from "@/components/shared/Breadcrum/BreadcrumbActionIcon";
    ```
2.  Envolva seus botões de ação dentro dele.
3.  Use `BreadcrumbActionIcon` para manter o padrão visual (flat, sem hover state complexo).

**Exemplo:**

```tsx
<Header
  heading={t("title")}
  icon={
    <div className="flex items-center gap-2">
      {/* Ações Mobile Injetadas no Breadcrumb */}
      <BreadcrumbActions placement="start">
        <BreadcrumbActionIcon icon={Book} onClick={() => setOpenDrawer(true)} />
      </BreadcrumbActions>

      {/* Ações Padrão (sempre visíveis ou desktop) */}
      <Button variant="ghost" size="icon">
        <Star className="w-5 h-5" />
      </Button>
    </div>
  }
/>
```

## 3. Adaptação de Componentes (Mobile Components)

**Não reutilize cards complexos de desktop dentro do Drawer.** Componentes de desktop ("Cards") geralmente possuem muitas informações, botões e espaçamentos que não funcionam bem em telas pequenas ou dentro de um Drawer.

### Regra de Criação:

1.  Crie um novo componente específico para mobile, geralmente prefixado com `Mobile` ou sufixado com `List` (ex: `MobileNotebooksList.tsx` vs `NotebooksCard.tsx`).
2.  **Simplifique:**
    - Remova ações secundárias.
    - Use listas verticais simples.
    - Foque na informação principal (Título, Data, Status).
    - Use `NoResults` para estados vazios.
3.  Mantenha as mesmas props de dados essenciais para facilitar a integração.

**Exemplo de Estrutura Mobile:**

```tsx
// components/student/MobileNotebooksList.tsx
export default function MobileNotebooksList({ notebooks }) {
  // ... lógica simplificada
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-3">
      {notebooks.map(notebook => (
        <Link href={...} className="block p-3 rounded-lg border">
           <h3>{notebook.title}</h3>
        </Link>
      ))}
    </div>
  )
}
```

## 4. Implementação na Página (Responsividade)

Use classes utilitárias do Tailwind para alternar entre a visão Desktop (Card na grid) e Mobile (Ícone + Drawer).

### Checklist de Implementação:

1.  [ ] **Estado:** Crie `useState` para controlar a visibilidade do Drawer.
2.  [ ] **Desktop:** Adicione `hidden md:block` (ou `md:flex`) no container do componente original (Desktop).
3.  [ ] **Mobile:** Injete o botão de abrir no `BreadcrumbActions`.
4.  [ ] **Drawer:** Adicione o componente `Drawer` no final da página, renderizando o componente Mobile.

**Exemplo Completo:**

```tsx
export default function MyPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="p-4">
      {/* 1. Botão Mobile (Injetado) */}
      <Header
        icon={
          <BreadcrumbActions placement="start">
            <BreadcrumbActionIcon
              icon={ListIcon}
              onClick={() => setIsDrawerOpen(true)}
            />
          </BreadcrumbActions>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. Componente Desktop (Escondido no mobile) */}
        <div className="hidden md:block">
          <DesktopCard data={data} />
        </div>

        {/* Outros conteúdos... */}
      </div>

      {/* 3. Drawer Mobile */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Título da Lista</DrawerTitle>
          </DrawerHeader>
          <MobileList data={data} />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
```

## 5. Busca no Breadcrumb (BreadcrumbSearch)

Para economizar espaço em listas filtráveis, mova a barra de pesquisa para o Breadcrumb no mobile, usando o componente expansível `BreadcrumbSearch`.

Ele exibe uma lupa que, ao ser clicada, expande e cobre todo o breadcrumb com o input de texto.

### Como usar:

1.  Importe o componente:
    ```tsx
    import BreadcrumbSearch from "@/components/shared/Breadcrum/BreadcrumbSearch";
    ```
2.  Adicione dentro de `BreadcrumbActions`.
3.  Mantenha a `SearchBar` original visível apenas no desktop (`hidden md:block`).

**Exemplo:**

```tsx
<Header
  icon={
    <div className="flex items-center gap-2">
      {/* Mobile: Busca Expansível no Topo */}
      <BreadcrumbActions placement="start">
        <BreadcrumbSearch
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
        />
      </BreadcrumbActions>

      {/* Desktop: Busca Normal */}
      <div className="hidden md:block w-72">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    </div>
  }
/>
```
