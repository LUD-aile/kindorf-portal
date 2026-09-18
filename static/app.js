let currentUser = null;
let currentLang = 'en';
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
        certNeed: "Путь к сертификату: требуется 2 месяца активности и 150 коинов.", certDone: "🎉 Вы заслужили сертификат!",
        claimBtn: "Взять себе", cancelBtn: "Отменить задачу", placeholderReport: "Вставьте ссылку на диск/документ с отчетом...",
        alertSuccess: "Отчет успешно отправлен руководству!", wrongAuth: "❌ Неверный логин или пароль!", fillFields: "⚠️ Заполните все поля формы!",
        promoteBtn: "Повысить", kickBtn: "Выгнать", regSuccess: "🎉 Регистрация завершена! Теперь войдите в систему.", taskPubSuccess: "🚀 Задача успешно опубликована!",
        modalTitle: "Удаление", modalText: "Выгнать пользователя из команды?",
        phUsername: "Имя пользователя", phPassword: "Пароль", phFullName: "Полное имя",
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
        certNeed: "Certificate path: 2 months milestone and 150 coins required.", certDone: "🎉 Certificate Earned!",
        claimBtn: "Claim Task", cancelBtn: "Cancel Work", placeholderReport: "Paste link to Google Drive/Document report...",
        alertSuccess: "Report successfully sent to directors!", wrongAuth: "❌ Incorrect username or password!", fillFields: "⚠️ Please fill all fields!",
        promoteBtn: "Promote", kickBtn: "Kick", regSuccess: "🎉 Registration complete! Now please sign in.", taskPubSuccess: "🚀 Task published successfully!",
        modalTitle: "Kick User", modalText: "Are you sure you want to kick this user?",
        phUsername: "Username", phPassword: "Password", phFullName: "Full Name",
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
    if (!toast) return;
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
    document.getElementById('lang-btn').innerText = currentLang === 'ru' ? 'EN' : 'RU';
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

    document.getElementById('username-input').placeholder = l.phUsername;
    document.getElementById('password-input').placeholder = l.phPassword;
    document.getElementById('reg-name').placeholder = l.phFullName;
    document.getElementById('reg-user').placeholder = l.phUsername;
    document.getElementById('reg-pass').placeholder = l.phPassword;

    document.getElementById('new-task-title').placeholder = l.phTaskTitle;
    document.getElementById('new-task-desc').placeholder = l.phTaskDesc;
    document.getElementById('new-task-points').placeholder = l.phTaskPoints;
    document.getElementById('user-search-input').placeholder = l.phSearch;
    document.getElementById('new-task-day').placeholder = currentLang === 'ru' ? "День (1-31)" : "Day (1-31)";
    document.getElementById('new-task-month').placeholder = currentLang === 'ru' ? "Месяц (1-12)" : "Month (1-12)";

    const createSelect = document.getElementById('new-task-stream');
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
    currentUser.username = userInp;
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
    if (currentUser && currentUser.username && currentUser.username.toLowerCase() === "victoria") {
        currentUser.role = "admin";
        currentUser.stream = "All";
    }
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

async function loadTeamUsers() {
    const res = await fetch('/api/users');
    if (!res.ok) return;
    allCachedUsers = await res.json();
    renderTeamUsers(allCachedUsers);
}

