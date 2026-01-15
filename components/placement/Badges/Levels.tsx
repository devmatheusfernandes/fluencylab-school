import Image from "next/image";

// Importando as imagens
import SabrinaSatoImage from "../../../public/images/badges/sabrinasato.png";
import NaboteImage from "../../../public/images/badges/nabote.png";
import AlcioneImage from "../../../public/images/badges/alcione.png";
import RicharlissonImage from "../../../public/images/badges/richarlisson.png";
import JoelSantanaImage from "../../../public/images/badges/joelsantana.png";
import NaldoBennyImage from "../../../public/images/badges/naldobenny.png";
import { EyeClosed } from "lucide-react";

export const badgesData = [
  {
    name: "Sabrina Sato",
    image: SabrinaSatoImage,
    level: "A1 - Iniciante",
    link: "https://www.youtube.com/watch?v=VcRABt1HZVc",
    text: "Oi, Justchin! 🤸🏿",
    explanation:
      "Compreende e usa expressões básicas e frases simples para necessidades cotidianas. Consegue cumprimentar e entender as palavras mais principiantes.",
  },
  {
    name: "Nabote",
    image: NaboteImage,
    level: "A2 - Básico",
    link: "https://www.youtube.com/watch?v=2fgEx6g9aR8",
    text: "I not alcohol 🥛",
    explanation:
      "Entende frases curtas e informações simples, como apresentações e pedidos básicos. Não passa mais fome, consegue pedir uma água, comida e até falar a religião.",
  },
  {
    name: "Alcione",
    image: AlcioneImage,
    level: "B1 - Intermediário",
    link: "https://www.youtube.com/watch?v=PHLBaAryPoE",
    text: "Sometaimes is djustin love 💔",
    explanation:
      "Consegue compreender o essencial de diálogos e textos sobre assuntos conhecidos, permitindo a comunicação em situações rotineiras. Pode te dar confiança o suficiente para cantar as músicas mais difíceis.",
  },
  {
    name: "Richarlisson",
    image: RicharlissonImage,
    level: "B2 - Intermediário avançado",
    link: "https://www.youtube.com/watch?v=hEeKtJCj3hc",
    text: "I speak inglish mai friend 💅",
    explanation:
      "Entende ideias principais de textos complexos e se comunica com mais fluência e clareza, mesmo em contextos variados. Até nas entrevistas e momentos de pressão consegue conversar em inglês, meu amigo.",
  },
  {
    name: "Joel Santana",
    image: JoelSantanaImage,
    level: "C1 - Avançado",
    link: "https://www.youtube.com/watch?v=iewQ45wJ7JA",
    text: "Controu the métchi ⚽",
    explanation:
      "Compreende textos longos e exigentes, captando nuances e se expressa de forma fluente e espontânea. Uma pessoa nesse nível já consegue até ensinar e treinar outros para falar inglês.",
  },
  {
    name: "Naldo Benny",
    image: NaldoBennyImage,
    level: "C2 - Proficiente",
    link: "https://www.youtube.com/watch?v=VNyhdWhE67Q",
    text: "Fã do Chris Brownie 🍪",
    explanation:
      "Domina o idioma de forma quase nativa, entendendo e se comunicando com precisão em qualquer situação. Consegue falar do seu melhor amigo, consegue cantar músicas rápidas e falar de forma natural.",
  },
];

interface LevelsProps {
  onClose: () => void;
}

export function Levels({ onClose }: LevelsProps) {
  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-65 flex justify-center items-center z-50">
      <div className="relative text-text-light dark:text-text-dark bg-pages-light dark:bg-pages-dark rounded-lg w-[90%] lg:w-[70%] max-h-[90vh] overflow-y-auto shadow-xl p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <EyeClosed className="w-6 h-6" />
        </button>

        {/* Title & Description */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            Fluency Níveis - Método Alternativo 😂
          </h1>
          <p className="mb-6 text-center max-w-2xl mx-auto">
            Uma maneira divertida de entender seu nível de inglês! Aqui estão
            todos os níveis explicados de forma simples e engraçada.
            <br /> Conforme você faz os testes, sua pontuação vai atualizando e
            seu nível vai sendo definido até o último teste ser feito.
          </p>
        </div>

        {/* Badges List */}
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
          {badgesData.map((badge, index) => (
            <div
              key={index}
              className="p-4 border rounded-xl lg:flex lg:flex-row md:flex md:flex-col flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-bg-dark"
            >
              <div className="border-4 bg-white rounded-full">
                <Image
                  src={badge.image}
                  alt={badge.name}
                  width={100}
                  height={100}
                  className="bg-cover scale-125"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {badge.name} - {badge.level}
                </h2>
                <p className="text-gray-500 dark:text-gray-300 text-sm mb-2">
                  {badge.text}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {badge.explanation}
                </p>
                <a
                  href={badge.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 underline block"
                >
                  Ver em ação 🔗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
