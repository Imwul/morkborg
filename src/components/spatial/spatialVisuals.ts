/** Artwork coordinates only. Meaning and canonical identity belong to spatialScenes.
 * featurePoint is on the depicted object, independent of the enlarged hit area.
 * Lower layers allow whole floors/water/routes to sit behind their physical objects.
 */
export type SpatialVisualTarget = {
  hitPath: string;
  hitStrokeWidth?: number;
  labelPoint: readonly [number, number];
  featurePoint: readonly [number, number];
  layer?: number;
};
export const SPATIAL_VIEWBOX = '0 0 760 620';

export const sceneVisuals: Record<
  'wilderness' | 'dungeon',
  Record<string, SpatialVisualTarget>
> = {
  dungeon: {
    floor: {
      hitPath:
        'M169 131 284 131 291 103 337 103 345 132 518 132 541 200 676 237 687 381 613 438 508 389 473 415 408 442 330 459 244 432 141 424 105 370 154 296 153 218 125 190Z',
      featurePoint: [395, 268],
      labelPoint: [405, 275],
      layer: -2,
    },
    entrance: {
      hitPath: 'M297 452 411 452 414 506 297 506Z',
      featurePoint: [358, 479],
      labelPoint: [427, 478],
    },
    threshold: {
      hitPath: 'M175 524 259 517 307 562 276 605 185 593Z',
      featurePoint: [239, 560],
      labelPoint: [212, 610],
    },
    'entrance-marks': {
      hitPath: 'M409 550 487 552 521 612 421 614 382 582Z',
      featurePoint: [458, 585],
      labelPoint: [520, 597],
    },
    'entrance-odour': {
      hitPath: 'M280 506 436 506 448 545 411 561 304 558 269 535Z',
      featurePoint: [399, 535],
      labelPoint: [460, 538],
    },
    masonry: {
      hitPath: 'M76 292 134 289 150 365 107 388 72 355Z',
      featurePoint: [103, 344],
      labelPoint: [71, 383],
    },
    door: {
      hitPath: 'M283 8 351 8 353 62 283 62Z',
      featurePoint: [320, 24],
      labelPoint: [386, 32],
    },
    passage: {
      hitPath: 'M291 63 346 63 346 122 290 122Z',
      featurePoint: [320, 91],
      labelPoint: [375, 99],
    },
    contents: {
      hitPath: 'M343 132 399 129 437 164 425 209 350 211 337 172Z',
      featurePoint: [378, 155],
      labelPoint: [410, 222],
    },
    furnishing: {
      hitPath: 'M247 237 326 237 349 314 321 333 248 324Z',
      featurePoint: [292, 273],
      labelPoint: [275, 338],
    },
    chest: {
      hitPath: 'M471 129 528 129 535 187 471 187Z',
      featurePoint: [498, 155],
      labelPoint: [502, 202],
    },
    trap: {
      hitPath: 'M325 389 382 389 385 443 325 443Z',
      featurePoint: [353, 418],
      labelPoint: [399, 430],
    },
    light: {
      hitPath: 'M151 120 205 116 210 170 166 180 151 153Z',
      featurePoint: [183, 146],
      labelPoint: [218, 176],
    },
    remains: {
      hitPath: 'M560 302 638 301 662 367 581 386 560 351Z',
      featurePoint: [614, 337],
      labelPoint: [623, 399],
    },
    sounds: {
      hitPath: 'M539 77 595 77 596 133 545 133Z',
      featurePoint: [563, 108],
      labelPoint: [627, 112],
    },
    'room-odour': {
      hitPath:
        'M111 342 185 355 236 382 316 394 316 424 208 421 120 392 101 362Z',
      featurePoint: [193, 384],
      labelPoint: [201, 432],
    },
  },
  wilderness: {
    river: {
      hitPath:
        'M372 0 436 0 477 63 532 85 561 155 535 199 510 233 530 304 519 386 492 458 531 519 580 558 593 620 449 620 451 557 415 506 422 440 450 360 444 300 435 249 419 195 438 162 414 132 389 91Z',
      featurePoint: [500, 348],
      labelPoint: [536, 358],
      layer: -1,
    },
    road: {
      hitPath:
        'M159 175 C161 211 204 216 242 214 S365 227 430 232 L509 234 C569 235 610 238 639 258 C675 292 676 366 682 421 S691 508 716 539 L740 606',
      hitStrokeWidth: 54,
      featurePoint: [474, 233],
      labelPoint: [476, 269],
      layer: 0,
    },
    offroad: {
      hitPath:
        'M229 219 C228 247 202 267 216 284 S267 310 247 337 C223 365 175 368 163 411 L136 475',
      hitStrokeWidth: 54,
      featurePoint: [160, 423],
      labelPoint: [135, 448],
      layer: 0,
    },
    roadside: {
      hitPath: 'M681 490 752 490 759 562 718 578 684 553Z',
      featurePoint: [714, 527],
      labelPoint: [697, 591],
    },
    'threat-signs': {
      hitPath: 'M168 269 220 267 229 321 173 329Z',
      featurePoint: [193, 294],
      labelPoint: [189, 345],
    },
    forage: {
      hitPath: 'M49 386 115 377 130 431 71 451 41 420Z',
      featurePoint: [90, 417],
      labelPoint: [82, 467],
    },
    tracks: {
      hitPath: 'M278 190 307 211 360 217 365 246 310 249 278 232Z',
      featurePoint: [298, 217],
      labelPoint: [322, 264],
    },
    camp: {
      hitPath: 'M583 358 653 355 666 416 651 451 575 453 556 423Z',
      featurePoint: [620, 393],
      labelPoint: [604, 467],
    },
    weather: {
      hitPath: 'M669 1 745 1 754 55 674 57Z',
      featurePoint: [708, 22],
      labelPoint: [709, 73],
    },
    village: {
      hitPath: 'M37 30 202 24 218 143 204 182 150 191 47 168Z',
      featurePoint: [144, 117],
      labelPoint: [143, 203],
    },
    remains: {
      hitPath: 'M674 250 733 249 739 306 683 310Z',
      featurePoint: [699, 277],
      labelPoint: [717, 326],
    },
    distances: {
      hitPath: 'M308 154 361 155 363 210 307 210Z',
      featurePoint: [330, 188],
      labelPoint: [367, 185],
    },
  },
};
