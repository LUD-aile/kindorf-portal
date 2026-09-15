let currentUser = null;
let currentLang = 'ru';
let isDarkTheme = true;
let allCachedUsers = [];
let pendingDeleteUserId = null;

const langMap = {
    ru: {
        loginTitle: "Добро Кабинет", loginBtn: "Войти в систему", logout: "Выйти",
        regTitle: "Регистрация в команду", regBtn: "Зарегистрироваться", goReg: "Создать аккаунт", goLogin: "Есть аккаунт? Войти",
        yourActivity: "Ваша активность", tasksDone: "Задач сдано", coinsBalance: "Баланс коинов",
        myCurrentTasks: "Мои текущие задачи", adminPanel: "Панель управления проектом",
        createTask: "Создать новое задание для стрима", pubBtn: "Опубликовать задачу",
        tasksReview: "Задачи, требующие проверки:", teamList: "Список всей команды:",
        availableTasks: "Доступные задачи стримов", noTasks: "Нет доступных задач для выполнения.",
        noReview: "Нет задач, ожидающих проверки.", volRole: "Волонтер", managerRole: "Менеджер направления", adminRole: "Главный Администратор",
        certNeed: "До сертификата нужно: 2 месяца активности и 200 коинов", certDone: "🎉 Вы заслужили сертификат!",
        claimBtn: "Взять себе", cancelBtn: "Отменить задачу", placeholderReport: "Вставьте ссылку на диск/документ с отчетом...",
        alertSuccess: "Отчет успешно отправлен руководству!", wrongAuth: "❌ Неверный логин или пароль!", fillFields: "⚠️ Заполните все поля формы!",
        promoteBtn: "Повысить", kickBtn: "Выгнать", regSuccess: "🎉 Регистрация завершена! Теперь войдите в систему.", taskPubSuccess: "🚀 Задача успешно опубликована!",
        modalTitle: "Удаление", modalText: "Выгнать пользователя из команды?",
        phTaskTitle: "Название задачи", phTaskDesc: "Описание задачи...", phTaskPoints: "Коины", phSearch: "🔍 Поиск по нику...",
        streams: {
            All: "Все стримы", Finance: "Финансы", HR: "Управление персоналом", Legal: "Юриспруденция",
            Research: "Исследования", Partnerships: "Партнерство", Design: "Дизайн",
            SMM: "Маркетинг в соцсетях", IT: "Разработка", Project: "Управление проектами"
        }
    },
    en: {
        loginTitle: "KINDORF Portal", loginBtn: "Sign In", logout: "Logout",
        regTitle: "Join the Team", regBtn: "Sign Up Now", goReg: "Create an Account", goLogin: "Have an account? Login",
        yourActivity: "Your Activity", tasksDone: "Tasks Completed", coinsBalance: "Coins Balance",
        myCurrentTasks: "My Current Active Tasks", adminPanel: "Management Control Dashboard",
        createTask: "Create New Task for Stream", pubBtn: "Publish Task",
        tasksReview: "Tasks Awaiting Verification:", teamList: "Team Members Directory:",
        availableTasks: "Open Public Stream Tasks", noTasks: "No available tasks found for this stream.",
        noReview: "No tasks pending verification.", volRole: "Volunteer", managerRole: "Stream Manager", adminRole: "Global Administrator",
        certNeed: "Certificate path: 2 months milestone and 200 coins required", certDone: "🎉 Certificate Earned!",
        claimBtn: "Claim Task", cancelBtn: "Cancel Work", placeholderReport: "Paste link to Google Drive/Document report...",
        alertSuccess: "Report successfully sent to directors!", wrongAuth: "❌ Incorrect username or password!", fillFields: "⚠️ Please fill all fields!",
        promoteBtn: "Promote", kickBtn: "Kick", regSuccess: "🎉 Registration complete! Now please sign in.", taskPubSuccess: "🚀 Task published successfully!",
        modalTitle: "Kick User", modalText: "Are you sure you want to kick this user?",
        phTaskTitle: "Task Title", phTaskDesc: "Task description...", phTaskPoints: "Coins", phSearch: "🔍 Search nick...",
        streams: {
            All: "All Streams", Finance: "Finance", HR: "HR", Legal: "Legal",
            Research: "Research", Partnerships: "Partnerships", Design: "Design",
            SMM: "SMM", IT: "IT", Project: "Project Management"
        }
    }
};

