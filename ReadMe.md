# MobX i18n

Responsive **Translation** utility based on [TypeScript][1] & [MobX][2]

[![MobX compatibility](https://img.shields.io/badge/Compatible-1?logo=mobx&label=MobX%206%2F7)][2]
[![NPM Dependency](https://img.shields.io/librariesio/github/idea2app/MobX-i18n.svg)][3]
[![CI & CD](https://github.com/idea2app/MobX-i18n/actions/workflows/main.yml/badge.svg)][4]

[![NPM](https://nodei.co/npm/mobx-i18n.png?downloads=true&downloadRank=true&stars=true)][5]

## Features

- [x] **Type hinting** of Text keys
- [x] **Lambda Expression** values
- [x] Space utility for CJK & other characters
- [x] **Responsive re-rendering**
- [x] **Async loading** of Language packages
- [x] support **HTTP protocol** for **Server-side rendering**
- [x] support BOM/DOM language API for Client-side rendering
- [x] [Speech Synthesis API][6] for **Text-to-Speech** (TTS)

## Versions

|  SemVer   |  branch  |    status    | ES decorator |    MobX     |
| :-------: | :------: | :----------: | :----------: | :---------: |
| `>=0.5.0` |  `main`  | ✅developing |   stage-3    |  `>=6.11`   |
| `<0.5.0`  | `master` | ❌deprecated |   stage-2    | `>=4 <6.11` |

## Text internationalization (React example)

Original from https://github.com/idea2app/React-MobX-Bootstrap-ts

### Installation

```shell
npm i mobx mobx-react mobx-i18n
```

### Configuration

#### `tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ES6",
        "useDefineForClassFields": true,
        "experimentalDecorators": false
    }
}
```

### Translation

#### `translation/zh-CN.ts`

```typescript
import { textJoin } from 'mobx-i18n';

export default {
    open_source: '开源',
    project: '项目',
    love: ({ a, b }: Record<'a' | 'b', string>) => textJoin(a, '爱', b)
} as const;
```

#### `translation/en-US.ts`

```typescript
import { textJoin } from 'mobx-i18n';

export default {
    open_source: 'Open Source',
    project: 'project',
    love: ({ a, b }: Record<'a' | 'b', string>) => textJoin(a, 'love', b)
} as const;
```

### Initialization

#### `model/Translation.ts`

```typescript
export const i18n = new TranslationModel({
    'zh-CN': zhCN,
    'en-US': () => import('../translation/en-US')
});

export const LanguageName: Record<(typeof i18n)['currentLanguage'], string> = {
    'zh-CN': '简体中文',
    'en-US': 'English'
};
```

#### `page/index.tsx`

```tsx
import { textJoin } from 'mobx-i18n';
import { observer } from 'mobx-react';

import { i18n, LanguageName } from '../model/Translation';

export const HomePage = observer(() => {
    const { currentLanguage, t } = i18n;

    return (
        <>
            <select
                value={currentLanguage}
                onChange={({ currentTarget: { value } }) =>
                    i18n.loadLanguages(value as typeof currentLanguage)
                }
            >
                {Object.entries(LanguageName).map(([code, name]) => (
                    <option key={code} value={code}>
                        {name}
                    </option>
                ))}
            </select>
            <p>
                {t('love', {
                    a: '我',
                    b: textJoin(t('open_source'), t('project'))
                })}
            </p>
        </>
    );
});
```

### Server Side Rendering (Next.js example)

You can use [React Context API][7] to share the `TranslationModel` instance cross Class & Function components in Client & Server runtimes, which has been all set in an [One-key Template Repository][8].

If you use React server components with Next.js app router, you should share Translation Data between server and client as below, which is from another [One-key Template Repository][9].

#### `translation/en-US.ts`

```ts
import { encodeFunctions } from 'mobx-i18n';

export default {
    toJSON: encodeFunctions,
    i18nKey1: 'i18nValue1',
    i18nKey2: ({ someKey }: { someKey: string }) => `i18nValue2: ${someKey}`
    // ...
} as const;
```

#### `translation/context.tsx`

```tsx
'use client';

import {
    TranslationModel,
    SerializedFunctions,
    decodeFunctions
} from 'mobx-i18n';
import { createContext, FC, PropsWithChildren } from 'react';

import enUS from './en-US';

export const I18nContext = createContext(
    new TranslationModel({ 'en-US': enUS })
);

export type I18nProviderProps = PropsWithChildren<{
    language: string;
    languageMap: SerializedFunctions<typeof enUS>;
}>;

export const I18nProvider: FC<I18nProviderProps> = ({
    language,
    languageMap,
    children
}) => {
    const i18n = new TranslationModel({
        [language]: decodeFunctions(languageMap)
    });
    return <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>;
};
```

#### `app/layout.tsx`

```tsx
import { PropsWithChildren } from 'react';

import { I18nProvider } from '../translation/context';
import enUS from '../translation/en-US';

export default async function RootLayout({ children }: PropsWithChildren) {
    const language = 'en-US';

    return (
        <html lang={language}>
            <head />
            <body>
                <I18nProvider language={language} languageMap={enUS}>
                    {children}
                </I18nProvider>
            </body>
        </html>
    );
}
```

## Text to Speech (WebCell example)

### `pages/article.tsx`

```tsx
import { component, observer } from 'web-cell';
import { SpeechSynthesisModel, SpeechSynthesisState } from 'mobx-i18n';

@component({ tagName: 'article-page' })
@observer
export class ArticlePage extends HTMLElement {
    storeTTS = new SpeechSynthesisModel();

    toggleSpeaking = () => {
        const { storeTTS } = this;

        if (storeTTS.state !== SpeechSynthesisState.Clear)
            return storeTTS.toggle();

        const text = SpeechSynthesisModel.getReadableText(
            this.querySelector('article')
        );
        storeTTS.speak(text);
    };

    render() {
        const speaking = this.storeTTS.state === SpeechSynthesisState.Speaking;

        return (
            <>
                <button
                    style={{ background: speaking ? 'red' : 'blue' }}
                    onClick={this.toggleSpeaking}
                >
                    {speaking ? '🔇' : '📢'}
                </button>
                <article>
                    <h1>The Four Freedoms</h1>
                    <ol>
                        <li>Freedom of speech and expression</li>
                        <li>Freedom of worship</li>
                        <li>Freedom from want</li>
                        <li>Freedom from fear</li>
                    </ol>
                </article>
            </>
        );
    }
}
```

## Inspired by

1. https://github.com/infinum/react-mobx-translatable
2. https://github.com/jverhoelen/react-mobx-i18n
3. https://github.com/QuiiBz/next-international

[1]: https://www.typescriptlang.org/
[2]: https://mobx.js.org/
[3]: https://libraries.io/npm/mobx-i18n
[4]: https://github.com/idea2app/MobX-i18n/actions/workflows/main.yml
[5]: https://nodei.co/npm/mobx-i18n/
[6]: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
[7]: https://legacy.reactjs.org/docs/context.html#passing-info-automatically-through-a-tree
[8]: https://github.com/idea2app/Next-Bootstrap-ts
[9]: https://github.com/idea2app/Next-shadcn-ts
