// --- 核心狀態與數據 ---
const state = {
    player: { hp: 150, maxHp: 150, atk: 700 },
    enemy: { hp: 10000, maxHp: 10000, atk: 35, isStunned: false },
    cooldowns: { heavy: 0, stun: 0 },
    isPlayerTurn: true,
    gameOver: false
};

// --- 工具函數 ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function triggerAnimation(elementId, animClass) {
    const el = document.getElementById(elementId);
    // 移除舊動畫並強制重繪 (Reflow) 確保動畫能重複觸發
    el.style.animation = 'none';
    void el.offsetWidth; 
    el.style.animation = '';
    
    // 套用新動畫
    el.classList.add(animClass);
    setTimeout(() => {
        el.classList.remove(animClass);
    }, 500);
}

// 終端機打字機特效
async function typeWriter(text, elementId, speed = 50) {
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
        el.innerHTML += text.charAt(i);
        await sleep(speed);
    }
}

// 紀錄戰鬥日誌
function logMessage(msg, type = 'log-sys') {
    const logContainer = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = `> ${msg}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight; // 自動捲動到底部
}

// --- UI 更新邏輯 ---
function updateUI() {
    // 更新血量與血條
    document.getElementById('player-hp-text').innerText = state.player.hp;
    document.getElementById('player-hp-bar').style.width = `${Math.max(0, (state.player.hp / state.player.maxHp) * 100)}%`;
    
    document.getElementById('enemy-hp-text').innerText = state.enemy.hp;
    document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, (state.enemy.hp / state.enemy.maxHp) * 100)}%`;
    
    // 敵人低血量變色
    if (state.enemy.hp < state.enemy.maxHp * 0.2) {
        document.getElementById('enemy-hp-bar').classList.add('low-hp');
    }

    // 更新按鈕狀態與冷卻顯示
    document.getElementById('btn-heavy').innerText = `sudo rm -rf / [CD:${state.cooldowns.heavy}]`;
    document.getElementById('btn-heavy').disabled = state.cooldowns.heavy > 0 || !state.isPlayerTurn || state.gameOver;
    
    document.getElementById('btn-stun').innerText = `Ctrl+C [CD:${state.cooldowns.stun}]`;
    document.getElementById('btn-stun').disabled = state.cooldowns.stun > 0 || !state.isPlayerTurn || state.gameOver;
    
    document.getElementById('btn-attack').disabled = !state.isPlayerTurn || state.gameOver;
    document.getElementById('btn-heal').disabled = !state.isPlayerTurn || state.gameOver;
}

// --- 開場前言 (Prologue) ---
async function runPrologue() {
    const prologueImg = document.getElementById('prologue-image');
    
    // 階段一：玩家視角 (利姆路)
    await typeWriter("System: 初始化中... 載入利姆路意識...", "prologue-text", 40);
    await sleep(1000);
    await typeWriter("這是一個平凡的夜晚，你正在編寫著枯燥的代碼...", "prologue-text", 60);
    await sleep(1500);
    
    // 階段二：惡意入侵 (切換蜜莉姆圖片)
    await typeWriter("WARNING: 偵測到異常流量！未知的龐大魔素正在突破防火牆！", "prologue-text", 30);
    prologueImg.style.opacity = 0;
    await sleep(1000);
    
    prologueImg.src = "https://raw.githubusercontent.com/irene0212-a11y/2d/main/1000-removebg-preview.png";
    prologueImg.className = "glow-red";
    prologueImg.style.opacity = 1;
    
    await typeWriter("大魔王蜜莉姆：『哇哈哈！發現好玩的東西了！陪我玩吧，史萊姆！』", "prologue-text", 50);
    await sleep(2000);
    
    // 切換至戰鬥畫面
    document.getElementById('prologue-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    logMessage("戰鬥開始！大魔王蜜莉姆挾帶毀滅性的力量降臨！", "log-sys");
    updateUI();
}

// --- 戰鬥流程邏輯 ---
async function executeAction(actionType) {
    if (!state.isPlayerTurn || state.gameOver) return;
    state.isPlayerTurn = false;
    updateUI();

    let damage = 0;
    
    if (actionType === 'attack') {
        damage = state.player.atk + Math.floor(Math.random() * 100);
        logMessage(`執行 std::attack()！造成 ${damage} 點傷害。`);
        triggerAnimation('player-img', 'anim-dash-player');
        
    } else if (actionType === 'heavy') {
        damage = state.player.atk * 2.5;
        state.cooldowns.heavy = 3; // 設定3，在回合結束時會扣1，實際等待2回合
        logMessage(`執行 sudo rm -rf /！引發系統暴擊，造成 ${damage} 點傷害！`, 'log-dmg');
        triggerAnimation('player-img', 'anim-dash-player');
        
    } else if (actionType === 'stun') {
        damage = Math.floor(state.player.atk * 0.2);
        state.cooldowns.stun = 4; // 設定4，在回合結束時會扣1，實際等待3回合
        state.enemy.isStunned = true;
        logMessage(`執行 Ctrl+C！強制中斷進程。造成 ${damage} 點傷害，並施加 [暈眩]！`);
        triggerAnimation('player-img', 'anim-dash-player');
        
    } else if (actionType === 'heal') {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 60);
        logMessage(`執行 debug_heal()。系統修復，恢復 60 點 HP。`);
    }

    // 處理敵人受擊與特效
    if (damage > 0) {
        await sleep(150); // 等待衝刺動畫到達敵人面前
        state.enemy.hp -= damage;
        triggerAnimation('enemy-img', 'anim-glitch');
    }

    updateUI();
    await checkWinLose();
    
    if (!state.gameOver) {
        await sleep(1000);
        await enemyTurn();
    }
}

async function enemyTurn() {
    if (state.enemy.isStunned) {
        logMessage("大魔王蜜莉姆受到 Ctrl+C 中斷，本回合無法行動！", "log-sys");
        state.enemy.isStunned = false;
    } else {
        const damage = state.enemy.atk + Math.floor(Math.random() * 10);
        logMessage(`蜜莉姆發動「龍星爆炎」！造成 ${damage} 點傷害！`, "log-dmg");
        
        triggerAnimation('enemy-img', 'anim-dash-enemy');
        await sleep(150); // 等待衝刺到達玩家面前
        state.player.hp -= damage;
        triggerAnimation('player-img', 'anim-glitch');
    }

    updateUI();
    await checkWinLose();

    if (!state.gameOver) {
        // 回合結束，減少冷卻時間
        if (state.cooldowns.heavy > 0) state.cooldowns.heavy--;
        if (state.cooldowns.stun > 0) state.cooldowns.stun--;
        
        state.isPlayerTurn = true;
        updateUI();
        logMessage("等待輸入指令...", "log-sys");
    }
}

async function checkWinLose() {
    if (state.enemy.hp <= 0) {
        state.enemy.hp = 0;
        state.gameOver = true;
        document.getElementById('enemy-img').classList.add('anim-die');
        logMessage("SUCCESS: 大魔王蜜莉姆被成功擊退！系統恢復正常。", "log-sys");
        updateUI();
    } else if (state.player.hp <= 0) {
        state.player.hp = 0;
        state.gameOver = true;
        document.getElementById('player-img').classList.add('anim-die');
        logMessage("FATAL ERROR: 利姆路核心損毀... 系統崩潰。", "log-dmg");
        updateUI();
    }
}

// 啟動遊戲
window.onload = runPrologue;