import * as React from 'react';

// interface PlayerSize {
//   width: number;
//   height: number;
//   aspectRatio: number;
//   windowPercentage: number;
//   screenPercentage: number;
//   physicalWidth: number;
//   physicalHeight: number;
//   devicePixelRatio: number;
// }

export function useDisplayCoverage(playerRef: React.RefObject<HTMLDivElement>): PlayerSize {
  const [size, setSize] = React.useState<Number>(0)
  // const [size, setSize] = useState<PlayerSize>({
  //   width: 0,
  //   height: 0,
  //   aspectRatio: 0,
  //   windowPercentage: 0,
  //   screenPercentage: 0,
  //   physicalWidth: 0,
  //   physicalHeight: 0,
  //   devicePixelRatio: 1
  // });

  React.useEffect(() => {
    if (!playerRef.current) return;

    const calculateSize = () => {
      const player = playerRef.current;
      if (!player) return;

      const playerRect = player.getBoundingClientRect();
      // const dpr = window.devicePixelRatio || 1;
      
      // Get the physical dimensions (accounting for DPR)
      // const physicalWidth = playerRect.width * dpr;
      // const physicalHeight = playerRect.height * dpr;
      
      // Get the logical dimensions (what we see on screen)
      const logicalWidth = playerRect.width;
      const logicalHeight = playerRect.height;
      
      // Get window dimensions
      // const windowWidth = window.innerWidth;
      // const windowHeight = window.innerHeight;

      // Get screen dimensions
      const screenWidth = window.screen.availWidth;
      const screenHeight = window.screen.availHeight;

      // Calculate window-relative percentage
      // const windowWidthPercentage = (logicalWidth / windowWidth) * 100;
      // const windowHeightPercentage = (logicalHeight / windowHeight) * 100;
      // const windowPercentage = Math.max(windowWidthPercentage, windowHeightPercentage);

      // Calculate screen-relative percentage
      const screenWidthPercentage = (logicalWidth / screenWidth) * 100;
      const screenHeightPercentage = (logicalHeight / screenHeight) * 100;
      const screenPercentage = Math.max(screenWidthPercentage, screenHeightPercentage);

      // setSize({
      //   width: logicalWidth,
      //   height: logicalHeight,
      //   aspectRatio: logicalWidth / logicalHeight,
      //   windowPercentage: Math.round(windowPercentage),
      //   screenPercentage: Math.round(screenPercentage),
      //   physicalWidth,
      //   physicalHeight,
      //   devicePixelRatio: dpr
      // });
      setSize(Math.round(screenPercentage))
    };

    // Initial calculation
    calculateSize();
    
    // TODO: add debounce

    // Recalculate on window resize
    window.addEventListener('resize', calculateSize);

    // Cleanup
    return () => window.removeEventListener('resize', calculateSize);
  }, [playerRef]);

  return size;
} 