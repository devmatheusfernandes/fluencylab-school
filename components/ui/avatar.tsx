"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { twMerge } from "tailwind-merge";

// --- Utility function to extract initials from a name ---
function getInitials(name: string | undefined | null): string {
  if (!name) return "?";

  const cleanedName = name.trim();
  if (!cleanedName) return "?";

  const words = cleanedName.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

import { getFallbackImages } from "@/actions/get-fallback-images";

// Lista inicial vazia - será populada dinamicamente via Server Action
let globalFallbackImages: string[] = [];

// Cache simples para evitar requests múltiplos
let isFetched = false;
let fetchPromise: Promise<string[]> | null = null;

// Definição única de tamanhos para evitar inconsistências
type SizeVariant = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<SizeVariant, string> = {
  xs: "h-6 w-6 sm:h-8 sm:w-8",
  sm: "h-8 w-8 sm:h-10 sm:w-10",
  // Ajustei h-17 para h-16 (padrão Tailwind), se precisar de 17 use h-[68px]
  md: "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16",
  lg: "h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20",
  xl: "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24",
  "2xl": "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32",
};

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    status?: "online" | "offline";
    size?: SizeVariant;
  }
>(({ className, status, size = "md", children, ...props }, ref) => {
  const statusSizeClasses = {
    xs: "h-1.5 w-1.5 sm:h-2 sm:w-2 bottom-0 right-0 border-1",
    sm: "h-2 w-2 sm:h-2.5 sm:w-2.5 bottom-0.5 right-0.5 border-1",
    md: "h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 border-2",
    lg: "h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 bottom-1 right-1 border-2",
    xl: "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 border-2",
    "2xl":
      "h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 border-2 sm:border-3",
  };

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={twMerge(
        "relative flex shrink-0 overflow-hidden rounded-2xl transition-all duration-200",
        sizeClasses[size], // O tamanho é definido APENAS aqui
        className,
      )}
      {...props}
    >
      {/* Passamos o contexto de tamanho para os filhos via cloneElement se necessário, 
        mas aqui simplifiquei para usar CSS inheritance (h-full w-full) 
      */}
      {children}

      {status && (
        <span
          className={twMerge(
            "absolute block rounded-full border-background ring-1 ring-background",
            statusSizeClasses[size],
            status === "online" && "bg-green-500",
            status === "offline" && "bg-subtitle",
          )}
          aria-label={status === "online" ? "Online" : "Offline"}
        />
      )}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

// --- Styled Image with Loading State ---
const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = React.useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (!props.src || hasError) {
    return null;
  }

  return (
    <>
      <AvatarPrimitive.Image
        ref={ref}
        className={twMerge(
          "aspect-square h-full w-full object-cover rounded-2xl", // h-full w-full preenche o Root
          className,
          isLoading && "hidden",
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {isLoading && (
        <div
          className={twMerge(
            "absolute inset-0 flex items-center justify-center rounded-2xl bg-container/80 h-full w-full",
          )}
        >
          {/* Spinner genérico que se adapta ao tamanho */}
          <div className="h-[40%] w-[40%] animate-spin rounded-full border-2 border-subtitle border-t-transparent" />
        </div>
      )}
    </>
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// --- Styled Fallback ---
const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    name?: string;
  }
>(({ className, name, children, ...props }, ref) => {
  const [images, setImages] = React.useState(globalFallbackImages);

  React.useEffect(() => {
    if (isFetched) {
      if (images !== globalFallbackImages) setImages(globalFallbackImages);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = getFallbackImages().then((fetchedImages) => {
        if (fetchedImages && fetchedImages.length > 0) {
          globalFallbackImages = fetchedImages;
          isFetched = true;
        }
        return globalFallbackImages;
      });
    }

    fetchPromise.then((finalImages) => {
      if (finalImages !== images) {
        setImages(finalImages);
      }
    });
  }, []);

  const fallbackImageSrc = React.useMemo(() => {
    if (children) return null;
    if (images.length === 0) return null;

    let hash = 0;
    const stringToHash = name || "default";
    for (let i = 0; i < stringToHash.length; i++) {
      hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % images.length;
    return images[index];
  }, [name, children, images]);

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={twMerge(
        "flex h-full w-full items-center justify-center rounded-2xl bg-foreground/10 text-white border-2 border-foreground/10 font-semibold overflow-hidden", // h-full w-full aqui também
        className,
      )}
      {...props}
    >
      {children ? (
        children
      ) : fallbackImageSrc ? (
        <img
          src={fallbackImageSrc}
          alt={name || "Avatar fallback"}
          className="h-full w-full object-cover"
        />
      ) : (
        /* Estado vazio/carregando ou sem imagens disponíveis: mostra iniciais se houver nome, ou nada */
        <span className="text-muted-foreground">
          {name ? getInitials(name) : "?"}
        </span>
      )}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback, getInitials };
