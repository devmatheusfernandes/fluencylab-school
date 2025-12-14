import React, { useState, useEffect } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import PropTypes from "prop-types";
import { useSession } from "next-auth/react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { CheckCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const TranslationComponent = ({ node, updateAttributes }) => {
  const [userTranslation, setUserTranslation] = useState(
    node.attrs.userTranslation || ""
  );
  const [feedback, setFeedback] = useState(node.attrs.feedback || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track if the component is in editing mode
  const [editedSentence, setEditedSentence] = useState(
    node.attrs.originalSentence
  );
  const { originalSentence, sentenceNumber } = node.attrs;
  const { data: session } = useSession(); // Use session to check if user is admin
  const isAdmin = session?.user?.role === "admin"; // Assuming 'role' determines admin status

  const handleChange = (e) => {
    setUserTranslation(e.target.value);
  };

  const checkTranslation = async () => {
    setIsLoading(true);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 500,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_destructiveOUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const prompt = `
      Verifique se a tradução em Português fornecida pelo usuário para a frase ${sentenceNumber}: "${originalSentence}" está correta.
      Tradução do usuário: "${userTranslation}".
      Retorne "Correta" se a tradução estiver correta ou "Incorreta: [feedback]" se não estiver correta.
    `;

    try {
      const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: [],
      });

      const result = await chat.sendMessage(prompt);
      const responseText = result.response.text();

      let newFeedback = "";
      if (responseText.includes("Correta")) {
        newFeedback = "Muito bem! 🎉";
      } else if (responseText.includes("Incorreta")) {
        const feedbackText = responseText.replace("Incorreta:", "").trim();
        newFeedback = `Incorreto. ${feedbackText} ❌`;
      } else {
        newFeedback = "Could not determine the correctness of the translation.";
      }

      // Update node attributes with feedback and user translation
      updateAttributes({
        userTranslation,
        feedback: newFeedback,
      });

      setFeedback(newFeedback);
    } catch (error) {
      console.error("Error checking translation:", error);
      setFeedback("An error occurred while checking the translation.");
      updateAttributes({
        userTranslation,
        feedback: "An error occurred while checking the translation.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true); // Enable editing mode
  };

  const handleSave = () => {
    if (editedSentence.trim() !== originalSentence.trim()) {
      updateAttributes({
        originalSentence: editedSentence, // Update the sentence
      });
    }
    setIsEditing(false); // Exit editing mode
  };

  const handleCancel = () => {
    setEditedSentence(originalSentence); // Revert changes if canceled
    setIsEditing(false); // Exit editing mode
  };

  return (
    <NodeViewWrapper className="react-component">
      <div className="flex flex-col items-start w-full ml-3">
        <div className="flex flex-row my-4 items-start">
          <div className="flex flex-wrap gap-1">
            <p className="flex flex-row items-end gap-2">
              <strong>{sentenceNumber}. </strong>
              {isEditing ? (
                <Textarea
                  className="w-full pl-1"
                  value={editedSentence}
                  onChange={(e) => setEditedSentence(e.target.value)}
                  rows={1}
                />
              ) : (
                originalSentence
              )}{" "}
              -
            </p>
            <Input
              type="text"
              className="bg-transparent border-b-2 border-dotted outline-none pl-2"
              value={userTranslation}
              onChange={handleChange}
              placeholder="Escreva a tradução aqui"
            />
            <Button onClick={checkTranslation} variant="success" isLoading={isLoading} leftIcon={<CheckCheckIcon className="size-4" />}>
              Verificar
            </Button>
          </div>
        </div>

        {feedback && (
          <div className="flex flex-col justify-center items-center mb-2">
            <p
              className={`${
                feedback.includes("Muito bem")
                  ? "text-green-500"
                  : "text-red-500"
              } font-bold text-sm`}
            >
              {feedback}
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="my-2">
            {!isEditing ? (
              <Button onClick={handleEdit} variant="warning" size="sm">Editar</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} variant="success" size="sm">Salvar</Button>
                <Button onClick={handleCancel} variant="destructive" size="sm">Cancelar</Button>
              </div>
            )}
          </div>
        )}
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

TranslationComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      originalSentence: PropTypes.string.isRequired,
      sentenceNumber: PropTypes.number.isRequired,
      userTranslation: PropTypes.string,
      feedback: PropTypes.string,
    }).isRequired,
  }).isRequired,
  updateAttributes: PropTypes.func.isRequired,
};

export default TranslationComponent;
