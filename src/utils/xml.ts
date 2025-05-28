const BLACK_ELEMENT_LIST = ['script', 'link', 'style', 'html', 'base', 'head', 'title', 'meta', 'area', 'audio', 'img', 'map', 'track', 'video', 'embed', 'iframe', 'object', 'picture', 'portal', 'source', 'svg', 'math', 'canvas', 'noscript', 'slot', 'template']

const BLOCK_ELEMENT_LIST = ['address', 'blockquote', 'body', 'center', 'dir', 'div', 'dl', 'fieldset', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'isindex', 'menu', 'noframes', 'noscript', 'ol', 'p', 'pre', 'table', 'ul', 'dd', 'dt', 'frameset', 'li', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'html', 'br']

export const toText = (doc: Document, start?: Element | string | null, end?: Element | string | null) => {
  if (!doc.body) return null
  const startEl = typeof start === 'string' ? doc.getElementById(start) : start
  const endEl = typeof end === 'string' ? doc.getElementById(end) : end
  if (!startEl && !endEl) {
    return doc.body.innerText
  }
  let iterator: NodeIterator | null = null
  // end 节点前的内容
  iterator = doc.createNodeIterator(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (startEl && node === startEl) {
        return NodeFilter.FILTER_ACCEPT
      }
      if (endEl && node === endEl) {
        // 不包含结束节点
        return NodeFilter.FILTER_REJECT
      }
      if (startEl && !(startEl.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        // 在开始节点之前
        return NodeFilter.FILTER_REJECT
      }
      if (endEl && !(endEl.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING)) {
        // 在结束节点之后
        return NodeFilter.FILTER_REJECT
      }
      let el = node
      if (node.nodeType === Node.TEXT_NODE) {
        el = node.parentElement!
      }
      return BLACK_ELEMENT_LIST.includes(el.nodeName.toLowerCase()) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    },
  })
  let text = ''
  do {
    if (iterator.referenceNode.nodeType === Node.TEXT_NODE) {
      text += (iterator.referenceNode.textContent?.trim() ?? '')
    } else {
      const curText = BLOCK_ELEMENT_LIST.includes(iterator.referenceNode.nodeName.toLowerCase()) ? '\n' : ''
      text += curText
    }
  } while(iterator.nextNode())
  return text
}

// 检测文字中的最长重复子串
export const findLongestRepeatedSubstring = (text: string): string => {
  const n = text.length;
  const suffixes = Array.from({ length: n }, (_, i) => text.slice(i));
  suffixes.sort();

  let longestSubstring = '';
  for (let i = 0; i < n - 1; i++) {
    const lcp = longestCommonPrefix(suffixes[i], suffixes[i + 1]);
    if (lcp.length > longestSubstring.length) {
      longestSubstring = lcp;
    }
  }
  return longestSubstring;
};

const longestCommonPrefix = (s1: string, s2: string): string => {
  let i = 0;
  while (i < s1.length && i < s2.length && s1[i] === s2[i]) {
    i++;
  }
  return s1.slice(0, i);
};
