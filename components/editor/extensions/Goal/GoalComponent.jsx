"use client";

import React from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import PropTypes from "prop-types";
import Image from "next/image";
// import GoalIcon from "../../../../../../../public/images/apostila/goal.png";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '@/lib/firebase/config';
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const GoalComponent = ({ node }) => {
  const { data: session } = useSession();
  const { title, description, schedule } = node.attrs;
  const scheduleItems = schedule ? schedule.split("\n") : [];
  const handleAddTask = async (day, task, done) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("student");
      if (!id) {
        throw new Error("ID do estudante não encontrado na URL.");
      }

      const studentDocRef = doc(db, `users/${id}`);
      await updateDoc(studentDocRef, {
        "tasks.Task": arrayUnion({ day, task, done }),
      });
    } catch (error) {
      console.error("Erro ao adicionar a tarefa:", error);
      toast.error("Erro ao adicionar a tarefa.");
    }
  };

  const handleTaskModal = async (tasks) => {
    const addAllTasks = async () => {
      for (const [day, task, done] of tasks) {
        await handleAddTask(day, task, done);
      }
    };

    toast.promise(addAllTasks(), {
      loading: "Adicionando todas as tarefas...",
      success: "Todas as tarefas foram adicionadas com sucesso!",
      error: "Erro ao adicionar todas as tarefas",
    });
  };

  const handleAddAllTasks = () => {
    const taskArray = scheduleItems.map((item, index) => [
      `Day ${index + 1}`,
      item.trim(),
      false,
    ]);

    handleTaskModal(taskArray);
  };

  return (
    <NodeViewWrapper className="react-component">
      <div className="flex flex-col bg-muted text-foreground rounded-xl px-4 py-4">
        {/* Title and Icon */}
        <div className="flex flex-row items-center justify-center mb-2">
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          {/* <Image src={GoalIcon} alt="Goal Icon" className="w-12 h-12 ml-2" /> */}
        </div>

        {/* Description */}
        <div className="flex flex-row gap-2 justify-center items-center mb-4">
          <p className="font-semibold text-primary">Objetivo:</p>
          <p className="text-md font-semibold">{description}</p>
        </div>

        {/* Weekly Schedule */}
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold flex flex-col justify-center items-center">
            Programação da semana:
          </h3>
          <ul className="list-none">
            {scheduleItems.map((item, index) => (
              <li
                key={index}
                className="mb-1 flex justify-between items-center"
              >
                <div>{item}</div>
              </li>
            ))}
          </ul>

          {session?.user.role == "teacher" && (
            <Button
              className="self-center mt-4"
              variant="glass"
              onClick={handleAddAllTasks}
            >
              Adicionar como tarefas para o aluno
            </Button>
          )}
        </div>

        {/* Content from the editor */}
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

GoalComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      schedule: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default GoalComponent;
