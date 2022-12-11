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
    value = document.cookie
): T => Object.fromEntries(value.split(/;\s*/).map(item => item.split('=')));

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
