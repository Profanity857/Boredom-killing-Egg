// script.js - 完整版（含事项来源选择，无反馈无计数器）

// ==================== 用户自定义库 ====================
let userTasks = [];

function loadUserTasks() {
    const stored = localStorage.getItem('userTasks');
    userTasks = stored ? JSON.parse(stored) : [];
}

function saveUserTasks() {
    localStorage.setItem('userTasks', JSON.stringify(userTasks));
}

function getDefaultTasks() {
    return TASKS;
}

function getCustomTasks() {
    return userTasks;
}

function getMergedTasks() {
    return [...getDefaultTasks(), ...getCustomTasks()];
}

function getTasksBySource() {
    if (taskSource === 'default') return getDefaultTasks();
    if (taskSource === 'custom') return getCustomTasks();
    return getMergedTasks();
}

// ==================== 筛选与抽蛋 ====================
const BUDGET_MAP = { free: '免费', cheap: '小资', medium: '中等', expensive: '稍贵' };
const DURATION_MAP = { short: '15分钟内', medium: '半小时', long: '1-2小时', whole: '半天以上' };
const PLACE_MAP = { indoor: '🏠 室内', outdoor: '🌳 户外' };
const PEOPLE_MAP = { alone: '👤 独自', couple: '👥 结伴', group: '👨‍👩‍👧‍👦 多人' };

const BUDGET_OPTS = [
    { label: '任意', value: 'any' },
    { label: '免费', value: 'free' },
    { label: '小资(<50元)', value: 'cheap' },
    { label: '中等(50-200)', value: 'medium' },
    { label: '稍贵(>200)', value: 'expensive' }
];
const DURATION_OPTS = [
    { label: '任意', value: 'any' },
    { label: '15分钟内', value: 'short' },
    { label: '半小时', value: 'medium' },
    { label: '1-2小时', value: 'long' },
    { label: '半天以上', value: 'whole' }
];
const PLACE_OPTS = [
    { label: '任意', value: 'any' },
    { label: '🏠 室内', value: 'indoor' },
    { label: '🌳 户外', value: 'outdoor' }
];
const PEOPLE_OPTS = [
    { label: '任意', value: 'any' },
    { label: '👤 独自', value: 'alone' },
    { label: '👥 结伴', value: 'couple' },
    { label: '👨‍👩‍👧‍👦 多人', value: 'group' }
];

let selectedBudget = 'any';
let selectedDuration = 'any';
let selectedPlace = 'any';
let selectedPeople = 'any';
let taskSource = 'merged';  // 'default', 'custom', 'merged'
let cracking = false;
let lastTaskName = '';
let filterOpen = false;

// DOM 元素
const eggWrapper = document.getElementById('eggWrapper');
const crackLine = document.getElementById('crackLine');
const paperModal = document.getElementById('paperModal');
const paperTask = document.getElementById('paperTask');
const paperTags = document.getElementById('paperTags');
const closePaper = document.getElementById('closePaper');
const resetBtn = document.getElementById('resetBtn');
const filterHeader = document.getElementById('filterHeader');
const filterBody = document.getElementById('filterBody');
const filterArrow = document.getElementById('filterArrow');

function renderOptions() {
    const budgetGroup = document.getElementById('budgetGroup');
    const durationGroup = document.getElementById('durationGroup');
    const placeGroup = document.getElementById('placeGroup');
    const peopleGroup = document.getElementById('peopleGroup');
    const sourceGroup = document.getElementById('sourceGroup');
    
    budgetGroup.innerHTML = BUDGET_OPTS.map(opt => `<div class="option ${selectedBudget === opt.value ? 'active' : ''}" data-type="budget" data-value="${opt.value}">${opt.label}</div>`).join('');
    durationGroup.innerHTML = DURATION_OPTS.map(opt => `<div class="option ${selectedDuration === opt.value ? 'active' : ''}" data-type="duration" data-value="${opt.value}">${opt.label}</div>`).join('');
    placeGroup.innerHTML = PLACE_OPTS.map(opt => `<div class="option ${selectedPlace === opt.value ? 'active' : ''}" data-type="place" data-value="${opt.value}">${opt.label}</div>`).join('');
    peopleGroup.innerHTML = PEOPLE_OPTS.map(opt => `<div class="option ${selectedPeople === opt.value ? 'active' : ''}" data-type="people" data-value="${opt.value}">${opt.label}</div>`).join('');
    
    sourceGroup.innerHTML = `
        <div class="option ${taskSource === 'default' ? 'active' : ''}" data-source="default">默认库</div>
        <div class="option ${taskSource === 'custom' ? 'active' : ''}" data-source="custom">我的库</div>
        <div class="option ${taskSource === 'merged' ? 'active' : ''}" data-source="merged">合并库</div>
    `;

    document.querySelectorAll('#budgetGroup .option').forEach(el => {
        el.addEventListener('click', () => { selectedBudget = el.dataset.value; renderOptions(); });
    });
    document.querySelectorAll('#durationGroup .option').forEach(el => {
        el.addEventListener('click', () => { selectedDuration = el.dataset.value; renderOptions(); });
    });
    document.querySelectorAll('#placeGroup .option').forEach(el => {
        el.addEventListener('click', () => { selectedPlace = el.dataset.value; renderOptions(); });
    });
    document.querySelectorAll('#peopleGroup .option').forEach(el => {
        el.addEventListener('click', () => { selectedPeople = el.dataset.value; renderOptions(); });
    });
    document.querySelectorAll('#sourceGroup .option').forEach(el => {
        el.addEventListener('click', () => {
            taskSource = el.dataset.source;
            renderOptions();
        });
    });
}

