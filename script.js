// script.js - 所有逻辑

// ==================== 访问计数器 ====================
async function updateVisitCount() {
    const namespace = 'egg_idea';
    const key = 'visits';
    const updateUrl = `https://api.countapi.xyz/update/${namespace}/${key}?amount=1`;
    try {
        const response = await fetch(updateUrl);
        const data = await response.json();
        if (data && data.value !== undefined) {
            document.getElementById('visitCount').innerText = data.value;
        } else {
            // 尝试初始化
            await fetch(`https://api.countapi.xyz/create?namespace=${namespace}&key=${key}&value=1`);
            const getResp = await fetch(`https://api.countapi.xyz/get/${namespace}/${key}`);
            const getData = await getResp.json();
            document.getElementById('visitCount').innerText = getData.value || 1;
        }
    } catch (err) {
        console.error('计数器失败', err);
        document.getElementById('visitCount').innerText = '?';
    }
}

// ==================== 用户自定义库 ====================
let userTasks = [];

function loadUserTasks() {
    const stored = localStorage.getItem('userTasks');
    userTasks = stored ? JSON.parse(stored) : [];
}

function saveUserTasks() {
    localStorage.setItem('userTasks', JSON.stringify(userTasks));
}

function getAllTasks() {
    return [...TASKS, ...userTasks];
}

// 渲染自定义库列表（弹窗内）
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

// ==================== 筛选与抽蛋（合并默认库+用户库） ====================
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
let cracking = false;
let lastTaskName = '';

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
    budgetGroup.innerHTML = BUDGET_OPTS.map(opt => `<div class="option ${selectedBudget === opt.value ? 'active' : ''}" data-type="budget" data-value="${opt.value}">${opt.label}</div>`).join('');
    durationGroup.innerHTML = DURATION_OPTS.map(opt => `<div class="option ${selectedDuration === opt.value ? 'active' : ''}" data-type="duration" data-value="${opt.value}">${opt.label}</div>`).join('');
    placeGroup.innerHTML = PLACE_OPTS.map(opt => `<div class="option ${selectedPlace === opt.value ? 'active' : ''}" data-type="place" data-value="${opt.value}">${opt.label}</div>`).join('');
    peopleGroup.innerHTML = PEOPLE_OPTS.map(opt => `<div class="option ${selectedPeople === opt.value ? 'active' : ''}" data-type="people" data-value="${opt.value}">${opt.label}</div>`).join('');

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
}

function filterTasks() {
    const allTasks = getAllTasks();
    return allTasks.filter(task => {
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
        alert('没有符合条件的事项，请放宽筛选');
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

// ==================== 反馈功能（Netlify Forms） ====================
let selectedFeedbackType = '';
const feedbackModal = document.getElementById('feedbackModal');
const closeFeedbackModal = document.getElementById('closeFeedbackModal');
const feedbackOptionsDiv = document.getElementById('feedbackOptions');
const feedbackTextArea = document.getElementById('feedbackText');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackTypeHidden = document.getElementById('feedbackType');

function openFeedbackModal() {
    feedbackModal.style.display = 'flex';
    selectedFeedbackType = '';
    feedbackTypeHidden.value = '';
    feedbackTextArea.style.display = 'none';
    submitFeedbackBtn.style.display = 'none';
    feedbackTextArea.value = '';
    feedbackOptionsDiv.style.display = 'block';
}

function closeFeedback() {
    feedbackModal.style.display = 'none';
}

function onSelectFeedbackType(type) {
    selectedFeedbackType = type;
    feedbackTypeHidden.value = type;
    feedbackOptionsDiv.style.display = 'none';
    feedbackTextArea.style.display = 'block';
    submitFeedbackBtn.style.display = 'block';
}

// 处理表单提交（不刷新页面）
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = feedbackTextArea.value.trim();
    if (!message) {
        alert('请填写反馈内容');
        return;
    }
    if (!selectedFeedbackType) {
        alert('请选择一个反馈类型');
        return;
    }
    const formData = new FormData(feedbackForm);
    formData.append('message', message);
    formData.append('type', selectedFeedbackType);

    try {
        const response = await fetch('/thank-you', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert('感谢你的反馈！蛋蛋会认真看的 🥚✨');
            closeFeedback();
        } else {
            throw new Error('提交失败');
        }
    } catch (err) {
        alert('提交失败，请稍后再试。如果多次失败，请联系开发者。');
    }
});

// ==================== 自定义库弹窗交互 ====================
const customModal = document.getElementById('customModal');
const customFab = document.getElementById('customFab');
const closeCustomModal = document.getElementById('closeCustomModal');
const showAddFormBtn = document.getElementById('showAddFormBtn');
const addFormDiv = document.getElementById('addForm');
const saveCustomBtn = document.getElementById('saveCustomBtn');

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

const feedbackFabBtn = document.getElementById('feedbackFab');
feedbackFabBtn.addEventListener('click', openFeedbackModal);
closeFeedbackModal.addEventListener('click', closeFeedback);
feedbackModal.addEventListener('click', (e) => { if (e.target === feedbackModal) closeFeedback(); });
feedbackOptionsDiv.querySelectorAll('.feedback-option').forEach(opt => {
    opt.addEventListener('click', () => {
        const type = opt.dataset.type;
        onSelectFeedbackType(type);
    });
});

// 初始化
loadUserTasks();
renderOptions();
filterBody.classList.remove('open');
filterArrow.innerText = '▼';
updateVisitCount();  // 计数器