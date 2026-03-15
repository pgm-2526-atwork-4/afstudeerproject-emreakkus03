import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { AppState, AppStateStatus } from "react-native";

interface RealtimeContextType {
  lastUpdate: number;
  triggerUpdate: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  lastUpdate: Date.now(),
  triggerUpdate: () => {},
});

export const RealtimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const appStateRef = useRef<AppStateStatus>("active");

  const triggerUpdate = () => {
    console.log("🔄 Handmatige refresh getriggerd...");
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only poll when the app is active
      if (appStateRef.current === "active") {
        setLastUpdate(Date.now());
      }
    }, 5000);

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          console.log("📱 App back in focus! Refreshing immediately...");
          triggerUpdate();
        }
        appStateRef.current = nextAppState;
      },
    );

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ lastUpdate, triggerUpdate}}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);