function showToast(text) {
    const toast = document.getElementById('toast-notif');
    toast.innerText = text;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function openConfirmModal(userId) {
    pendingDeleteUserId = userId;
    const l = langMap[currentLang];
    document.getElementById('t-modal-title').innerText = l.modalTitle;
    document.getElementById('t-modal-text').innerText = l.modalText;
    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.onclick = async function() { await executeUserKick(); };
    document.getElementById('confirm-modal').classList.add('show');
}
function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('show');
    pendingDeleteUserId = null;
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        btn.innerText = "👁️";
    } else {
        input.type = "password";
        btn.innerText = "🙈";
    }
}

function toggleLang() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    document.getElementById('lang-btn').innerText = currentLang === 'ru' ? '🇷🇺' : '🇺🇸';
    updateLanguageDOM();
    if (currentUser) renderApp();
}

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme', !isDarkTheme);
    document.getElementById('theme-btn').innerText = isDarkTheme ? '🌙' : '☀️';
}

function switchAuthMode(toReg) {
    document.getElementById('login-form-block').classList.toggle('hidden', toReg);
    document.getElementById('register-form-block').classList.toggle('hidden', !toReg);
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('reg-error').style.display = 'none';
}

function updateLanguageDOM() {
    const l = langMap[currentLang];
    document.getElementById('t-login-title').innerText = l.loginTitle;
    document.getElementById('t-login-btn').innerText = l.loginBtn;
    document.getElementById('t-reg-title').innerText = l.regTitle;
    document.getElementById('t-reg-btn').innerText = l.regBtn;
    document.getElementById('t-go-reg').innerText = l.goReg;
    document.getElementById('t-go-login').innerText = l.goLogin;
    document.getElementById('t-logout').innerText = l.logout;
    document.getElementById('t-your-activity').innerText = l.yourActivity;
    document.getElementById('t-tasks-done').innerText = l.tasksDone;
    document.getElementById('t-coins-balance').innerText = l.coinsBalance;
    document.getElementById('t-my-current-tasks').innerText = l.myCurrentTasks;
    document.getElementById('t-admin-panel').innerText = l.adminPanel;
    document.getElementById('t-create-task').innerText = l.createTask;
    document.getElementById('t-pub-btn').innerText = l.pubBtn;
    document.getElementById('t-tasks-review').innerText = l.tasksReview;
    document.getElementById('t-team-list').innerText = l.teamList;
    document.getElementById('t-available-tasks').innerText = l.availableTasks;

    document.getElementById('new-task-title').placeholder = l.phTaskTitle;
    document.getElementById('new-task-desc').placeholder = l.phTaskDesc;
    document.getElementById('new-task-points').placeholder = l.phTaskPoints;
    document.getElementById('user-search-input').placeholder = l.phSearch;

    const createSelect = document.getElementById('new-task-stream');
    const cMap = ["Finance", "HR", "Legal", "Research", "Partnerships", "Design", "SMM", "IT", "Project Management"];
    for (let i = 0; i < createSelect.options.length; i++) {
        let val = createSelect.options[i].value;
        if (val === "Project Management") val = "Project";
        if (l.streams[val]) createSelect.options[i].text = l.streams[val];
    }

    const filterSelect = document.getElementById('filter-stream');
    for (let i = 0; i < filterSelect.options.length; i++) {
        let val = filterSelect.options[i].value;
        if (val === "Project Management") val = "Project";
        if (l.streams[val]) filterSelect.options[i].text = l.streams[val];
    }
}
async function handleLogin() {
    const userInp = document.getElementById('username-input').value.trim();
    const passInp = document.getElementById('password-input').value.trim();
    const errBlock = document.getElementById('login-error');

    if (!userInp || !passInp) {
        errBlock.innerText = langMap[currentLang].fillFields;
        errBlock.style.display = 'block';
        return;
    }

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userInp, password: passInp })
    });

    if (!res.ok) {
        errBlock.innerText = langMap[currentLang].wrongAuth;
        errBlock.style.display = 'block';
        return;
    }

    currentUser = await res.json();
    errBlock.style.display = 'none';
    renderApp();
}

async function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const user = document.getElementById('reg-user').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    const errBlock = document.getElementById('reg-error');

    if (!name || !user || !pass) {
        errBlock.innerText = langMap[currentLang].fillFields;
        errBlock.style.display = 'block';
        return;
    }

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username: user, password: pass })
    });

    if (res.ok) {
        showToast(langMap[currentLang].regSuccess);
        switchAuthMode(false);
    } else {
        errBlock.innerText = "Username already taken!";
        errBlock.style.display = 'block';
    }
}

