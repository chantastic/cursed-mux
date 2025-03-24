import { useEffect, useRef, useState } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs";

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
        setState(prev => ({
          ...prev,
          lastError: "Camera access requires HTTPS. Please use a secure connection.",
          cameraStatus: "error"
        }));
        return false;
      }

      if (!navigator.permissions || !navigator.mediaDevices) {
        setState(prev => ({
          ...prev,
          lastError: "Your browser does not support camera access.",
          cameraStatus: "error"
        }));
        return false;
      }

      const permission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      setState(prev => ({ ...prev, permissionStatus: permission.state }));

      if (permission.state === "denied") {
        setState(prev => ({
          ...prev,
          lastError: "Camera permission was denied. Please reset permissions and reload.",
          cameraStatus: "error"
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error("Permission check error:", error);
      setState(prev => ({
        ...prev,
        lastError: "Failed to check camera permissions",
        cameraStatus: "error"
      }));
      return false;
    }
  };

  // Check if eyes are open based on landmarks
  const checkEyesOpen = (landmarks: any) => {
    try {
      const leftEye = landmarks.leftEye || landmarks[33] || landmarks[159];
      const rightEye = landmarks.rightEye || landmarks[263] || landmarks[386];
      return leftEye && rightEye;
    } catch (error) {
      console.error("Eye detection error:", error);
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

        setState(prev => ({
          ...prev,
          cameraStatus: "initializing",
          faceDetectionStatus: "Setting up camera..."
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

        setState(prev => ({
          ...prev,
          faceDetectionStatus: "Loading face landmarks model..."
        }));

        // Initialize TensorFlow.js backend
        await tf.setBackend('webgl');
        await tf.ready();

        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        detector = await faceLandmarksDetection.createDetector(model, {
          runtime: "tfjs",
          refineLandmarks: true,
          maxFaces: 1,
        });

        setState(prev => ({
          ...prev,
          cameraStatus: "ready",
          faceDetectionStatus: "Starting face detection..."
        }));

        detectFaces();
      } catch (error) {
        console.error("Setup error:", error);
        setState(prev => ({
          ...prev,
          lastError: error instanceof Error ? error.message : "Unknown error",
          cameraStatus: "error",
          isWatching: false,
          attentiveness: 0
        }));
      }
    };

    const detectFaces = async () => {
      if (!videoRef.current || !detector) return;

      try {
        const faces = await detector.estimateFaces(videoRef.current);
        const hasFace = faces.length > 0;
        
        setState(prev => ({
          ...prev,
          isWatching: hasFace,
          lastDetectionTime: new Date()
        }));

        if (hasFace) {
          const face = faces[0];
          const isEyesOpen = checkEyesOpen(face.keypoints);
          
          // Calculate attentiveness (0-100)
          const rotationY = Math.abs((face as any).rotation?.angle.y || 0);
          const rotationZ = Math.abs((face as any).rotation?.angle.z || 0);

          const normalizedRotationY = Math.max(0, Math.min(1, 1 - rotationY / 30));
          const normalizedRotationZ = Math.max(0, Math.min(1, 1 - rotationZ / 20));

          const attentivenessScore = Math.max(
            0,
            Math.min(
              100,
              60 +
                ((isEyesOpen ? 0.5 : 0) +
                  normalizedRotationY * 0.3 +
                  normalizedRotationZ * 0.2) *
                  40
            )
          );

          setState(prev => ({
            ...prev,
            eyeStatus: isEyesOpen ? "open" : "closed",
            attentiveness: Math.round(attentivenessScore),
            faceDetectionStatus: `Attentiveness: ${Math.round(attentivenessScore)}%`
          }));

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
          setState(prev => ({
            ...prev,
            eyeStatus: "unknown",
            attentiveness: 0,
            faceDetectionStatus: "No face detected"
          }));
        }
      } catch (error) {
        console.error("Face detection error:", error);
        setState(prev => ({
          ...prev,
          faceDetectionStatus: "Detection error occurred",
          isWatching: false,
          attentiveness: 0
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
    videoRef
  };
}
