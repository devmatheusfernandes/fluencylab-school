import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
} from "@/components/ui/modal";

const LessonModal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="w-full max-w-2xl">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <div className="overflow-y-auto p-6">{children}</div>
      </ModalContent>
    </Modal>
  );
};

export default LessonModal;
