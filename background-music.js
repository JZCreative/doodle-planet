// Shared across home, painting and group portraits; never reset by hash changes.
const button = document.querySelector('#musicBtn');
const music = new Audio(new URL('./assets/audio/doodle-loop.mp3', import.meta.url).href);
music.loop = true;
music.volume = 0.28;
music.preload = 'none';
music.id = 'backgroundMusic';
music.hidden = true;
document.body.append(music);
let enabled = true, unlocked = false, failed = false;
try { enabled = localStorage.getItem('doodle-music-enabled') !== 'false'; } catch {}

function render() {
  const en = document.documentElement.lang === 'en';
  const playing = !music.paused && enabled;
  const text = failed ? (en ? 'Retry music ↻' : '音乐重试 ↻')
    : playing ? (en ? 'Music ♫' : '音乐 ♫')
    : (en ? 'Music ♪' : '音乐 ♪');
  if (button.textContent !== text) button.textContent = text;
  if (button.getAttribute('aria-pressed') !== String(playing)) button.setAttribute('aria-pressed', String(playing));
  const label = failed ? (en ? 'Retry background music' : '重试背景音乐')
    : playing ? (en ? 'Mute background music' : '关闭背景音乐')
    : (en ? 'Play background music' : '播放背景音乐');
  if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
  if (button.title !== label) button.title = label;
}
async function play() {
  if (!enabled || !unlocked || document.hidden) return;
  try {
    await music.play();
    failed = false;
    if (!enabled || document.hidden) music.pause();
  } catch (error) {
    // A browser refusing autoplay is not a missing-file error; a click can retry.
    failed = error.name !== 'NotAllowedError';
    if (error.name === 'NotAllowedError') unlocked = false;
  }
  render();
}
function remember() {
  try { localStorage.setItem('doodle-music-enabled', String(enabled)); } catch {}
}
button.addEventListener('click', () => {
  unlocked = true;
  if (!music.paused && enabled) {
    enabled = false;
    music.pause();
    render();
  } else {
    enabled = true;
    failed = false;
    void play();
  }
  remember();
});
function firstInteraction(event) {
  if (event.target?.closest?.('#musicBtn') || unlocked) return;
  if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey)) return;
  unlocked = true;
  void play();
}
document.addEventListener('pointerdown', firstInteraction, { passive: true });
document.addEventListener('keydown', firstInteraction);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.pause();
  else void play();
});
music.addEventListener('play', render);
music.addEventListener('pause', render);
music.addEventListener('error', () => { failed = true; render(); });
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
render();
