import React from 'react';
import CinematicLoader from './common/CinematicLoader';

/**
 * Animated PageLoader with DINEVIQ Cinematic Intro
 */
export default function PageLoader({ onLoaded, duration = 600, statusText = 'Loading workspace...' }) {
  return (
    <CinematicLoader
      duration={duration}
      onComplete={onLoaded}
      statusText={statusText}
    />
  );
}
