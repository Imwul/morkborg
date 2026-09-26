import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-proxy-server'] });
const reports = [];
const output = 'outputs/combat-tool';
await mkdir(output, { recursive: true });
try {
  for (const width of (process.env.WIDTHS || '360,768,1440,3440').split(',').map(Number)) {
    const context = await browser.newContext({ viewport: { width, height: 1080 }, isMobile: width === 360, hasTouch: width === 360 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(process.env.REFERENCE_URL || 'http://127.0.0.1:5173');
      const launcher = page.getByRole('button', { name: '전투', exact: true });
      if (width === 360) await launcher.tap(); else await launcher.click();
      const panel = page.getByRole('dialog', { name: /전투 도구/ });
      await panel.waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${output}/overview-${width}.png` });
      await panel.getByRole('button', { name: '+ 아군 추가', exact: true }).click();
      await panel.getByRole('button', { name: '+ 적 추가', exact: true }).click();
      const pc = panel.locator('[data-combatant-id][data-side="pc"]');
      const enemy = panel.locator('[data-combatant-id][data-side="enemy"]');
      async function edit(owner, label, value) {
        const input = owner.getByRole('spinbutton', { name: label, exact: true });
        await input.fill(String(value)); await input.press('Tab');
      }
      async function textEdit(owner, label, value) {
        const input = owner.getByRole('textbox', { name: label, exact: true });
        await input.fill(value); await input.press('Tab');
      }
      for (const owner of [pc, enemy]) { await edit(owner, '최대 HP', 12); await edit(owner, 'HP', 12); }
      await edit(pc, 'Strength', 2); await edit(pc, 'Agility', 1); await edit(pc, 'Presence', 3); await edit(pc, 'Omen', 3);
      await pc.getByText('장비·추가 설정', { exact: true }).click();
      await pc.getByRole('combobox', { name: '방어구 빠른 설정' }).selectOption('2');
      await textEdit(enemy, '방어구 감소', 'd2'); await textEdit(enemy, '무기 피해', 'd8');
      await textEdit(pc, '상태 메모', '실드 마법 · 보정은 직접 입력');
      await panel.getByRole('button', { name: '실물 값 입력', exact: true }).click();
      await panel.getByRole('spinbutton', { name: '선공 d6', exact: true }).fill('6');
      await panel.getByRole('button', { name: '선공 판정 · 시작', exact: true }).click();
      assert.match(await panel.locator('.combat-round').innerText(), /1 R.*선공/s);
      await page.evaluate(() => document.fonts.ready);
      await panel.locator('.combat-rosters').scrollIntoViewIfNeeded();
      await panel.screenshot({ path: `${output}/roster-${width}.png` });
      const pcId = await pc.getAttribute('data-combatant-id'), enemyId = await enemy.getAttribute('data-combatant-id');
      const pair = async (a, t) => { await panel.getByRole('combobox', { name: '공격자', exact: true }).selectOption(a); await panel.getByRole('combobox', { name: '대상', exact: true }).selectOption(t); };
      await pair(pcId, enemyId);
      async function manual(test, damage = '', armor = '') {
        await panel.getByRole('textbox', { name: '판정 d20', exact: true }).fill(test);
        await panel.getByRole('textbox', { name: '무기 피해 실물 값', exact: true }).fill(damage);
        await panel.getByRole('textbox', { name: '방어구 실물 값', exact: true }).fill(armor);
        await panel.getByRole('button', { name: '입력값으로 판정 →', exact: true }).click();
      }
      await manual('20', '5', '1');
      assert.match(await panel.locator('.combat-critical').innerText(), /CRITICAL.*자동 변경하지 않습니다/s);
      assert.equal(await enemy.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '12');
      assert.equal(await panel.locator('.combat-damage strong').innerText(), '4');
      await panel.screenshot({ path: `${output}/critical-${width}.png` });
      await panel.getByText('결과를 본 뒤 Omen 효과 선택', { exact: true }).click();
      await panel.getByRole('button', { name: '현재 눈 그대로 효과 계산', exact: true }).click();
      assert.equal(await panel.locator('.combat-critical').count(), 0);
      assert.match(await panel.locator('.combat-dice-results').innerText(), /20/);
      assert.equal(await pc.getByRole('spinbutton', { name: 'Omen', exact: true }).inputValue(), '3');
      await panel.getByRole('combobox', { name: '결과 후 Omen 효과', exact: true }).selectOption('none');
      await panel.getByRole('button', { name: '현재 눈 그대로 효과 계산', exact: true }).click();
      assert.match(await panel.locator('.combat-critical').innerText(), /CRITICAL/);
      await panel.getByText('결과를 본 뒤 Omen 효과 선택', { exact: true }).click();
      await panel.getByRole('button', { name: '결과 적용 · HP 반영', exact: true }).click();
      assert.equal(await enemy.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '8');
      assert.equal(await enemy.getByRole('textbox', { name: '방어구 감소', exact: true }).inputValue(), 'd2');
      await textEdit(enemy, '상태 메모', '주문으로 둔화'); await textEdit(enemy, '무기 피해', '2d4+1');
      await panel.getByRole('button', { name: '후공으로 →', exact: true }).click();
      assert.match(await panel.locator('.combat-round').innerText(), /후공.*적/s);
      await pair(enemyId, pcId);
      await manual('1', '2,3', '2');
      assert.match(await panel.locator('.combat-critical').innerText(), /FUMBLE/);
      assert.equal(await panel.locator('.combat-damage strong').innerText(), '4');
      await panel.getByText('피해 직접 수정 · 판정 값 수정', { exact: true }).click();
      await edit(panel, '최종 피해 직접 지정', 5);
      await panel.getByRole('button', { name: '결과 적용 · HP 반영', exact: true }).click();
      assert.equal(await pc.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '7');
      assert.equal(await pc.getByRole('textbox', { name: '방어구 감소', exact: true }).inputValue(), 'd4');
      const checkpoint = panel.getByRole('combobox', { name: '복원할 차례' });
      const firstValue = await checkpoint.locator('option').evaluateAll(options => options.find(o => o.textContent.startsWith('1R · 선공')).value);
      await checkpoint.selectOption(firstValue);
      await panel.getByRole('button', { name: '시작점 복원', exact: true }).click();
      assert.equal(await pc.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '12');
      assert.equal(await enemy.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '12');
      assert.equal(await enemy.getByRole('textbox', { name: '무기 피해', exact: true }).inputValue(), 'd8');
      assert.equal(await enemy.getByRole('textbox', { name: '상태 메모', exact: true }).inputValue(), '');
      await panel.getByText('Omen · 방패 · 예외 처리', { exact: true }).click();
      await pair(pcId, enemyId);
      await panel.getByRole('combobox', { name: 'Omen 효과', exact: true }).selectOption('maximum');
      await manual('15', '', '1');
      assert.equal(await panel.locator('.combat-damage strong').innerText(), '5');
      await panel.getByText('Omen으로 주사위 재굴림', { exact: true }).click();
      await panel.getByRole('textbox', { name: '다시 굴린 실물 값', exact: true }).fill('2');
      await panel.getByRole('button', { name: '방어구 감소 재굴림 · Omen 1', exact: true }).click();
      assert.equal(await panel.locator('.combat-damage strong').innerText(), '4');
      assert.equal(await pc.getByRole('spinbutton', { name: 'Omen', exact: true }).inputValue(), '3');
      await panel.getByRole('button', { name: '결과 적용 · HP 반영', exact: true }).click();
      assert.equal(await pc.getByRole('spinbutton', { name: 'Omen', exact: true }).inputValue(), '1');
      await panel.getByRole('button', { name: '↶ 한 작업 되돌리기', exact: true }).click();
      assert.equal(await pc.getByRole('spinbutton', { name: 'Omen', exact: true }).inputValue(), '3');
      assert.equal(await enemy.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '12');
      await panel.getByRole('button', { name: '다시 적용 ↷', exact: true }).click();
      assert.equal(await enemy.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '8');
      await page.reload();
      if (!await panel.isVisible()) await launcher.click();
      await panel.waitFor();
      assert.equal(await pc.getByRole('spinbutton', { name: 'Omen', exact: true }).inputValue(), '1');
      assert.equal(await enemy.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '8');
      assert.equal(await pc.getByRole('textbox', { name: '상태 메모', exact: true }).inputValue(), '실드 마법 · 보정은 직접 입력');
      await panel.getByRole('button', { name: '실물 값 입력', exact: true }).click();
      await pair(pcId, enemyId);
      await manual('21', '5', '1');
      assert.match(await panel.locator('.combat-error').innerText(), /정수/);
      assert.equal(await enemy.getByRole('spinbutton', { name: 'HP', exact: true }).inputValue(), '8');
      await panel.getByRole('textbox', { name: '사기 2d6', exact: true }).fill('6,6');
      await panel.getByRole('spinbutton', { name: '실패한 사기 d6', exact: true }).fill('2');
      await panel.getByRole('button', { name: '사기 판정·적용', exact: true }).click();
      assert.equal(await enemy.getByRole('checkbox', { name: '참여', exact: true }).isChecked(), false);
      assert.match(await enemy.getByRole('textbox', { name: '상태 메모', exact: true }).inputValue(), /도주/);
      await panel.getByRole('button', { name: '↶ 한 작업 되돌리기', exact: true }).click();
      assert.equal(await enemy.getByRole('checkbox', { name: '참여', exact: true }).isChecked(), true);
      await panel.getByRole('button', { name: '앱 주사위', exact: true }).click();
      await panel.getByRole('button', { name: '굴려서 판정 →', exact: true }).click();
      assert.match(await panel.locator('.combat-dice-results').innerText(), /앱/);
      const layout = await panel.evaluate(el => ({ overflow: el.scrollWidth > el.clientWidth + 1, panelWidth: el.clientWidth, viewportOverflow: document.documentElement.scrollWidth > innerWidth, smallControls: [...el.querySelectorAll('button,input,select,summary')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 35).map(e => e.textContent) }));
      assert.equal(layout.overflow, false); assert.equal(layout.viewportOverflow, false);
      await page.keyboard.press('Escape');
      await panel.waitFor({ state: 'hidden' });
      assert.equal(await launcher.evaluate(el => el === document.activeElement), true);
      await launcher.click(); await panel.waitFor();
      await page.keyboard.press('Tab');
      assert.equal(await panel.evaluate(el => el.contains(document.activeElement)), true);
      await page.goBack(); await panel.waitFor({ state: 'hidden' });
      assert.deepEqual(errors, []);
      reports.push({ width, passed: true, ...layout });
      console.log('PASS', width, 'combat: manual/app, critical/fumble notices, overrides, Omen, phase rollback, undo/redo, reload, morale, keyboard/back');
    } catch (error) { console.error(error); await page.screenshot({ path: `${output}/failure-${width}.png`, timeout: 5000 }).catch(() => {}); throw error; }
    finally { await context.close(); }
  }
} finally { await writeFile(`${output}/acceptance.json`, JSON.stringify(reports, null, 2)); await browser.close(); }
