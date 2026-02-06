---
alwaysApply: false
description:
---

# Regras de Manutenção de Arquivos de Tradução (i18n)

Este documento define regras ESTRITAS para a edição dos arquivos de tradução localizados em `messages/` (`en.json` e `pt.json`).

A integridade destes arquivos é crítica. Edições automatizadas incorretas podem causar perda de dados, chaves duplicadas ou JSONs inválidos.

## 1. Princípios de Integridade

### 🛑 NUNCA Delete Chaves Existentes

- A menos que o usuário EXPLICITAMENTE peça para "remover" ou "limpar" uma chave, **nunca** apague conteúdo existente.
- Se for adicionar uma nova chave, certifique-se de que a operação de escrita não sobrescreva o arquivo inteiro com uma versão truncada.

### 🔄 Sincronização Obrigatória

- Toda alteração feita em `messages/pt.json` **DEVE** ser replicada imediatamente em `messages/en.json`.
- A estrutura de chaves (namespaces e sub-chaves) deve ser idêntica em ambos os arquivos. Apenas os valores (textos) mudam.

## 2. Estratégia de Edição Segura

### Use `SearchReplace` para Pequenas Alterações

Para evitar ler e reescrever arquivos grandes (o que pode causar truncamento por limite de tokens), prefira usar a ferramenta de busca e substituição para inserir novas chaves.

**Exemplo Seguro:**
Encontre o final de um objeto existente para inserir o novo item.

_Search:_

```json
    "lastExistingKey": "Valor antigo"
  }
```

_Replace:_

```json
    "lastExistingKey": "Valor antigo",
    "newKey": "Novo Valor"
  }
```

### Se Precisar Reescrever (Write)

Se for necessário reescrever o arquivo inteiro ou uma grande seção:

1. **LEIA** o arquivo com um limite de linhas alto o suficiente para garantir que você tem o conteúdo COMPLETO.
2. Verifique se o conteúdo lido não foi truncado (não termina abruptamente).
3. Somente então gere o novo conteúdo completo.

## 3. Preservação de Estrutura

### Não Achate (Flatten) a Estrutura

Mantenha o aninhamento dos objetos. Não transforme um objeto aninhado em chaves separadas por ponto, a menos que seja o padrão do arquivo.

_Correto:_

```json
"Auth": {
  "Login": {
    "title": "Entrar"
  }
}
```

_Errado (se o arquivo usa aninhamento):_

```json
"Auth.Login.title": "Entrar"
```

### Respeite a Ordem

- Tente inserir novas chaves em ordem alfabética ou lógica, próximo a chaves relacionadas.
- Não reordene o arquivo inteiro aleatoriamente.

## 4. Validação de Sintaxe

- **Vírgulas:** Verifique sempre se a chave anterior recebeu uma vírgula ao adicionar uma nova linha.
- **Chaves:** Certifique-se de que todos os blocos `{` e `}` estão balanceados.
- **Aspas:** Use aspas duplas `"` para chaves e valores. Escape aspas internas com `\"`.

## 5. Exemplo de Workflow Correto

1. Usuário pede: "Adicione um botão 'Cancelar' na tela de Login".
2. Agente lê `messages/pt.json` e `messages/en.json` para ver a estrutura de `Login`.
3. Agente identifica o bloco:
   ```json
   "Login": {
     "submit": "Entrar"
   }
   ```
4. Agente usa `SearchReplace` (ou `Write` cuidadoso) para adicionar `"cancel": "Cancelar"` em PT e `"cancel": "Cancel"` em EN.
5. Resultado final preserva todo o resto do arquivo.
