import type { Route } from "./+types/home";
import { useEffect } from "react";
import { registerCursedPlayer } from "../cursed-player";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  useEffect(() => {
    registerCursedPlayer();
  }, []);

  return <cursed-player src="https://stream.mux.com/A3VXy02VoUinw01pwyomEO3bHnG4P32xzV7u1j1FSzjNg/low.mp4"
></cursed-player>;
}
