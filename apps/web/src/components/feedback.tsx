"use client";

/**
 * In-app replacements for window.alert / window.confirm.
 *
 *   toast.success("Saved");            toast.error("Upload failed");
 *   toast("Plain message");            toast.info("Syncing…");
 *   if (await confirmDialog({ title: "Delete visit?", danger: true })) { ... }
 *   const note = await promptDialog({ title: "Add note", defaultValue: "" });   // null = cancelled
 *
 * Callable from anywhere (no hooks/context); <FeedbackHost /> in the layout renders them.
 */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "@/components/icons";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };
type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When set, the dialog shows a text field and resolves with its value. */
  input?: { label: string; defaultValue?: string; multiline?: boolean };
};
type ConfirmState = ConfirmOptions & { resolve: (ok: boolean, value?: string) => void };

let nextId = 1;
const toastListeners = new Set<(t: ToastItem) => void>();
const confirmListeners = new Set<(c: ConfirmState) => void>();

function push(kind: ToastKind, message: unknown) {
  const item = { id: nextId++, kind, message: String(message) };
  toastListeners.forEach((l) => l(item));
}

export const toast = Object.assign((message: unknown) => push("info", message), {
  success: (message: unknown) => push("success", message),
  error: (message: unknown) => push("error", message),
  info: (message: unknown) => push("info", message),
});

export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === "string" ? { title: options } : options;
  // No host mounted (shouldn't happen) -> fall back to the native dialog
  if (confirmListeners.size === 0) return Promise.resolve(window.confirm(opts.title));
  return new Promise((resolve) => confirmListeners.forEach((l) => l({ ...opts, resolve })));
}

/** Text-input dialog (replacement for window.prompt). Resolves to null when cancelled. */
export function promptDialog(options: {
  title: string;
  message?: string;
  label?: string;
  defaultValue?: string;
  multiline?: boolean;
  confirmLabel?: string;
}): Promise<string | null> {
  const { label, defaultValue, multiline, ...rest } = options;
  if (confirmListeners.size === 0) return Promise.resolve(window.prompt(options.title, defaultValue ?? ""));
  return new Promise((resolve) =>
    confirmListeners.forEach((l) =>
      l({ ...rest, input: { label: label || options.title, defaultValue, multiline }, resolve: (ok, value) => resolve(ok ? value ?? "" : null) })
    )
  );
}

const TOAST_STYLE: Record<ToastKind, { icon: typeof Info; ring: string; iconClass: string }> = {
  success: { icon: CheckCircle2, ring: "border-emerald-200", iconClass: "text-emerald-600" },
  error: { icon: XCircle, ring: "border-rose-200", iconClass: "text-rose-600" },
  info: { icon: Info, ring: "border-sky-200", iconClass: "text-[#0084bf]" },
};

export function FeedbackHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setToasts((list) => [...list.slice(-3), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), t.kind === "error" ? 6000 : 3500);
    };
    const onConfirm = (c: ConfirmState) => setConfirmState(c);
    toastListeners.add(onToast);
    confirmListeners.add(onConfirm);
    return () => {
      toastListeners.delete(onToast);
      confirmListeners.delete(onConfirm);
    };
  }, []);

  useEffect(() => {
    if (!confirmState) return;
    setInputValue(confirmState.input?.defaultValue ?? "");
    if (!confirmState.input) confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && settle(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState]);

  const settle = (ok: boolean) => {
    confirmState?.resolve(ok, inputValue);
    setConfirmState(null);
  };

  return (
    <>
      <div className="no-print fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96" aria-live="polite" role="status">
        {toasts.map((t) => {
          const { icon: Icon, ring, iconClass } = TOAST_STYLE[t.kind];
          return (
            <div key={t.id} className={`flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#002235] border ${ring} dark:border-slate-700 shadow-lift animate-slide-in-right`}>
              <Icon className={`w-5 h-5 shrink-0 ${iconClass}`} />
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line break-words">{t.message}</p>
              <button
                onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
                aria-label="Dismiss notification"
                className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="no-print fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in" onMouseDown={() => settle(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#002235] border border-slate-200 dark:border-slate-700 shadow-2xl p-5 animate-scale-up"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmState.danger ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-[#0084bf]"}`}>
                {confirmState.danger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <h2 id="confirm-title" className="font-heading font-bold text-slate-900 dark:text-white">{confirmState.title}</h2>
                {confirmState.message && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{confirmState.message}</p>}
              </div>
            </div>
            {confirmState.input && (
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  settle(true);
                }}
              >
                <label htmlFor="feedback-prompt-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  {confirmState.input.label}
                </label>
                {confirmState.input.multiline ? (
                  <textarea
                    id="feedback-prompt-input"
                    autoFocus
                    rows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#04223a] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-[#0084bf]/20 focus:border-[#0084bf]"
                  />
                ) : (
                  <input
                    id="feedback-prompt-input"
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#04223a] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-[#0084bf]/20 focus:border-[#0084bf]"
                  />
                )}
              </form>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => settle(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
                {confirmState.cancelLabel || "Cancel"}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => settle(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${confirmState.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#0084bf] hover:bg-[#00618e]"}`}
              >
                {confirmState.confirmLabel || (confirmState.input ? "Save" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
