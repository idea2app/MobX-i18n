import { decodeFunctions, encodeFunctions } from '../source/utility';

describe('encodeFunctions / decodeFunctions', () => {
    const translationMap = {
        title: '标题',
        detail: ({ name }: Record<'name', string>) => `${name}的标题`,
        toJSON: encodeFunctions
    };

    it('should serialize function members to their source code', () => {
        const json = JSON.stringify(translationMap);
        const parsed: Record<string, unknown> = JSON.parse(json);

        expect(parsed.title).toBe('标题');
        expect(typeof parsed.detail).toBe('object');
        expect(
            (parsed.detail as Record<string, unknown>)['__serializedFunction__']
        ).toEqual(expect.any(String));
        expect(typeof parsed.toJSON).toBe('object');
        expect(
            (parsed.toJSON as Record<string, unknown>)['__serializedFunction__']
        ).toEqual(expect.any(String));
    });

    it('should deserialize serialized functions back to callable functions', () => {
        const json = JSON.stringify(translationMap);
        const restored = JSON.parse(json, decodeFunctions) as typeof translationMap;

        expect(restored.title).toBe('标题');
        expect(typeof restored.detail).toBe('function');
        expect(restored.detail({ name: '条目' })).toBe('条目的标题');
    });

    it('should handle nested objects with functions', () => {
        const nested = {
            inner: {
                fn: (x: number) => x * 2
            },
            toJSON: encodeFunctions
        };

        const json = JSON.stringify(nested);
        const restored = JSON.parse(json, decodeFunctions) as typeof nested;

        expect(typeof restored.inner.fn).toBe('function');
        expect(restored.inner.fn(5)).toBe(10);
    });

    it('should handle arrays of functions', () => {
        const withArray = {
            handlers: [
                (x: number) => x + 1,
                (x: number) => x * 2
            ],
            toJSON: encodeFunctions
        };

        const json = JSON.stringify(withArray);
        const restored = JSON.parse(json, decodeFunctions) as typeof withArray;

        expect(Array.isArray(restored.handlers)).toBe(true);
        expect(typeof restored.handlers[0]).toBe('function');
        expect(restored.handlers[0](3)).toBe(4);
        expect(restored.handlers[1](3)).toBe(6);
    });
});
