import type { ReactNode } from 'react';

import {
  roadLine,
  offroadLine,
  type SpatialArtworkScene,
} from './spatialVisuals';
export {
  sceneVisuals,
  SPATIAL_VIEWBOX,
  type SpatialArtworkScene,
  type SpatialVisualTarget,
} from './spatialVisuals';

const chamber =
  'M218 219Q270 215 320 222Q330 224 329 214L326 169Q325 160 334 161L353 161Q361 162 360 153Q356 99 357 41Q386 37 419 39Q417 99 422 154Q422 162 430 161L446 162Q454 162 453 171L452 211Q451 221 462 220Q536 224 618 217Q627 217 628 227Q626 265 631 306Q632 317 620 317Q576 321 529 318Q520 318 520 327L519 347Q519 357 508 357L497 356Q487 354 488 365Q492 407 490 450Q490 461 479 461L429 459Q419 459 420 470Q417 531 421 602Q373 606 326 601Q331 534 328 471Q329 460 318 460Q269 463 223 458Q212 458 213 447Q217 338 213 232Q212 221 218 219Z';
const cave =
  'M512 344C525 343 526 327 542 328S562 337 577 332C585 330 580 318 591 317Q611 316 632 326C643 331 639 341 649 345S675 343 678 353Q680 370 690 382C696 392 711 397 706 411S704 434 691 442Q675 445 676 455C678 474 665 479 650 484S631 492 624 502Q617 516 604 505C598 498 589 503 584 494S570 486 567 477Q564 465 549 469C535 470 536 453 526 441S524 417 515 407C507 397 489 398 490 383S499 354 512 344Z';

