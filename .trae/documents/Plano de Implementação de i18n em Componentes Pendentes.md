Baseado na análise do código, identifiquei os seguintes componentes e páginas que contêm textos "hardcoded" (em português ou inglês) e ainda não utilizam o `next-intl` para internacionalização.

### 📋 Lista de Arquivos que Precisam de Tradução

**1. Módulo de Tarefas (`components/features/tasks/`)**
Estes componentes possuem status e prioridades fixos no código.
- `TaskKanbanView.tsx`: Textos de colunas ("A Fazer", "Em Progresso", "Revisão", "Concluído") e placeholder ("Solte itens aqui").
- `TaskCard.tsx`: Labels de prioridade ("Baixa", "Média", "Alta") e status.
- `TaskDashboard.tsx`: (Provável) Títulos e filtros da dashboard.

**2. Dashboard Administrativo (`components/admin/`)**
- `DashboardClient.tsx`: Títulos de cards estatísticos ("Receita (Mês)", "Novos Utilizadores", "Professores Ativos").
- Outros componentes em `components/admin/` (ex: modais e tabelas) também podem conter textos fixos.

**3. Componentes de UI (`components/ui/`)**
- `sidebar.tsx`: Textos de acessibilidade e títulos em inglês ("Toggle Sidebar", "Sidebar").
- `modal.tsx`: Botões padrão se houver (ex: "Cancelar").

---

### 🚀 Plano de Implementação (Next-intl)

Para corrigir isso, seguiremos o padrão definido em `.trae/rules/usetranslations-use.md`.

#### Passo 1: Definir Chaves de Tradução (JSON)
Adicionaremos as chaves necessárias em `messages/pt.json` e `messages/en.json`.

**Estrutura Proposta:**
```json
{
  "Tasks": {
    "status": {
      "todo": "A Fazer",
      "in_progress": "Em Progresso",
      "review": "Revisão",
      "done": "Concluído"
    },
    "priority": {
      "low": "Baixa",
      "medium": "Média",
      "high": "Alta"
    },
    "kanban": {
      "dropPlaceholder": "Solte itens aqui"
    }
  },
  "AdminDashboard": {
    "stats": {
      "revenue": "Receita (Mês)",
      "newUsers": "Novos Usuários (Mês)",
      "scheduledClasses": "Aulas Agendadas (Hoje)",
      "activeTeachers": "Professores Ativos"
    }
  }
}
```

#### Passo 2: Refatorar Componentes
Vamos atualizar os componentes para usar o hook `useTranslations`.

1.  **Atualizar `TaskKanbanView.tsx` e `TaskCard.tsx`**:
    -   Importar `useTranslations` de `next-intl`.
    -   Substituir os mapas de objetos estáticos (`const COLUMNS`, `priorityConfig`) por chamadas dinâmicas ou mover a lógica para dentro do componente onde o hook pode ser usado.

2.  **Atualizar `DashboardClient.tsx`**:
    -   Substituir as strings literais nos títulos dos `StatCard` pelo hook `t("stats.revenue")`, etc.

3.  **Verificação**:
    -   Garantir que não sobraram strings soltas.
    -   Verificar se a troca de idioma reflete nos novos textos.

#### Passo 3: Varredura Final
Após corrigir os principais, faremos uma verificação rápida em outros arquivos listados (como `TaskWeekView` e `sidebar`) para garantir cobertura total.

Deseja que eu comece a execução deste plano pelos componentes de **Tarefas** ou pelo **Dashboard Administrativo**?