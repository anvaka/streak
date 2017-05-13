/**
 * A small utility to update page title. Some components change
 * the page title when route hits them.
 */
export default function setPageTitle(title) {
  window.document.title = title || 'Streak';
}
