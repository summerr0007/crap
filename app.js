// 花旗骰 (Craps 2D) 全功能遊戲邏輯 - 包含 Direct Lay Bets (鋪指定點數 4,5,6,8,9,10)

document.addEventListener('DOMContentLoaded', () => {
    // 1. 遊戲狀態 State
    const state = {
        bankroll: 1000,
        selectedChip: 10,
        phase: 'COME_OUT', // 'COME_OUT' 或 'POINT'
        point: null,
        bets: {
            pass: 0,
            passOdds: 0,
            dontPass: 0,
            layOdds: 0,
            come: 0,
            dontCome: 0,
            comePoints: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            dontComePoints: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            directLay: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            field: 0,
            place: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            hardways: { hard4: 0, hard6: 0, hard8: 0, hard10: 0 },
            props: { any7: 0, anyCraps: 0, yo11: 0, aces2: 0, boxcars12: 0 }
        }
    };

    // 2. DOM 元素引用
    const bankrollEl = document.getElementById('bankroll');
    const totalBetEl = document.getElementById('total-bet');
    const gamePhaseEl = document.getElementById('game-phase');
    const puckBadge = document.getElementById('puck-badge');

    const dice1El = document.getElementById('dice-1');
    const dice2El = document.getElementById('dice-2');
    const diceSumEl = document.getElementById('dice-sum');

    const btnRoll = document.getElementById('btn-roll');
    const btnClear = document.getElementById('btn-clear');
    const btnReset = document.getElementById('btn-reset');
    const btnClearLog = document.getElementById('btn-clear-log');
    const dealerLog = document.getElementById('dealer-log');

    // 區域引用
    const zonePass = document.getElementById('zone-pass');
    const zoneOdds = document.getElementById('zone-odds');
    const zoneDontPass = document.getElementById('zone-dont-pass');
    const zoneLayOdds = document.getElementById('zone-lay-odds');
    const zoneCome = document.getElementById('zone-come');
    const zoneDontCome = document.getElementById('zone-dont-come');
    const zoneField = document.getElementById('zone-field');

    const oddsDescText = document.getElementById('odds-desc-text');
    const oddsRateDisplay = document.getElementById('odds-rate-display');
    const layOddsDescText = document.getElementById('lay-odds-desc-text');
    const layOddsRateDisplay = document.getElementById('lay-odds-rate-display');

    // Slots 引用
    const slotPass = document.getElementById('slot-pass');
    const slotOdds = document.getElementById('slot-odds');
    const slotDontPass = document.getElementById('slot-dont-pass');
    const slotLayOdds = document.getElementById('slot-lay-odds');
    const slotCome = document.getElementById('slot-come');
    const slotDontCome = document.getElementById('slot-dont-come');
    const slotField = document.getElementById('slot-field');

    // Web Audio 音效產生器
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playSound(type) {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'chip') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'roll') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'win') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {}
    }

    // 3. 渲染骰子點數圖案
    const diceDotLayouts = {
        1: ['center'],
        2: ['top-right', 'bottom-left'],
        3: ['top-right', 'center', 'bottom-left'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };

    function renderDice(diceEl, value) {
        diceEl.innerHTML = '';
        const dots = diceDotLayouts[value] || [];
        dots.forEach(pos => {
            const dot = document.createElement('div');
            dot.className = `dot ${pos}`;
            if (value === 1) dot.classList.add('red');
            diceEl.appendChild(dot);
        });
    }

    renderDice(dice1El, 1);
    renderDice(dice2El, 2);

    // 4. UI 畫面更新
    function updateUI() {
        bankrollEl.textContent = `$${state.bankroll.toLocaleString()}`;

        // 計算總下注
        let totalBet = state.bets.pass + state.bets.passOdds + state.bets.dontPass + state.bets.layOdds + state.bets.come + state.bets.dontCome + state.bets.field;
        Object.values(state.bets.comePoints).forEach(v => totalBet += v);
        Object.values(state.bets.dontComePoints).forEach(v => totalBet += v);
        Object.values(state.bets.directLay).forEach(v => totalBet += v);
        Object.values(state.bets.place).forEach(v => totalBet += v);
        Object.values(state.bets.hardways).forEach(v => totalBet += v);
        Object.values(state.bets.props).forEach(v => totalBet += v);
        totalBetEl.textContent = `$${totalBet.toLocaleString()}`;

        const pointsWall = document.querySelector('.points-wall');
        const layWall = document.querySelector('.lay-wall');

        if (state.phase === 'COME_OUT') {
            gamePhaseEl.textContent = 'Come-Out Roll (首擲)';
            gamePhaseEl.style.color = '#38bdf8';
            puckBadge.textContent = 'OFF';
            puckBadge.className = 'puck off';

            // 鎖定 Pass Odds / Lay Odds / Place Bets / Direct Lay / Come / Don't Come
            zoneOdds.className = 'bet-zone zone-odds locked';
            oddsDescText.textContent = '🔒【點數未確立】需待首擲建立 Point 點數後方可在 Pass Line 後方加注';
            oddsRateDisplay.textContent = '未開放';

            zoneLayOdds.className = 'bet-zone zone-lay-odds locked';
            layOddsDescText.textContent = '🔒【點數未確立】需待首擲建立 Point 點數後方可在 Don\'t Pass 旁鋪注';
            layOddsRateDisplay.textContent = '未開放';

            zoneCome.className = 'bet-zone zone-come locked';
            zoneDontCome.className = 'bet-zone zone-dont-come locked';

            if (pointsWall) pointsWall.classList.add('locked');
            if (layWall) layWall.classList.add('locked');
            document.querySelectorAll('.point-box').forEach(box => box.classList.remove('active-point'));
        } else {
            gamePhaseEl.textContent = `Point Phase (目標: ${state.point})`;
            gamePhaseEl.style.color = '#f4ca59';
            puckBadge.textContent = `ON`;
            puckBadge.className = 'puck on';

            // 解鎖 Odds / Lay Odds / Place / Direct Lay / Come / Don't Come
            zoneOdds.className = 'bet-zone zone-odds unlocked';
            zoneLayOdds.className = 'bet-zone zone-lay-odds unlocked';
            zoneCome.className = 'bet-zone zone-come';
            zoneDontCome.className = 'bet-zone zone-dont-come';
            if (pointsWall) pointsWall.classList.remove('locked');
            if (layWall) layWall.classList.remove('locked');

            // 賠率提示
            let passRate = '', layRate = '';
            if (state.point === 4 || state.point === 10) { passRate = '賠 2:1'; layRate = '賠 1:2'; }
            else if (state.point === 5 || state.point === 9) { passRate = '賠 3:2'; layRate = '賠 2:3'; }
            else if (state.point === 6 || state.point === 8) { passRate = '賠 6:5'; layRate = '賠 5:6'; }

            oddsDescText.textContent = `★ 已確立 Point 【${state.point}】！可在 Pass Line 正後方加碼 Take Odds`;
            oddsRateDisplay.textContent = `${passRate} (0% 莊家優勢)`;

            layOddsDescText.textContent = `★ 已確立 Point 【${state.point}】！可在 Don't Pass 旁邊加碼 Lay Odds`;
            layOddsRateDisplay.textContent = `${layRate} (0% 莊家優勢)`;

            document.querySelectorAll('.point-box').forEach(box => {
                if (parseInt(box.getAttribute('data-point')) === state.point) {
                    box.classList.add('active-point');
                } else {
                    box.classList.remove('active-point');
                }
            });
        }

        // 渲染籌碼標記
        renderSlotChips(slotPass, state.bets.pass);
        renderSlotChips(slotOdds, state.bets.passOdds);
        renderSlotChips(slotDontPass, state.bets.dontPass);
        renderSlotChips(slotLayOdds, state.bets.layOdds);
        renderSlotChips(slotCome, state.bets.come);
        renderSlotChips(slotDontCome, state.bets.dontCome);
        renderSlotChips(slotField, state.bets.field);

        // Place bets 渲染
        Object.keys(state.bets.place).forEach(pt => {
            const slot = document.getElementById(`slot-place-${pt}`);
            const totalOnPt = state.bets.place[pt] + state.bets.comePoints[pt] + state.bets.dontComePoints[pt];
            if (slot) renderSlotChips(slot, totalOnPt);
        });

        // Direct Lay Bets 渲染
        Object.keys(state.bets.directLay).forEach(pt => {
            const slot = document.getElementById(`slot-lay-${pt}`);
            if (slot) renderSlotChips(slot, state.bets.directLay[pt]);
        });

        // Hardways
        Object.keys(state.bets.hardways).forEach(h => {
            const slot = document.getElementById(`slot-${h}`);
            if (slot) renderSlotChips(slot, state.bets.hardways[h]);
        });

        // Props
        Object.keys(state.bets.props).forEach(p => {
            const slot = document.getElementById(`slot-${p}`);
            if (slot) renderSlotChips(slot, state.bets.props[p]);
        });
    }

    function renderSlotChips(slotEl, amount) {
        slotEl.innerHTML = '';
        if (amount > 0) {
            const chip = document.createElement('div');
            let chipClass = 'chip-val-10';
            if (amount >= 500) chipClass = 'chip-val-500';
            else if (amount >= 100) chipClass = 'chip-val-100';
            else if (amount >= 50) chipClass = 'chip-val-50';
            else if (amount >= 25) chipClass = 'chip-val-25';

            chip.className = `chip-display ${chipClass}`;
            chip.textContent = `$${amount}`;
            slotEl.appendChild(chip);
        }
    }

    // 5. 荷官日誌紀錄
    function addLog(msg, type = 'normal') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = msg;
        dealerLog.appendChild(entry);
        dealerLog.scrollTop = dealerLog.scrollHeight;
    }

    // 6. 籌碼選擇
    document.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.selectedChip = parseInt(e.currentTarget.getAttribute('data-value'));
            playSound('chip');
        });
    });

    // 7. 通用下注函數
    function placeBet(type, targetKey = null) {
        const cost = state.selectedChip;
        if (state.bankroll < cost) {
            addLog(`⚠️ 本金不足！當前籌碼只剩 $${state.bankroll}`, 'lose');
            return;
        }

        // 條件檢查
        if (type === 'passOdds') {
            if (state.phase !== 'POINT') { addLog('⚠️ Pass Odds 只能在確立 Point 後加碼！', 'lose'); return; }
            if (state.bets.pass === 0) { addLog('⚠️ 必須先有 Pass Line 原注才能加碼 Pass Odds！', 'lose'); return; }
        }

        if (type === 'layOdds') {
            if (state.phase !== 'POINT') { addLog('⚠️ Lay Odds 只能在確立 Point 後加碼！', 'lose'); return; }
            if (state.bets.dontPass === 0) { addLog('⚠️ 必須先有 Don\'t Pass 原注才能加碼 Lay Odds！', 'lose'); return; }
        }

        if ((type === 'come' || type === 'dontCome' || type === 'place' || type === 'directLay') && state.phase !== 'POINT') {
            addLog('⚠️ Come / Don\'t Come / Place / Lay 點數注只能在 Point 確立後開放下注！', 'lose');
            return;
        }

        if (type === 'pass' && state.phase === 'POINT') {
            addLog(`💡 <b>Put Bet 提醒</b>：在 Point 階段才下注 Pass Line 錯過了首擲 7/11 的好處，數學期望值較不利！建議改下 Come 注或加碼 Odds。`, 'odds');
        }

        state.bankroll -= cost;

        if (type === 'place') {
            state.bets.place[targetKey] += cost;
            const amt = state.bets.place[targetKey];
            const numPt = parseInt(targetKey);
            addLog(`下注 Place ${targetKey}: +$${cost} (累積: $${amt})`);
            if ((numPt === 6 || numPt === 8) && amt % 6 !== 0) {
                addLog(`💡 <b>面額提示</b>：Place 6/8 賠率為 7:6，建議總額湊滿 <b>$6 的倍數</b>（當前 $${amt}），否則非倍數小數點將被捨去。`, 'odds');
            } else if ((numPt === 5 || numPt === 9 || numPt === 4 || numPt === 10) && amt % 5 !== 0) {
                addLog(`💡 <b>面額提示</b>：Place ${numPt} 建議總額湊滿 <b>$5 的倍數</b>（當前 $${amt}）。`, 'odds');
            }
        } else if (type === 'directLay') {
            state.bets.directLay[targetKey] += cost;
            const amt = state.bets.directLay[targetKey];
            const numPt = parseInt(targetKey);
            addLog(`⚡ 下注 Direct Lay ${targetKey} (賭 7 比 ${targetKey} 先出): +$${cost} (累積: $${amt})`, 'odds');
            if ((numPt === 6 || numPt === 8) && amt % 6 !== 0) {
                addLog(`💡 <b>面額提示</b>：Lay 6/8 賠率為 5:6，建議金額下 <b>$6 的倍數</b>（當前 $${amt}）。`, 'odds');
            } else if ((numPt === 5 || numPt === 9) && amt % 3 !== 0) {
                addLog(`💡 <b>面額提示</b>：Lay 5/9 賠率為 2:3，建議金額下 <b>$3 的倍數</b>（當前 $${amt}）。`, 'odds');
            } else if ((numPt === 4 || numPt === 10) && amt % 2 !== 0) {
                addLog(`💡 <b>面額提示</b>：Lay 4/10 賠率為 1:2，建議金額下 <b>偶數 ($2倍數)</b>（當前 $${amt}）。`, 'odds');
            }
        } else if (type === 'hardways') {
            state.bets.hardways[targetKey] += cost;
            addLog(`下注 Hardways (${targetKey.toUpperCase()}): +$${cost}`);
        } else if (type === 'props') {
            state.bets.props[targetKey] += cost;
            addLog(`下注 單次 Prop (${targetKey}): +$${cost}`);
        } else {
            state.bets[type] += cost;
            if (type === 'passOdds') {
                const amt = state.bets.passOdds;
                addLog(`🔥 Pass Line 後方加碼 Take Odds: +$${cost} (0% 莊家優勢, 累積: $${amt})`, 'odds');
                if ((state.point === 6 || state.point === 8) && amt % 5 !== 0) {
                    addLog(`💡 <b>面額提示</b>：點數 ${state.point} 的 Pass Odds 賠率為 6:5，建議金額下 <b>$5 的倍數</b>（當前 $${amt}）。`, 'odds');
                } else if ((state.point === 5 || state.point === 9) && amt % 2 !== 0) {
                    addLog(`💡 <b>面額提示</b>：點數 ${state.point} 的 Pass Odds 賠率為 3:2，建議金額下 <b>偶數 ($2倍數)</b>（當前 $${amt}）。`, 'odds');
                }
            }
            else if (type === 'layOdds') addLog(`⚡ Don't Pass 旁加碼 Lay Odds: +$${cost} (0% 莊家優勢)`, 'odds');
            else if (type === 'pass') addLog(`下注 Pass Line: +$${cost}`);
            else if (type === 'dontPass') addLog(`下注 Don't Pass: +$${cost}`);
            else if (type === 'come') addLog(`下注 Come (來注): +$${cost}`);
            else if (type === 'dontCome') addLog(`下注 Don't Come (不來注): +$${cost}`);
            else if (type === 'field') addLog(`下注 Field Bet: +$${cost}`);
        }

        playSound('chip');
        updateUI();
    }

    // 事件監聽
    zonePass.addEventListener('click', () => placeBet('pass'));
    zoneOdds.addEventListener('click', () => placeBet('passOdds'));
    zoneDontPass.addEventListener('click', () => placeBet('dontPass'));
    zoneLayOdds.addEventListener('click', () => placeBet('layOdds'));
    zoneCome.addEventListener('click', () => placeBet('come'));
    zoneDontCome.addEventListener('click', () => placeBet('dontCome'));
    zoneField.addEventListener('click', () => placeBet('field'));

    document.querySelectorAll('.point-box').forEach(box => {
        box.addEventListener('click', () => {
            placeBet('place', box.getAttribute('data-point'));
        });
    });

    document.querySelectorAll('.lay-box').forEach(box => {
        box.addEventListener('click', () => {
            placeBet('directLay', box.getAttribute('data-lay'));
        });
    });

    document.querySelectorAll('[data-prop]').forEach(box => {
        box.addEventListener('click', () => {
            const propKey = box.getAttribute('data-prop');
            if (propKey.startsWith('hard')) placeBet('hardways', propKey);
            else placeBet('props', propKey);
        });
    });

    // 8. 擲骰子核心引擎
    btnRoll.addEventListener('click', () => {
        let totalBet = state.bets.pass + state.bets.passOdds + state.bets.dontPass + state.bets.layOdds + state.bets.come + state.bets.dontCome + state.bets.field;
        Object.values(state.bets.comePoints).forEach(v => totalBet += v);
        Object.values(state.bets.dontComePoints).forEach(v => totalBet += v);
        Object.values(state.bets.directLay).forEach(v => totalBet += v);
        Object.values(state.bets.place).forEach(v => totalBet += v);
        Object.values(state.bets.hardways).forEach(v => totalBet += v);
        Object.values(state.bets.props).forEach(v => totalBet += v);

        if (totalBet === 0) {
            addLog('⚠️ 請先放置籌碼下注再擲骰！', 'lose');
            return;
        }

        btnRoll.disabled = true;
        dice1El.classList.add('rolling');
        dice2El.classList.add('rolling');
        playSound('roll');

        setTimeout(() => {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            const sum = d1 + d2;
            const isPair = (d1 === d2);

            renderDice(dice1El, d1);
            renderDice(dice2El, d2);
            diceSumEl.textContent = sum;

            dice1El.classList.remove('rolling');
            dice2El.classList.remove('rolling');
            btnRoll.disabled = false;

            addLog(`🎲 擲出 <b>${d1} + ${d2} = ${sum}</b> ${isPair ? '(對子 Pair!)' : ''}`);
            evaluateAllBets(d1, d2, sum, isPair);
        }, 500);
    });

    // 全方位結算引擎
    function evaluateAllBets(d1, d2, sum, isPair) {
        let totalWin = 0;

        // A. Field Bet 結算 (單次)
        if (state.bets.field > 0) {
            const fBet = state.bets.field;
            if ([2, 3, 4, 9, 10, 11, 12].includes(sum)) {
                let mult = 1;
                if (sum === 2) mult = 2; // 2倍
                if (sum === 12) mult = 3; // 3倍
                totalWin += fBet + (fBet * mult);
                addLog(`🎉 Field Bet 命中 (${sum})！贏得 $${fBet * mult}`, 'win');
            } else {
                addLog(`❌ Field Bet 失敗 (${sum})`, 'lose');
            }
            state.bets.field = 0;
        }

        // B. One-Roll Prop Bets 結算
        const p = state.bets.props;
        if (p.any7 > 0) {
            if (sum === 7) { const win = p.any7 * 4; totalWin += p.any7 + win; addLog(`🎉 Any 7 命中！贏得 $${win}`, 'win'); }
            else addLog(`❌ Any 7 失敗`, 'lose');
            p.any7 = 0;
        }
        if (p.anyCraps > 0) {
            if ([2, 3, 12].includes(sum)) { const win = p.anyCraps * 7; totalWin += p.anyCraps + win; addLog(`🎉 Any Craps (${sum}) 命中！贏得 $${win}`, 'win'); }
            else addLog(`❌ Any Craps 失敗`, 'lose');
            p.anyCraps = 0;
        }
        if (p.yo11 > 0) {
            if (sum === 11) { const win = p.yo11 * 15; totalWin += p.yo11 + win; addLog(`🎉 Yo 11 命中！贏得 $${win}`, 'win'); }
            else addLog(`❌ Yo 11 失敗`, 'lose');
            p.yo11 = 0;
        }
        if (p.aces2 > 0) {
            if (sum === 2) { const win = p.aces2 * 30; totalWin += p.aces2 + win; addLog(`🎉 Aces (1+1=2) 爆發！贏得 30 倍 $${win}`, 'win'); }
            else addLog(`❌ Aces (2) 失敗`, 'lose');
            p.aces2 = 0;
        }
        if (p.boxcars12 > 0) {
            if (sum === 12) { const win = p.boxcars12 * 30; totalWin += p.boxcars12 + win; addLog(`🎉 Twelve (6+6=12) 爆發！贏得 30 倍 $${win}`, 'win'); }
            else addLog(`❌ Twelve (12) 失敗`, 'lose');
            p.boxcars12 = 0;
        }

        // C. Hardways 結算
        const h = state.bets.hardways;
        if (h.hard4 > 0) {
            if (sum === 4 && isPair) { const win = h.hard4 * 7; totalWin += h.hard4 + win; addLog(`🎉 Hard 4 (2+2) 命中！贏得 $${win}`, 'win'); h.hard4 = 0; }
            else if (sum === 7 || sum === 4) { addLog(`❌ Hard 4 失敗 (${sum === 7 ? '7-Out' : '軟點 1+3'})`, 'lose'); h.hard4 = 0; }
        }
        if (h.hard6 > 0) {
            if (sum === 6 && isPair) { const win = h.hard6 * 9; totalWin += h.hard6 + win; addLog(`🎉 Hard 6 (3+3) 命中！贏得 $${win}`, 'win'); h.hard6 = 0; }
            else if (sum === 7 || sum === 6) { addLog(`❌ Hard 6 失敗 (${sum === 7 ? '7-Out' : '軟點'})`, 'lose'); h.hard6 = 0; }
        }
        if (h.hard8 > 0) {
            if (sum === 8 && isPair) { const win = h.hard8 * 9; totalWin += h.hard8 + win; addLog(`🎉 Hard 8 (4+4) 命中！贏得 $${win}`, 'win'); h.hard8 = 0; }
            else if (sum === 7 || sum === 8) { addLog(`❌ Hard 8 失敗 (${sum === 7 ? '7-Out' : '軟點'})`, 'lose'); h.hard8 = 0; }
        }
        if (h.hard10 > 0) {
            if (sum === 10 && isPair) { const win = h.hard10 * 7; totalWin += h.hard10 + win; addLog(`🎉 Hard 10 (5+5) 命中！贏得 $${win}`, 'win'); h.hard10 = 0; }
            else if (sum === 7 || sum === 10) { addLog(`❌ Hard 10 失敗 (${sum === 7 ? '7-Out' : '軟點'})`, 'lose'); h.hard10 = 0; }
        }

        // D. Place Bets 結算
        if (state.bets.place[sum] && state.bets.place[sum] > 0) {
            const pBet = state.bets.place[sum];
            let rate = 1;
            if (sum === 4 || sum === 10) rate = 9 / 5;
            else if (sum === 5 || sum === 9) rate = 7 / 5;
            else if (sum === 6 || sum === 8) rate = 7 / 6;

            const winAmount = Math.floor(pBet * rate);
            totalWin += pBet + winAmount;
            addLog(`🎉 Place Bet 命中【${sum}】！贏得 $${winAmount}`, 'win');
        }

        // E. Direct Lay Bets 結算 (鋪指定點數)
        if (state.bets.directLay[sum] && state.bets.directLay[sum] > 0) {
            // 號碼先出 $\rightarrow$ Direct Lay 失敗！
            addLog(`❌ Direct Lay ${sum} 失敗！(號碼 ${sum} 先於 7 出現)`, 'lose');
            state.bets.directLay[sum] = 0;
        }

        if (sum === 7) {
            // 遇 7-Out $\rightarrow$ 所有活著的 Direct Lay 獲勝！
            Object.keys(state.bets.directLay).forEach(pt => {
                const lAmount = state.bets.directLay[pt];
                if (lAmount > 0) {
                    let rate = 1, rStr = '';
                    const numPt = parseInt(pt);
                    if (numPt === 4 || numPt === 10) { rate = 0.5; rStr = '1:2'; }
                    else if (numPt === 5 || numPt === 9) { rate = 2 / 3; rStr = '2:3'; }
                    else if (numPt === 6 || numPt === 8) { rate = 5 / 6; rStr = '5:6'; }

                    const win = Math.floor(lAmount * rate);
                    totalWin += lAmount + win;
                    addLog(`⚡ <b>Direct Lay ${numPt} 遇 7-Out 獲勝！ (${rStr}) 贏得 $${win}</b>`, 'odds');
                    state.bets.directLay[pt] = 0;
                }
            });
        }

        // F. 移位後的 Come Points & Don't Come Points 結算
        if (state.bets.comePoints[sum] > 0) {
            const cWin = state.bets.comePoints[sum] * 2;
            totalWin += cWin;
            addLog(`🎉 擊中 Come Point 【${sum}】！贏得 $${state.bets.comePoints[sum]}`, 'win');
            state.bets.comePoints[sum] = 0;
        }

        if (state.bets.dontComePoints[sum] > 0) {
            addLog(`❌ Don't Come Point 【${sum}】 失敗 (點數重覆出現)`, 'lose');
            state.bets.dontComePoints[sum] = 0;
        }

        if (sum === 7) {
            Object.keys(state.bets.dontComePoints).forEach(pt => {
                if (state.bets.dontComePoints[pt] > 0) {
                    const win = state.bets.dontComePoints[pt] * 2;
                    totalWin += win;
                    addLog(`🎉 Don't Come Point 【${pt}】 遇 7-Out 獲勝！贏得 $${state.bets.dontComePoints[pt]}`, 'win');
                    state.bets.dontComePoints[pt] = 0;
                }
            });

            Object.keys(state.bets.comePoints).forEach(pt => {
                if (state.bets.comePoints[pt] > 0) {
                    addLog(`❌ Come Point 【${pt}】 遇 7-Out 失敗`, 'lose');
                    state.bets.comePoints[pt] = 0;
                }
            });
        }

        // G. 新下注 Come / Don't Come 當輪移動/結算
        if (state.bets.come > 0) {
            const cBet = state.bets.come;
            if (sum === 7 || sum === 11) { totalWin += cBet * 2; addLog(`🎉 Come 新注 7/11 獲勝！`, 'win'); }
            else if ([2, 3, 12].includes(sum)) { addLog(`❌ Come 新注 Craps (${sum}) 失敗`, 'lose'); }
            else {
                state.bets.comePoints[sum] += cBet;
                addLog(`📌 Come 新注移位至點數【${sum}】 (遇 ${sum} 賠 1:1，遇 7 輸)`, 'point');
            }
            state.bets.come = 0;
        }

        if (state.bets.dontCome > 0) {
            const dcBet = state.bets.dontCome;
            if ([2, 3].includes(sum)) { totalWin += dcBet * 2; addLog(`🎉 Don't Come 新注 2/3 獲勝！`, 'win'); }
            else if (sum === 12) { totalWin += dcBet; addLog(`⚖️ Don't Come 新注 12 平局 (Push)`, 'point'); }
            else if (sum === 7 || sum === 11) { addLog(`❌ Don't Come 新注 7/11 失敗`, 'lose'); }
            else {
                state.bets.dontComePoints[sum] += dcBet;
                addLog(`📌 Don't Come 新注移位至點數【${sum}】 (遇 7 賠 1:1，遇 ${sum} 輸)`, 'point');
            }
            state.bets.dontCome = 0;
        }

        // H. 主線 Phase 邏輯 (Pass / Pass Odds / Don't Pass / Lay Odds)
        if (state.phase === 'COME_OUT') {
            if (sum === 7 || sum === 11) {
                if (state.bets.pass > 0) { totalWin += state.bets.pass * 2; addLog(`🎉 <b>Come-Out 7/11 Natural！</b> Pass Line 贏得 $${state.bets.pass}`, 'win'); state.bets.pass = 0; }
                if (state.bets.dontPass > 0) { addLog(`❌ Don't Pass 失敗 (7/11)`, 'lose'); state.bets.dontPass = 0; }
            } else if ([2, 3, 12].includes(sum)) {
                if (state.bets.pass > 0) { addLog(`💀 <b>Come-Out ${sum} Craps！</b> Pass Line 輸`, 'lose'); state.bets.pass = 0; }
                if (state.bets.dontPass > 0) {
                    if (sum === 12) { totalWin += state.bets.dontPass; addLog(`⚖️ Don't Pass 12 平局 (Push)`, 'point'); }
                    else { totalWin += state.bets.dontPass * 2; addLog(`🎉 Don't Pass 獲勝！`, 'win'); }
                    state.bets.dontPass = 0;
                }
            } else {
                state.point = sum;
                state.phase = 'POINT';
                addLog(`🎯 <b>確立 Point 為 【${sum}】！</b> 進入 Point Phase。現在可加碼 Take Odds 或 Lay Odds (0% 莊家優勢)，亦可直接 Lay 指定號碼。`, 'point');
            }
        } else {
            // Point Phase
            if (sum === state.point) {
                addLog(`🔥 <b>擊中 Point 【${sum}】！</b>`, 'win');

                if (state.bets.pass > 0) { totalWin += state.bets.pass * 2; addLog(`💰 Pass Line 贏得 $${state.bets.pass}`, 'win'); }

                if (state.bets.passOdds > 0) {
                    const pBet = state.bets.passOdds;
                    let pRate = 1, rStr = '';
                    if (sum === 4 || sum === 10) { pRate = 2; rStr = '2:1'; }
                    else if (sum === 5 || sum === 9) { pRate = 1.5; rStr = '3:2'; }
                    else if (sum === 6 || sum === 8) { pRate = 1.2; rStr = '6:5'; }

                    const win = Math.floor(pBet * pRate);
                    totalWin += pBet + win;
                    addLog(`💎 <b>Pass Take Odds (0% 莊優 ${rStr}) 贏得 $${win}！</b>`, 'odds');
                }

                if (state.bets.dontPass > 0) addLog(`❌ Don't Pass 失敗 (Point Hit)`, 'lose');
                if (state.bets.layOdds > 0) addLog(`❌ Lay Odds 失敗 (Point Hit)`, 'lose');

                state.bets.pass = 0;
                state.bets.passOdds = 0;
                state.bets.dontPass = 0;
                state.bets.layOdds = 0;
                state.point = null;
                state.phase = 'COME_OUT';
            } else if (sum === 7) {
                addLog(`💥 <b>7-Out！(Seven Out)</b> 本局結束。`, 'lose');

                if (state.bets.dontPass > 0) { totalWin += state.bets.dontPass * 2; addLog(`🎉 Don't Pass 獲勝！`, 'win'); }

                if (state.bets.layOdds > 0) {
                    const lBet = state.bets.layOdds;
                    let lRate = 1, rStr = '';
                    if (state.point === 4 || state.point === 10) { lRate = 0.5; rStr = '1:2'; }
                    else if (state.point === 5 || state.point === 9) { lRate = 2 / 3; rStr = '2:3'; }
                    else if (state.point === 6 || state.point === 8) { lRate = 5 / 6; rStr = '5:6'; }

                    const win = Math.floor(lBet * lRate);
                    totalWin += lBet + win;
                    addLog(`⚡ <b>Don't Pass Lay Odds (0% 莊優 ${rStr}) 贏得 $${win}！</b>`, 'odds');
                }

                if (state.bets.pass > 0) addLog(`❌ Pass Line 失敗 (7-Out)`, 'lose');
                if (state.bets.passOdds > 0) addLog(`❌ Pass Odds 失敗 (7-Out)`, 'lose');

                Object.keys(state.bets.place).forEach(k => state.bets.place[k] = 0);

                state.bets.pass = 0;
                state.bets.passOdds = 0;
                state.bets.dontPass = 0;
                state.bets.layOdds = 0;
                state.point = null;
                state.phase = 'COME_OUT';
            } else {
                addLog(`點數 ${sum}。Point 仍為 【${state.point}】，請繼續擲骰。`);
            }
        }

        if (totalWin > 0) {
            state.bankroll += totalWin;
            playSound('win');
        }

        updateUI();
    }

    // 9. 清空與重置
    btnClear.addEventListener('click', () => {
        let refunded = state.bets.pass + state.bets.passOdds + state.bets.dontPass + state.bets.layOdds + state.bets.come + state.bets.dontCome + state.bets.field;
        Object.values(state.bets.comePoints).forEach(v => refunded += v);
        Object.values(state.bets.dontComePoints).forEach(v => refunded += v);
        Object.values(state.bets.directLay).forEach(v => refunded += v);
        Object.values(state.bets.place).forEach(v => refunded += v);
        Object.values(state.bets.hardways).forEach(v => refunded += v);
        Object.values(state.bets.props).forEach(v => refunded += v);

        state.bankroll += refunded;
        state.bets = {
            pass: 0, passOdds: 0, dontPass: 0, layOdds: 0, come: 0, dontCome: 0,
            comePoints: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            dontComePoints: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            directLay: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            field: 0,
            place: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            hardways: { hard4: 0, hard6: 0, hard8: 0, hard10: 0 },
            props: { any7: 0, anyCraps: 0, yo11: 0, aces2: 0, boxcars12: 0 }
        };

        addLog(`已清空所有下注，退回 $${refunded}`);
        playSound('chip');
        updateUI();
    });

    btnReset.addEventListener('click', () => {
        state.bankroll = 1000;
        state.bets = {
            pass: 0, passOdds: 0, dontPass: 0, layOdds: 0, come: 0, dontCome: 0,
            comePoints: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            dontComePoints: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            directLay: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            field: 0,
            place: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
            hardways: { hard4: 0, hard6: 0, hard8: 0, hard10: 0 },
            props: { any7: 0, anyCraps: 0, yo11: 0, aces2: 0, boxcars12: 0 }
        };
        state.phase = 'COME_OUT';
        state.point = null;
        addLog('遊戲狀態已重置為預設值 $1,000。', 'system');
        updateUI();
    });

    btnClearLog.addEventListener('click', () => {
        dealerLog.innerHTML = '<div class="log-entry system">日誌已清空。</div>';
    });

    // 10. 玩法指南 Modal 彈窗控制
    const guideModal = document.getElementById('guide-modal');
    const btnOpenGuide = document.getElementById('btn-open-guide');
    const btnCloseGuide = document.getElementById('btn-close-guide');
    const btnConfirmModal = document.getElementById('btn-confirm-modal');

    if (btnOpenGuide && guideModal) {
        btnOpenGuide.addEventListener('click', () => {
            guideModal.classList.add('active');
        });
    }
    if (btnCloseGuide && guideModal) {
        btnCloseGuide.addEventListener('click', () => {
            guideModal.classList.remove('active');
        });
    }
    if (btnConfirmModal && guideModal) {
        btnConfirmModal.addEventListener('click', () => {
            guideModal.classList.remove('active');
        });
    }
    if (guideModal) {
        guideModal.addEventListener('click', (e) => {
            if (e.target === guideModal) guideModal.classList.remove('active');
        });
    }

    updateUI();
});
