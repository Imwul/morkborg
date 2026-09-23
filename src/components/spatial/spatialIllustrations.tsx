const dungeon = new URL('../../assets/spatial/dungeon.png', import.meta.url)
  .href;
const city = new URL('../../assets/spatial/city.png', import.meta.url).href;
const journey = new URL('../../assets/spatial/journey.png', import.meta.url)
  .href;
import { sceneVisuals, type SpatialVisualTarget } from './spatialVisuals';
import { cityVisuals } from './cityVisuals';

/** Owned, bundled plates; identity and roll behavior remain in the scene/registry. */
export const spatialIllustrations: Record<
  string,
  {
    imageSrc: string;
    targets: Record<string, SpatialVisualTarget>;
  }
> = {
  dungeon: { imageSrc: dungeon, targets: sceneVisuals.dungeon },
  wilderness: { imageSrc: journey, targets: sceneVisuals.wilderness },
  city: { imageSrc: city, targets: cityVisuals },
};
