import type { ReactNode } from 'react';
import { SpatialArtwork, sceneVisuals } from './SpatialArtwork';
import { CityArtwork, cityVisuals } from './CityArtwork';
import type { SpatialVisualTarget } from './spatialVisuals';

/** New visual grammars register here; the shared interaction surface stays unchanged. */
export const spatialIllustrations: Record<
  string,
  {
    targets: Record<string, SpatialVisualTarget>;
    render: (target?: string) => ReactNode;
  }
> = {
  dungeon: {
    targets: sceneVisuals.dungeon,
    render: (target) => <SpatialArtwork sceneId="dungeon" target={target} />,
  },
  wilderness: {
    targets: sceneVisuals.wilderness,
    render: (target) => <SpatialArtwork sceneId="wilderness" target={target} />,
  },
  city: {
    targets: cityVisuals,
    render: (target) => <CityArtwork target={target} />,
  },
};