function filterTasks() {
    const tasks = getTasksBySource();
    return tasks.filter(task => {
        if (selectedBudget !== 'any' && task.budget !== selectedBudget) return false;
        if (selectedDuration !== 'any' && task.duration !== selectedDuration) return false;
        if (selectedPlace !== 'any' && task.place !== selectedPlace) return false;
        if (selectedPeople !== 'any' && task.people !== selectedPeople) return false;
        return true;
    });
}

function crackEgg() {
    if (cracking) return;
    const filtered = filterTasks();
    if (filtered.length === 0) {
        alert('没有符合条件的事项，请放宽筛选或切换事项来源');
        return;
    }
    let selected;
    if (filtered.length === 1) {
        selected = filtered[0];
    } else {
        let attempts = 0;
        do {
            const rand = Math.floor(Math.random() * filtered.length);
            selected = filtered[rand];
            attempts++;
            if (selected.name !== lastTaskName || attempts >= 5) break;
        } while (true);
    }
    lastTaskName = selected.name;

    cracking = true;
    eggWrapper.classList.add('crack-animation');
    crackLine.style.display = 'block';
    setTimeout(() => {
        eggWrapper.classList.remove('crack-animation');
        crackLine.style.display = 'none';
        showPaper(selected);
        cracking = false;
    }, 300);
}

function showPaper(task) {
    paperTask.innerText = task.name;
    const tags = [
        BUDGET_MAP[task.budget],
        DURATION_MAP[task.duration],
        PLACE_MAP[task.place],
        PEOPLE_MAP[task.people]
    ];
    paperTags.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    paperModal.style.display = 'flex';
}

// ==================== 自定义库弹窗交互 ====================
const customModal = document.getElementById('customModal');
const customFab = document.getElementById('customFab');
const closeCustomModal = document.getElementById('closeCustomModal');
const showAddFormBtn = document.getElementById('showAddFormBtn');
const addFormDiv = document.getElementById('addForm');
const saveCustomBtn = document.getElementById('saveCustomBtn');

function renderCustomList() {
    const container = document.getElementById('customList');
    if (!container) return;
    container.innerHTML = '';
    userTasks.forEach((task, idx) => {
        const div = document.createElement('div');
        div.className = 'custom-item';
        div.innerHTML = `<span>${task.name}</span><button class="delete-custom" data-idx="${idx}">删除</button>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.delete-custom').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.idx);
            userTasks.splice(idx, 1);
            saveUserTasks();
            renderCustomList();
            alert('已删除，下次抽蛋生效');
        });
    });
}

function addCustomTask(task) {
    userTasks.push(task);
    saveUserTasks();
    renderCustomList();
}

function openCustomModal() {
    renderCustomList();
    customModal.style.display = 'flex';
}

function closeCustomModalFunc() {
    customModal.style.display = 'none';
}

if (customFab) customFab.addEventListener('click', openCustomModal);
if (closeCustomModal) closeCustomModal.addEventListener('click', closeCustomModalFunc);
if (showAddFormBtn) showAddFormBtn.addEventListener('click', () => {
    addFormDiv.style.display = 'block';
});
if (saveCustomBtn) saveCustomBtn.addEventListener('click', () => {
    const name = document.getElementById('newName').value.trim();
    if (!name) {
        alert('请输入活动名称');
        return;
    }
    const newTask = {
        name: name,
        budget: document.getElementById('newBudget').value,
        duration: document.getElementById('newDuration').value,
        place: document.getElementById('newPlace').value,
        people: document.getElementById('newPeople').value
    };
    addCustomTask(newTask);
    addFormDiv.style.display = 'none';
    document.getElementById('newName').value = '';
    alert('添加成功！');
});

// ==================== 事件绑定 ====================
eggWrapper.addEventListener('click', crackEgg);
closePaper.addEventListener('click', () => { paperModal.style.display = 'none'; });
paperModal.addEventListener('click', (e) => { if (e.target === paperModal) paperModal.style.display = 'none'; });
resetBtn.addEventListener('click', () => {
    selectedBudget = 'any';
    selectedDuration = 'any';
    selectedPlace = 'any';
    selectedPeople = 'any';
    renderOptions();
});
filterHeader.addEventListener('click', () => {
    filterOpen = !filterOpen;
    filterBody.classList.toggle('open', filterOpen);
    filterArrow.innerText = filterOpen ? '▲' : '▼';
});

// 初始化
loadUserTasks();
renderOptions();
filterBody.classList.remove('open');
filterArrow.innerText = '▼';