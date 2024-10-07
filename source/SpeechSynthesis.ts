import { computed, IReactionDisposer, observable, reaction } from 'mobx';
import { getVisibleText, sleep } from 'web-utility';

import { TranslationModel } from './Translation';

export enum SpeechSynthesisState {
    Clear,
    Speaking,
    Pause
}

export class SpeechSynthesisModel {
    @observable
    accessor state = SpeechSynthesisState.Clear;

    @computed
    get language() {
        return this.i18n?.currentLanguage || globalThis.navigator?.language;
    }
    #disposer?: IReactionDisposer;

    constructor(public i18n?: TranslationModel<any, any>) {
        if (i18n)
            this.#disposer = reaction(() => i18n.currentLanguage, this.clear);

        globalThis.addEventListener('unload', this.clear);
    }

    clear = () => {
        this.state = SpeechSynthesisState.Clear;
        this.#disposer?.();
        speechSynthesis.cancel();
    };

    static getVoices() {
        const voices = speechSynthesis.getVoices();

        return voices[0]
            ? Promise.resolve(voices)
            : new Promise<SpeechSynthesisVoice[]>(resolve => {
                  sleep(1).then(() => resolve([]));

                  speechSynthesis.onvoiceschanged = () =>
                      resolve(speechSynthesis.getVoices());
              });
    }

    async speak(text: string) {
        const { language } = this,
            content = new SpeechSynthesisUtterance(text),
            voices = await SpeechSynthesisModel.getVoices();

        content.voice =
            voices.find(
                ({ localService, lang }) => localService && lang === language
            ) || voices.find(({ default: backup }) => backup);

        const result = new Promise((resolve, reject) => {
            content.onend = resolve;
            content.onerror = reject;
        });
        speechSynthesis.speak(content);

        this.state = SpeechSynthesisState.Speaking;

        try {
            await result;
        } finally {
            this.clear();
        }
    }

    toggle() {
        if (this.state === SpeechSynthesisState.Speaking) {
            speechSynthesis.pause();

            this.state = SpeechSynthesisState.Pause;
        } else {
            speechSynthesis.resume();

            this.state = SpeechSynthesisState.Speaking;
        }
    }

    static *walk(range: Range) {
        const { commonAncestorContainer, endContainer } = range;
        const walker = document.createNodeIterator(commonAncestorContainer);
        var current: Node;

        while ((current = walker.nextNode())) {
            if (range.intersectsNode(current)) yield current;

            if (
                commonAncestorContainer !== endContainer &&
                current === endContainer
            )
                break;
        }
    }

    static getSelectedText(box?: Element | null) {
        const range = getSelection()?.getRangeAt(0);

        if (!range?.toString() || !box?.contains(range.commonAncestorContainer))
            throw new RangeError('No text selected');

        return [...this.walk(range)]
            .filter(({ nodeType, parentNode }) => {
                if (nodeType !== 3) return;

                const { width, height } = (
                    parentNode as Element
                ).getBoundingClientRect();

                return width && height;
            })
            .map(({ nodeValue }, index, { length }) =>
                nodeValue.slice(
                    index === 0 ? range.startOffset : 0,
                    index === length - 1 ? range.endOffset : Infinity
                )
            )
            .filter(text => text.trim())
            .join('')
            .trim();
    }

    static getReadableText(box?: Element | null) {
        try {
            return this.getSelectedText(box);
        } catch {
            return getVisibleText(box);
        }
    }
}
