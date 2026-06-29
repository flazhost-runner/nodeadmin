import sanitizeHtml from 'sanitize-html'

/**
 * Sanitasi HTML rich-text (output Trumbowyg) sebelum disimpan/ditampilkan.
 * Whitelist tag aman + atribut; buang <script>, event handler (onerror, dll),
 * dan skema URL berbahaya (javascript:). Cegah XSS karena Joi tak mem-filter HTML.
 */
export function cleanRichText(dirty: string | null | undefined): string {
    if (!dirty) return ''
    return sanitizeHtml(dirty, {
        allowedTags: [
            'p', 'br', 'div', 'span', 'b', 'i', 'u', 'strong', 'em', 'del', 's',
            'sup', 'sub', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
            'ul', 'ol', 'li', 'a', 'img', 'hr', 'pre', 'code', 'table', 'thead',
            'tbody', 'tr', 'th', 'td',
        ],
        allowedAttributes: {
            a: ['href', 'name', 'target', 'rel'],
            img: ['src', 'alt', 'title', 'width', 'height', 'style'],
            '*': ['style'],
        },
        allowedStyles: {
            '*': {
                'text-align': [/^left$|^right$|^center$|^justify$/],
                'max-width': [/^\d+(\.\d+)?(px|%)$/],
                width: [/^\d+(\.\d+)?(px|%)$/],
            },
        },
        // Hanya skema URL aman (blokir javascript:, data: kecuali gambar inline).
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedSchemesByTag: { img: ['http', 'https', 'data'] },
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
        },
    })
}
