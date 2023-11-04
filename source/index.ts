import { observable, computed, action, reaction } from 'mobx';
import * as MobX from 'mobx';

import { parseCookie, setCookie } from './utility';

export * from './utility';

export type TranslationResolver<T extends Record<string, any> = any> = (
    data: T
) => string;

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

    defaultLanguage: Name;

    @observable
    currentLanguage = '' as Name;

    @observable
    currentMap = {} as TranslationMap<Key>;

    @computed
    get defaultMap() {
        return this.configuration[this.defaultLanguage] as TranslationMap<Key>;
    }

    constructor(public configuration: TranslationConfiguration<Name, Key>) {
        MobX.makeObservable?.(this);

        for (const name in configuration)
            if (typeof configuration[name] !== 'function')
                this.defaultLanguage = name;

        if (!this.defaultLanguage)
            throw ReferenceError('One static language map is required');

        if (!globalThis.window) return;

        const languages = [
            parseCookie().language,
            ...(navigator.languages || [this.defaultLanguage])
        ].filter(Boolean);

        this.loadLanguages(languages);

        window.addEventListener('languagechange', () =>
            this.changeLanguage(navigator.language as Name)
        );
    }

    onLanguageChange(handler: (language: Name) => any) {
        var lastLanguage = this.currentLanguage;

        reaction(
            () => this.currentLanguage,
            currentLanguage => {
                if (lastLanguage) handler.call(this, currentLanguage);

                lastLanguage = currentLanguage;
            }
        );
    }

    protected setLanguage(name: Name) {
        this.currentLanguage = name;

        if (globalThis.document?.documentElement)
            setCookie('language', (document.documentElement.lang = name), {
                path: '/'
            });
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
        const languages = Object.keys(this.configuration).sort(
            ({ length: a }, { length: b }) => b - a
        );

        for (const name of names) {
            const language = languages.includes(name)
                ? name
                : languages.find(
                      language =>
                          name.startsWith(language) || language.startsWith(name)
                  );
            if (language)
                try {
                    return await this.changeLanguage(language as Name);
                } catch {}
        }
        return this.changeLanguage(this.defaultLanguage);
    }

    textOf<K extends Key>(
        key: K,
        data?: TranslationResolverData<TranslationMap<Key>[K]>
    ): string {
        const value = this.currentMap[key] || this.defaultMap[key];

        if (typeof value !== 'function') return value;

        if (!data)
            throw ReferenceError(
                'Input data is required for Translation Resolver'
            );
        return value(data);
    }

    t = this.textOf.bind(this) as TranslationModel<Name, Key>['textOf'];
}
