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

  return <cursed-player />;
}
