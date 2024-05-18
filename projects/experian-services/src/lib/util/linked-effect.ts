import { Injector, Signal, effect, signal, untracked } from "@angular/core";

export type LinkedRefeshCall<S, T> = (source: S, abort?: AbortSignal) => Promise<T | undefined>;

export interface LinkedEffectResult<T> {
    pending: boolean;
    debounce: boolean;
    object?: T;
    error?: unknown;
}

export interface LinkedEffect<T> {
    destroy: () => void;
    result: Signal<LinkedEffectResult<T>>;
    refresh: () => Promise<void>;
}

export interface LinkedEffectOptions {
    abort?: AbortSignal;
    refreshOnInital?: boolean; // should a search trigger on creation... default false.
    debounceTimeout?: number;
}


export function createLinkedEffect<S, T>(
    source: Signal<S>,
    refresh: LinkedRefeshCall<S, T>,
    options: LinkedEffectOptions,
    injector: Injector,
): LinkedEffect<T> {
    let isCreation = true;
    let debounceTimeoutId: any = null;
    if (options?.abort?.aborted) {
        throw new Error('request aborted');
    }
    const rtnSig = signal<LinkedEffectResult<T>>({ pending: false, debounce: false });
    const detroyFn = () => {
        eff.destroy();
        options?.abort?.removeEventListener('abort', detroyFn);
    }

    const internal_refresh = async (_source: S) => {
        rtnSig.update(f => ({ ...f, pending: true, error: undefined }));
        try {
            let result = await refresh(_source, options?.abort);
            rtnSig.update(f => ({ ...f, object: result }));
        } catch (ex: unknown) {
            rtnSig.update(f => ({ ...f, object: undefined, error: ex }));
        } finally {
            rtnSig.update(f => ({ ...f, pending: false }));
        }
    }
    const eff = effect(() => {
        const src = source();
        if (isCreation) {
            isCreation = false;
            if (!options?.refreshOnInital) {
                return;
            }
        }
        untracked(() => {
            if (debounceTimeoutId) {
                clearTimeout(debounceTimeoutId);
            }
            rtnSig.update(f => ({ ...f, debounce: true }));
            debounceTimeoutId = setTimeout(() => {
                rtnSig.update(f => ({ ...f, debounce: false }));
                internal_refresh(src)
            }, options?.debounceTimeout ?? 10);
        });
    }, { injector });

    if (options?.abort) {
        options.abort.addEventListener('abort', detroyFn)
    }
    return {
        result: rtnSig.asReadonly(),
        refresh: () => internal_refresh(source()),
        destroy: () => detroyFn(),
    };
}

