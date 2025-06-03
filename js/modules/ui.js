
export function updateTime() {
  const now = new Date();
  document.getElementById('current-time').textContent = now.toLocaleTimeString();
  document.getElementById('current-date').textContent = now.toLocaleDateString();
}

export function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `glass-effect p-4 rounded-lg text-white mb-2 fade-in ${type === 'error' ? 'bg-red-500/50' : 'bg-green-500/50'}`;
  notification.textContent = message;
  document.getElementById('notifications').appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

export function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const tabName = btn.id.replace('tab-', '');
    btn.addEventListener('click', () => showTab(tabName));
  });
}

export function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-white/20', 'text-white');
    btn.classList.add('text-white/70');
  });
  
  document.getElementById(`${tabName}-section`).classList.remove('hidden');
  document.getElementById(`tab-${tabName}`).classList.add('bg-white/20', 'text-white');
  document.getElementById(`tab-${tabName}`).classList.remove('text-white/70');
}
