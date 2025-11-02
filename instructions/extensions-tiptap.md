# Tiptap - Guia de Extensões Customizadas

## Estrutura Básica

### Criando uma Extensão

```typescript
import { Extension } from "@tiptap/core";

const CustomExtension = Extension.create({
  name: "customExtension",
  onUpdate() {
    console.log(this.editor.getJSON());
  },
});
```

### Com Callback Function (para encapsular lógica)

```typescript
const CustomExtension = Extension.create(() => {
  const customVariable = "foo";

  function onCreate() {}
  function onUpdate() {}

  return {
    name: "customExtension",
    onCreate,
    onUpdate,
  };
});
```

### Instalando no Editor

```typescript
const editor = new Editor({
  extensions: [CustomExtension],
});

// Ou com React/Vue
const editor = useEditor({
  extensions: [CustomExtension],
});
```

## Opções da Extensão

### `name` (obrigatório)

Identificador único da extensão. Para nodes/marks, persiste no JSON.

```typescript
const CustomExtension = Extension.create({
  name: "customExtension",
});
```

### `priority`

Define ordem de carregamento (padrão: 100). Prioridade maior = carrega primeiro.

```typescript
const CustomLink = Link.extend({
  priority: 1000, // Carrega antes das outras
});
```

**Influencia:**

- Ordem dos plugins ProseMirror
- Ordem do schema (ex: `<a><strong>` vs `<strong><a>`)

### `addOptions`

Define opções configuráveis pelo usuário.

```typescript
type CustomExtensionOptions = {
  customOption: string;
};

const CustomExtension = Extension.create<CustomExtensionOptions>({
  name: "customExtension",
  addOptions() {
    return {
      customOption: "default value",
    };
  },
});

// Uso:
const editor = new Editor({
  extensions: [CustomExtension.configure({ customOption: "new value" })],
});
```

### `addStorage`

Gerenciador de estado simples para a extensão.

```typescript
type CustomExtensionStorage = {
  customValue: string;
};

const CustomExtension = Extension.create<any, CustomExtensionStorage>({
  name: "customExtension",
  addStorage() {
    return {
      customValue: "default value",
    };
  },
  onUpdate() {
    console.log(this.storage.customValue); // Acesso interno
  },
});

// Acesso externo:
editor.storage.customExtension.customValue;
```

### `addCommands`

Define comandos executáveis pelo usuário.

```typescript
const CustomExtension = Extension.create({
  name: "customExtension",
  addCommands() {
    return {
      customCommand:
        () =>
        ({ commands }) => {
          return commands.setContent("Custom command executed");
        },
    };
  },
});

// Uso:
editor.commands.customCommand();
editor.chain().customCommand().run();
```

### `addKeyboardShortcuts`

Define atalhos de teclado.

```typescript
const CustomExtension = Extension.create({
  name: "customExtension",
  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        console.log("Keyboard shortcut executed");
        return true;
      },
    };
  },
});
```

### `addInputRules`

Regex para transformar texto digitado (markdown shortcuts).

```typescript
import { markInputRule } from "@tiptap/core";

const CustomExtension = Extension.create({
  name: "customExtension",
  addInputRules() {
    return [
      markInputRule({
        find: /(?:~)((?:[^~]+))(?:~)$/,
        type: this.editor.schema.marks.strike,
      }),
    ];
  },
});
```

**Exemplo:** `~texto~` → texto tachado

**Diferença entre Input e Paste Rules:**

- Input rules terminam com `$` (fim da linha)
- Paste rules não têm `$` (buscam em todo conteúdo)

### `addPasteRules`

Similar ao input rules, mas para conteúdo colado.

```typescript
import { markPasteRule } from "@tiptap/core";

const CustomExtension = Extension.create({
  name: "customExtension",
  addPasteRules() {
    return [
      markPasteRule({
        find: /(?:~)((?:[^~]+))(?:~)/g, // Sem $ no final
        type: this.editor.schema.marks.strike,
      }),
    ];
  },
});
```

