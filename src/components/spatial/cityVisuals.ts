import type { SpatialVisualTarget } from './spatialVisuals';

/** Fixed geometry only; semantic Reference identities live in the scene model. */
export const cityVisuals: Record<string, SpatialVisualTarget> = {
  gate: {
    hitPath: 'M287 38 L408 35 412 174 283 175 Z',
    labelPoint: [347, 187],
  },
  street: {
    hitPath:
      'M351 620 C351 559 420 524 425 471 C430 425 424 388 405 347 C383 300 338 285 320 244 C298 202 319 168 344 146 M329 269 C240 279 148 306 31 305 M410 367 C465 347 534 293 733 290 M431 461 C491 423 584 429 728 449',
    hitStrokeWidth: 74,
    labelPoint: [340, 216],
  },
  crowd: {
    hitPath: 'M297 317 L398 315 409 409 300 417 Z',
    labelPoint: [354, 428],
  },
  tavern: {
    hitPath: 'M65 346 L232 333 250 494 78 506 Z',
    labelPoint: [153, 521],
  },
  shop: {
    hitPath: 'M463 457 L613 447 629 564 469 578 Z',
    labelPoint: [546, 592],
  },
  townhouse: {
    hitPath: 'M548 104 L687 112 700 250 556 258 Z',
    labelPoint: [625, 275],
  },
  shrine: {
    hitPath: 'M81 93 L211 103 221 244 89 254 Z',
    labelPoint: [157, 274],
  },
  merchant: {
    hitPath: 'M472 297 L592 302 589 413 471 408 Z',
    labelPoint: [534, 431],
  },
  directions: {
    hitPath: 'M244 449 L323 442 331 537 244 542 Z',
    labelPoint: [286, 556],
  },
};
