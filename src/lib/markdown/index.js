import marked from 'marked';

export default renderMarkdown;

const renderer = createCustomRenderer();
marked.setOptions({ renderer });

function renderMarkdown(string) {
  return marked(string);
}

function createCustomRenderer() {
  const renderer = new marked.Renderer();
  const originalLink = renderer.link;

  renderer.link = function link(href, title, text) {
    const youtubeVideoId = isYouTubueLink(href);
    if (youtubeVideoId) {
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeVideoId}" frameborder="0" allowfullscreen></iframe>`;
    }
    return originalLink.call(renderer, href, title, text);
  };

  return renderer;
}

function isYouTubueLink(href) {
  const youtubeRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const youtubeMatch = href.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[7].length === 11) {
    return youtubeMatch[7];
  }
}
