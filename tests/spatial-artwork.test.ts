import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPATIAL_SCENES } from '../src/domain/spatialScenes';
import { sceneVisuals } from '../src/components/spatial/spatialVisuals';
import { cityVisuals } from '../src/components/spatial/cityVisuals';

const allSceneVisuals = { ...sceneVisuals, city: cityVisuals };

test('all spatial drawings cover every semantic scene and target with no orphan artwork', () => {
  assert.deepEqual(
    Object.keys(allSceneVisuals).sort(),
    SPATIAL_SCENES.map((scene) => scene.id).sort(),
  );
  for (const [sceneId, targets] of Object.entries(allSceneVisuals)) {
    const scene = SPATIAL_SCENES.find((candidate) => candidate.id === sceneId)!;
    assert.ok(scene, `${sceneId}: missing semantic scene`);
    assert.deepEqual(
      Object.keys(targets).sort(),
      scene.hotspots.map((spot) => spot.visualTarget).sort(),
      `${sceneId}: artwork and semantic targets differ`,
    );
  }
});

test('scene geometry keeps markers visible and gives open trails broad continuous hit regions', () => {
  for (const [sceneId, targets] of Object.entries(allSceneVisuals)) {
    for (const [target, visual] of Object.entries(targets)) {
      const label = `${sceneId}/${target}`;
      assert.match(visual.hitPath, /^M/, `${label}: missing SVG hit path`);
      assert.doesNotMatch(
        visual.hitPath,
        /NaN|undefined|Infinity/,
        `${label}: invalid geometry`,
      );
      const [x, y] = visual.labelPoint;
      assert.ok(
        Number.isFinite(x) && x >= 8 && x <= 752,
        `${label}: marker outside plate`,
      );
      assert.ok(
        Number.isFinite(y) && y >= 8 && y <= 612,
        `${label}: marker outside plate`,
      );
      if (visual.hitStrokeWidth) {
        // 640px is the smallest rendered plate. Its continuous trail target stays >44px.
        assert.ok(
          (visual.hitStrokeWidth * 640) / 760 >= 44,
          `${label}: narrow trail hit area`,
        );
      } else {
        assert.match(
          visual.hitPath,
          /Z$/i,
          `${label}: area target must be closed`,
        );
      }
    }
  }
  assert.ok(
    sceneVisuals.wilderness.road.hitStrokeWidth,
    'the road is interactive along its entire route',
  );
  assert.ok(
    sceneVisuals.wilderness.offroad.hitStrokeWidth,
    'the side trail is interactive through its junction',
  );
  assert.ok(
    cityVisuals.street.hitStrokeWidth,
    'the city street is interactive along its entire route and branches',
  );
});