## Event Listeners

```typescript
const CustomExtension = Extension.create({
  onBeforeCreate() {
    // Editor está prestes a ser criado
  },
  onCreate() {
    // Editor está pronto
  },
  onUpdate() {
    // Conteúdo mudou
  },
  onSelectionUpdate({ editor }) {
    // Seleção mudou
  },
  onTransaction({ transaction }) {
    // Estado do editor mudou
  },
  onFocus({ event }) {
    // Editor focado
  },
  onBlur({ event }) {
    // Editor perdeu foco
  },
  onDestroy() {
    // Editor sendo destruído
  },
});
```

## ProseMirror Plugins

### Usando plugin existente

```typescript
import { history } from "@tiptap/pm/history";

const History = Extension.create({
  addProseMirrorPlugins() {
    return [history()];
  },
});
```

### Criando plugin customizado

```typescript
import { Plugin, PluginKey } from "@tiptap/pm/state";

const CustomExtension = Extension.create({
  name: "customExtension",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("customPlugin"),
        view() {
          return {
            update() {
              console.log("Custom plugin updated");
            },
          };
        },
      }),
    ];
  },
});
```

## Extensões Compostas

### `addExtensions`

Agrupa múltiplas extensões.

```typescript
import CustomExtension1 from "./CustomExtension1";

const CustomExtension = Extension.create({
  name: "customExtension",
  addExtensions() {
    return [
      CustomExtension1.configure({
        name: "customExtension1",
      }),
    ];
  },
});
```

## Estendendo Schema

### `extendNodeSchema`

Adiciona atributos ao NodeConfig.

```typescript
declare module "@tiptap/core" {
  interface NodeConfig {
    customAttribute: {
      default: null;
    };
  }
}

const CustomExtension = Extension.create({
  name: "customExtension",
  extendNodeSchema() {
    return {
      customAttribute: {
        default: null,
      },
    };
  },
});
```

### `extendMarkSchema`

Adiciona atributos ao MarkConfig.

```typescript
declare module "@tiptap/core" {
  interface MarkConfig {
    customAttribute: {
      default: null;
    };
  }
}

const CustomExtension = Extension.create({
  name: "customExtension",
  extendMarkSchema() {
    return {
      customAttribute: {
        default: null,
      },
    };
  },
});
```

## Contexto `this` Disponível

Dentro de uma extensão, você tem acesso a:

```typescript
this.name; // Nome da extensão
this.editor; // Instância do editor
this.type; // Tipo ProseMirror (se node/mark)
this.options; // Objeto com todas as configurações
this.parent; // Extensão pai (se usando extend)
this.storage; // Objeto de storage
```

## Tipos de Extensões

### 1. Extension (funcionalidade)

Não adiciona ao schema, apenas funcionalidade.

### 2. Node

Tipos de conteúdo no documento (Paragraph, Heading, CodeBlock).

```typescript
import { Node } from "@tiptap/core";

const CustomNode = Node.create({
  name: "customNode",
  // Configurações específicas de node...
});
```

### 3. Mark

Formatação de texto (Bold, Italic, Link).

```typescript
import { Mark } from "@tiptap/core";

const CustomMark = Mark.create({
  name: "customMark",
  // Configurações específicas de mark...
});
```

## CLI Bootstrap

Para criar extensões publicáveis:

```bash
npm init tiptap-extension
```

O CLI cria um projeto pré-configurado com Rollup.

## Dicas Importantes

1. **Prioridade**: Extensões com maior prioridade carregam primeiro
2. **Input Rules**: Use `$` no final do regex para fim de linha
3. **Paste Rules**: Não use `$` (busca em todo conteúdo)
4. **Commands**: Acesse outros comandos via parâmetro `commands`
5. **Storage**: É namespacado pelo nome da extensão
6. **TypeScript**: Declare módulos para type safety completo
7. **Use a pasta**: @/components/editor/extensions e crie uma pasta para cada extensão
