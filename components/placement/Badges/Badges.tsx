import React, { useState } from "react";
import Image from "next/image";
import "../../placement/Placement.css";

// Images
import SabrinaSatoImage from "../../../public/images/badges/sabrinasato.png";
import NaboteImage from "../../../public/images/badges/nabote.png";
import AlcioneImage from "../../../public/images/badges/alcione.png";
import RicharlissonImage from "../../../public/images/badges/richarlisson.png";
import JoelSantanaImage from "../../../public/images/badges/joelsantana.png";
import NaldoBennyImage from "../../../public/images/badges/naldobenny.png";
import { Spinner } from "@/components/ui/spinner";
import { EyeClosed } from "lucide-react";

const badgesData = [
  {
    name: "Sabrina Sato",
    image: SabrinaSatoImage,
    className: "w-[5.3rem] h-[5.3rem] scale-125",
    link: "https://www.youtube.com/watch?v=VcRABt1HZVc",
    text: "Oi, Justchin! 🤸🏿",
    explanation:
      "Compreende e usa expressões básicas e frases simples para necessidades cotidianas. Consegue cumprimentar e entender as palavras mais principiantes.",
  },
  {
    name: "Nabote",
    image: NaboteImage,
    className: "w-[5.04rem] h-[5.04rem] scale-125 relative left-[0.10rem]",
    link: "https://www.youtube.com/watch?v=2fgEx6g9aR8",
    text: "I not alcohol 🥛",
    explanation:
      "Entende frases curtas e informações simples, como apresentações e pedidos básicos. Não passa mais fome, consegue pedir uma água, comida e até falar a religião.",
  },
  {
    name: "Alcione",
    image: AlcioneImage,
    className: "w-[5.04rem] h-[5.04rem] scale-125 relative bottom-[0.05rem]",
    link: "https://www.youtube.com/watch?v=PHLBaAryPoE",
    text: "Sometaimes is djustin love 💔",
    explanation:
      "Consegue compreender o essencial de diálogos e textos sobre assuntos conhecidos, permitindo a comunicação em situações rotineiras. Pode te dar confiança o suficiente para cantar as músicas mais difíceis.",
  },
  {
    name: "Richarlisson",
    image: RicharlissonImage,
    className:
      "w-[5.025rem] h-[5.025rem] scale-125 relative top-[0.04rem] left-[0.04rem]",
    link: "https://www.youtube.com/watch?v=hEeKtJCj3hc",
    text: "I speak inglish mai friend 💅",
    explanation:
      "Entende ideias principais de textos complexos e se comunica com mais fluência e clareza, mesmo em contextos variados. Até nas entrevistas e momentos de pressão consegue conversar em inglês, meu amigo.",
  },
  {
    name: "Joel Santana",
    image: JoelSantanaImage,
    className:
      "w-[5rem] h-[5rem] scale-125 relative top-[0.05rem] left-[0.02rem]",
    link: "https://www.youtube.com/watch?v=iewQ45wJ7JA",
    text: "Controu the métchi ⚽",
    explanation:
      "Compreende textos longos e exigentes, captando nuances e se expressa de forma fluente e espontânea. Uma pessoa nesse nível já consegue até ensinar e treinar outros para falar inglês.",
  },
  {
    name: "Naldo Benny",
    image: NaldoBennyImage,
    className: "w-[5.1rem] h-[5.1rem] scale-125",
    link: "https://www.youtube.com/watch?v=VNyhdWhE67Q",
    text: "Fã do Chris Brownie 🍪",
    explanation:
      "Domina o idioma de forma quase nativa, entendendo e se comunicando com precisão em qualquer situação. Consegue falar do seu melhor amigo, consegue cantar músicas rápidas e falar de forma natural.",
  },
];

export default function Badges({
  level,
  isLoading = false,
}: {
  level: number;
  isLoading?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  // Garante que o nível esteja dentro dos limites do array
  const validLevel = Math.max(0, Math.min(level, badgesData.length - 1));
  const badge = badgesData[validLevel];

  // Mapeamento dos níveis CEFR
  const cerfLevels = [
    "A1 - Iniciante",
    "A2 - Básico",
    "B1 - Intermediário",
    "B2 - Intermediário avançado",
    "C1 - Avançado",
    "C2 - Proficiente",
  ];

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        id="background-body"
        className="bg-indigo-600 rounded-full w-[5.9rem] h-[5.9rem] flex items-center justify-center overflow-visible"
      >
        <Image
          src={badge.image}
          className={badge.className}
          width={300}
          height={300}
          priority
          alt="EnglishBadge"
        />
      </div>
      {/* Nome clicável */}
      <div
        className="cursor-pointer font-bold mt-2 duration-300 ease-in-out transition-all hover:text-indigo-500"
        onClick={openModal}
      >
        {badge.name}
      </div>
      <a
        href={badge.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm duration-300 ease-in-out transition-all hover:text-indigo-600"
      >
        {badge.text}
      </a>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div
            onClick={(e) => e.stopPropagation()}
            className="text-text-light dark:text-text-dark bg-pages-light dark:bg-pages-dark rounded-lg lg:w-[50%] md:w-[90vw] w-[85vw] h-[85vh] overflow-hidden"
          >
            <div className="flex justify-between items-center py-3 px-6 bg-gray-100 dark:bg-gray-800">
              <p className="text-xl font-semibold">
                Sobre seu nível de domínio
              </p>
              <EyeClosed
                onClick={closeModal}
                className="text-indigo-500 hover:text-indigo-600 cursor-pointer w-7 h-7 ease-in-out duration-300"
              />
            </div>

            <div className="flex flex-col items-center justify-center p-4">
              <div
                id="background-body"
                className="bg-indigo-600 rounded-full w-[5.9rem] h-[5.9rem] flex items-center justify-center overflow-visible"
              >
                <Image
                  src={badge.image}
                  className={badge.className}
                  width={300}
                  height={300}
                  priority
                  alt="EnglishBadge"
                />
              </div>
              <div className="flex flex-col items-center w-full p-2">
                <p className="mb-4 text-indigo-600">
                  <strong>{cerfLevels[validLevel]}</strong>
                </p>
                {badge.explanation && (
                  <p className="mb-4 w-[70%]">{badge.explanation}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
