import type { Route } from "./+types/home";
import MuxPlayer from "@mux/mux-player-react/lazy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <MuxPlayer
    loading="viewport"
    playbackId="DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
    metadata={{
      video_id: "video-id-123456",
      video_title: "Bick Buck Bunny",
      viewer_user_id: "user-id-bc-789",
    }}
  />;
}
