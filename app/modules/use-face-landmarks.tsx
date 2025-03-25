import { useEffect, useRef, useState } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs";
import * as React from "react";

interface FaceLandmarksState {
  isWatching: boolean;
  cameraStatus: "initializing" | "ready" | "error";
  lastError: string;
  permissionStatus: "prompt" | "granted" | "denied";
  faceDetectionStatus: string;
  lastDetectionTime: Date | null;
  eyeStatus: "open" | "closed" | "unknown";
  attentiveness: number;
}

export function useFaceLandmarks() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<FaceLandmarksState>({
    isWatching: false,
    cameraStatus: "initializing",
    lastError: "",
    permissionStatus: "prompt",
    faceDetectionStatus: "Not started",
    lastDetectionTime: null,
    eyeStatus: "unknown",
    attentiveness: 0,
  });

  // Check and request camera permissions
  const checkAndRequestPermission = async () => {
    try {
      if (
        !window.location.protocol.includes("https") &&
        !window.location.hostname.includes("localhost")
      ) {
        setState((prev) => ({
          ...prev,
          lastError:
            "Camera access requires HTTPS. Please use a secure connection.",
          cameraStatus: "error",
        }));
        return false;
      }

      if (!navigator.permissions || !navigator.mediaDevices) {
        setState((prev) => ({
          ...prev,
          lastError: "Your browser does not support camera access.",
          cameraStatus: "error",
        }));
        return false;
      }

      const permission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      setState((prev) => ({ ...prev, permissionStatus: permission.state }));

      if (permission.state === "denied") {
        setState((prev) => ({
          ...prev,
          lastError:
            "Camera permission was denied. Please reset permissions and reload.",
          cameraStatus: "error",
        }));
        return false;
      }

      return true;
    } catch (error) {
      // console.error("Permission check error:", error);
      setState((prev) => ({
        ...prev,
        lastError: "Failed to check camera permissions",
        cameraStatus: "error",
      }));
      return false;
    }
  };

  // Check if eyes are open based on landmarks
  const checkEyesOpen = (landmarks: any) => {
    try {
      type Landmark = { y: number };

      function isEyeOpen(upperPoint: Landmark, lowerPoint: Landmark) {
        const yDiff = Math.abs(upperPoint.y - lowerPoint.y);
        // Thresholds may vary; calibrate based on video resolution
        return yDiff > 7;
      }

      const rightEye = isEyeOpen(landmarks[386], landmarks[374]);
      const leftEye = isEyeOpen(landmarks[159], landmarks[145]);

      return leftEye && rightEye;
    } catch (error) {
      // console.error("Eye detection error:", error);
      return false;
    }
  };

  useEffect(() => {
    let detector: faceLandmarksDetection.FaceLandmarksDetector;
    let stream: MediaStream;
    let animationFrameId: number;

    const setupFaceDetection = async () => {
      try {
        const permissionGranted = await checkAndRequestPermission();
        if (!permissionGranted) return;

        setState((prev) => ({
          ...prev,
          cameraStatus: "initializing",
          faceDetectionStatus: "Setting up camera...",
        }));

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 640,
            height: 480,
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                resolve(null);
              };
            }
          });
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        setState((prev) => ({
          ...prev,
          faceDetectionStatus: "Loading face landmarks model...",
        }));

        // Initialize TensorFlow.js backend
        await tf.setBackend("webgl");
        await tf.ready();

        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        detector = await faceLandmarksDetection.createDetector(model, {
          runtime: "tfjs",
          refineLandmarks: true,
          maxFaces: 1,
        });

        setState((prev) => ({
          ...prev,
          cameraStatus: "ready",
          faceDetectionStatus: "Starting face detection...",
        }));

        detectFaces();
      } catch (error) {
        // console.error("Setup error:", error);
        setState((prev) => ({
          ...prev,
          lastError: error instanceof Error ? error.message : "Unknown error",
          cameraStatus: "error",
          isWatching: false,
          attentiveness: 0,
        }));
      }
    };

    const detectFaces = async () => {
      if (!videoRef.current || !detector) return;

      try {
        const faces = await detector.estimateFaces(videoRef.current);
        const hasFace = faces.length > 0;

        setState((prev) => ({
          ...prev,
          isWatching: hasFace,
          lastDetectionTime: new Date(),
        }));

        if (hasFace) {
          const face = faces[0];
          const isEyesOpen = checkEyesOpen(face.keypoints);

          const attentivenessScore = isEyesOpen ? 100 : 50;

          setState((prev) => ({
            ...prev,
            eyeStatus: isEyesOpen ? "open" : "closed",
            attentiveness: attentivenessScore,
            faceDetectionStatus: `Attentiveness: ${attentivenessScore}%`,
          }));

        } else {
          setState((prev) => ({
            ...prev,
            eyeStatus: "unknown",
            attentiveness: 0,
            faceDetectionStatus: "No face detected",
          }));
        }
      } catch (error) {
        // console.error("Face detection error:", error);
        setState((prev) => ({
          ...prev,
          faceDetectionStatus: "Detection error occurred",
          isWatching: false,
          attentiveness: 0,
        }));
      }

      animationFrameId = requestAnimationFrame(detectFaces);
    };

    setupFaceDetection();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return {
    ...state,
    videoRef,
  };
}

interface CameraDebugPanelProps {
  isWatching: boolean;
  cameraStatus: "initializing" | "ready" | "error";
  lastError: string;
  permissionStatus: "prompt" | "granted" | "denied";
  faceDetectionStatus: string;
  lastDetectionTime: Date | null;
  eyeStatus: "open" | "closed" | "unknown";
  attentiveness: number;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const CameraDebugPanel: React.FC<CameraDebugPanelProps> = ({
  isWatching,
  cameraStatus,
  lastError,
  permissionStatus,
  faceDetectionStatus,
  lastDetectionTime,
  eyeStatus,
  attentiveness,
  videoRef,
}) => {
  return (
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
          width: "100%",
          transform: "scaleX(-1)",
          border: "1px solid #ccc",
          marginTop: "10px",
        }}
        width="640"
        height="480"
        autoPlay
        playsInline
      />
    </div>
  );
};
