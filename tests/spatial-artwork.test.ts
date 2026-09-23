import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spatialIllustrations } from '../src/components/spatial/spatialIllustrations';
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

test('the dungeon exit sits beyond the northern passage, not before the entrance', () => {
  const bounds = (path: string) => {
    const coordinates = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(([n]) =>
      Number(n),
    );
    assert.equal(coordinates.length % 2, 0);
    const xs = coordinates.filter((_, index) => index % 2 === 0);
    const ys = coordinates.filter((_, index) => index % 2 === 1);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };
  const entrance = bounds(sceneVisuals.dungeon.entrance.hitPath);
  const exit = bounds(sceneVisuals.dungeon.door.hitPath);
  const passage = bounds(sceneVisuals.dungeon.passage.hitPath);
  assert.ok(
    exit.maxY <= passage.minY,
    'exit must be at the far end of the northern passage',
  );
  assert.ok(
    exit.maxY < entrance.minY - 300,
    'exit must remain far from the southern entrance',
  );
});

test('animals and journal clues retain their source meaning, with human loot kept in the context shelf', () => {
  const dungeon = SPATIAL_SCENES.find((scene) => scene.id === 'dungeon')!;
  const journey = SPATIAL_SCENES.find((scene) => scene.id === 'wilderness')!;
  for (const [scene, id] of [
    [dungeon, 'oracle:reclvse.dressing'],
    [journey, 'oracle:reclvse.remains_ruins'],
  ] as const) {
    assert.equal(
      scene.hotspots.find((s) => s.visualTarget === 'remains')?.referenceId,
      id,
    );
    assert.ok(
      !scene.hotspots.some(
        (s) => s.referenceId === 'oracle:core.corpsePlundering',
      ),
    );
    assert.ok(
      scene.supportGroups
        .flatMap((g) => g.references)
        .some((s) => s.referenceId === 'oracle:core.corpsePlundering'),
    );
  }
  assert.equal(
    dungeon.hotspots.find((s) => s.visualTarget === 'furnishing')?.referenceId,
    'oracle:reclvse.roomDiscovery',
  );
});

test('paint order keeps the room and terrain behind physical objects', () => {
  for (const [scene, background] of [
    ['dungeon', 'floor'],
    ['wilderness', 'river'],
  ] as const) {
    for (const [name, target] of Object.entries(sceneVisuals[scene])) {
      if (name !== background)
        assert.ok(
          (sceneVisuals[scene][background].layer ?? 1) < (target.layer ?? 1),
          name,
        );
    }
  }
  for (const targets of Object.values(allSceneVisuals)) {
    for (const visual of Object.values(targets)) {
      assert.ok(visual.featurePoint.every(Number.isFinite));
      assert.ok(visual.featurePoint[0] >= 0 && visual.featurePoint[0] <= 760);
      assert.ok(visual.featurePoint[1] >= 0 && visual.featurePoint[1] <= 620);
    }
  }
});

test('every scene bundles a local PNG plate matching its coordinate aspect ratio', () => {
  for (const scene of SPATIAL_SCENES) {
    const illustration = spatialIllustrations[scene.id];
    assert.ok(illustration);
    const bytes = readFileSync(new URL(illustration.imageSrc));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.ok(
      Math.abs(bytes.readUInt32BE(16) / bytes.readUInt32BE(20) - 760 / 620) <
        0.005,
    );
    assert.ok(bytes.readUInt32BE(16) >= 1380);
  }
});
