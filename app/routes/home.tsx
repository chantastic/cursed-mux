import type { Route } from "./+types/home";
import MuxPlayer from "@mux/mux-player-react/lazy";
import * as React from "react";
import { useDisplayCoverage } from "~/modules/use-display-coverage";
import Player from "~/modules/player";
import { useQueuedAttention } from "~/modules/use-queued-attention";
import { useFaceLandmarks, CameraDebugPanel } from "~/modules/use-face-landmarks";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}


export default function Home() {
  const player = React.useRef<HTMLVideoElement>(null);
  const playerContainer = React.useRef<HTMLDivElement>(null);
  const { isWatching, cameraStatus, lastError, permissionStatus, faceDetectionStatus, lastDetectionTime, eyeStatus, attentiveness, videoRef } = useFaceLandmarks();
  const displayCoverage = useDisplayCoverage(playerContainer as React.RefObject<HTMLDivElement>);
  const [queuedAttention, setQueuedAttention] = useQueuedAttention();

  return (
    <>
      <div>
        <CameraDebugPanel
          isWatching={isWatching}
          cameraStatus={cameraStatus}
          lastError={lastError}
          permissionStatus={permissionStatus}
          faceDetectionStatus={faceDetectionStatus}
          lastDetectionTime={lastDetectionTime}
          eyeStatus={eyeStatus}
          attentiveness={attentiveness}
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
        />

        <div
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            padding: "10px",
            zIndex: 1,
          }}
        >
          <div>Display Coverage: {displayCoverage}%</div>
          <div>
            Attention:{" "}
            {typeof queuedAttention === "number" ? queuedAttention : 0}
          </div>
          <div>
            <button
              onClick={() =>
                typeof setQueuedAttention === "function" && setQueuedAttention()
              }
            >
              Buffer some attention
            </button>
          </div>
        </div>
        <div ref={playerContainer}>
          <MuxPlayer
            ref={player as any}
            loading="viewport"
            playbackId="IxGIC02VBBqLex7Za5eLEeFgXPkFR3fJczGp3GBvN7Vw"
          />
        </div>
        <Player />
      </div>
    </>
  );
}
