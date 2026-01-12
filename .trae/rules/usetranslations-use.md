# Guia de Implementação de Traduções (i18n)

Este documento estabelece o padrão para implementação de internacionalização (i18n) no projeto utilizando a biblioteca `next-intl`. Siga este passo a passo para garantir consistência e manutenibilidade.

## 1. Estrutura de Chaves nos Arquivos JSON

Antes de alterar o código, defina as chaves de tradução. As chaves devem ser agrupadas pelo **contexto da página** ou **nome do componente**.

### Localização dos Arquivos
- Português: `messages/pt.json`
- Inglês: `messages/en.json`

### Padrão de Nomenclatura
Use `PascalCase` para o namespace (grupo) e `camelCase` para as chaves individuais.

**Exemplo:**
Se você está criando uma página de "Configurações de Usuário", o JSON deve ficar assim:

```json
// messages/pt.json
{
  "UserSettings": {
    "title": "Configurações",
    "saveButton": "Salvar Alterações",
    "notificationsDescription": "Gerencie suas preferências de notificação."
  }
}
```

**Regra Importante:** Sempre adicione as chaves em **ambos** os arquivos (`pt.json` e `en.json`) simultaneamente.

## 2. Implementação no Componente

### Importação
Importe o hook `useTranslations` do pacote `next-intl`.

```tsx
import { useTranslations } from "next-intl";
```

### Inicialização do Hook
Dentro do componente, chame o hook passando o namespace definido no passo 1.

```tsx
export default function UserSettingsPage() {
  // "UserSettings" deve corresponder à chave raiz no JSON
  const t = useTranslations("UserSettings"); 

  return (
    <div>
      {/* Uso das chaves definidas */}
      <h1>{t("title")}</h1>
      <p>{t("notificationsDescription")}</p>
      
      <button>{t("saveButton")}</button>
    </div>
  );
}
```

## 3. Casos Específicos

### Interpolação de Variáveis
Se o texto precisar de valores dinâmicos:

**JSON:**
```json
"welcome": "Olá, {name}!"
```

**Componente:**
```tsx
<h1>{t("welcome", { name: "Matheus" })}</h1>
```

### Rich Text (Negrito, Itálico, Links)
Para textos que contêm formatação HTML simples, use o método `rich`:

**JSON:**
```json
"terms": "Aceito os <link>Termos de Uso</link>."
```

**Componente:**
```tsx
<p>
  {t.rich("terms", {
    link: (chunks) => <a href="/terms" className="underline">{chunks}</a>
  })}
</p>
```

## Checklist de Verificação
1. [ ] Chaves adicionadas em `messages/pt.json`.
2. [ ] Chaves adicionadas em `messages/en.json`.
3. [ ] `useTranslations` importado e utilizado corretamente.
4. [ ] Textos "hardcoded" removidos do componente.
