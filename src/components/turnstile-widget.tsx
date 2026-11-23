"use client";

import Script from "next/script";
import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";

type TurnstileWidgetId = string;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    }
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
  remove: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  action: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
  theme?: "light" | "dark" | "auto";
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAGOcu8uhHJEYd5HB";

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget(
    { action, onSuccess, onError, onExpire, className = "", theme = "auto" },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (e) {
            console.warn("[Turnstile] Reset failed:", e);
          }
        }
      }
    }));

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current !== null) {
        return;
      }
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme,
          callback: (token: string) => {
            onSuccess(token);
          },
          "error-callback": () => {
            if (onError) onError();
          },
          "expired-callback": () => {
            if (onExpire) onExpire();
          }
        });
      } catch (err) {
        console.error("[Turnstile] Render error:", err);
      }
    };

    useEffect(() => {
      if (typeof window !== "undefined" && window.turnstile && !widgetIdRef.current) {
        renderWidget();
      }

      return () => {
        if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Container may already be unmounted
          }
          widgetIdRef.current = null;
        }
      };
    }, [action]);

    return (
      <div className={`turnstile-wrapper my-2 flex justify-center ${className}`}>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => {
            setScriptLoaded(true);
            renderWidget();
          }}
        />
        <div ref={containerRef} className="cf-turnstile-container min-h-[65px]" />
      </div>
    );
  }
);
