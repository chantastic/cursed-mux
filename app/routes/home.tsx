import type { Route } from "./+types/home";
import MuxPlayer from "@mux/mux-player-react/lazy";
import { useEffect, useReducer, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as faceDetection from "@tensorflow-models/face-detection";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { useDisplayCoverage } from "~/modules/use-display-coverage";
import Player from "~/modules/player";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const [viewportPercentage, setViewportPercentage] = useState(100);
  const [isWatching, setIsWatching] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<
    "initializing" | "ready" | "error"
  >("initializing");
  const [lastError, setLastError] = useState<string>("");
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [faceDetectionStatus, setFaceDetectionStatus] = useState("Not started");
  const [lastDetectionTime, setLastDetectionTime] = useState<Date | null>(null);
  const [eyeStatus, setEyeStatus] = useState<"open" | "closed" | "unknown">(
    "unknown"
  );
  const [attentiveness, setAttentiveness] = useState(100);

  // Use the new usePlayerSize hook
  const displayCoverage = useDisplayCoverage(playerContainer);

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
      const percentage = Math.max(
        0,
        Math.min(100, (1 - containerRect.top / windowHeight) * 100)
      );

      setViewportPercentage(Math.round(percentage));
    };

    window.addEventListener("scroll", handleScroll);
    // Initial calculation
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
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

  // Add permission check function
  const checkAndRequestPermission = async () => {
    try {
      // First check if we're on HTTPS or localhost
      if (
        !window.location.protocol.includes("https") &&
        !window.location.hostname.includes("localhost")
      ) {
        setLastError(
          "Camera access requires HTTPS. Please use a secure connection."
        );
        setCameraStatus("error");
        return false;
      }

      // Check if permissions API is supported
      if (!navigator.permissions || !navigator.mediaDevices) {
        setLastError("Your browser does not support camera access.");
        setCameraStatus("error");
        return false;
      }

      // Check current permission status
      const permission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      setPermissionStatus(permission.state);

      if (permission.state === "denied") {
        setLastError(
          "Camera permission was denied. Please reset permissions and reload."
        );
        setCameraStatus("error");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Permission check error:", error);
      setLastError("Failed to check camera permissions");
      setCameraStatus("error");
      return false;
    }
  };

  // Replace the calculateEAR function with this new eye detection approach
  const checkEyesOpen = (landmarks: any) => {
    try {
      // Log the entire landmarks object to see its structure
      // console.log('Full landmarks:', landmarks);

      // Get eye landmarks (these are the indices for left and right eyes in MediaPipe Face Mesh)
      const leftEye = landmarks.leftEye || landmarks[33] || landmarks[159];
      const rightEye = landmarks.rightEye || landmarks[263] || landmarks[386];

      // Log the eye landmarks
      console.log("Eye landmarks:", {
        leftEye: leftEye ? "detected" : "not detected",
        rightEye: rightEye ? "detected" : "not detected",
      });

      // If we can detect both eyes, consider them open
      const eyesDetected = leftEye && rightEye;

      return eyesDetected;
    } catch (error) {
      console.error("Eye detection error:", error);
      return false;
    }
  };

  // Modify the face detection setup
  useEffect(() => {
    let detector: faceLandmarksDetection.FaceLandmarksDetector;
    let stream: MediaStream;
    let animationFrameId: number;

    const setupFaceDetection = async () => {
      try {
        // Check permissions first
        const permissionGranted = await checkAndRequestPermission();
        if (!permissionGranted) return;

        setCameraStatus("initializing");
        setFaceDetectionStatus("Setting up camera...");

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 640,
            height: 480,
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready and playing
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                resolve(null);
              };
            }
          });

          // Additional wait to ensure video is actually playing
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        setFaceDetectionStatus("Loading face landmarks model...");
        // Load the face landmarks model instead of basic face detection
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        detector = await faceLandmarksDetection.createDetector(model, {
          runtime: "tfjs",
          refineLandmarks: true,
          maxFaces: 1,
        });

        setCameraStatus("ready");
        setFaceDetectionStatus("Starting face detection...");
        // Start detection loop
        detectFaces();
      } catch (error) {
        console.error("Setup error:", error);
        setLastError(error instanceof Error ? error.message : "Unknown error");
        setCameraStatus("error");
        setIsWatching(true); // Fallback to always watching
      }
    };

    const detectFaces = async () => {
      if (!videoRef.current || !detector) return;

      try {
        const faces = await detector.estimateFaces(videoRef.current);
        const hasFace = faces.length > 0;
        setIsWatching(hasFace);
        setLastDetectionTime(new Date());

        if (hasFace) {
          const face = faces[0];

          // Use new eye detection method
          const isEyesOpen = checkEyesOpen(face.keypoints);
          setEyeStatus(isEyesOpen ? "open" : "closed");

          // Calculate attentiveness (0-100)
          const rotationY = Math.abs(face.rotation?.angle.y || 0);
          const rotationZ = Math.abs(face.rotation?.angle.z || 0);

          // Normalize rotation values
          const normalizedRotationY = Math.max(
            0,
            Math.min(1, 1 - rotationY / 30)
          );
          const normalizedRotationZ = Math.max(
            0,
            Math.min(1, 1 - rotationZ / 20)
          );

          // Calculate attentiveness with adjusted weights
          const attentivenessScore = Math.max(
            0,
            Math.min(
              100,
              60 +
                // Base score of 60 when face is detected
                ((isEyesOpen ? 0.5 : 0) + // 50% weight on eyes being open
                  normalizedRotationY * 0.3 + // 30% weight on looking at camera
                  normalizedRotationZ * 0.2) * // 20% weight on head tilt
                  40 // Remaining 40 points
            )
          );

          setAttentiveness(Math.round(attentivenessScore));
          setFaceDetectionStatus(
            `Attentiveness: ${Math.round(attentivenessScore)}%`
          );

          // Enhanced debugging
          console.log("Face details:", {
            eyesOpen: isEyesOpen,
            rotationY,
            normalizedRotationY,
            rotationZ,
            normalizedRotationZ,
            attentivenessScore,
            metrics: {
              eyeScore: (isEyesOpen ? 0.5 : 0) * 40,
              rotationYScore: normalizedRotationY * 0.3 * 40,
              rotationZScore: normalizedRotationZ * 0.2 * 40,
              baseScore: 60,
            },
          });
        } else {
          setEyeStatus("unknown");
          setAttentiveness(0);
          setFaceDetectionStatus("No face detected");
        }
      } catch (error) {
        console.error("Face detection error:", error);
        setFaceDetectionStatus("Detection error occurred");
      }

      animationFrameId = requestAnimationFrame(detectFaces);
    };

    setupFaceDetection();

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Modify video playback to consider face detection
  useEffect(() => {
    if (!player.current) return;

    if (state.secondsOfPlay > 0 && isWatching) {
      player.current.play();
    } else {
      player.current.pause();
    }
  }, [state.secondsOfPlay, isWatching]);

  // Update volume based on viewport position
  useEffect(() => {
    if (!player.current) return;
    player.current.volume = viewportPercentage / 100;
  }, [viewportPercentage]);

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
          {/* <video 
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
          /> */}
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
