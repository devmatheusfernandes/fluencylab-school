# APIs — Rotas e Endpoints

Este documento lista as rotas de API presentes em `app/api`, com seus caminhos e métodos HTTP exportados, para facilitar a consulta e evitar duplicação de lógica.

## Índice (visão geral)

- Pasta base: `app/api`
- Padrão de handlers: Next.js App Router (`route.ts` com `GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- Autenticação: Muitas rotas usam `getServerSession` e validam papel do usuário (`admin`, `manager`, `teacher`, `student`).

## Admin

- `GET, POST` — `/api/admin/announcements`
- `GET, PUT, DELETE` — `/api/admin/announcements/[id]`
- `POST` — `/api/admin/assign-schedule`
- `GET` — `/api/admin/contracts`
- `GET` — `/api/admin/contracts/all`
- `POST` — `/api/admin/contracts/sign`
- `GET` — `/api/admin/credits/balance/[studentId]`
- `GET` — `/api/admin/credits/history/[studentId]`
- `GET` — `/api/admin/subscriptions/[subscriptionId]`
- `GET` — `/api/admin/teacher-availability/[teacherId]`
- `GET` — `/api/admin/teachers`
- `GET` — `/api/admin/teachers/[teacherId]/classes`
- `PATCH, DELETE` — `/api/admin/users/[userId]`
- `GET` — `/api/admin/users/[userId]/details`
- `GET` — `/api/admin/users/[userId]/financials`
- `PUT` — `/api/admin/users/[userId]/teachers`

## Announcements

- `GET` — `/api/announcements`
- `POST` — `/api/announcements/[id]/read`

## Auth

- `GET` — `/api/auth/check-verification`
- `POST` — `/api/auth/resend-verification`
- `GET` — `/api/auth/verification-status`
- `GET` — `/api/auth/verify-status`
- `POST` — `/api/auth/2fa/setup`
- `POST` — `/api/auth/2fa/verify`
- `POST` — `/api/auth/2fa/disable`

## Avatar

- `POST` — `/api/avatar`

## Classes

- `POST` — `/api/classes/generate-classes`
- `POST` — `/api/classes/[classId]/convert-to-slot`
- `PUT` — `/api/classes/[classId]/teacher`

## Class Templates

- `GET, PUT, DELETE` — `/api/class-templates/[studentId]`
- `POST` — `/api/class-templates/[studentId]/delete-classes`

## Contract

- `GET` — `/api/contract/[userId]`
- `POST` — `/api/contract/sign`
- `POST, GET` — `/api/contract/cancel/[userId]`
- `GET` — `/api/contract/notification/[userId]`
- `POST` — `/api/contract/validate/[userId]`
- `POST, GET` — `/api/contract/auto-renewal/process`

## Debug

- `GET` — `/api/debug/check-claims`
- `GET` — `/api/debug/classes`
- `GET` — `/api/debug/email-status`
- `POST, GET` — `/api/debug/fix-teacher-student`

## Onboarding

- `GET` — `/api/onboarding/check-payment-status`
- `GET` — `/api/onboarding/contract-status`
- `POST` — `/api/onboarding/create-subscription`
- `POST` — `/api/onboarding/sign-contract`
- `POST` — `/api/onboarding/teacher/complete`

## Payment

- `POST, GET, PUT, DELETE` — `/api/payment/mercadopago/webhook`

## Student

- `GET` — `/api/student/availability`
- `GET` — `/api/student/achievements`
- `PUT` — `/api/student/achievements/[id]`
- `GET` — `/api/student/can-reschedule`
- `POST` — `/api/student/checkout-url`
- `POST` — `/api/student/classes`
- `GET` — `/api/student/classes/list`
- `POST` — `/api/student/classes/reschedule`
- `GET` — `/api/student/credits/balance`
- `POST` — `/api/student/generate-pix`
- `GET` — `/api/student/google-calendar/callback`
- `GET` — `/api/student/google-calendar/connect`
- `POST` — `/api/student/google-calendar/disconnect`
- `POST` — `/api/student/google-calendar/sync`
- `GET` — `/api/student/monthly-reschedules`
- `GET` — `/api/student/notebooks`
- `GET` — `/api/student/notebooks/[id]`
- `GET` — `/api/student/payment-history`
- `GET` — `/api/student/payment-status`
- `GET` — `/api/student/placement`
- `POST` — `/api/student/recreate-checkout`
- `GET` — `/api/student/reschedule-availability`
- `GET` — `/api/student/subscription-status`
- `GET` — `/api/student/tasks`
- `PUT` — `/api/student/tasks/[taskId]`

## Subscription

- `POST` — `/api/subscription/create`
- `POST` — `/api/subscription/cancel`

## Teacher

- `POST, GET` — `/api/teacher/availability`
- `POST` — `/api/teacher/availability/[slotId]`
- `GET` — `/api/teacher/my-classes`
- `GET` — `/api/teacher/my-students`
- `POST` — `/api/teacher/settings`
- `GET` — `/api/teacher/student-credits/[studentId]`
- `GET` — `/api/teacher/students/[studentId]/classes`
- `GET, POST` — `/api/teacher/students/[studentId]/notebooks`
- `GET, PUT, DELETE` — `/api/teacher/students/[studentId]/notebooks/[notebookId]`
- `GET, POST, DELETE` — `/api/teacher/students/[studentId]/tasks`
- `PUT, DELETE` — `/api/teacher/students/[studentId]/tasks/[taskId]`

## Users

- `GET` — `/api/users/me`

## Vacations

- `POST, GET, DELETE` — `/api/vacations`
- `POST, GET, DELETE` — `/api/vacations/[delete]`

## Observações

- Alguns diretórios (ex.: `profile`, `settings`, `my-classes`) existem, mas seus métodos não foram listados aqui porque não há `export async function` explícito detectado. Caso necessário, atualize este documento após implementar os handlers.
- Rotas com parâmetros (`[id]`, `[userId]`, etc.) seguem o padrão Next.js para `Dynamic Segments`.
- Este documento foi gerado a partir da análise dos arquivos `route.ts` e pode ser expandido com detalhes de payloads e respostas conforme a necessidade.