/** Geometry belongs to the drawing; canonical reference identity lives in the scene model. */
export type SpatialArtworkScene = 'wilderness' | 'dungeon';
export type SpatialVisualTarget = {
  hitPath: string;
  hitStrokeWidth?: number;
  labelPoint: readonly [number, number];
};
export const SPATIAL_VIEWBOX = '0 0 760 620';
export const roadLine =
  'M688 622C677 560 622 550 560 533S490 503 498 469 444 419 365 424 305 390 313 353 392 319 423 283 544 245 548 187 491 123 442 123 276 163 223 117L194 74';
export const offroadLine = 'M307 422Q275 441 244 450T175 453L138 428';

export const sceneVisuals: Record<
  SpatialArtworkScene,
  Record<string, SpatialVisualTarget>
> = {
  wilderness: {
    road: { hitPath: roadLine, hitStrokeWidth: 74, labelPoint: [607, 563] },
    roadside: {
      hitPath: 'M605 410 Q642 400 686 421 L694 489 Q661 508 613 493Z',
      labelPoint: [653, 507],
    },
    river: {
      hitPath: 'M558 169 Q604 161 655 175 L662 230 Q614 242 563 229Z',
      labelPoint: [603, 246],
    },
    'threat-signs': {
      hitPath: 'M238 233 Q272 225 310 242 L314 311 Q279 326 241 307Z',
      labelPoint: [280, 329],
    },
    forage: {
      hitPath: 'M83 254 191 240 228 298 215 373 102 380 65 312Z',
      labelPoint: [136, 384],
    },
    offroad: {
      hitPath: offroadLine,
      hitStrokeWidth: 74,
      labelPoint: [178, 516],
    },
    tracks: {
      hitPath: 'M338 291 412 280 458 332 421 380 342 363Z',
      labelPoint: [389, 383],
    },
    camp: {
      hitPath: 'M460 367 559 342 609 420 583 466 467 470 444 427Z',
      labelPoint: [531, 478],
    },
    weather: {
      hitPath: 'M527 44 689 38 721 105 677 151 547 150 515 93Z',
      labelPoint: [622, 157],
    },
    village: {
      hitPath: 'M117 63 266 57 299 144 274 206 121 194 87 141Z',
      labelPoint: [200, 214],
    },
    corpse: {
      hitPath: 'M617 229 707 241 734 327 677 359 613 320Z',
      labelPoint: [670, 363],
    },
    distances: {
      hitPath: 'M354 112 438 107 452 201 361 210Z',
      labelPoint: [401, 219],
    },
  },
  dungeon: {
    threshold: {
      hitPath: 'M238 534 311 531 316 615 235 616Z',
      labelPoint: [269, 525],
    },
    'entrance-marks': {
      hitPath: 'M453 532 519 529 522 604 452 606Z',
      labelPoint: [487, 522],
    },
    'entrance-odour': {
      hitPath: 'M244 459 312 457 313 529 243 530Z',
      labelPoint: [273, 451],
    },
    floor: {
      hitPath: 'M458 232 518 231 519 315 458 316Z',
      labelPoint: [487, 225],
    },
    'room-odour': {
      hitPath: 'M255 385 324 383 326 450 254 452Z',
      labelPoint: [287, 457],
    },
    entrance: {
      hitPath: 'M318 534 427 534 448 609 302 609Z',
      labelPoint: [374, 530],
    },
    masonry: {
      hitPath: 'M167 336 253 336 254 433 169 438Z',
      labelPoint: [160, 387],
    },
    door: {
      hitPath: 'M323 443 428 443 438 523 314 523Z',
      labelPoint: [446, 487],
    },
    contents: {
      hitPath: 'M343 239 436 227 462 294 424 338 346 321Z',
      labelPoint: [397, 228],
    },
    furnishing: {
      hitPath: 'M231 272 326 271 334 367 237 373Z',
      labelPoint: [280, 382],
    },
    chest: {
      hitPath: 'M522 213 631 210 649 307 526 315Z',
      labelPoint: [580, 320],
    },
    trap: {
      hitPath: 'M356 358 463 357 472 435 357 442Z',
      labelPoint: [413, 446],
    },
    passage: {
      hitPath: 'M330 33 455 31 454 160 322 167Z',
      labelPoint: [470, 99],
    },
    light: {
      hitPath: 'M207 170 291 167 306 251 218 267Z',
      labelPoint: [254, 165],
    },
    corpse: {
      hitPath: 'M560 358 666 357 695 440 616 489 547 439Z',
      labelPoint: [627, 493],
    },
    sounds: {
      hitPath: 'M602 71 701 72 721 167 612 174Z',
      labelPoint: [662, 180],
    },
  },
};
