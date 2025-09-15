import { IncomingHttpHeaders } from 'http';
import { action, computed, observable, reaction } from 'mobx';
import { parseCookie, setCookie } from 'web-utility';

import { parseLanguageHeader } from './utility';

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
    accessor loading = false;

    defaultLanguage: Name;

    @observable
    accessor currentLanguage = '' as Name;

    @observable
    accessor currentMap = {} as TranslationMap<Key>;

    @computed
    get defaultMap() {
        return this.configuration[this.defaultLanguage] as TranslationMap<Key>;
    }

    constructor(public configuration: TranslationConfiguration<Name, Key>) {
        for (const name in configuration)
            if (typeof configuration[name] !== 'function')
                this.defaultLanguage = name;

        if (!this.defaultLanguage)
            throw ReferenceError('One static language map is required');

        if (!globalThis.window) return;

        const languages = [
            parseCookie().language,
            ...(navigator.languages || [this.defaultLanguage]),
            document.documentElement.lang
        ].filter(Boolean) as Name[];

        this.loadLanguages(...languages);

        window.addEventListener('languagechange', () =>
            this.loadLanguages(navigator.language as Name)
        );
    }

    onLanguageChange(handler: (language: Name) => any) {
        reaction(
            () => this.currentLanguage,
            (currentLanguage, lastLanguage) => {
                if (lastLanguage) handler.call(this, currentLanguage);
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
    async loadLanguages(...names: Name[]) {
        this.loading = true;

        const {
            language = this.defaultLanguage,
            languageMap = this.configuration[this.defaultLanguage]
        } = (await loadLanguageMap(this.configuration, names)) || {};

        this.loading = false;

        this.setLanguage(language);

        return (this.currentMap = languageMap as TranslationMap<Key>);
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

export const loadLanguageMap = async <N extends string, K extends string>(
    configuration: TranslationConfiguration<N, K>,
    names: N[]
) => {
    const languages = Object.keys(configuration).sort(
        ({ length: a }, { length: b }) => b - a
    );

    for (const name of names) {
        const language = (
            languages.includes(name)
                ? name
                : languages.find(
                      language =>
                          name.startsWith(language) || language.startsWith(name)
                  )
        ) as N;

        if (!language) continue;

        try {
            const languageMap = configuration[language];

            if (typeof languageMap !== 'function')
                return { language, languageMap } as {
                    language: N;
                    languageMap: TranslationMap<K>;
                };
            const { default: data } = await languageMap();

            configuration[language] = data;

            return { language, languageMap: data };
        } catch {}
    }
};

export const loadLanguageMapFrom = <N extends string, K extends string>(
    configuration: TranslationConfiguration<N, K>,
    { 'accept-language': acceptLanguage, cookie }: IncomingHttpHeaders
) => {
    const { language } = parseCookie(cookie || ''),
        languages = parseLanguageHeader(acceptLanguage || '');

    return loadLanguageMap(
        configuration,
        [language, ...languages].filter(Boolean) as N[]
    );
};
