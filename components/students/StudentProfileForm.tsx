"use client";

import { useState } from "react";
import { User } from "@/types/users/users";
import { createStudentProfile } from "@/actions/studentProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";

interface StudentProfileFormValues {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  state: string;
  languageOfInterest: string;
  age?: number;
  level: string;
  placementNotes: string;
  schedulePreferences: string;
  likesPreferences: string;
  mainGoal: string;
  goalDeadline: string;
  firstImpressions: string;
}

interface StudentProfileFormProps {
  users: User[];
}

export function StudentProfileForm({ users }: StudentProfileFormProps) {
  const t = useTranslations("StudentProfile");
  const [openUserSelect, setOpenUserSelect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StudentProfileFormValues>({
    userId: "",
    name: "",
    email: "",
    phoneNumber: "",
    city: "",
    state: "",
    languageOfInterest: "",
    age: undefined,
    level: "",
    placementNotes: "",
    schedulePreferences: "",
    likesPreferences: "",
    mainGoal: "",
    goalDeadline: "",
    firstImpressions: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentProfileFormValues, string>>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof StudentProfileFormValues]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof StudentProfileFormValues];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: keyof StudentProfileFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setFormData((prev) => ({
        ...prev,
        userId: userId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        age: user.birthDate
          ? new Date().getFullYear() - new Date(user.birthDate).getFullYear()
          : undefined,
      }));
      
      // Clear userId error
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.userId;
        return newErrors;
      });
      
      setOpenUserSelect(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentProfileFormValues, string>> = {};
    let isValid = true;

    if (!formData.userId) {
      newErrors.userId = "Selecione um usuário";
      isValid = false;
    }
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
      isValid = false;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
      isValid = false;
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Contato é obrigatório";
      isValid = false;
    }
    if (!formData.languageOfInterest) {
      newErrors.languageOfInterest = "Selecione um idioma";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t("fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStudentProfile({
        userId: formData.userId,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        state: formData.state,
        languageOfInterest: formData.languageOfInterest,
        age: formData.age,
        level: formData.level,
        placementNotes: formData.placementNotes,
        preferences: {
          schedule: formData.schedulePreferences,
          likes: formData.likesPreferences,
        },
        goals: {
          mainGoal: formData.mainGoal,
          deadline: formData.goalDeadline,
        },
        firstImpressions: formData.firstImpressions,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (result.success) {
        toast.success(t("successMessage"));
      } else {
        toast.error(`Erro ao criar perfil: ${result.error}`);
      }
    } catch (error) {
      toast.error("Erro inesperado ao criar perfil.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Contact Info */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("contactInfo")}</CardTitle>
            <CardDescription>
              {t("contactDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Selection */}
            <div className="flex flex-col space-y-2">
              <Label>{t("associateUser")}</Label>
              <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUserSelect}
                    className="justify-between w-full"
                  >
                    {formData.userId
                      ? users.find((user) => user.id === formData.userId)?.name
                      : t("selectUser")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-full min-w-[300px]" align="start">
                  <Command>
                    <CommandInput placeholder={t("searchUser")} />
                    <CommandList>
                      <CommandEmpty>{t("noUserFound")}</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.name}
                            onSelect={() => handleUserSelect(user.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.userId === user.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.name} ({user.email})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.userId && (
                <p className="text-sm text-red-500">{errors.userId}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")} *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")} *</Label>
              <Input 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                readOnly 
                className="bg-muted" 
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t("contact")} *</Label>
              <Input 
                id="phoneNumber" 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleInputChange} 
                placeholder="+55..." 
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t("city")}</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t("state")}</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Pedagogical Profile */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("pedagogicalProfile")}</CardTitle>
            <CardDescription>
              {t("pedagogicalDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">{t("language")} *</Label>
              <Select
                onValueChange={(value) => handleSelectChange("languageOfInterest", value)}
                value={formData.languageOfInterest}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectUser").replace("...", "")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">Inglês</SelectItem>
                  <SelectItem value="spanish">Espanhol</SelectItem>
                  <SelectItem value="french">Francês</SelectItem>
                  <SelectItem value="italian">Italiano</SelectItem>
                  <SelectItem value="german">Alemão</SelectItem>
                </SelectContent>
              </Select>
              {errors.languageOfInterest && (
                <p className="text-sm text-red-500">{errors.languageOfInterest}</p>
              )}
            </div>

            {/* Age & Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">{t("age")}</Label>
                <Input 
                  id="age" 
                  name="age" 
                  type="number" 
                  value={formData.age || ""} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{t("level")}</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("level", value)}
                  value={formData.level}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectUser").replace("...", "")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Iniciante</SelectItem>
                    <SelectItem value="A2">A2 - Básico</SelectItem>
                    <SelectItem value="B1">B1 - Intermediário</SelectItem>
                    <SelectItem value="B2">B2 - Independente</SelectItem>
                    <SelectItem value="C1">C1 - Avançado</SelectItem>
                    <SelectItem value="C2">C2 - Fluente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Placement Notes */}
            <div className="space-y-2">
              <Label htmlFor="placementNotes">{t("placementNotes")}</Label>
              <Textarea 
                id="placementNotes" 
                name="placementNotes" 
                placeholder="Observações sobre o teste de nível..." 
                value={formData.placementNotes} 
                onChange={handleInputChange} 
              />
            </div>

            {/* Preferences */}
            <div className="space-y-2">
              <Label htmlFor="schedulePreferences">{t("schedulePreferences")}</Label>
              <Input 
                id="schedulePreferences" 
                name="schedulePreferences" 
                placeholder="Ex: Manhãs, Seg/Qua/Sex..." 
                value={formData.schedulePreferences} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="likesPreferences">{t("likesPreferences")}</Label>
              <Textarea 
                id="likesPreferences" 
                name="likesPreferences" 
                placeholder="Filmes, séries, hobbies, interesses..." 
                value={formData.likesPreferences} 
                onChange={handleInputChange} 
              />
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label htmlFor="mainGoal">{t("mainGoal")}</Label>
              <Input 
                id="mainGoal" 
                name="mainGoal" 
                placeholder="Ex: Viagem, Trabalho, Certificação..." 
                value={formData.mainGoal} 
                onChange={handleInputChange} 
              />
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="goalDeadline">{t("deadline")}</Label>
              <Input 
                id="goalDeadline" 
                name="goalDeadline" 
                placeholder="Ex: 6 meses, fim do ano..." 
                value={formData.goalDeadline} 
                onChange={handleInputChange} 
              />
            </div>

            {/* First Impressions */}
            <div className="space-y-2">
              <Label htmlFor="firstImpressions">{t("firstImpressions")}</Label>
              <Textarea 
                id="firstImpressions" 
                name="firstImpressions" 
                placeholder="Comentários livres sobre o perfil do aluno..." 
                className="min-h-[100px]"
                value={formData.firstImpressions} 
                onChange={handleInputChange} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            t("saveButton")
          )}
        </Button>
      </div>
    </form>
  );
}
