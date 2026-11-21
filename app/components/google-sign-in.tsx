"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleCredential = { credential: string };
type GoogleButtonOptions = {
  theme: "outline";
  size: "large";
  text: "continue_with";
  shape: "rectangular";
  width: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: {
            client_id: string;
            callback: (response: GoogleCredential) => void;
          }): void;
          renderButton(element: HTMLElement, options: GoogleButtonOptions): void;
        };
      };
    };
  }
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (credential: string) => void | Promise<void>;
  onError: (message: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback(response) {
        if (!response.credential) {
          onErrorRef.current("Google did not return a sign-in credential");
          return;
        }
        Promise.resolve(onCredentialRef.current(response.credential)).catch((error: unknown) => {
          onErrorRef.current(error instanceof Error ? error.message : "Google sign-in failed");
        });
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: 280,
    });
  }, [scriptReady]);

  if (!clientId) {
    return (
      <div className="w-full rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-center">
        <p className="text-[11px] leading-5 text-amber-800">
          Google sign-in needs <code className="font-mono font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div className="google-signin-mount flex min-h-10 w-full min-w-0 items-center justify-center" ref={buttonRef} />
    </>
  );
}
