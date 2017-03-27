import marked from 'marked';

export default renderMarkdown;

const renderer = createCustomRenderer();
marked.setOptions({
  renderer,
  sanitize: true
});

function renderMarkdown(string) {
  return marked(string);
}

function createCustomRenderer() {
  const renderer = new marked.Renderer();
  const originalLink = renderer.link;

  renderer.link = link;
  renderer.image = image;

  return renderer;

  function link(href, title, text) {
    const youtubeVideoId = isYouTubueLink(href);
    if (youtubeVideoId) {
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeVideoId}" frameborder="0" allowfullscreen></iframe>`;
    }
    return originalLink.call(renderer, href, title, text);
  }

  function image(href, title, text) {
    const imageSizeMatch = /([\s\S]+) =([0-9]*)x([0-9]*)/.exec(href);

    if (imageSizeMatch) href = imageSizeMatch[1];

    let out = '<img src="' + href + '" alt="' + text + '"';
    if (title) {
      out += ' title="' + title + '"';
    }

    if (imageSizeMatch) {
      if (imageSizeMatch[2]) {
        out += ' width="' + Number.parseInt(imageSizeMatch[2], 10) + '"';
      }
      if (imageSizeMatch[3]) {
        out += ' height="' + Number.parseInt(imageSizeMatch[3], 10) + '"';
      }
    }

    out += this.options.xhtml ? '/>' : '>';
    return out;
  }
}

function isYouTubueLink(href) {
  const youtubeRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const youtubeMatch = href.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[7].length === 11) {
    return youtubeMatch[7];
  }
}
