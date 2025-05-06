import { sleep } from 'web-utility';

import { TranslationModel } from '../source/Translation';
import { textJoin } from '../source/utility';

describe('Translation', () => {
    const en_US = {
            title: 'Title',
            name: 'Name',
            detail: ({ title, name }: Record<'title' | 'name', string>) =>
                `Title of ${name} is "${title}"`
        } as const,
        zh_CN = {
            title: '标题',
            name: '名称',
            detail: ({ title, name }: Record<'title' | 'name', string>) =>
                `${name}的标题是《${title}》`
        } as const,
        zh_TW = {
            title: '標題',
            name: '名稱',
            detail: ({ title, name }: Record<'title' | 'name', string>) =>
                `${name}的標題是《${title}》`
        } as const;

    it('should match the User-agent Language', async () => {
        expect(navigator.language).toBe('en-US');
        expect(document.cookie).toBe('');

        const i18n = new TranslationModel({ 'en-US': en_US, 'zh-CN': zh_CN });

        await sleep();

        expect(i18n.currentLanguage).toBe('en-US');
        expect(i18n.t('title')).toBe(en_US.title);
        expect(document.cookie).toBe('language=en-US');
    });

    it('should use the Default Language while mismatch the User-agent Language', async () => {
        expect(document.cookie).toBe('language=en-US');

        const i18n = new TranslationModel({
            'zh-CN': zh_CN,
            'zh-TW': async () => ({ default: zh_TW })
        });
        await sleep();

        expect(i18n.currentLanguage).toBe('zh-CN');
        expect(i18n.t('title')).toBe(zh_CN.title);
        expect(document.documentElement.lang).toBe('zh-CN');
        expect(document.cookie).toBe('language=zh-CN');
    });

    it('should use the Default Language before a custom language loaded', async () => {
        const i18n = new TranslationModel({
            'zh-CN': zh_CN,
            'zh-TW': async () => ({ default: zh_TW })
        });
        await sleep();

        expect(i18n.currentLanguage).toBe('zh-CN');
        expect(i18n.t('title')).toBe(zh_CN.title);
        expect(document.documentElement.lang).toBe('zh-CN');

        await i18n.loadLanguages('zh-TW');

        expect(i18n.currentLanguage).toBe('zh-TW');
        expect(i18n.t('title')).toBe(zh_TW.title);
        expect(document.documentElement.lang).toBe('zh-TW');
    });

    it('should return texts with some inputs based on Lambda expressions', () => {
        const { t } = new TranslationModel({ 'zh-CN': zh_CN });

        expect(t('detail', { title: 'Title', name: 'Name' })).toBe(
            `Name的标题是《Title》`
        );
    });

    it('should join strings into text based on the rule of Matched language', () => {
        const { t } = new TranslationModel({ 'zh-TW': zh_TW, 'zh-CN': zh_CN });

        expect(
            textJoin(t('title'), t('name'), 'test', 'example', '20221127')
        ).toBe(`${t('title')}${t('name')} test example 20221127`);

        expect(
            textJoin(t('title'), 'test', t('name'), '20221127', 'example')
        ).toBe(`${t('title')} test ${t('name')} 20221127 example`);
    });
});
