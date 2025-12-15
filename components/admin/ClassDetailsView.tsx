"use client";

import { motion } from "framer-motion";
import { FullClassDetails } from "@/types/classes/class";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMessages } from "next-intl";
import { 
  Calendar, 
  Clock, 
  User, 
  GraduationCap, 
  FileText, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  Mail
} from "lucide-react";

interface ClassDetailsViewProps {
  classDetails: FullClassDetails;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
};

export default function ClassDetailsView({
  classDetails,
}: ClassDetailsViewProps) {
  const classDate = new Date(classDetails.scheduledAt);
  const formattedDate = classDate.toLocaleDateString("pt-BR", {
    dateStyle: "full",
  });
  const formattedTime = classDate.toLocaleTimeString("pt-BR", {
    timeStyle: "short",
  });
  const messages = useMessages();
  const tClassStatus = (messages?.ClassStatus ?? {}) as Record<string, string>;

  // Status config
  const statusConfig = {
    scheduled: { 
      icon: Clock, 
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/50 dark:border-blue-400/50"
    },
    completed: { 
      icon: CheckCircle2, 
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/50 dark:border-green-400/50"
    },
    cancelled: { 
      icon: XCircle, 
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/50 dark:border-red-400/50"
    },
  };

  const currentStatus = statusConfig[classDetails.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = currentStatus.icon;

  return (
    <motion.div 
      className="p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Date and Status */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
            Detalhes da Aula
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm md:text-base">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm md:text-base">{formattedTime}</span>
            </div>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentStatus.bgColor} ${currentStatus.borderColor} border`}
        >
          <StatusIcon className={`h-5 w-5 ${currentStatus.color}`} />
          <span className={`font-semibold ${currentStatus.color}`}>
            {tClassStatus[classDetails.status] ?? classDetails.status}
          </span>
        </motion.div>
      </motion.div>

      {/* Teacher and Student Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="card-base p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Professor</h2>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Avatar>
                <AvatarImage
                  src={classDetails?.teacher?.avatarUrl}
                  alt={classDetails?.teacher?.name}
                />
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                  {classDetails?.teacher?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                {classDetails?.teacher?.name}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail className="h-3 w-3" />
                <span>{classDetails?.teacher?.email}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Student Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="card-base p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Aluno</h2>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Avatar>
                <AvatarImage
                  src={classDetails.student.avatarUrl}
                  alt={classDetails.student.name}
                />
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                  {classDetails.student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                {classDetails.student.name}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail className="h-3 w-3" />
                <span>{classDetails.student.email}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notes Section */}
      {classDetails.notes && (
        <motion.div variants={itemVariants}>
          <Alert className="card-base border-blue-500/50 dark:border-blue-400/50">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <h3 className="font-semibold text-lg mb-2 text-blue-700 dark:text-blue-300">
                Tópico para esta Aula
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {classDetails.notes}
              </p>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Feedback Section */}
      {classDetails.feedback && (
        <motion.div variants={itemVariants}>
          <Alert className="card-base border-green-500/50 dark:border-green-400/50">
            <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>
              <h3 className="font-semibold text-lg mb-2 text-green-700 dark:text-green-300">
                Relatório da Aula
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {classDetails.feedback}
              </p>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Future Features Placeholder */}
      <motion.div 
        variants={itemVariants}
        className="mt-8 card-base p-6 border-dashed"
      >
        <div className="text-center text-slate-500 dark:text-slate-400 space-y-2">
          <p className="text-sm">Área reservada para recursos futuros:</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50">
              🎥 Chamada de Vídeo
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50">
              📝 Editor Colaborativo
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}