# MobX i18n

Responsive **Translation** utility based on [TypeScript][1] & [MobX][2]

[![CI & CD](https://github.com/idea2app/MobX-i18n/actions/workflows/main.yml/badge.svg)][3]

[![NPM](https://nodei.co/npm/mobx-i18n.png?downloads=true&downloadRank=true&stars=true)][4]

## React/Next.js example

Original from https://github.com/kaiyuanshe/kaiyuanshe.github.io

### Installation

```shell
npm i mobx@5 mobx-react@6 mobx-i18n
```

### Configuration

#### `tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ES5",
        "experimentalDecorators": true
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

export const LanguageName: Record<typeof i18n['currentLanguage'], string> = {
    'zh-CN': '简体中文',
    'en-US': 'English'
};
```

#### `pages/index.ts`

```tsx
import { GetServerSideProps } from 'next';
import { textJoin, parseLanguageHeader } from 'mobx-i18n';

import { i18n, LanguageName } from 'model/Translation';

export const getServerSideProps: GetServerSideProps = ({ req }) => {
    const languages = parseLanguageHeader(req.headers['accept-language'] || '');

    await i18n.loadLanguages(languages);

    return { props: {} };
};

@observer
export default class HomePage extends PureComponent {
    render() {
        const { currentLanguage, t } = i18n;

        return (
            <>
                <select
                    value={currentLanguage}
                    onChange={({ currentTarget: { value } }) =>
                        i18n.changeLanguage(value as typeof currentLanguage)
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
    }
}
```

## Inspired by

https://github.com/infinum/react-mobx-translatable

[1]: https://www.typescriptlang.org/
[2]: https://github.com/mobxjs/mobx/tree/mobx4and5/docs
[3]: https://github.com/idea2app/MobX-i18n/actions/workflows/main.yml
[4]: https://nodei.co/npm/mobx-i18n/
