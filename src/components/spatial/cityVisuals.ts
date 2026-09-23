import type { SpatialVisualTarget } from './spatialVisuals';

/** Geometry calibrated to the owned city plate; no registry knowledge. */
export const cityVisuals: Record<string, SpatialVisualTarget> = {
  gate: {
    hitPath: 'M305 47 389 46 393 110 306 110Z',
    featurePoint: [352, 80],
    labelPoint: [360, 120],
  },
  'gate-signs': {
    hitPath: 'M222 43 279 43 279 100 223 100Z',
    featurePoint: [248, 74],
    labelPoint: [247, 115],
  },
  street: {
    hitPath:
      'M354 109 L355 257 Q357 287 351 307 Q317 351 345 401 L350 491 Q346 538 364 620 M352 118 L218 118 216 209 83 210 M353 336 Q296 330 238 342 M400 380 Q499 388 601 421 M351 498 Q259 548 189 592 M352 510 Q430 544 581 575',
    hitStrokeWidth: 54,
    featurePoint: [356, 244],
    labelPoint: [361, 264],
    layer: 0,
  },
  cobbles: {
    hitPath: 'M320 442 376 442 377 498 321 498Z',
    featurePoint: [349, 470],
    labelPoint: [391, 482],
  },
  'alley-hazard': {
    hitPath: 'M481 136 530 134 538 218 517 257 479 253Z',
    featurePoint: [511, 204],
    labelPoint: [539, 261],
  },
  'chimney-smell': {
    hitPath: 'M704 98 759 90 759 174 705 174Z',
    featurePoint: [724, 141],
    labelPoint: [715, 190],
  },
  crowd: {
    hitPath: 'M312 314 407 313 420 369 389 395 321 391 308 351Z',
    featurePoint: [369, 352],
    labelPoint: [396, 405],
  },
  tavern: {
    hitPath: 'M27 281 213 280 240 313 231 407 85 420 26 388Z',
    featurePoint: [168, 375],
    labelPoint: [186, 434],
  },
  shop: {
    hitPath: 'M524 440 635 442 647 563 521 549Z',
    featurePoint: [582, 510],
    labelPoint: [596, 580],
  },
  townhouse: {
    hitPath: 'M581 145 665 145 670 231 651 278 606 279 581 237Z',
    featurePoint: [635, 198],
    labelPoint: [637, 292],
  },
  shrine: {
    hitPath: 'M81 99 173 96 177 196 87 201Z',
    featurePoint: [128, 147],
    labelPoint: [135, 216],
  },
  merchant: {
    hitPath: 'M469 306 574 307 590 397 477 395 462 363Z',
    featurePoint: [530, 358],
    labelPoint: [550, 412],
  },
  directions: {
    hitPath: 'M279 477 332 476 338 534 279 536Z',
    featurePoint: [309, 502],
    labelPoint: [278, 549],
  },
};