function renderApp() {
    const l = langMap[currentLang];
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('welcome-name').innerText = currentUser.name;
    
    let roleText = l.volRole;
    if (currentUser.role === 'admin') roleText = l.adminRole;
    if (currentUser.role === 'manager') roleText = l.managerRole;
    
    let streamLabel = currentUser.stream;
    if (streamLabel === 'Pending') streamLabel = currentLang === 'ru' ? 'Ожидает стрим' : 'Pending';
    if (streamLabel === 'All') streamLabel = currentLang === 'ru' ? 'Все стримы' : 'All';
    else if (l.streams[streamLabel]) streamLabel = l.streams[streamLabel];
    
    document.getElementById('user-role-badge').innerText = `${roleText} [${streamLabel}]`;

    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
        document.getElementById('volunteer-section').classList.add('hidden');
        document.getElementById('manager-section').classList.remove('hidden');
        
        const teamCont = document.getElementById('team-users-list');
        teamCont.style.maxHeight = "450px";
        teamCont.style.overflowY = "auto";

        if (currentUser.role === 'admin') {
            document.getElementById('admin-only-users').classList.remove('hidden');
            loadTeamUsers();
        } else {
            document.getElementById('admin-only-users').classList.add('hidden');
        }
        loadReviewTasks();
    } else {
        document.getElementById('volunteer-section').classList.remove('hidden');
        document.getElementById('manager-section').classList.add('hidden');
        document.getElementById('stat-tasks').innerText = currentUser.tasks;
        document.getElementById('stat-points').innerText = currentUser.points;
        
        document.getElementById('cert-tracker').innerText = currentUser.eligible ? l.certDone : `${l.certNeed} (Current: ${currentUser.months}m, ${currentUser.points}p)`;
        loadMyTasks();
    }
    loadAvailableTasks();
}
async function loadAvailableTasks() {
    const streamFilter = document.getElementById('filter-stream').value;
    const res = await fetch(`/api/tasks?stream=${streamFilter}`);
    const tasks = await res.json();
    const cont = document.getElementById('available-tasks-list');
    cont.innerHTML = tasks.length === 0 ? `<p style="color:var(--text-muted)">${langMap[currentLang].noTasks}</p>` : '';

    tasks.forEach(t => {
        let sKey = t.stream;
        if (sKey === "Project Management") sKey = "Project";
        const currentStreamName = langMap[currentLang].streams[sKey] || t.stream;
        cont.innerHTML += `
            <div class="task-node">
                <div>
                    <h4 style="margin:0;">${t.title}</h4>
                    <p style="margin:5px 0; color:var(--text-muted); font-size:14px;">${t.description}</p>
                    <span class="task-tag">${currentStreamName}</span>
                    <span class="task-tag" style="color:var(--accent)">+${t.points} XP</span>
                </div>
                ${currentUser && (currentUser.role === 'volunteer') ? `<button class="btn" onclick="claimTask(${t.id})">${langMap[currentLang].claimBtn}</button>` : ''}
            </div>
        `;
    });
}

async function loadMyTasks() {
    const res = await fetch(`/api/tasks?user_id=${currentUser.id}`);
    const tasks = await res.json();
    const cont = document.getElementById('my-tasks-list');
    cont.innerHTML = '';

    tasks.forEach(t => {
        const isReview = t.status === 'on_review';
        let sKey = t.stream;
        if (sKey === "Project Management") sKey = "Project";
        const currentStreamName = langMap[currentLang].streams[sKey] || t.stream;
        cont.innerHTML += `
            <div class="task-node" style="border-color: var(--accent);">
                <div style="flex-grow:1; width: 100%;">
                    <h4 style="margin:0;">${t.title}</h4>
                    <span class="task-tag">${currentStreamName}</span>
                    ${isReview ? `<span class="task-tag" style="color:orange; margin-top:5px;">Review Pending...</span>` : `
                        <input type="text" id="report-input-${t.id}" placeholder="${langMap[currentLang].placeholderReport}" style="margin-top:10px; width:100%;">
                    `}
                </div>
                ${isReview ? '' : `
                    <div style="display:flex; gap:10px; align-items:center; margin-top:10px;">
                        <button class="btn btn-danger" onclick="cancelTask(${t.id})">${langMap[currentLang].cancelBtn}</button>
                        <button class="btn btn-circle" onclick="submitTask(${t.id})">✓</button>
                    </div>
                `}
            </div>
        `;
    });
}

async function claimTask(taskId) {
    await fetch('/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, task_id: taskId })
    });
    loadAvailableTasks();
    loadMyTasks();
}

async function cancelTask(taskId) {
    await fetch('/api/tasks/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, task_id: taskId })
    });
    loadAvailableTasks();
    loadMyTasks();
}