function renderTeamUsers(users) {
    const cont = document.getElementById('team-users-list');
    if (!cont) return;
    cont.innerHTML = '';

    users.forEach(u => {
        const roleTranslation = currentLang === 'ru'
            ? (u.role === 'admin' ? 'Администратор' : u.role === 'manager' ? 'Менеджер' : 'Волонтер')
            : u.role;

        const statusTranslation = currentLang === 'ru'
            ? (u.status === 'pending' ? 'на рассмотрении' : 'подтвержден')
            : u.status;

        const isSelf = currentUser && currentUser.username.toLowerCase() === u.username.toLowerCase();

        let actionButtonsHtml = '';
        if (!isSelf) {
            if (u.role !== 'manager' && u.role !== 'admin') {
                actionButtonsHtml += '<button class="btn" style="padding:5px 10px; font-size:12px; border-radius:4px; background:#062319; color:#6ee7b7; border:1px solid #064e3b; margin-right:6px; cursor:pointer;" onclick="promoteUser(' + u.id + ')">' + langMap[currentLang].promoteBtn + '</button>';
            }
          actionButtonsHtml += '<button class="btn" style="padding:5px 10px; font-size:12px; border-radius:4px; background:#1a0f12; color:#fda4af; border:1px solid #4c1d24; cursor:pointer;" onclick="openConfirmModal(' + u.id + ')">' + langMap[currentLang].kickBtn + '</button>';
        }

        const row = document.createElement('div');
        row.className = 'user-row';
        row.innerHTML = `
            <div class="user-meta">
                <strong>${u.username}</strong> (${roleTranslation}) - <em>${statusTranslation}</em>
            </div>
            <div class="user-actions">
                ${actionButtonsHtml}
            </div>
        `;
        cont.appendChild(row);
    });
}
document.getElementById('user-search-input')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allCachedUsers.filter(u => u.username.toLowerCase().includes(query));
    renderTeamUsers(filtered);
});

async function promoteUser(userId) {
    await fetch(`/api/users/${userId}/promote`, { method: 'POST' });
    loadTeamUsers();
}

async function executeUserKick() {
    if (!pendingDeleteUserId) return;
    await fetch(`/api/users/${pendingDeleteUserId}`, { method: 'DELETE' });
    closeConfirmModal();
    loadTeamUsers();
}

