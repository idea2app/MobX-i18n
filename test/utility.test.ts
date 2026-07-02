import {
    decodeFunctions,
    encodeFunctions,
    SerializedFunctions
} from '../source/utility';

describe('Functions serialization in JSON', () => {
    const translationMap = {
        title: '标题',
        detail: ({ name }: { name: string }) => `${name}的标题`,
        toJSON: encodeFunctions
    };

    it('should serialize function members to their source code', () => {
        const json = JSON.stringify(translationMap);
        const {
            title,
            detail,
            toJSON
        }: SerializedFunctions<typeof translationMap> = JSON.parse(json);

        expect(title).toBe('标题');
        expect(typeof detail).toBe('object');
        expect(detail.__serializedFunction__).toEqual(expect.any(String));
        expect(toJSON).toBeUndefined();
    });

    it('should deserialize serialized functions back to callable functions', () => {
        const json = JSON.stringify(translationMap);

        const { title, detail }: typeof translationMap = JSON.parse(
            json,
            decodeFunctions
        );
        expect(title).toBe('标题');
        expect(typeof detail).toBe('function');
        expect(detail({ name: '条目' })).toBe('条目的标题');
    });

    it('should handle nested objects with functions', () => {
        const nested = {
            inner: { fn: (x: number) => x * 2 },
            toJSON: encodeFunctions
        };
        const json = JSON.stringify(nested);
        const { inner }: typeof nested = JSON.parse(json, decodeFunctions);

        expect(typeof inner.fn).toBe('function');
        expect(inner.fn(5)).toBe(10);
    });

    it('should handle arrays of functions', () => {
        const withArray = {
            handlers: [(x: number) => x + 1, (x: number) => x * 2],
            toJSON: encodeFunctions
        };
        const json = JSON.stringify(withArray);

        const { handlers }: typeof withArray = JSON.parse(
            json,
            decodeFunctions
        );
        expect(Array.isArray(handlers)).toBe(true);
        expect(typeof handlers[0]).toBe('function');
        expect(handlers[0](3)).toBe(4);
        expect(handlers[1](3)).toBe(6);
    });
});
