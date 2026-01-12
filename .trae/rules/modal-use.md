# Regras de Uso de Modais

Ao implementar modais na aplicação, siga estritamente este padrão visual para manter a consistência:

## Estrutura Obrigatória

Todo modal de confirmação ou ação deve seguir esta hierarquia de componentes:

1.  **ModalIcon**: Deve ser o primeiro elemento dentro de `ModalContent`. Escolha o `type` adequado (ex: "delete", "calendar", "warning").
2.  **ModalHeader**: Contém o `ModalTitle` e `ModalDescription`.
3.  **ModalFooter**: Deve usar os botões específicos de modal.

## Botões

*   **NÃO** use o componente `Button` padrão ou `ModalClose` diretamente no footer.
*   Use **`ModalSecondaryButton`** para ações de cancelamento/voltar.
*   Use **`ModalPrimaryButton`** para a ação principal.
    *   Para ações destrutivas (ex: excluir), use a prop `variant="destructive"`.

## Exemplo de Código

```tsx
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";

// ...

<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalContent>
    {/* 1. Ícone Contextual */}
    <ModalIcon type="delete" /> 

    {/* 2. Cabeçalho */}
    <ModalHeader>
      <ModalTitle>Título da Ação</ModalTitle>
      <ModalDescription>Descrição detalhada da ação.</ModalDescription>
    </ModalHeader>

    {/* 3. Rodapé com Botões Específicos */}
    <ModalFooter>
      <ModalSecondaryButton onClick={() => setIsOpen(false)}>
        Cancelar
      </ModalSecondaryButton>
      
      <ModalPrimaryButton 
        variant="destructive" 
        onClick={handleConfirm}
      >
        Confirmar
      </ModalPrimaryButton>
    </ModalFooter>
  </ModalContent>
</Modal>
```
