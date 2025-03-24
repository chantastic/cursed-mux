import * as React from "react";

export function useDisplayCoverage(playerRef: React.RefObject<HTMLDivElement>) {
  const [size, setSize] = React.useState(0);

  React.useEffect(() => {
    if (!playerRef.current) return;

    const calculateSize = () => {
      const player = playerRef.current;
      if (!player) return;

      const playerRect = player.getBoundingClientRect();
      const logicalWidth = playerRect.width;
      const logicalHeight = playerRect.height;

      const screenWidth = window.screen.availWidth;
      const screenHeight = window.screen.availHeight;

      const screenWidthPercentage = (logicalWidth / screenWidth) * 100;
      const screenHeightPercentage = (logicalHeight / screenHeight) * 100;
      const screenPercentage = Math.max(
        screenWidthPercentage,
        screenHeightPercentage
      );
      setSize(Math.round(screenPercentage));
    };

    calculateSize();

    window.addEventListener("resize", calculateSize);

    return () => window.removeEventListener("resize", calculateSize);
  }, [playerRef]);

  return size;
}
