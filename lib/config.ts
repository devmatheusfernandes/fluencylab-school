/**
 * Configuração central do site. Tudo que muda de um teste para outro
 * (nome do produto, domínio, exibir preço ou não) fica aqui ou em variáveis de ambiente.
 */
export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "Fluency Lab School";
export const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN ?? "fluencylab.school";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${DOMAIN}`;
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

/**
 * Quando "false" (padrão), a página NÃO mostra o preço: o formulário pergunta
 * quanto a pessoa pagaria ANTES de ela ver qualquer número, o que dá uma
 * intenção de pagamento mais honesta. Coloque "true" para mostrar a proposta.
 */
export const SHOW_PRICING = process.env.NEXT_PUBLIC_SHOW_PRICING === "true";

/** Proposta inicial (só aparece com SHOW_PRICING=true). */
export const PRICING = { base: 89, perStudent: 15 };