async function loadReviewTasks() {
    const res = await fetch('/api/manager/review');
    if (!res.ok) return;
    const tasks = await res.json();
    const cont = document.getElementById('review-tasks-list');
    if (!cont) return;
    cont.innerHTML = tasks.length === 0 ? `<p style="color:var(--text-muted)">${langMap[currentLang].noReview}</p>` : '';

    tasks.forEach(t => {
        cont.innerHTML += `
            <div class="task-node">
                <div>
                    <h4>${t.title}</h4>
                    <p style="margin:5px 0; color:var(--text-muted); font-size:14px;">${t.description}</p>
                    ${t.report_link ? `<p><a href="${t.report_link}" target="_blank" style="color:var(--accent)">Report Link</a></p>` : ''}
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

async function loadAvailableTasks() {
    const filterElem = document.getElementById('filter-stream');
    const selectedStream = filterElem ? filterElem.value : 'All';
    const endpoint = (selectedStream === 'All' || !selectedStream)
        ? '/api/tasks'
        : `/api/tasks?stream=${encodeURIComponent(selectedStream)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return;
    const tasks = await res.json();
    const cont = document.getElementById('available-tasks-list');
    if (!cont) return;
    cont.innerHTML = tasks.length === 0 ? `<p style="color:var(--text-muted)">${langMap[currentLang].noTasks}</p>` : '';

    tasks.forEach(t => {
        let skey = t.stream;
        if (skey === "Project Management") skey = "Project";
        const currentStreamName = langMap[currentLang].streams[skey] || t.stream;

        let deadlineAlert = '';
        let nodeStyle = '';

        if (t.deadline) {
            const diffTime = new Date(t.deadline) - new Date();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 1 && diffTime > 0) {
                nodeStyle = 'style="border-color: orange;"';
                deadlineAlert = '<span style="color: orange; font-weight: bold; margin-left: 10px;">⚠️ 1 day left!</span>';
            }
        }

        let actionsHtml = '';
        if (currentUser && currentUser.role === 'volunteer') {
            actionsHtml += '<button class="btn" style="padding:6px 12px; font-size:13px; border-radius:4px;" onclick="claimTask(' + t.id + ')">' + langMap[currentLang].claimBtn + '</button>';
        }
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
            actionsHtml += '<button class="btn" style="padding:6px 10px; font-size:13px; border-radius:4px; background:#1e293b; color:#94a3b8; border:1px solid #334155; margin-right:5px;" onclick="editTaskPrompt(' + t.id + ', \'' + t.title.replace(/'/g, "\\'") + '\', \'' + t.description.replace(/'/g, "\\'") + '\', ' + t.points + ', \'' + t.stream + '\')">✏️</button>';
            actionsHtml += '<button class="btn" style="padding:6px 10px; font-size:13px; border-radius:4px; background:#2d191e; color:#f43f5e; border:1px solid #4c1d24;" onclick="deleteTask(' + t.id + ')">🗑️</button>';
        }

        const taskHtmlNode = `
            <div class="task-node" ${nodeStyle} data-id="${t.id}">
                <div>
                    <h4>${t.title} ${deadlineAlert}</h4>
                    <p style="margin:5px 0; color:var(--text-muted); font-size:14px;">${t.description}</p>
                    <span class="task-tag">${currentStreamName}</span>
                    <span class="task-tag" style="color:var(--accent)">+${t.points} XP</span>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">${actionsHtml}</div>
            </div>
        `;

        if (t.status === 'assigned') {
            const activeCont = document.getElementById('my-active-tasks-list');
            if (activeCont) activeCont.innerHTML += taskHtmlNode;
        } else if (t.status === 'open' || t.status === 'published' || t.status === 'available' || !t.status) {
            const publicCont = document.getElementById('available-tasks-list');
            if (publicCont) publicCont.innerHTML += taskHtmlNode;
        }

    });
}

async function loadMyTasks() {
    const res = await fetch(`/api/tasks?user_id=${currentUser.id}`);
    if (!res.ok) return;
    const tasks = await res.json();
    const cont = document.getElementById('my-tasks-list');
    cont.innerHTML = '';

    tasks.forEach(t => {
        const isReview = t.status === 'on_review';
        let skey = t.stream;
        if (skey === "Project Management") skey = "Project";
        const currentStreamName = langMap[currentLang].streams[skey] || t.stream;

        let deadlineAlert = '';
        let nodeStyle = 'style="border-color: var(--accent);"';

        if (t.deadline) {
            const diffTime = new Date(t.deadline) - new Date();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 1 && diffTime > 0) {
                nodeStyle = 'style="border-color: orange;"';
                deadlineAlert = `<span style="color: orange; font-weight: bold; margin-left: 10px;">⚠️ 1 day left!</span>`;
            }
        }

        cont.innerHTML += `
            <div class="task-node" ${nodeStyle}>
                <div style="flex-grow: 1; width: 100%;">
                    <h4 style="margin:0;">${t.title} ${deadlineAlert}</h4>
                    <span class="task-tag">${currentStreamName}</span>
                    ${isReview ? `<span class="task-tag" style="color:orange; margin-top:5px;">Review Pending...</span>` : `
                        <input type="text" id="report-input-${t.id}" placeholder="${langMap[currentLang].placeholderReport}" style="margin-top:10px; width:100%;">
                    `}
                </div>
                ${isReview ? '' : `
                    <div style="display:flex; gap:10px; align-items:center; margin-top:10px;">
                        <button class="btn" style="padding:6px 12px; font-size:13px; border-radius:4px; background:#1a0f12; color:#fda4af; border:1px solid #4c1d24; cursor:pointer; font-weight:500;" onclick="cancelTask(${t.id})">${langMap[currentLang].cancelBtn}</button>
                        <button class="btn" style="padding:6px 10px; font-size:13px; border-radius:4px; background:#062319; color:#6ee7b7; border:1px solid #064e3b; cursor:pointer;" onclick="submitTask(${t.id})">✓</button>
                    </div>
                `}
            </div>
        `;
    });
}

async function claimTask(taskId) {
    const res = await fetch(`/api/tasks/${taskId}/claim`, { method: 'POST' });
    if (res.ok) {
        showToast(currentLang === 'ru' ? "Задача взята в работу" : "Task claimed successfully", false);
        loadAvailableTasks();
    } else {
        showToast(currentLang === 'ru' ? "Не удалось взять задачу" : "Failed to claim task", true);
    }
}

async function cancelTask(taskId) {
    const res = await fetch(`/api/tasks/${taskId}/cancel`, { method: 'POST' });
    if (res.ok) {
        showToast(currentLang === 'ru' ? "Работа отменена" : "Work canceled", false);
        loadAvailableTasks();
    } else {
        showToast(currentLang === 'ru' ? "Ошибка отмены" : "Error canceling", true);
    }
}

async function submitTask(taskId) {
    const inputElem = document.querySelector(`.task-node[data-id="${taskId}"] input`);
    const reportLink = inputElem ? inputElem.value.trim() : '';

    if (!reportLink) {
        return showToast(currentLang === 'ru' ? "Пожалуйста, введите ссылку на отчет!" : "Please enter report link!", true);
    }

    const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_link: reportLink })
    });

    if (res.ok) {
        showToast(currentLang === 'ru' ? "Отчет успешно отправлен!" : "Report successfully sent!", false);
        loadAvailableTasks();
    } else {
        showToast(currentLang === 'ru' ? "Ошибка отправки" : "Submission error", true);
    }
}