function Tree({
  x,
  y,
  scale = 1,
  lean = 0,
  variant = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  lean?: number;
  variant?: 0 | 1 | 2;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${lean}) scale(${scale})`}>
      <path className="plate-moss" d="M-3 10Q0 24-5 37Q2 34 10 38Q5 21 8 9Z" />
      <path
        className="plate-moss"
        d={
          [
            'M2-62C0-48-5-45-11-36Q-5-36-3-41C-8-27-15-25-23-18Q-13-16-6-22C-11-10-21-9-29-2Q-16 3-9-4C-16 9-25 10-31 18Q-12 23-3 15Q-6 24-17 29C-6 32 2 27 6 21Q15 29 29 27C20 17 17 14 15 7Q27 15 34 11C24 2 18-3 15-11Q24-5 29-10C18-21 14-25 9-35Q17-29 21-34C10-40 7-51 2-62Z',
            'M-3-63C-5-53-4-44-12-36Q-6-36-3-41C-8-30-17-26-21-21Q-12-17-5-23C-7-13-15-8-27-4Q-17 2-7-2C-13 8-26 14-30 21Q-19 26-7 18C-9 25-12 28-20 32Q-3 33 5 24C12 30 21 31 31 26Q20 20 15 11Q28 17 35 13C26 6 19-1 12-8Q23-3 29-7C19-17 16-25 8-34Q14-30 17-34C9-42 2-52-3-63Z',
            'M5-62Q-2-47-11-40Q-5-40-3-43C-8-32-19-28-21-22Q-15-18-6-23Q-11-12-27-5Q-17 1-7-5C-10 6-22 10-31 16Q-19 22-7 15Q-10 25-19 29C-5 32 4 23 8 17Q19 26 30 23C22 13 17 10 15 3Q28 10 32 6C23-1 22-12 12-20Q21-15 24-19C15-29 11-35 9-43Q16-37 19-40C12-46 9-56 5-62Z',
          ][variant]
        }
      />
      <path
        className="plate-fine"
        d="M2-46C4-24 0-5 5 22M0-33Q-6-25-15-21M3-26Q10-19 21-15M1-15Q-6-7-20-2M3-8Q12 0 25 4M2 3Q-7 13-22 17M5 10Q12 19 23 22M3 27Q2 31 2 34M7 30l1 4M-12-17q-4 4-8 4M-15-1l-5 4M16-10q4 4 9 5M-9 20l-7 4M11 7l4 4M0-39l-3 6M9-30l4 6"
      />
      <path
        className="plate-hairline"
        d="M-4-25q-4 6-11 9M-2-7q-7 6-15 8M9-17q5 8 12 10M7 1q4 7 12 11M-3 10q-5 6-12 7M-8 38q7-4 17 1"
      />
    </g>
  );
}

function Bones({
  x,
  y,
  angle = 0,
  scale = 1,
}: {
  x: number;
  y: number;
  angle?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <path
        className="plate-object-paper"
        d="M-9-34C-10-38-16-39-17-46C-19-57-10-64 1-64C14-64 22-55 19-45C17-39 12-38 12-34Q3-29-9-34Z"
      />
      <path
        className="plate-ink"
        d="M-11-50C-6-54-1-50-3-45Q-6-41-10-44Q-13-46-11-50ZM6-50C11-53 16-49 13-45Q10-41 6-44Q4-47 6-50Z"
      />
      <path
        className="plate-fine"
        d="M1-44q-3 4-2 6l4-1ZM-7-35q9 3 16-1M-5-36l1 5M0-35v5M5-36l1 5M-13-54q3-6 10-7M-14-42q2 3 4 2M13-41l-2 2"
      />
      <path
        className="plate-object-paper plate-soft"
        d="M-18-24Q-21-27-23-22C-26-14-32-6-35 0Q-38 5-33 6C-28 2-25-12-19-18Q-15-21-18-24ZM-33 6Q-35 6-33 10L-26 24Q-22 28-21 24C-24 16-30 14-30 8Q-29 5-33 6ZM21-23Q17-22 21-18C25-13 28-9 29-4Q31 1 35-2C35-5 27-18 25-21Q24-25 21-23ZM35 0Q31-2 33 3C37 7 36 12 41 13Q47 15 43 9L37 1ZM-8 18Q-12 15-12 21C-12 29-19 35-18 40Q-15 47-12 42C-10 34-7 29-5 23Q-3 19-8 18ZM-17 45Q-19 42-22 46C-25 51-32 51-32 55Q-31 59-26 55C-20 52-18 51-16 48Q-14 45-17 45ZM10 19Q6 17 8 23C10 28 17 34 20 38Q24 42 26 38C26 35 17 29 15 22Q14 17 10 19ZM23 41Q20 40 22 46C24 50 22 55 24 59Q28 64 29 59C29 54 25 52 27 45Q28 41 23 41Z"
      />
      <path
        className="plate-soft"
        d="M1-29C-1-18 0-6 2 10M-3-25Q-12-30-21-23M5-25Q15-30 24-22M-4-21C-26-29-23-11-5-13M5-21C25-29 27-10 7-13M-4-15C-25-19-22-3-4-6M6-15C27-18 25-1 7-6M-3-8C-23-9-18 8-3 1M6-8C27-8 23 8 7 1M-2-1C-16 0-12 10-2 7M6-1C21 0 18 10 7 7"
      />
      <path
        className="plate-object-paper plate-soft"
        d="M-2 12C-7 6-14 9-12 16Q-11 23-5 24L2 19 8 24Q16 23 17 15C17 9 10 8 6 12Q1 15-2 12Z"
      />
      <path
        className="plate-fine"
        d="M-2-27l5 1M-2-18l5 1M-1-10l5 1M0-2l5 1M0 6l5 1M-26 25q3 2 6 1M-25 27l-1 4M-21 27l1 4M41 13l4 5M43 12l5 3M-33 54q-5 0-7 4M-32 57l-5 4M25 61q5 4 11 2M27 64l7 2"
      />
    </g>
  );
}

/** Two courses of fitted stones. Sizes and bowed outlines are fixed drawing decisions. */
function StoneCourse({
  x,
  y,
  angle = 0,
  widths,
}: {
  x: number;
  y: number;
  angle?: number;
  widths: number[];
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle})`}
      className="plate-wall plate-soft"
    >
      {widths.map((width, index) => {
        const left = widths
          .slice(0, index)
          .reduce((sum, value) => sum + value, 0);
        const w = width - 2;
        return (
          <g key={index} transform={`translate(${left} 0)`}>
            <path
              d={
                index % 2 === 0
                  ? `M1-10Q${w / 2}-12 ${w - 1}-10Q${w + 1}-5 ${w - 1}-1Q${w / 2} 0 1-2Q-1-6 1-10Z`
                  : `M1-11Q${w / 2}-9 ${w}-10L${w - 1}-2Q${w / 2}-3 1-1Q-1-6 1-11Z`
              }
            />
            <path
              d={
                index % 3 === 0
                  ? `M0 1Q${w / 2} 0 ${w - 1} 2Q${w + 1} 5 ${w} 10Q${w / 2} 12 1 10Z`
                  : `M1 2Q${w / 2} 3 ${w} 1Q${w - 2} 6 ${w} 11Q${w / 2} 9 0 11Q-1 7 1 2Z`
              }
            />
            {index % 3 === 1 && (
              <path
                className="plate-hairline"
                fill="none"
                d={`M3-8q${w / 2 - 3} 2 ${w - 6} 0M3 8q${w / 2 - 3}-1 ${w - 6} 0`}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

function WildernessBackground() {
  return (
    <>
      <path className="plate-ground plate-no-line" d="M0 0H760V620H0Z" />
      {/* Contours, water, and the road give the plate a geography before any objects appear. */}
      <path
        className="plate-fine plate-faint"
        d="M35 104Q65 21 204 27T448 57M39 114Q89 57 135 49M277 38Q362 38 426 61M63 537Q114 565 188 554T317 560M73 552Q141 581 211 567M484 606Q438 584 420 561M57 211Q69 189 94 186M701 492Q727 472 731 430"
      />
      <path
        className="plate-water"
        d="M740 166Q673 189 628 177T547 190Q513 212 505 267T483 351Q448 381 404 411T344 478Q305 530 266 623H320Q344 552 389 511T446 452Q474 415 515 393T545 313Q543 252 566 231T634 220Q698 233 758 203"
      />
      <path
        className="plate-fine"
        d="M728 188Q669 212 633 198M613 199Q555 186 533 243M529 262Q520 295 523 321M515 347Q512 372 486 382M468 396 442 416M424 433Q388 458 374 487M349 520 326 557M320 580 308 610M555 231 548 247M731 211 707 219M396 507 381 523M347 558 333 579"
      />
      <g className="plate-faint plate-fine">
        <path d="M44 383l5-8 2 6 4-3M87 405l3-7 6 3M87 222l4-7 4 5M270 253l4-9 4 7M290 550l-7-5-3 7M436 526l6-9 3 7M566 581l4-6 6 5M680 383l5-8 4 6M716 361l4-9 4 7M428 212l3-6 7 5M579 157l4-6 3 7M90 574l5-6 7 3M122 588l4-7 6 4M230 535l5-7 6 5M611 506l4-9 4 8" />
        <path d="M64 430h13M239 232h15M457 548h17M421 578h11M590 294h17M662 467h18M106 553h19M666 166h13" />
      </g>
      <Tree x={84} y={241} scale={0.87} lean={-7} />
      <Tree x={117} y={227} scale={1.13} lean={5} variant={1} />
      <Tree x={165} y={233} scale={0.96} lean={-5} variant={2} />
      <Tree x={211} y={251} scale={1.08} lean={6} />
      <Tree x={77} y={290} scale={0.85} lean={-6} variant={2} />
      <Tree x={227} y={300} scale={0.84} lean={8} />
      <Tree x={81} y={345} scale={0.76} lean={-4} />
      <Tree x={232} y={367} scale={1.1} lean={-9} variant={1} />
      <Tree x={190} y={382} scale={0.8} lean={2} />
      <Tree x={726} y={549} scale={1.09} lean={-9} variant={2} />
      <Tree x={706} y={507} scale={0.83} lean={7} />
      <path
        className="plate-fine"
        d="M39 493 36 510 44 507 39 493M39 511v25M31 528l8-7 8 8"
      />
      <path
        className="plate-fine plate-faint"
        d="M53 508v32M30 542h26M56 509 51 513M59 520 52 524"
      />
    </>
  );
}

const wildernessObjects: Record<string, ReactNode> = {
  road: (
    <>
      <path d={roadLine} strokeWidth="23" />
      <path
        d={roadLine}
        stroke="var(--spatial-object-fill, var(--plate-rose))"
        strokeWidth="17"
      />
      <path className="plate-fine" strokeDasharray="7 12 2 13" d={roadLine} />
      {/* A narrow timber bridge occupies the actual river crossing. */}
      <path className="plate-paper" d="M492 237 548 254 542 279 485 261Z" />
      <path
        className="plate-fine"
        d="M494 240 489 261M502 243 497 263M510 245 505 266M518 247 513 268M526 249 521 270M534 251 529 272M542 254 537 275M489 235 551 253M483 264 546 283"
      />
      <path
        className="plate-fine"
        d="M548 511l-2 4M567 523l-2 4M613 537l-2 4M652 553l-3 5M666 563l-3 5M538 544l3-5M598 562l2-5M639 576l4-5"
      />
      <Tree x={626} y={549} scale={0.78} lean={5} variant={1} />
    </>
  ),
  forage: (
    <>
      <path
        className="plate-moss"
        d="M107 336C99 336 100 329 94 326C84 321 91 311 96 307C88 298 96 287 104 287C98 276 109 270 119 275C115 262 130 255 140 264C149 252 163 257 166 267C179 258 193 268 191 282C205 283 211 293 204 304C215 313 205 328 196 329C197 341 181 345 175 337C167 350 153 349 148 339C136 353 119 347 121 338Q114 344 107 336Z"
      />
      <path d="M145 358C145 337 139 321 143 299M143 333C131 321 119 321 114 304M142 339C155 329 168 328 174 308M143 315Q156 307 163 286M129 322Q120 325 111 319M161 330Q175 336 184 325" />
      <path
        className="plate-soft"
        d="M123 315Q114 310 114 301Q124 302 127 312ZM150 321Q151 308 163 306Q163 315 150 321ZM134 292Q126 287 127 278Q138 281 139 289ZM177 322Q182 311 191 312Q190 322 180 326ZM154 340Q165 338 171 342"
      />
      <path
        className="plate-hairline"
        d="M99 310q-3 7 4 11M112 279q-8 0-8 5M126 266q-6 1-6 7M180 272q8 3 6 8M193 290q6 3 5 9M115 334q-6 2-10-4M136 344q7-2 8-6M185 333q6-2 7-6M124 305l2 5M154 315l6-6M181 320l6-5M145 346q3 6 2 12"
      />
      <g className="plate-rose plate-soft">
        <path d="M114 298q1-5 6-3t3 7q-3 5-7 1t-2-5ZM124 290q6-2 8 3t-3 7q-6 1-6-4t1-6ZM120 306q5-4 8 1t-2 7q-5 2-7-2t1-6ZM170 301q5-4 8 1t-1 7q-6 2-8-2t1-6ZM180 296q5-3 8 2t-2 7q-6 1-7-3t1-6ZM177 311q5-4 8 1t-1 8q-6 1-8-4t1-5ZM151 280q5-4 8 1t-2 7q-6 1-7-3t1-5ZM162 275q5-3 7 2t-2 7q-6 0-6-4t1-5Z" />
      </g>
      <path
        className="plate-fine"
        d="M126 365q20-6 38-1M131 370q10-2 22 0M111 351q-3 4-1 7M170 351q3 3 6 2"
      />
    </>
  ),
  offroad: (
    <>
      <path d={offroadLine} stroke="var(--plate-paper)" strokeWidth="16" />
      <path strokeDasharray="10 9 3 8" d={offroadLine} />
      <path
        className="plate-fine"
        d="M217 463 222 466M224 457 229 460M202 458 207 460M209 452 214 454M185 459 190 461M191 449 196 451M176 453 181 455M165 444 169 446M159 435 163 437"
      />
      <path
        className="plate-moss"
        d="M136 432 133 415 143 414 152 430 147 443Z"
      />
      <path
        className="plate-fine"
        d="M140 418 145 436M127 436l-6 5M154 446l5 5M236 474l7-4M263 440l3-6"
      />
      <path d="M122 473l7-20 6 17M161 478l3-18 7 15" />
    </>
  ),
  tracks: (
    <>
      {[
        [355, 309, -34],
        [373, 320, -29],
        [383, 341, -4],
        [405, 338, 15],
        [419, 316, 34],
        [442, 303, 43],
      ].map(([x, y, angle], index) => (
        <g
          key={index}
          transform={`translate(${x} ${y}) rotate(${angle})`}
          className="plate-rose plate-soft"
        >
          <path d="M-5 1C-8-5-5-13 1-13C7-13 9-5 6 1Q4 5 0 4L-3 4Q-5 3-5 1ZM-3 8Q1 7 4 8L3 13Q0 16-4 12Z" />
          <path
            className="plate-hairline"
            d="M-4-7q4-2 9 0M-4-3q4-1 8 0M-1 1h4M-2 10h4"
            fill="none"
          />
        </g>
      ))}
      <path
        className="plate-hairline"
        d="M345 304l-3-2M363 336l-3 2M391 357l7 2M425 337l6-1M451 316l5-2M368 292l7-1"
      />
    </>
  ),
  camp: (
    <>
      <path
        className="plate-fine"
        d="M449 442Q475 458 512 451T592 442M461 448q-4 1-4 5M568 451q3 3 6 4M473 458l-2 4"
      />
      <path
        className="plate-rose"
        d="M465 419C475 404 478 381 486 371Q513 371 544 361C550 379 562 397 574 415Q551 419 534 429Q499 420 465 419Z"
      />
      <path
        className="plate-ink"
        d="M486 371C496 393 516 412 534 429C535 405 540 382 544 361Q514 375 486 371Z"
      />
      <path
        className="plate-rose"
        d="M485 373Q493 386 499 393C494 409 490 414 486 419L468 419Q479 391 485 373Z"
      />
      <path
        className="plate-paper"
        d="M545 364C541 387 537 402 537 424Q551 416 572 414C559 400 549 383 545 364Z"
      />
      <path
        className="plate-fine"
        d="M486 378Q481 402 476 411M490 390Q487 406 482 414M545 374Q547 393 563 409M542 392Q545 405 551 413M548 385l5 11M551 400l5 8M465 418Q461 426 454 433M574 414Q580 425 588 431M452 429l3 9M587 428l2 9"
      />
      <path
        className="plate-ink"
        d="M519 447q13-7 30-11l4 4q-14 6-30 11ZM523 436q12 3 29 13l-4 3q-16-10-27-13Z"
      />
      <path
        className="plate-rose"
        d="M530 439C519 434 520 420 531 412Q528 422 534 424C541 415 546 411 542 402C552 412 558 426 549 436Q542 443 530 439Z"
      />
      <path
        className="plate-fine"
        d="M534 436q-6-7 2-15M550 397q13-14 4-22M549 367q-8-11 3-20"
      />
      <path
        className="plate-moss plate-soft"
        d="M509 445q1-7 7-7q7 2 4 7t-11 0ZM548 452q4-8 9-7t2 7q-5 6-11 0ZM528 452q5-3 9 1q0 5-8 4Z"
      />
    </>
  ),
  weather: (
    <>
      <path
        className="plate-object-paper"
        d="M550 100Q533 85 545 72 557 57 575 65 579 43 602 44 625 39 636 62 661 52 671 70 693 65 698 83 712 104 687 110L554 111Q541 109 550 100Z"
      />
      <path
        className="plate-fine"
        d="M548 90q11-9 23-1M578 64q7 0 10 7M638 62q-3 5-1 12M671 73q-1 7 5 12M574 102h96M598 106h76M610 48q-14 1-20 13"
      />
      <path d="M566 119l-5 12M590 120l-5 12M620 119l-5 13M645 122l-4 10M671 119l-4 11M602 138l-2 5M653 139l-2 4" />
      <path className="plate-fine" d="M701 59l5-4M697 42l6-7M713 75l9-1" />
    </>
  ),
  village: (
    <>
      <path
        className="plate-paper"
        d="M132 113Q152 107 174 104L193 118Q190 137 191 160L165 170Q149 162 134 159Q138 136 132 113ZM218 131Q236 125 254 124L272 135Q270 156 272 174Q247 180 222 169Q224 149 218 131ZM168 154Q186 150 201 147L227 158Q224 172 226 184Q198 192 169 180Z"
      />
      <path
        className="plate-rose"
        d="M121 119C137 104 151 82 165 66C176 84 189 102 204 117Q183 109 164 107Q143 114 121 119ZM207 135C224 124 234 105 248 93Q263 119 283 136Q264 128 247 126Q226 133 207 135ZM160 162C176 147 186 128 200 113Q214 140 236 159Q218 155 199 150Q179 157 160 162Z"
      />
      <path
        className="plate-soft"
        d="M164 69Q163 89 164 105M249 96Q246 113 247 126M201 118Q198 134 200 149M136 121Q136 139 136 157M170 111Q168 135 169 163M225 135Q225 151 223 169M253 130Q251 153 252 174M199 153Q201 170 198 186M174 160Q174 172 173 181M223 162Q221 173 224 183"
      />
      <path
        className="plate-ink"
        d="M143 139Q141 129 145 125Q152 121 155 126L156 139Q148 137 143 139ZM229 157Q229 145 235 143Q242 144 242 156Q236 154 229 157ZM181 180Q180 165 187 165Q194 165 193 184ZM208 181Q207 168 212 165Q219 163 220 177Z"
      />
      <path
        className="plate-paper"
        d="M176 95Q178 83 177 70Q182 67 189 70Q186 88 188 108Z"
      />
      <path
        className="plate-hairline"
        d="M180 74q3-1 6 0M179 82l7 2M178 90l8 2M145 127v9M147 132l7-1M234 146v8M231 151l9-1M138 146l18 4M139 151l9 3M172 145l14 5M225 161l17 4M204 176l2 8M176 165l5 1M137 108q10-12 19-27M143 109q10-10 16-24M151 107l8-11M172 84q9 16 16 21M176 96l6 9M219 127q10-12 22-24M228 126q7-8 13-15M255 111q8 13 14 17M173 151q12-13 20-26M183 150q8-7 12-18M205 130q8 14 17 23"
      />
      <path
        className="plate-ink plate-no-line"
        d="M123 118q17-5 41-11l-29 16ZM207 135q24-2 40-9l-24 14ZM162 163q15-8 37-13l-29 17Z"
      />
      <path
        className="plate-soft"
        d="M106 171Q145 193 186 193M219 193Q251 188 279 177M111 177q-1-9 1-16M122 182q-2-8-1-16M133 187q1-9-1-16M145 191q-2-9 0-16M158 194q2-9 0-16M171 196q-2-9-1-16M230 193q2-8 0-15M244 189q-1-9 1-15M258 185q-2-7-1-15M272 181q1-8-1-15"
      />
      <path
        className="plate-fine"
        d="M178 56q-8-9 2-15M182 46q9-11 1-20M109 190q20 8 34 9M235 200q18-3 31-10"
      />
    </>
  ),
  corpse: (
    <>
      <path
        className="plate-fine plate-faint"
        d="M614 281Q630 260 664 263T720 302M626 320q22 22 70 9M637 337l-7 3M702 326l6 2"
      />
      <Bones x={671} y={295} angle={-33} />
      <path className="plate-rose" d="M709 284q12-9 15 3l-4 15-14-5Z" />
      <path
        className="plate-fine"
        d="M711 283l10 4M717 286l-4 13M640 257l-8-4M705 330l7 3"
      />
    </>
  ),
  distances: (
    <>
      <path
        className="plate-rose"
        d="M376 194C378 177 376 152 381 142Q385 130 394 123Q405 125 415 133C421 151 418 174 423 192Q414 199 405 200Q389 199 376 194Z"
      />
      <path
        className="plate-soft"
        d="M394 125Q390 148 394 171Q395 183 392 194M385 193Q400 196 418 190M402 145q5 3 10 2M402 154q4 2 11 2M403 166q6 2 9 1"
      />
      <path
        className="plate-hairline"
        d="M383 151q-2 11-1 20M386 143q-3 10-2 16M415 151q-1 15 2 24M418 180l2 9M379 185l1 6M399 134q6 0 9 4M368 201q30 9 60-3M375 209q7-1 13 1"
      />
      <path className="plate-ink" d="M409 174q2 1 5 4l-6 2Z" />
    </>
  ),
};

function DungeonBackground() {
  return (
    <>
      <defs>
        <pattern
          id="spatial-floor-stipple"
          width="37"
          height="31"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M5 9h1M27 21h1M18 3h1"
            stroke="var(--plate-ink)"
            opacity=".18"
            strokeWidth="1.5"
          />
        </pattern>
        <clipPath id="spatial-floor-clip">
          <path d={chamber} />
        </clipPath>
      </defs>
      <path className="plate-ground plate-no-line" d="M0 0H760V620H0Z" />
      {/* The rough cave breaches the east wall instead of becoming another rectangular room. */}
      <path d={cave} className="plate-ink" strokeWidth="3" />
      <path
        d={cave}
        className="plate-moss"
        transform="translate(603 410) scale(.9) translate(-603 -410)"
      />
      <g className="plate-moss plate-soft">
        <path d="M532 335q8-8 13-3t-1 10q-10 4-12-2ZM551 334q9-1 13 4t-5 6q-9-2-8-10ZM578 331q3-11 10-12t6 8q-9 7-12 10ZM600 322q8-2 14 3t-2 8q-12 0-12-11ZM621 328q10-2 15 7t-5 9q-8-5-10-16ZM644 343q6-3 13 4t-1 10q-10-4-12-14ZM666 353q8-4 12 3t-1 10q-10 1-11-8ZM680 374q2-5 7 0t5 12q-2 6-8 3t-4-15ZM694 397q8-2 11 9t-4 10q-10-4-7-19ZM693 426q8-5 6 4t-9 12q-10 0-6-7ZM675 448q6-4 7 4t-5 11q-9-1-7-8ZM664 469q8-3 7 4t-9 9q-10-1-7-7ZM642 483q7-4 11 1t-4 9q-10 6-13-1ZM621 495q7-5 5 4t-8 8q-9-3-7-8ZM598 490q8 0 9 8t-9 5q-9-7-5-11ZM581 483q6-1 10 6t-1 7q-7 0-14-10ZM555 466q6-3 13 4t-2 9q-10-1-11-13ZM538 451q6-5 11 3t-2 10q-10-1-9-13ZM529 430q6-3 11 4t-1 9q-11-3-10-13ZM522 409q7 2 10 8t-6 7q-8-5-8-12ZM501 384q8-6 13 1t-1 10q-12-1-12-11ZM513 351q7-5 11-1t-1 11q-8 1-10-10Z" />
      </g>
      <path className="plate-moss" d={chamber} />
      <path d={chamber} fill="url(#spatial-floor-stipple)" />
      <g clipPath="url(#spatial-floor-clip)" className="plate-soft">
        <path d="M220 272Q247 267 271 273T325 269Q350 275 378 272T431 269Q453 273 476 270L518 267M214 326Q245 327 270 322Q294 330 323 325T376 326Q404 333 432 326T481 324L525 328M214 379Q239 377 264 382Q291 373 322 377Q350 386 375 380T429 378Q457 385 491 377M214 429Q241 427 269 432T322 426Q345 431 376 430T430 429Q460 434 491 430M272 219Q277 247 271 273Q268 299 273 321Q265 349 265 380Q271 401 269 432L265 461M326 219Q318 242 325 268Q332 297 323 325Q318 349 322 376Q314 402 322 426L325 459M379 161Q374 190 379 217Q386 240 378 272Q369 297 376 326Q382 351 375 380Q367 405 376 430L373 462M432 165Q426 192 430 218Q439 246 431 269Q423 297 432 326Q439 351 429 378Q423 404 430 429L433 461M486 220Q481 245 487 270Q491 297 482 322Q479 342 482 355M522 267Q548 271 575 267T630 264M574 219Q581 243 575 267Q568 294 572 318M327 504Q348 500 375 507T420 503M327 548Q350 551 373 552T420 548M375 463Q369 486 375 507Q378 529 373 552Q368 579 377 601M359 92Q389 96 419 93M359 126Q391 122 421 127" />
        <path
          className="plate-fine"
          d="M294 226q-7 8-7 15l9 7q-6 8-5 18M446 282l-12 10q3 8 5 17l-13 17M230 344q9 4 16 8l-4 22M350 439l-7-8 2-11M459 431l10 7q-5 12-6 20M530 230l12 3 6-5M605 285q-2 6-9 8l5 15M353 571q7 5 12 6l-5 18M394 73l10 7q8-5 15-5"
        />
        <path
          className="plate-ink plate-no-line"
          d="M268 270q6 3 11 1l-8 7ZM318 323q9 3 12-4l-4 11ZM373 377q6 5 12 0l-9 9ZM425 267q7 4 13-1l-8 10ZM267 427q1 6 8 6l-6 5ZM479 321q5 6 12 2l-9 8ZM372 505q6 3 11 2l-6 6Z"
        />
        <path
          className="plate-hairline"
          d="M234 277q10-3 20-1M279 275l7 1M335 277q8 2 16 0M394 277q8-2 15-2M279 330l8 1M348 331q10-2 15 0M392 334q9 2 15 0M224 384l13 1M277 386q9-4 14-3M341 386l14 1M444 388l14-2M239 436l11 1M333 437q12 2 20 1M387 434l14 1M435 436l11 2M270 236l1 10M280 286l1 12M329 349l-1 9M381 392l-1 13M439 288l1 12M581 278l-1 11M380 562l-1 13"
        />
      </g>
      {/* Fitted bricks follow the room boundary; the mortar is the same dark ink as its recesses. */}
      <path d={chamber} stroke="var(--plate-ink)" strokeWidth="31" />
      <StoneCourse x={225} y={220} widths={[18, 23, 20, 17, 23]} />
      <StoneCourse x={327} y={168} angle={90} widths={[16, 21, 17]} />
      <StoneCourse x={331} y={160} widths={[17, 19]} />
      <StoneCourse
        x={358}
        y={46}
        angle={90}
        widths={[18, 22, 17, 21, 19, 19]}
      />
      <StoneCourse
        x={419}
        y={43}
        angle={90}
        widths={[23, 18, 22, 16, 23, 18]}
      />
      <StoneCourse x={420} y={161} widths={[17, 17]} />
      <StoneCourse x={452} y={167} angle={90} widths={[18, 17, 21]} />
      <StoneCourse
        x={455}
        y={220}
        widths={[20, 17, 21, 19, 23, 17, 24, 20, 14]}
      />
      <StoneCourse x={629} y={226} angle={90} widths={[18, 23, 17, 21, 18]} />
      <StoneCourse x={522} y={317} widths={[17, 22, 18, 24, 24]} />
      <StoneCourse x={519} y={323} angle={90} widths={[18, 17]} />
      <StoneCourse x={487} y={357} widths={[18, 17]} />
      <StoneCourse x={489} y={361} angle={90} widths={[21, 18, 23, 17, 17]} />
      <StoneCourse x={421} y={460} widths={[18, 23, 24]} />
      <StoneCourse
        x={419}
        y={465}
        angle={90}
        widths={[17, 24, 18, 22, 17, 24, 14]}
      />
      <StoneCourse
        x={329}
        y={465}
        angle={90}
        widths={[22, 17, 24, 19, 21, 17, 15]}
      />
      <StoneCourse x={216} y={459} widths={[18, 22, 17, 24, 20, 23]} />
      <StoneCourse
        x={214}
        y={225}
        angle={90}
        widths={[20, 18, 23, 17, 22, 19, 24, 18, 21, 17, 23, 13]}
      />
      {/* Intentional open ends and the breached passage into the cave. */}
      <path
        d="M348 40 430 39M315 601 433 602"
        stroke="var(--plate-ground)"
        strokeWidth="36"
      />
      <path d="M494 349 522 380" stroke="var(--plate-moss)" strokeWidth="46" />
      <path
        className="plate-fine"
        d="M490 337l-7 9 8 5M520 388l9-6 4 7M498 350l6-5 6 5-4 7ZM523 360l8 3-2 9-8-3ZM482 366l6 2M509 384l7 6"
      />
      <path
        className="plate-fine"
        d="M190 229l-15 9M189 250l-12 7M189 280l-14 8M187 301l-14 6M187 323l-15 8M188 448l-13 8M203 483l-10 13M229 486l-6 12M251 487l-7 10M274 486l-6 12M306 483l-5 13M302 517l-13 6M301 542l-12 7M300 567l-13 7M300 592l-13 5M444 527l13 5M444 552l11 5M445 576l13 6M451 486l7 12M479 483l8 10M509 448l12 6M509 421l13 4M650 239l15-5M652 263l13-2M651 288l14 4M649 316l14 7M607 341l-4 8M579 352l-7 6M664 373l-7 4M680 414l-8 1M652 465l-7-7M596 475l3-9M553 434l8-4M525 397l10-3M304 202l-12-5M304 178l-14-5M335 136l-14-3M333 110l-11-2M333 84l-14-2M445 73l12-4M447 102l11-2M447 130l12-4M478 184l13-3M478 207l11-2M506 195l3-14M538 193l2-14M568 193l1-14M598 191l-1-13"
      />
      <g className="plate-fine plate-faint">
        <path d="M568 390l8-7 8 3M659 423l10 7M585 459l4-9M646 346l4 7M679 395l8 3M598 369l9-3M535 414l4 9M239 437h7M346 345h4M460 242h7M383 185h5M305 443h5M466 359h5M552 290h4" />
        <path d="M95 248q16-8 36-5M87 255q21-9 47-5M94 263h25M613 555q36 10 66-8M626 563q26 5 42-5" />
      </g>
      <path
        className="plate-fine"
        d="M91 446 88 464 96 461 91 446M91 465v27M83 485l8-7 8 8M80 499h25"
      />
    </>
  );
}

const dungeonObjects: Record<string, ReactNode> = {
  entrance: (
    <>
      <path
        className="plate-ink"
        d="M332 591Q325 568 337 546C349 516 390 511 409 541Q426 565 414 593L395 589Q402 566 392 550Q374 531 357 551Q347 565 353 590Z"
      />
      <path
        className="plate-wall"
        d="M333 589Q328 569 335 550C342 531 355 521 372 521C390 519 405 533 413 551Q422 570 413 590L399 587Q404 568 398 553C389 532 362 533 353 552Q346 568 350 588Z"
      />
      <path
        className="plate-soft"
        d="M335 553q6 4 17 6M331 572q10 0 17 4M399 558q7-3 16-3M403 575q8 0 13-4M345 536q7 4 13 12M364 523q4 7 4 16M384 524q-3 7-4 15M402 537q-6 3-10 9"
      />
      <path
        className="plate-hairline"
        d="M339 561q-3 6-2 13M346 540l8 6M369 526l1 7M396 540l-3 4M409 564v7M336 587l8-1M405 585l6-2"
      />
      <path
        className="plate-fine"
        d="M355 584q3-5 6-6M388 584q-4-3-6-6M365 594q6-1 14 0"
      />
    </>
  ),
  masonry: (
    <>
      <path
        className="plate-ink"
        d="M195 344Q211 340 231 344L232 376Q225 388 229 400L232 429Q211 433 194 428L189 404Q196 379 191 359Z"
      />
      <path
        className="plate-wall"
        d="M197 346Q209 343 225 346Q229 357 225 372Q212 376 196 373Q194 361 197 346ZM194 379Q210 376 225 379Q225 389 220 398Q209 401 195 400Q191 389 194 379ZM198 404Q210 400 226 402Q228 413 226 425Q212 427 198 424Q195 416 198 404Z"
      />
      <path
        className="plate-soft"
        d="M212 347q-3 13 1 27M209 379q2 9-1 21M213 404q-2 10 3 21"
      />
      <path
        className="plate-hairline"
        d="M200 350q3-2 8-1M216 349l7 1M199 357l-1 9M196 382q5-2 9-1M215 383l6-1M200 407q5-1 10-1M219 408l5-1M203 421l7 1M239 367l8-3M237 411l5 1"
      />
    </>
  ),
  door: (
    <>
      <path
        className="plate-ink"
        d="M338 461Q373 458 407 462Q411 482 408 504Q373 510 338 505Z"
      />
      <path
        className="plate-rose"
        d="M343 458Q373 455 403 459Q406 478 402 498Q373 502 342 499Q344 478 343 458Z"
      />
      <path
        className="plate-soft"
        d="M354 459Q351 479 353 498M366 459Q368 479 364 499M379 460Q381 479 379 498M393 460Q391 478 393 498M343 469Q375 471 404 470M343 486Q374 483 403 485"
      />
      <path
        className="plate-paper plate-soft"
        d="M338 466q5-1 11 0l1 8q-6 1-12 0ZM338 483q6-2 11 0l-1 8q-5-2-10 0Z"
      />
      <path className="plate-ink" d="M388 477q4-3 6 1t-2 5q-4 0-4-3Z" />
      <path
        className="plate-hairline"
        d="M357 474q2 6 1 10M373 473q-2 5 1 8M384 465v4M399 487q1 6-1 8M346 488v6M351 506q21 1 47-1M354 512q17-2 35-1"
      />
    </>
  ),
  contents: (
    <>
      <path
        className="plate-rose"
        d="M367 254C369 261 359 261 360 272C360 284 366 289 376 288C386 287 391 280 387 270C384 263 380 261 381 254Z"
      />
      <path
        className="plate-paper plate-soft"
        d="M365 250Q374 246 383 251L381 256Q371 258 365 254Z"
      />
      <path
        className="plate-fine"
        d="M364 271q-1 10 7 13M370 253q5 1 9-1M382 267q5 7 1 14"
      />
      <path
        className="plate-rose"
        d="M405 262Q400 268 404 277Q411 284 421 278Q428 272 421 261Z"
      />
      <ellipse className="plate-ink" cx="413" cy="261" rx="9" ry="3" />
      <path
        className="plate-paper plate-soft"
        d="M390 306Q394 299 393 291L413 286Q417 293 425 295Q421 302 422 310Q416 308 411 313Q401 307 390 306Z"
      />
      <path
        className="plate-fine"
        d="M395 292Q397 299 404 301Q406 294 414 289M404 301q2 7 7 12M392 307q5-5 12-6M407 270q-1 5 3 7M372 300q2-5 7-4l4 6-8 3ZM433 278q4 2 7 5l-5 6M377 309l-6 4M414 320l7 1"
      />
    </>
  ),
  furnishing: (
    <>
      <g transform="translate(280 317) scale(.92) translate(-280 -317)">
        <path
          className="plate-ink"
          d="M246 294Q270 285 299 286Q311 314 317 342Q294 352 266 357Q253 323 246 294Z"
        />
        <path
          className="plate-rose"
          d="M244 291Q270 280 298 278C301 295 310 314 313 333Q288 344 259 347Q253 319 244 291Z"
        />
        <path
          className="plate-soft"
          d="M252 289Q254 316 265 344M266 285Q269 316 278 341M279 282Q282 310 291 337M293 280Q296 307 305 334M246 296Q272 286 299 284M260 342Q287 337 311 328"
        />
        <path
          className="plate-paper plate-soft"
          d="M250 290q-4-6-3-11q6-4 12-4l4 12ZM298 288q5-5 10-4q4 5 4 11l-9 3ZM259 342q-5 0-10 4q-1 6 4 9l9-3ZM307 332q3-4 10-4q5 4 4 10l-10 5Z"
        />
        <path
          className="plate-paper plate-soft"
          d="M267 309Q270 303 272 297Q282 299 291 305Q288 310 286 317Q276 311 267 309Z"
        />
        <path
          className="plate-hairline"
          d="M274 301q7 2 11 5M273 305q4 1 9 4M263 318q3 6 4 13M268 326q2 8 5 11M296 308q1 7 4 12M281 286q2 5 3 8M250 305l4 15M283 334l-7 2M278 328q-4-2-6 1t3 3M248 361q7-1 12-5"
        />
        <path
          className="plate-paper plate-soft"
          d="M281 325q3-5 8-2t3 7q-5 6-10 1Z"
        />
        <path className="plate-fine" d="M283 325q4 3 7 0" />
      </g>
    </>
  ),
  chest: (
    <>
      <g transform="translate(576 263) scale(.92) translate(-576 -263)">
        <path
          className="plate-ink"
          d="M540 246Q568 233 599 233Q613 246 620 259L615 286Q590 292 555 298L541 281Z"
        />
        <path
          className="plate-rose"
          d="M538 247C534 234 539 226 550 224L587 217C600 215 606 224 607 235L612 273Q588 282 552 287Q543 280 541 272Z"
        />
        <path
          className="plate-soft"
          d="M538 246Q566 246 599 233Q603 238 609 247Q581 256 549 260Q542 256 538 246ZM549 260Q549 273 552 286M541 270q5 1 10-2M552 225C561 226 563 234 562 243Q564 264 568 282M582 219C590 221 593 227 593 236Q594 257 599 277"
        />
        <path
          className="plate-paper plate-soft"
          d="M569 249Q574 247 580 247L582 262Q577 264 572 263Z"
        />
        <path
          className="plate-ink"
          d="M575 253q3-2 4 1t-1 3v3h-2v-3q-2-1-1-4Z"
        />
        <path
          className="plate-hairline"
          d="M544 241q-3-9 4-12M547 240q-1-8 4-10M565 230q11-1 18-4M567 234q12-2 18-5M554 269q3 6 2 11M570 279l22-5M583 266l10-3M604 251q2 10 3 17M542 256l3 9M550 300q17-1 29-6"
        />
      </g>
    </>
  ),
  trap: (
    <>
      <path
        className="plate-ink"
        d="M371 377Q406 376 441 371Q449 395 454 417Q417 425 381 428Z"
      />
      <path
        className="plate-object-paper"
        d="M363 374Q394 368 426 367Q436 384 439 407Q409 410 375 417Q368 397 363 374Z"
      />
      <path
        className="plate-fine"
        d="M367 378Q393 374 422 372Q429 386 431 403M375 412q22-4 44-6M391 371l-4 12q6 2 12 6l-4 10q7 4 12 11M415 371l-5 6M436 416q5-9 9-18M424 419l5-7M400 422l5-6"
      />
      <path
        className="plate-rose plate-soft"
        d="M441 402q3-8 2-15q4 7 6 15ZM436 419q4-6 4-14q0 10 4 13ZM417 423q4-6 4-13l5 11Z"
      />
      <path
        className="plate-hairline"
        d="M360 428l10-3M452 429l7-2M374 382l3 13M379 396l2 9M399 373l11-1"
      />
    </>
  ),
  passage: (
    <>
      <path
        className="plate-ink"
        d="M366 149Q364 101 362 53Q387 49 413 52Q413 104 416 150Z"
      />
      <path
        className="plate-object-paper plate-soft"
        d="M363 55Q387 57 412 53L412 64Q386 67 363 64ZM364 73Q387 77 413 71L413 79Q388 83 364 79ZM364 90Q388 93 413 88L414 96Q389 100 365 96ZM365 107Q390 110 414 106L414 113Q391 117 365 114ZM366 126Q390 128 415 124L416 131Q391 136 366 133ZM367 144Q392 146 416 141L416 149Q391 153 366 149Z"
      />
      <path
        className="plate-hairline"
        d="M369 59q15 3 32-1M372 76q12 2 29 0M371 93q14 1 31-1M373 110q13 2 28-1M373 129q15 2 33-1M374 147q15 2 29-1"
      />
    </>
  ),
  light: (
    <>
      <path
        className="plate-ink"
        d="M237 223Q245 219 256 224L258 247Q249 258 241 250Z"
      />
      <path
        className="plate-paper"
        d="M231 224Q243 215 263 222L267 236Q256 249 236 237Z"
      />
      <path
        className="plate-rose"
        d="M238 223C223 212 230 200 239 194Q234 202 240 207C249 196 255 187 249 177C260 186 271 199 267 211Q265 220 256 225Z"
      />
      <path
        className="plate-object-paper"
        d="M232 223Q248 230 265 221C265 235 260 240 248 240Q236 239 232 223Z"
      />
      <path
        className="plate-soft"
        d="M233 224Q248 231 264 224M248 240l1 11M242 249q7 4 13 0"
      />
      <path
        className="plate-hairline"
        d="M240 230q1 6 6 7M250 235q6 0 10-5M247 218q-7-8 5-19M256 211q5-8 0-16"
      />
      <path
        className="plate-fine"
        stroke="var(--plate-paper)"
        d="M232 187l-5-6M270 185l5-6M281 202l7-1M218 203l-6-1M250 169v-9"
      />
    </>
  ),
  corpse: (
    <>
      <path
        className="plate-fine"
        d="M565 419q10 33 55 42M593 368q39-14 72 31M572 442l8 2M665 445l7-2M630 470l8-2"
      />
      <Bones x={620} y={412} angle={-55} scale={0.84} />
      <path className="plate-rose" d="M666 425q10-11 18 1l-2 17-18-2Z" />
      <path
        className="plate-fine"
        d="M666 426l15 3M674 429l-2 10M587 454l-6 6M634 366l7-2"
      />
    </>
  ),
  sounds: (
    <>
      {/* A marginal ear is deliberately pictographic, unlike the physical chamber objects. */}
      <path
        className="plate-object-paper"
        d="M652 144Q648 132 637 120 623 105 636 89 649 72 670 87 687 99 676 122L669 137Q667 151 658 152Z"
      />
      <path d="M643 111Q631 97 646 91 662 83 669 102Q673 112 661 122L658 133M648 116Q660 113 656 103 650 98 645 103" />
      <path
        className="plate-fine"
        stroke="var(--plate-paper)"
        d="M693 97q15 17 0 35M704 90q20 23 0 47M613 110h-11M619 92l-10-7M621 130l-9 6"
      />
    </>
  ),
};

export function SpatialArtwork({
  sceneId,
  target,
}: {
  sceneId: SpatialArtworkScene;
  target?: string;
}) {
  const artwork = target ? (
    (sceneId === 'wilderness' ? wildernessObjects : dungeonObjects)[target]
  ) : sceneId === 'wilderness' ? (
    <WildernessBackground />
  ) : (
    <DungeonBackground />
  );
  if (target && !artwork)
    throw new Error(`Missing spatial artwork: ${sceneId}/${target}`);
  return (
    <g className="spatial-art" aria-hidden="true">
      {artwork}
    </g>
  );
}
