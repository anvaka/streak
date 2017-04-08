/**
 * Renders a markdown string as html.
 */
import Remarkable from 'remarkable';

const md = constructRemarkableRenderer();

export default function renderMarkdown(string) {
  return md.render(string);
}

function constructRemarkableRenderer() {
  const md = new Remarkable({
    linkify: true
  });

  md.use(inlineYoutebeVideos);

  return md;
}

function inlineYoutebeVideos(md) {
  // I'm not sure if this is the right way to extend Remarkable. I'm just
  // checking if a link is a youtube link, and if it is, then I return my own
  // html. Otherwise the original remarkable methods are called.
  const rules = md.renderer.rules;
  const originalLinkOpen = rules.link_open;
  const originalLinkClose = rules.link_close;

  rules.link_open = function linkDecorator(tokens, idx, options) {
    const href = tokens[idx].href;
    const youtubeVideoId = isYouTubueLink(href);
    if (youtubeVideoId) {
      tokens.noClose = true;
      // TODO: this should be flexible width;
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeVideoId}" frameborder="0" allowfullscreen></iframe>`;
    }
    return originalLinkOpen(tokens, idx, options);
  };

  rules.link_close = function linkCloseDecorator(tokens, idx, options) {
    if (tokens.noClose) return '';

    return originalLinkClose(tokens, idx, options);
  };
}

function isYouTubueLink(href) {
  const youtubeRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const youtubeMatch = href.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[7].length === 11) {
    return youtubeMatch[7];
  }
}

// TODO: This code should probably be gone. I'm keeping it to see if I add width/height for images
// function createCustomRenderer() {
//   const renderer = new marked.Renderer();
//   const originalLink = renderer.link;
//
//   renderer.link = link;
//   renderer.image = image;
//
//   return renderer;
//
//   function link(href, title, text) {
//     const youtubeVideoId = isYouTubueLink(href);
//     if (youtubeVideoId) {
//       return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeVideoId}" frameborder="0" allowfullscreen></iframe>`;
//     }
//     return originalLink.call(renderer, href, title, text);
//   }
//
//   function image(href, title, text) {
//     const imageSizeMatch = /([\s\S]+) =([0-9]*)x([0-9]*)/.exec(href);
//
//     if (imageSizeMatch) href = imageSizeMatch[1];
//
//     let out = '<img src="' + href + '" alt="' + text + '"';
//     if (title) {
//       out += ' title="' + title + '"';
//     }
//
//     if (imageSizeMatch) {
//       if (imageSizeMatch[2]) {
//         out += ' width="' + Number.parseInt(imageSizeMatch[2], 10) + '"';
//       }
//       if (imageSizeMatch[3]) {
//         out += ' height="' + Number.parseInt(imageSizeMatch[3], 10) + '"';
//       }
//     }
//
//     out += this.options.xhtml ? '/>' : '>';
//     return out;
//   }
// }

