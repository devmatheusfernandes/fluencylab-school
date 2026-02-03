import Image from "next/image";
import "../../placement/Placement.css";

// Images
import SabrinaSatoImage from "../../../public/images/badges/sabrinasato.png";
import NaboteImage from "../../../public/images/badges/nabote.png";
import AlcioneImage from "../../../public/images/badges/alcione.png";
import RicharlissonImage from "../../../public/images/badges/richarlisson.png";
import JoelSantanaImage from "../../../public/images/badges/joelsantana.png";
import NaldoBennyImage from "../../../public/images/badges/naldobenny.png";
import { useTranslations } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";

const badgesConfig = [
  {
    image: SabrinaSatoImage,
    className: "w-[5.3rem] h-[5.3rem] scale-125",
    link: "https://www.youtube.com/watch?v=VcRABt1HZVc",
  },
  {
    image: NaboteImage,
    className: "w-[5.04rem] h-[5.04rem] scale-125 relative left-[0.10rem]",
    link: "https://www.youtube.com/watch?v=2fgEx6g9aR8",
  },
  {
    image: AlcioneImage,
    className: "w-[5.04rem] h-[5.04rem] scale-125 relative bottom-[0.05rem]",
    link: "https://www.youtube.com/watch?v=PHLBaAryPoE",
  },
  {
    image: RicharlissonImage,
    className:
      "w-[5.025rem] h-[5.025rem] scale-125 relative top-[0.04rem] left-[0.04rem]",
    link: "https://www.youtube.com/watch?v=hEeKtJCj3hc",
  },
  {
    image: JoelSantanaImage,
    className:
      "w-[5rem] h-[5rem] scale-125 relative top-[0.05rem] left-[0.02rem]",
    link: "https://www.youtube.com/watch?v=iewQ45wJ7JA",
  },
  {
    image: NaldoBennyImage,
    className: "w-[5.1rem] h-[5.1rem] scale-125",
    link: "https://www.youtube.com/watch?v=VNyhdWhE67Q",
  },
];

export default function Badges({
  level,
}: {
  level: number;
  isLoading?: boolean;
}) {
  const t = useTranslations("Badges");

  // Garante que o nível esteja dentro dos limites do array
  const validLevel = Math.max(0, Math.min(level, badgesConfig.length - 1));
  const badgeConfig = badgesConfig[validLevel];

  const badgeName = t(`items.${validLevel}.name`);
  const badgeText = t(`items.${validLevel}.text`);
  const badgeExplanation = t(`items.${validLevel}.explanation`);
  const levelText = t(`levels.${validLevel}`);

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        id="background-body"
        className="bg-indigo-600 rounded-full w-[5.9rem] h-[5.9rem] flex items-center justify-center overflow-visible"
      >
        <Image
          src={badgeConfig.image}
          className={badgeConfig.className}
          width={300}
          height={300}
          priority
          alt="EnglishBadge"
        />
      </div>

      <Modal>
        <ModalTrigger asChild>
          <div className="cursor-pointer font-bold mt-2 duration-300 ease-in-out transition-all hover:text-primary">
            {badgeName}
          </div>
        </ModalTrigger>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>{t("modalTitle")}</ModalTitle>
          </ModalHeader>

          <div className="flex flex-col items-center justify-center p-4">
            <div
              id="background-body"
              className="bg-indigo-600 rounded-full w-[5.9rem] h-[5.9rem] flex items-center justify-center overflow-visible"
            >
              <Image
                src={badgeConfig.image}
                className={badgeConfig.className}
                width={300}
                height={300}
                priority
                alt="EnglishBadge"
              />
            </div>
            <div className="flex flex-col items-center w-full p-2">
              <p className="mb-4 text-indigo-600">
                <strong>{levelText}</strong>
              </p>
              {badgeExplanation && (
                <p className="mb-4 text-center">{badgeExplanation}</p>
              )}
            </div>
          </div>
        </ModalContent>
      </Modal>

      <a
        href={badgeConfig.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm duration-300 ease-in-out transition-all hover:text-primary"
      >
        {badgeText}
      </a>
    </div>
  );
}
