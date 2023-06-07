export const isNumberLetter = (raw = '') =>
    new RegExp('\\p{N}', 'u').test(raw) ||
    new RegExp('\\p{Ll}', 'u').test(raw.toLowerCase());

export const textJoin = (...parts: string[]) =>
    parts
        .map((raw, index) => {
            const isNL = isNumberLetter(raw.slice(-1));

            if (index + 1 === parts.length) return raw;

            const diff = isNL !== isNumberLetter(parts[index + 1]?.trim()[0]);

            return raw + (diff || isNL ? ' ' : '');
        })
        .join('');

export const parseCookie = <T extends Record<string, string>>(
    value = globalThis.document.cookie
): T =>
    value
        ? Object.fromEntries(value.split(/;\s*/).map(item => item.split('=')))
        : {};

export interface CookieAttribute {
    domain?: string;
    path?: string;
    expires?: Date;
    'max-age'?: number;
    samesite?: 'lax' | 'strict' | 'none';
    secure?: boolean;
    partitioned?: boolean;
}

export function setCookie(
    key: string,
    value: string,
    attributes: CookieAttribute = {}
) {
    const data = `${key}=${value}`,
        option = Object.entries(attributes)
            .map(([key, value]) =>
                typeof value === 'boolean'
                    ? value
                        ? key
                        : ''
                    : `${key}=${value}`
            )
            .filter(Boolean)
            .join('; ');

    document.cookie = `${data}; expires=${new Date(0)}`;

    return (document.cookie = `${data}; ${option}`);
}

export const parseLanguageHeader = (value: string) =>
    value
        .split(',')
        .map(language => {
            const [name, quantity = ''] = language.split(';');
            const [_, value = '1'] = quantity.split('=');

            return [name.trim(), +value] as const;
        })
        .sort(([_, a], [__, b]) => b - a)
        .map(([name]) => name);
