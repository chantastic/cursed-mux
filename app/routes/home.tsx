import type { Route } from "./+types/home";
import MuxPlayer from "@mux/mux-player-react/lazy";
import { useEffect, useReducer, useRef, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

function playerReducer(state: any, action: any) {
  switch (action.type) {
    case "add_second_of_play":
      return { ...state, secondsOfPlay: state.secondsOfPlay + 1 };
    case "decrease_second_of_play":
      return { ...state, secondsOfPlay: Math.max(0, state.secondsOfPlay - 1) };
    default:
      return state;
  }
}

const initialState = {
  secondsOfPlay: 0,
};

export default function Home() {
  const player = useRef<any>(null);
  const playerContainer = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const [viewportPercentage, setViewportPercentage] = useState(100);

  // Track scroll position
  useEffect(() => {
    if (!playerContainer.current) return;

    const handleScroll = () => {
      const container = playerContainer.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // When top is 0, we're at the top of viewport (100%)
      // When top is windowHeight, we're at the bottom of viewport (0%)
      const percentage = Math.max(0, Math.min(100, 
        (1 - (containerRect.top / windowHeight)) * 100
      ));
      
      setViewportPercentage(Math.round(percentage));
    };

    window.addEventListener('scroll', handleScroll);
    // Initial calculation
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Timer effect to decrease seconds of play
  useEffect(() => {
    if (state.secondsOfPlay > 0) {
      const timer = setInterval(() => {
        dispatch({ type: "decrease_second_of_play" });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.secondsOfPlay]);

  // Control video playback based on seconds of play
  useEffect(() => {
    if (!player.current) return;

    if (state.secondsOfPlay > 0) {
      player.current.play();
    } else {
      player.current.pause();
    }
  }, [state.secondsOfPlay]);

  // Update volume based on viewport position
  useEffect(() => {
    if (!player.current) return;
    player.current.volume = viewportPercentage / 100;
  }, [viewportPercentage]);

  return (
    <>
      <div ref={playerContainer} style={{ margin: "800px 0" }}>
        <div style={{ position: "sticky", top: 0, backgroundColor: "white", padding: "10px", zIndex: 1 }}>
          Viewport Position: {viewportPercentage}%
        </div>
        <MuxPlayer
          ref={player}
          loading="viewport"
          playbackId="IxGIC02VBBqLex7Za5eLEeFgXPkFR3fJczGp3GBvN7Vw"
        />
        <button onClick={() => dispatch({ type: "add_second_of_play" })}>
          Add seconds of play
        </button>
        <div>Seconds remaining: {state.secondsOfPlay}</div>
      </div>
    </>
  );
}