async function addNewTask() {
    const title = document.getElementById('new-task-title').value.trim();
    const description = document.getElementById('new-task-desc').value.trim();
    const stream = document.getElementById('new-task-stream').value;
    const points = parseInt(document.getElementById('new-task-points').value);
    const day = document.getElementById('new-task-day').value.trim();
    const month = document.getElementById('new-task-month').value.trim();

    if (!title || !points) return showToast(currentLang === 'ru' ? "Заполните данные!" : "Fill data!");

    let deadlineValue = null;
    if (day && month) {
        const d = String(day).padStart(2, '0');
        const m = String(month).padStart(2, '0');
        deadlineValue = `2026-${m}-${d}T23:59:59`;
    }

    await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, stream, points, deadline: deadlineValue })
    });
    showToast(langMap[currentLang].taskPubSuccess);
    document.getElementById('new-task-title').value = '';
    document.getElementById('new-task-desc').value = '';
    document.getElementById('new-task-points').value = '';
    document.getElementById('new-task-day').value = '';
    document.getElementById('new-task-month').value = '';
    loadAvailableTasks();
}

let taskIdToDelete = null;
let taskIdToEdit = null;

async function deleteTask(taskId) {
    taskIdToDelete = taskId;
    const modal = document.getElementById('delete-task-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('confirm-delete-task-btn').onclick = async () => {
            await fetch(`/api/tasks/${taskIdToDelete}`, { method: 'DELETE' });
            closeDeleteTaskModal();
            loadAvailableTasks();
        };
    }
}

function closeDeleteTaskModal() {
    const modal = document.getElementById('delete-task-modal');
    if (modal) modal.style.display = 'none';
    taskIdToDelete = null;
}

function editTaskPrompt(taskId, title, desc, points, stream) {
    taskIdToEdit = taskId;
    document.getElementById('edit-task-title-header').innerText = `Edit: ${title}`;
    document.getElementById('edit-task-desc').value = desc;
    document.getElementById('edit-task-points').value = points;
    document.getElementById('edit-task-stream').value = stream || "Finance";
    const modal = document.getElementById('edit-task-modal');
    if (modal) modal.style.display = 'flex';

    document.getElementById('save-edit-task-btn').onclick = async () => {
        const newDesc = document.getElementById('edit-task-desc').value.trim();
        const newPoints = parseInt(document.getElementById('edit-task-points').value);
        const newStream = document.getElementById('edit-task-stream').value;
        if (!newDesc || isNaN(newPoints)) return alert("Fields cannot be empty!");

        await fetch(`/api/tasks/${taskIdToEdit}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                description: newDesc,
                points: newPoints,
                stream: newStream
            })
        });
        closeEditTaskModal();
        loadAvailableTasks();
    };
}

function closeEditTaskModal() {
    const modal = document.getElementById('edit-task-modal');
    if (modal) modal.style.display = 'none';
    taskIdToEdit = null;
}

async function logout() {
    currentUser = null;
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}
