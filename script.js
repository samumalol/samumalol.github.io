document.addEventListener('DOMContentLoaded', function () {
  const article = document.getElementById('article');

  document.querySelectorAll('[data-size]').forEach(function (button) {
    button.addEventListener('click', function () {
      article.classList.remove('small', 'normal', 'large');
      article.classList.add(button.dataset.size);
    });
  });

  document.querySelectorAll('[data-width]').forEach(function (button) {
    button.addEventListener('click', function () {
      article.classList.toggle('wide', button.dataset.width === 'wide');
    });
  });

  document.querySelectorAll('[data-theme]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.body.classList.toggle('dark', button.dataset.theme === 'dark');
    });
  });

  const noteButton = document.getElementById('toggle-note');
  const note = document.getElementById('study-note');

  if (noteButton && note) {
    noteButton.addEventListener('click', function () {
      const isHidden = note.hasAttribute('hidden');
      if (isHidden) {
        note.removeAttribute('hidden');
        noteButton.textContent = 'Hide study note';
      } else {
        note.setAttribute('hidden', '');
        noteButton.textContent = 'Show study note';
      }
    });
  }

  const form = document.getElementById('interest-form');
  const formMessage = document.getElementById('form-message');

  if (form && formMessage) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      formMessage.removeAttribute('hidden');
      form.reset();
    });
  }
});
