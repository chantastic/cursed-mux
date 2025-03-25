import {
  MediaProvider,
  useMediaDispatch,
  useMediaSelector,
  useMediaRef,
  useMediaFullscreenRef,
  MediaActionTypes,
} from "media-chrome/react/media-store";

import * as React from "react";
import { useDisplayCoverage } from "~/modules/use-display-coverage";

const Video = () => {
  // "Wire up" the <video/> element to the MediaStore using useMediaRef()
  const mediaRef = useMediaRef();

  return (
    <video
      ref={mediaRef}
      style={{ width: "100vw" }}
      src="https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4"
      preload="auto"
      muted
      crossOrigin=""
    />
  );
};

const PlayerContainer = ({ children }) => {
  // "Wire up" the element you want the MediaStore to target for fullscreen using useMediaFullscreenRef()
  const mediaFullscreenRef = useMediaFullscreenRef();

  return <div ref={mediaFullscreenRef}>{children}</div>;
};

const PlayButton = () => {
  // Dispatch media state change requests using useMediaDispatch()
  const dispatch = useMediaDispatch();
  // Get the latest media state you care about in your component using useMediaSelector()
  const mediaPaused = useMediaSelector((state) => state.mediaPaused);
  return (
    <button
      onClick={() => {
        // Select from a set of well-defined actions for state change requests
        // using MediaActionTypes
        const type = mediaPaused
          ? MediaActionTypes.MEDIA_PLAY_REQUEST
          : MediaActionTypes.MEDIA_PAUSE_REQUEST;
        dispatch({ type });
      }}
    >
      {mediaPaused ? "Play" : "Pause"}
    </button>
  );
};

const FullscreenButton = () => {
  // Dispatch media state change requests using useMediaDispatch()
  const dispatch = useMediaDispatch();
  // Get the latest media state you care about in your component using useMediaSelector()
  const mediaIsFullscreen = useMediaSelector(
    (state) => state.mediaIsFullscreen
  );
  return (
    <button
      onClick={() => {
        // Select from a set of well-defined actions for state change requests
        // using MediaActionTypes
        const type = mediaIsFullscreen
          ? MediaActionTypes.MEDIA_EXIT_FULLSCREEN_REQUEST
          : MediaActionTypes.MEDIA_ENTER_FULLSCREEN_REQUEST;
        dispatch({ type });
      }}
    >
      {mediaIsFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    </button>
  );
};

const Player = () => {
  const playerContainer = React.useRef(null);
  // const displayCoverage = useDisplayCoverage(
  //   playerContainer as React.RefObject<HTMLDivElement>
  // );
  const dispatch = useMediaDispatch();

  React.useEffect(() => {
    dispatch({
      type: MediaActionTypes.MEDIA_PLAYBACK_RATE_REQUEST,
      detail: 2
    });
  });

  // Get access to Media Chrome's state management in your components using <MediaProvider/>
  // NOTE: Unlike many other providers (including react-redux's Provider), you'll likely want to keep
  // your <MediaProvider/> in or close to your <Player/> component)
  return (
    <MediaProvider>
      <PlayerContainer>
        <div ref={playerContainer}>
          <Video />
        </div>
        <div>
          <PlayButton />
          <FullscreenButton />
        </div>
      </PlayerContainer>
    </MediaProvider>
  );
};

export default Player;
