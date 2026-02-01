Aqui está o plano detalhado para padronizar e organizar a estrutura do seu projeto.

### 1. Análise Atual
- **Padrões Misturados**: Existe uma mistura de `camelCase` (ex: `useAuth.ts`), `kebab-case` (ex: `use-mobile.ts`) e `PascalCase` (ex: `ClassTemplateRepository.ts`).
- **Estrutura Plana**: Muitas pastas têm muitos arquivos na raiz, dificultando a localização.
- **API**: A pasta `app/api` já segue o padrão correto do Next.js (`kebab-case` para rotas), então não precisa de alteração de nomes, apenas verificação de estrutura.

### 2. Proposta de Padronização de Nomes
Vou padronizar tudo para **camelCase** (padrão mais comum em projetos TypeScript/React), exceto onde o framework exige outro padrão.

| Pasta | Padrão Atual | Padrão Proposto | Exemplo de Mudança |
|-------|--------------|-----------------|--------------------|
| **hooks** | Misto | **camelCase** | `use-mobile.ts` → `useMobile.ts` |
| **services** | camelCase (maioria) | **camelCase** | Manter `authService.ts` |
| **repositories** | Misto | **camelCase** | `ClassTemplateRepository.ts` → `classTemplateRepository.ts` |
| **lib** | Misto | **camelCase** | `practice-logic.ts` → `practiceLogic.ts` |
| **types** | Misto | **camelCase** | `user-details.ts` → `userDetails.ts` |
| **actions** | kebab-case | **camelCase** | `lesson-processing.ts` → `lessonProcessing.ts` |
| **app/api** | kebab-case | **kebab-case** | Manter (Obrigatório do Next.js) |

### 3. Proposta de Organização de Pastas (Sub-pastas)
Para melhorar a organização, vou agrupar os arquivos por **domínio/funcionalidade**.

#### 📂 Hooks
- **`auth/`**: `useAuth`, `useTwoFactor`, `useCurrentUser`...
- **`ui/`**: `useMenuNavigation`, `useMobile`, `useTiptapEditor`...
- **`student/`**: `useStudent`, `useStudentPanel`...
- **`teacher/`**: `useTeacher`, `useTeacherCalendarData`...
- **`features/`**: Manter ou expandir para features específicas (ex: `tasks`, `notifications`).

#### 📂 Services & Repositories (Espelhados)
- **`core/`**: `authService`, `userService`, `emailService`...
- **`financial/`**: `contractService`, `subscriptionService`, `creditService`...
- **`learning/`**: `courseService`, `classService` (se houver), `placementService`...
- **`communication/`**: `announcementService`, `pushService`...

#### 📂 Lib
- **`utils/`**: Utilitários gerais (`utils.ts`, `rateLimit.ts`...).
- **`config/`**: Configurações de serviços externos (`abacatepay`, `firebase`).
- **`logic/`**: Lógicas de negócio puras (`practiceLogic.ts`, `grading.ts`).

### 4. Plano de Execução

1.  **Renomear Arquivos**: Executar script para renomear arquivos de `kebab-case` e `PascalCase` para `camelCase` nas pastas `hooks`, `repositories`, `lib`, `types`, `actions`.
2.  **Criar Estrutura de Pastas**: Criar as sub-pastas sugeridas.
3.  **Mover Arquivos**: Mover os arquivos para suas respectivas sub-pastas.
4.  **Atualizar Imports**: (Crucial) Atualizar todas as referências nos arquivos do projeto para apontar para os novos caminhos e nomes.

> **Nota**: A atualização de imports será feita com cuidado para garantir que o projeto continue compilando.

Você aprova este plano de padronização e organização?