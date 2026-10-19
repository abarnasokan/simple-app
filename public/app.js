const get = id => document.getElementById(id);
let tasks = [], storageKey = '', healthy = false;
function announce(message) { get('announcement').textContent = message; }
function error(message) { get('error').textContent = message; get('error').hidden = false; }
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
  catch { error('Browser storage is unavailable. Changes will last until this page is refreshed.'); }
}
function render() {
  const list = get('tasks'); list.replaceChildren();
  for (const task of tasks) {
    const row = document.createElement('li'); row.className = task.done ? 'task done' : 'task';
    const label = document.createElement('label');
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done;
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; persist(); render(); announce(`${task.name} marked ${task.done ? 'complete' : 'incomplete'}.`); });
    const name = document.createElement('span'); name.textContent = task.name; label.append(checkbox, name);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove'; remove.textContent = '×'; remove.setAttribute('aria-label', `Delete ${task.name}`);
    remove.addEventListener('click', () => { tasks = tasks.filter(item => item.id !== task.id); persist(); render(); announce('Task deleted.'); });
    row.append(label, remove); list.append(row);
  }
  get('progress').textContent = `${tasks.filter(task => task.done).length} of ${tasks.length} complete`;
  get('empty').hidden = tasks.length !== 0;
  get('add-task').disabled = !healthy || tasks.length >= 100;
}
get('task-form').addEventListener('submit', event => {
  event.preventDefault(); const name = get('task-name').value.trim();
  if (!name || !healthy || tasks.length >= 100) return;
  tasks.push({id: crypto.randomUUID(), name, done: false}); persist(); render(); get('task-name').value = ''; get('task-name').focus(); announce('Task added.');
});
try {
  const response = await fetch('/api/health', {cache: 'no-store', signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('The health endpoint is unavailable. Check the deployment configuration.');
  const info = await response.json();
  const labels = {dev: 'Development', staging: 'Staging', prod: 'Production'};
  if (info.status !== 'ok' || !labels[info.environment]) throw new Error('The app returned an invalid environment configuration.');
  document.body.dataset.environment = info.environment;
  get('environment').textContent = labels[info.environment]; get('environment-name').textContent = labels[info.environment];
  get('version').textContent = `v${info.version}`; get('commit').textContent = info.commit.slice(0, 8);
  get('deployment-id').textContent = info.deploymentId; get('headline').textContent = info.headline;
  get('health').textContent = 'Healthy'; healthy = true;
  storageKey = `launchpad:tasks:v1:${info.environment}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Invalid task list');
      tasks = parsed.filter(task => task && typeof task.id === 'string' && typeof task.name === 'string' && task.name.length <= 160 && typeof task.done === 'boolean').slice(0, 100);
    } else tasks = [{id: crypto.randomUUID(), name: 'Try adding your first task', done: false}, {id: crypto.randomUUID(), name: 'Check the environment and release version', done: false}];
  } catch { error('Saved tasks could not be loaded. You can start a new board here.'); }
  get('task-name').disabled = false; render();
} catch (cause) { get('health').textContent = 'Unavailable'; get('environment').textContent = 'Unavailable'; error(cause.message); }
