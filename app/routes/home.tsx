import type { Route } from "./+types/home";
import MuxPlayer from "@mux/mux-player-react/lazy";
import { useEffect, useReducer, useRef } from "react";
import { useDisplayCoverage } from "~/modules/use-display-coverage";
import Player from "~/modules/player";
import { useQueuedAttention } from "~/modules/use-queued-attention";
import { useFaceLandmarks } from "~/modules/use-face-landmarks";

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
  const { isWatching, cameraStatus, lastError, permissionStatus, faceDetectionStatus, lastDetectionTime, eyeStatus, attentiveness, videoRef } = useFaceLandmarks();

  // Use the new usePlayerSize hook
  const displayCoverage = useDisplayCoverage(playerContainer as React.RefObject<HTMLDivElement>);

  // use setAttention to draw down attention when none is detected
  const [queuedAttention, setQueuedAttention] = useQueuedAttention();

  // Modify video playback to consider face detection
  useEffect(() => {
    if (!player.current) return;

    if (state.secondsOfPlay > 0 && isWatching) {
      player.current.play();
    } else {
      player.current.pause();
    }
  }, [state.secondsOfPlay, isWatching]);

  return (
    <>
      <div>
        {/* Debug panel */}
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            width: "320px",
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            zIndex: 1000,
          }}
        >
          <h3>Camera Debug Panel</h3>
          <div>Status: {cameraStatus}</div>
          <div>Permission: {permissionStatus}</div>
          <div>Detection Status: {faceDetectionStatus}</div>
          <div>
            Last Detection: {lastDetectionTime?.toLocaleTimeString() || "Never"}
          </div>
          <div>Eye Status: {eyeStatus}</div>
          <div>
            Attentiveness:
            <div
              style={{
                width: "100%",
                height: "20px",
                backgroundColor: "#f0f0f0",
                borderRadius: "10px",
                overflow: "hidden",
                marginTop: "5px",
              }}
            >
              <div
                style={{
                  width: `${attentiveness}%`,
                  height: "100%",
                  backgroundColor: `hsl(${attentiveness}, 70%, 50%)`,
                  transition: "all 0.3s",
                }}
              />
            </div>
            {attentiveness}%
          </div>
          {lastError && (
            <div
              style={{
                color: "red",
                padding: "10px",
                margin: "10px 0",
                backgroundColor: "#fff0f0",
                borderRadius: "4px",
              }}
            >
              {lastError}
              {!window.location.protocol.includes("https") &&
                !window.location.hostname.includes("localhost") && (
                  <div style={{ marginTop: "10px" }}>
                    To fix this:
                    <ul>
                      <li>Use HTTPS instead of HTTP, or</li>
                      <li>Use localhost for development</li>
                    </ul>
                  </div>
                )}
            </div>
          )}
          <div
            style={{
              padding: "10px",
              backgroundColor: isWatching ? "#e6ffe6" : "#ffe6e6",
              borderRadius: "4px",
              marginTop: "10px",
            }}
          >
            Face Detection:{" "}
            {isWatching ? "Face Detected ✅" : "No Face Detected ❌"}
          </div>
          <video 
            ref={videoRef}
            style={{ 
              width: '100%',
              transform: 'scaleX(-1)',
              border: '1px solid #ccc',
              marginTop: '10px'
            }}
            width="640"
            height="480"
            autoPlay
            playsInline
          />
        </div>

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
            ref={player}
            loading="viewport"
            playbackId="IxGIC02VBBqLex7Za5eLEeFgXPkFR3fJczGp3GBvN7Vw"
          />
        </div>
        <Player />
        <button onClick={() => dispatch({ type: "add_second_of_play" })}>
          Add seconds of play
        </button>
        <div>Seconds remaining: {state.secondsOfPlay}</div>
      </div>
    </>
  );
}
