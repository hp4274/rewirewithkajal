const hasWindow = typeof window !== 'undefined';
// eslint-disable-next-line no-script-url
const SCRIPT_SCHEME_REGEX = /^\s*javascript\s*:/i;

const removeDangerousNodes = (root: ParentNode) => {
    root.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());

    root.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value.trim().toLowerCase();

            if (attrName.startsWith('on')) {
                el.removeAttribute(attr.name);
            }

            if ((attrName === 'href' || attrName === 'src') && SCRIPT_SCHEME_REGEX.test(attrValue)) {
                el.removeAttribute(attr.name);
            }
        });
    });
};

export const sanitizeBlogHtml = (content: string): string => {
    const raw = String(content || '');
    if (!raw) return '';
    if (!hasWindow) return raw;

    const parser = new DOMParser();
    const parsed = parser.parseFromString(raw, 'text/html');
    removeDangerousNodes(parsed.body);
    return parsed.body.innerHTML;
};

export const blogContentToPlainText = (content: string): string => {
    const safeHtml = sanitizeBlogHtml(content);
    if (!safeHtml) return '';

    if (!hasWindow) {
        return safeHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const parser = new DOMParser();
    const parsed = parser.parseFromString(safeHtml, 'text/html');
    const text = parsed.body.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
};
