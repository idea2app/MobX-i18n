export const isNumberLetter = (raw = '') =>
    new RegExp('\\p{N}', 'u').test(raw) ||
    new RegExp('\\p{Ll}', 'u').test(raw.toLowerCase());

const FUNCTION_MARKER = '__serializedFunction__' as const;

export interface SerializedFunctionNode {
    [FUNCTION_MARKER]: string;
}

export type SerializedFunctions<T> = T extends (...args: any[]) => any
    ? SerializedFunctionNode
    : T extends string | number | boolean | null | undefined | bigint | symbol
      ? T
      : T extends Array<infer U>
        ? SerializedFunctions<U>[]
        : T extends object
          ? { [K in keyof T]: SerializedFunctions<T[K]> }
          : T;

const serializeFunctionMembers = <T>(value: T): SerializedFunctions<T> => {
    if (typeof value === 'function')
        return {
            [FUNCTION_MARKER]: value.toString()
        } as SerializedFunctions<T>;

    if (Array.isArray(value))
        return value.map(serializeFunctionMembers) as SerializedFunctions<T>;

    if (value && typeof value === 'object') {
        const output: Record<string, unknown> = {};

        for (const [key, item] of Object.entries(value))
            output[key] = serializeFunctionMembers(item);

        return output as SerializedFunctions<T>;
    }

    return value as SerializedFunctions<T>;
};

export function encodeFunctions(
    this: Record<string, unknown>
): SerializedFunctions<Record<string, unknown>> {
    return serializeFunctionMembers(this);
}

const isSerializedFunctionNode = (
    value: unknown
): value is SerializedFunctionNode =>
    !!value &&
    typeof value === 'object' &&
    FUNCTION_MARKER in value &&
    typeof (value as SerializedFunctionNode)[FUNCTION_MARKER] === 'string';

const reviveFunction = (source: string) => {
    const factory = Function('"use strict"; return (' + source + ');');
    const fn = factory();

    if (typeof fn !== 'function')
        throw new TypeError(
            'Serialized source does not evaluate to a function.'
        );
    return fn as (...args: unknown[]) => unknown;
};

/**
 * Reviver for {@link JSON.parse} that restores function members serialized by
 * {@link encodeFunctions}.  Only use this with data from a trusted source,
 * because function sources are executed via the `Function` constructor.
 */
export const decodeFunctions = (_key: string, value: unknown) => {
    if (isSerializedFunctionNode(value))
        return reviveFunction(value[FUNCTION_MARKER]);

    return value;
};

export const textJoin = (...parts: string[]) =>
    parts
        .map((raw, index) => {
            const isNL = isNumberLetter(raw.slice(-1));

            if (index + 1 === parts.length) return raw;

            const diff = isNL !== isNumberLetter(parts[index + 1]?.trim()[0]);

            return raw + (diff || isNL ? ' ' : '');
        })
        .join('');

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
