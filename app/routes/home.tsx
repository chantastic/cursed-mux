import type { Route } from "./+types/home";
import MuxPlayer from "@mux/mux-player-react/lazy";
import { useEffect, useReducer, useRef } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

function playerReducer(state: any, action: any) {
  switch (action.type) {
    case "toggle_play":
      return { ...state, isPlaying: !state.isPlaying };
  }
}

const initialState = {
  isPlaying: false,
};

export default function Home() {
  const player = useRef<any>(null);

  const [state, dispatch] = useReducer(playerReducer, initialState);

  useEffect(() => {
    if (!player.current) return;
    
    if (state.isPlaying) {
      player.current.play();
    } else {
      player.current.pause();
    }
  }, [state.isPlaying]);

  return (
    <>
      <MuxPlayer
        ref={player}
        loading="viewport"
        playbackId="IxGIC02VBBqLex7Za5eLEeFgXPkFR3fJczGp3GBvN7Vw"
      />
      <button onClick={() => dispatch({ type: "toggle_play" })}>
        {state.isPlaying ? "Pause" : "Play"}
      </button>
    </>
  );
}
