"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FullClassDetails } from "@/types/classes/class";
import { Notebook, Transcription } from "@/types/notebooks/notebooks";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useMessages } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Calendar,
  Clock,
  User,
  GraduationCap,
  FileText,
  MessageSquare,
  ScrollText,
  CheckCircle2,
  XCircle,
  Mail,
  ChevronRight,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Supondo que você tenha um componente de Badge, ou usaremos tailwind direto

interface ClassDetailsViewProps {
  classDetails: FullClassDetails;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const},
  },
};

export default function ClassDetailsView({
  classDetails,
}: ClassDetailsViewProps) {
  const [weekTranscriptions, setWeekTranscriptions] = useState<Transcription[]>([]);
  const [isLoadingTranscriptions, setIsLoadingTranscriptions] = useState(false);

  useEffect(() => {
    async function fetchWeekTranscriptions() {
      if (!classDetails.student.id || !classDetails.scheduledAt) return;

      setIsLoadingTranscriptions(true);
      try {
        const classDate = new Date(classDetails.scheduledAt);
        const startDate = new Date(classDate);
        startDate.setDate(classDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        const notebooksRef = collection(db, "users", classDetails.student.id, "Notebooks");
        const q = query(
          notebooksRef,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          where("createdAt", "<=", Timestamp.fromDate(endDate))
        );

        const querySnapshot = await getDocs(q);
        const transcriptions: Transcription[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Notebook;
          if (data.transcriptions && Array.isArray(data.transcriptions)) {
            transcriptions.push(...data.transcriptions);
          }
        });

        setWeekTranscriptions(transcriptions);
      } catch (error) {
        console.error("Error fetching transcriptions:", error);
      } finally {
        setIsLoadingTranscriptions(false);
      }
    }

    fetchWeekTranscriptions();
  }, [classDetails]);

  const classDate = new Date(classDetails.scheduledAt);
  const formattedDate = classDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = classDate.toLocaleTimeString("pt-BR", {
    timeStyle: "short",
  });
  const messages = useMessages();
  const tClassStatus = (messages?.ClassStatus ?? {}) as Record<string, string>;

  // Minimalist Status Config
  const statusConfig = {
    scheduled: {
      icon: Clock,
      style: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      label: "Agendada",
    },
    completed: {
      icon: CheckCircle2,
      style: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      label: "Concluída",
    },
    cancelled: {
      icon: XCircle,
      style: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
      label: "Cancelada",
    },
  };

  const currentStatus = statusConfig[classDetails.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = currentStatus.icon;

  const formatDate = (date: any) => {
    if (!date) return "";
    try {
      if (typeof date.toDate === "function") return date.toDate().toLocaleDateString("pt-BR");
      if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString("pt-BR");
      return new Date(date).toLocaleDateString("pt-BR");
    } catch (e) {
      return "";
    }
  };

  return (
    <motion.div
      className="w-full max-w-7xl p-4 mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Minimalist Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Detalhes da Aula
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex items-center gap-1.5 capitalize">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formattedDate}
            </div>
            <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                {formattedTime}
            </div>
            </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${currentStatus.style}`}>
            <StatusIcon className="h-4 w-4" />
            <span>{tClassStatus[classDetails.status] ?? classDetails.status}</span>
        </div>
      </motion.div>

      {/* 2. Participants Grid (Cards Minimalistas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teacher */}
        <motion.div
          variants={itemVariants}
          className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
        >
          <Avatar>
            <AvatarImage src={classDetails?.teacher?.avatarUrl} />
            <AvatarFallback/>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> Professor
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate capitalize">
              {classDetails?.teacher?.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 truncate">
              <Mail className="h-3 w-3" />
              {classDetails?.teacher?.email}
            </p>
          </div>
        </motion.div>

        {/* Student */}
        <motion.div
          variants={itemVariants}
          className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
        >
          <Avatar>
            <AvatarImage src={classDetails.student.avatarUrl} />
            <AvatarFallback />
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <User className="h-3 w-3" /> Aluno
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate capitalize">
              {classDetails.student.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 truncate">
              <Mail className="h-3 w-3" />
              {classDetails.student.email}
            </p>
          </div>
        </motion.div>
      </div>

      {/* 3. Accordion Section (Content Collapsed) */}
      <motion.div variants={itemVariants}>
        <Accordion type="multiple" defaultValue={["notes", "feedback"]} className="w-full space-y-4">
          
          {/* Notes Item */}
          {classDetails.notes && (
            <AccordionItem value="notes" className="border rounded-xl px-4 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                        <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Tópico da Aula</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed px-1">
                {classDetails.notes}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Feedback Item */}
          {classDetails.feedback && (
            <AccordionItem value="feedback" className="border rounded-xl px-4 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Relatório da Aula</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed px-1">
                {classDetails.feedback}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Transcriptions Item (Dynamic) */}
          {weekTranscriptions.length > 0 && (
            <AccordionItem value="transcriptions" className="border rounded-xl px-4 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30 dark:text-purple-400">
                        <ScrollText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                        <span className="block font-medium text-gray-900 dark:text-gray-100">Transcrições da Semana</span>
                        <span className="block text-xs text-gray-500 font-normal">
                            {weekTranscriptions.length} registro(s) encontrado(s)
                        </span>
                    </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-4">
                <div className="space-y-6 px-1">
                    {weekTranscriptions.map((transcription, index) => (
                        <div key={index} className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            <div className="mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                    {formatDate(transcription.date)}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 mb-1">Conteúdo</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {transcription.content || "Sem conteúdo."}
                                    </p>
                                </div>
                                {transcription.summary && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 mb-1">Resumo</p>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 italic bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                            {transcription.summary}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </motion.div>

     
    </motion.div>
  );
}