//@types/users/userPermissions.ts

//Examples of possible permissions, but not all of them are here yet
export type UserPermission =
  // Student / Guarded
  | "class.view" // ver aulas próprias ou do protegido
  | "class.cancel.self" // cancelar aulas próprias
  | "class.reschedule.self" // reagendar aulas próprias
  | "contract.view.self" // ver contrato próprio
  | "profile.update.self" // atualizar perfil próprio
  | "feedback.create" // enviar feedback pós-aula
  | "payment.view.self" // visualizar histórico de pagamentos
  | "credits.view.self" // visualizar próprios créditos de aulas

  // Teacher
  | "class.view.assigned" // ver aulas que leciona
  | "class.update.status" // marcar aula como concluída, no-show, etc.
  | "class.reschedule.teacher" // reagendar aula como professor
  | "vacation.create" // criar férias
  | "vacation.view" // ver férias próprias
  | "student.feedback.read" // ler feedbacks de alunos
  | "class.create.with.credits" // criar aula usando créditos do estudante
  | "credits.view.students" // ver créditos dos próprios estudantes

  // Admin
  | "user.create" // criar usuários
  | "user.update" // atualizar qualquer usuário
  | "user.delete" // deletar/arquivar usuários
  | "class.view.all" // visualizar todas aulas
  | "class.update.any" // atualizar qualquer aula
  | "contract.create" // criar contratos
  | "contract.update" // atualizar contratos
  | "vacation.override" // aprovar/editar férias de professores
  | "report.view" // gerar relatórios
  | "payment.manage" // gerenciar pagamentos
  | "credits.manage" // gerenciar créditos de aulas regulares
  | "credits.grant" // conceder créditos a estudantes
  | "credits.view.all" // visualizar créditos de todos os estudantes

  // Manager / Support
  | "student.support" // agir em nome do aluno
  | "teacher.support" // agir em nome do professor
  | "report.view.limited" // acessar relatórios limitados
  | "credits.grant" // conceder créditos a estudantes
  | "credits.view.assigned" // visualizar créditos dos estudantes atribuídos

  // Material Manager
  | "material.create" // criar material
  | "material.update" // atualizar material
  | "material.delete" // deletar material
  | "material.view"; // visualizar material
