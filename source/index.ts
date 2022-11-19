import { observable, action } from 'mobx';

export * from './utility';

export type TranslationResolver = (data: Record<string, any>) => string;

export type TranslationResolverData<T> = T extends TranslationResolver
    ? Parameters<T>[0]
    : never;

export type TranslationMap<T extends string> = {
    [key in T]: string | TranslationResolver;
};

export type TranslationConfiguration<
    N extends string,
    K extends string
> = Record<
    N,
    TranslationMap<K> | (() => Promise<{ default: TranslationMap<K> }>)
>;

export class TranslationModel<Name extends string, Key extends string> {
    @observable
    loading = false;

    @observable
    currentLanguage: Name = globalThis.navigator?.language as Name;

    @observable
    currentMap: TranslationMap<Key> = {} as TranslationMap<Key>;

    constructor(public configuration: TranslationConfiguration<Name, Key>) {
        if (!this.currentLanguage) {
            for (const name in configuration)
                if (typeof configuration[name] !== 'function')
                    this.currentLanguage = name;

            if (!this.currentLanguage)
                throw ReferenceError('One static language map is required');
        }
        if (typeof window === 'undefined') return;

        this.changeLanguage(this.currentLanguage);

        window.addEventListener('languagechange', () =>
            this.changeLanguage(navigator.language as Name)
        );
    }

    protected setLanguage(name: Name) {
        document.documentElement.lang = this.currentLanguage = name;
    }

    @action
    async changeLanguage(name: Name) {
        const language = this.configuration[name];

        if (typeof language !== 'function') {
            this.setLanguage(name);

            return (this.currentMap = language as TranslationMap<Key>);
        }
        this.loading = true;

        const { default: map } = await language();

        this.loading = false;

        this.setLanguage(name);

        return (this.currentMap = this.configuration[name] = map);
    }

    async loadLanguages(names: string[]) {
        for (const name of names) {
            const language = this.configuration[name as Name];

            if (language)
                try {
                    return await this.changeLanguage(name as Name);
                } catch {}
        }
        return this.changeLanguage(this.currentLanguage);
    }

    textOf<K extends Key>(
        key: K,
        data?: TranslationResolverData<TranslationMap<Key>[K]>
    ): string {
        const value = this.currentMap[key];

        if (typeof value === 'string') return value;

        if (!data)
            throw ReferenceError(
                'Input data is required for Translation Resolver'
            );

        return value(data);
    }

    t = this.textOf.bind(this);
}
