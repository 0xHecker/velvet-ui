import { useEffect, useState } from "react";
import { Sheet } from "../../velvet/index.js";
import "./Toast.css";

export const Toast = () => {
  const [presented, setPresented] = useState(false);
  useEffect(() => {
    if (!presented) return;
    const t = setTimeout(() => setPresented(false), 4000);
    return () => clearTimeout(t);
  }, [presented]);

  return (
    <Sheet.Root open={presented} onOpenChange={setPresented}>
      <Sheet.Trigger className="Btn">Show Toast</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.View className="Toast-view" modal={false}>
          <Sheet.Content className="Toast-content">
            <Sheet.BleedingBackground className="Toast-bg" />
            <span className="Toast-dot" aria-hidden />
            <div className="Toast-text">
              <Sheet.Title className="Toast-title">Saved to your library</Sheet.Title>
              <Sheet.Description className="Toast-desc">Synced across your devices.</Sheet.Description>
            </div>
            <Sheet.Trigger action="close" className="Toast-action">Done</Sheet.Trigger>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
};