async function submitTask(taskId) {
    const link = document.getElementById(`report-input-${taskId}`).value.trim();
    if (!link) return alert("Enter link first!");

    await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, task_id: taskId, report_link: link })
    });
    showToast(langMap[currentLang].alertSuccess);
    loadMyTasks();
}

async function addNewTask() {
    const title = document.getElementById('new-task-title').value.trim();
    const description = document.getElementById('new-task-desc').value.trim();
    const stream = document.getElementById('new-task-stream').value;
    const points = parseInt(document.getElementById('new-task-points').value);

    if (!title || !points) return alert("Fill data!");

    await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, stream, points })
    });
    showToast(langMap[currentLang].taskPubSuccess);
    document.getElementById('new-task-title').value = '';
    document.getElementById('new-task-desc').value = '';
    document.getElementById('new-task-points').value = '';
    loadAvailableTasks();
}

async function loadReviewTasks() {
    const streamParam = currentUser.role === 'admin' ? 'All' : currentUser.stream;
    const [tasksRes, usersRes] = await Promise.all([
        fetch(`/api/manager/review?stream=${streamParam}`),
        fetch('/api/users')
    ]);
    const tasks = await tasksRes.json();
    const users = await usersRes.json();
    const cont = document.getElementById('review-tasks-list');
    cont.innerHTML = tasks.length === 0 ? `<p style="color:var(--text-muted)">${langMap[currentLang].noReview}</p>` : '';

    tasks.forEach(t => {
        const worker = users.find(u => u.id == t.worker_id);
        const workerName = worker ? worker.name : "Unknown Volunteer";
        let sKey = t.stream;
        if (sKey === "Project Management") sKey = "Project";
        const currentStreamName = langMap[currentLang].streams[sKey] || t.stream;
        cont.innerHTML += `
            <div class="task-node" style="border-color:var(--danger)">
                <div style="width: 100%;">
                    <h4>${t.title}</h4>
                    <p style="margin:0 0 10px 0; font-size:14px; color:var(--accent);">👤 Отправитель / From: <strong>${workerName}</strong></p>
                    <span class="task-tag">${currentStreamName}</span><br><br>
                    <a href="${t.report_link}" target="_blank" style="color:var(--accent); font-weight:bold;">🔗 Open Report Link</a>
                </div>
                <button class="btn btn-success" onclick="approveTask(${t.id})">Approve</button>
            </div>
        `;
    });
}

async function approveTask(taskId) {
    await fetch(`/api/tasks/approve?task_id=${taskId}`, { method: 'POST' });
    loadReviewTasks();
}

async function loadTeamUsers() {
    const res = await fetch('/api/users');
    allCachedUsers = await res.json();
    buildTeamListDOM(allCachedUsers);
}

function buildTeamListDOM(usersList) {
    const cont = document.getElementById('team-users-list');
    cont.innerHTML = '';
    usersList.forEach(u => {
        if(u.role === 'admin') return;
        
        let userStreamName = u.stream;
        if (userStreamName === 'Pending') userStreamName = currentLang === 'ru' ? 'Ожидает' : 'Pending';
        else if (langMap[currentLang].streams[userStreamName]) userStreamName = langMap[currentLang].streams[userStreamName];

        cont.innerHTML += `
            <div class="user-row">
                <div class="user-meta">
                    <strong>${u.name}</strong><br>
                    <span style="color:var(--text-muted)">@${u.username}</span><br>
                    Role: <span style="color:var(--accent)">${u.role}</span> [${userStreamName}]<br>
                    🪙 ${u.points} XP
                </div>
                <div class="user-actions">
                    ${u.role === 'volunteer' ? `<button class="btn" style="background:var(--success); color:black;" onclick="promoteUser(${u.id})">${langMap[currentLang].promoteBtn}</button>` : ''}
                    <button class="btn btn-danger" onclick="openConfirmModal(${u.id})">${langMap[currentLang].kickBtn}</button>
                </div>
            </div>
        `;
    });
}

function filterTeamUsers() {
    const query = document.getElementById('user-search-input').value.toLowerCase().trim();
    const filtered = allCachedUsers.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.username.toLowerCase().includes(query)
    );
    buildTeamListDOM(filtered);
}

async function promoteUser(userId) {
    await fetch(`/api/users/${userId}/promote`, { method: 'POST' });
    loadTeamUsers();
}

async function executeUserKick() {
    if (pendingDeleteUserId) {
        await fetch(`/api/users/${pendingDeleteUserId}`, { method: 'DELETE' });
        closeConfirmModal();
        loadTeamUsers();
    }
}

function logout() {
    currentUser = null;
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('username-input').value = '';
    document.getElementById('password-input').value = '';
}

updateLanguageDOM();
