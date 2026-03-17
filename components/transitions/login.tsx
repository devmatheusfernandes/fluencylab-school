import { useState, useEffect } from "react";
import "./animation.css";

const sentences = [
  "Procurando seus cadernos.",
  "Reunindo os melhores materiais.",
  "Carregando os jogos para praticar.",
  "Preparando área de estudo.",
  "Prepare-se para aprimorar suas habilidades de comunicação!",
  "Divirta-se e boa aprendizagem!",
  "Sua jornada começa aqui!",
  "Divirta-se e boa aprendizagem!",
];

const TransitionAnimation = () => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const fadeOutTimeout = setTimeout(() => setFade(false), 2500);
    const fadeInTimeout = setTimeout(() => {
      setCurrentSentenceIndex(
        (prevIndex) => (prevIndex + 1) % sentences.length
      );
      setFade(true);
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimeout);
      clearTimeout(fadeInTimeout);
    };
  }, [currentSentenceIndex]);

  return (
    <div className="fixed fade-in fade-out top-0 left-0 w-screen h-screen bg-background z-50">
      <div className="min-h-screen flex flex-col items-center justify-around">
        <video
          className="lg:w-[10%] md:w-[25%] w-[50%] min-h-screen"
          controls={false}
          loop
          autoPlay
        >
          <source
            src="https://firebasestorage.googleapis.com/v0/b/fluencylab-webapp.appspot.com/o/Animations%2FFluencyLab_Final.webm?alt=media&token=870b22b3-0a99-4301-b736-f1c6ad30bab5"
            type="video/webm"
          />
        </video>

        <div
          className={`text-container-animation ${fade ? "fade-in" : "fade-out"}`}
        >
          <p className="font-medium text-black dark:text-white ">
            {sentences[currentSentenceIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransitionAnimation;
