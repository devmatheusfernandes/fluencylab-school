"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalBody,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchStudents } from "@/actions/userSearch";
import { associateStudentProfile } from "@/actions/studentProfile";
import { toast } from "sonner";

interface AssociateStudentModalProps {
  profileId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssociateStudentModal({
  profileId,
  isOpen,
  onClose,
}: AssociateStudentModalProps) {
  const t = useTranslations("AssociateModal");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      searchStudents().then((res) => {
        setStudents(res);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!profileId || !value) return;

    const result = await associateStudentProfile(profileId, value);
    if (result.success) {
      toast.success(t("success"));
      onClose();
    } else {
      toast.error("Error: " + (result.error || "Unknown error"));
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalIcon type="user" />
        <ModalHeader>
          <ModalTitle>{t("title")}</ModalTitle>
          <ModalDescription>{t("description")}</ModalDescription>
        </ModalHeader>

        <ModalBody>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-12"
              >
                {value
                  ? students.find((s) => s.id === value)?.name
                  : t("selectUser")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder={t("searchUser")} />
                <CommandList>
                  <CommandEmpty>No student found.</CommandEmpty>
                  <CommandGroup>
                    {students.map((student) => (
                      <CommandItem
                        key={student.id}
                        value={student.name}
                        onSelect={() => {
                          setValue(student.id === value ? "" : student.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === student.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {student.name} ({student.email})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </ModalBody>

        <ModalFooter>
          <ModalSecondaryButton onClick={onClose}>
            {t("cancel")}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={!value}>
            {t("save")}
          </ModalPrimaryButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
