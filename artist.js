const artistDialog = document.querySelector('#artistDialog');
const artistButton = document.querySelector('#artistBtn');
const artistClose = document.querySelector('#artistClose');
let previousOverflow = '';
artistButton.addEventListener('click', () => {
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  artistDialog.showModal();
  artistClose.focus();
});
artistClose.addEventListener('click', () => artistDialog.close());
// Native dialog provides Escape dismissal, focus trapping and background inertness.
artistDialog.addEventListener('click', event => {
  if (event.target !== artistDialog) return;
  const r = artistDialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) artistDialog.close();
});
artistDialog.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  artistButton.focus();
});
