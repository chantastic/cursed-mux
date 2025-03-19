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
  const [state, dispatch] = useReducer(playerReducer, initialState);

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

  return (
    <>
      <MuxPlayer
        ref={player}
        loading="viewport"
        playbackId="IxGIC02VBBqLex7Za5eLEeFgXPkFR3fJczGp3GBvN7Vw"
      />
      <button onClick={() => dispatch({ type: "add_second_of_play" })}>Add seconds of play</button>
      <div>Seconds remaining: {state.secondsOfPlay}</div>
    </>
  );
}
