import { useState, useEffect } from "react";

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Handle the case where the SW controls the page
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);

          // If there is already a waiting worker, we can update
          if (reg.waiting) {
            setNeedRefresh(true);
          }

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                // When the new worker is installed and there is already a controller,
                // it means there is an update waiting.
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setNeedRefresh(true);
                }
              });
            }
          });
        }
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      // Send message to skip waiting
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      
      // Reload the page when the new service worker takes control
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  };

  return { needRefresh, updateServiceWorker };
}
