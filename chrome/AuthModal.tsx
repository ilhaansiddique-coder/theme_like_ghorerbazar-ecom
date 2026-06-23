"use client";

/**
 * ShopKart — Auth modal, matching the CD Ecom storefront
 * (dev.contradigital.agency) login/register UI, themed in this template's red:
 *
 *   • Login | Register underline tabs
 *   • Login    → Email + Password, "Forgot password?"
 *   • Register → Your name + Email + Phone (optional) + Password + Confirm password
 *   • Forgot password → code-based reset (Send Reset Code → Set New Password)
 *
 * Login / Register start a client-side demo session (see components/auth.ts) and
 * close the modal. Swap those two calls for the engine's auth API in production.
 */

import { useEffect, useState } from "react";
import { FiX, FiArrowLeft, FiPhone, FiMail, FiLock, FiUser } from "react-icons/fi";
import { useAuth } from "../components/auth";

interface Props { open: boolean; onClose: () => void }

type Mode = "login" | "register" | "reset";

export default function AuthModal({ open, onClose }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  useEffect(() => { setResetSent(false); setCode(""); setStatus(""); }, [mode]);

  // ── Auth handlers — start a client-side demo session (components/auth.ts).
  //    Replace login()/register() with the engine auth API in production. ──────
  const submit = () => {
    if (mode === "reset") {
      setStatus("Demo: verify the reset code, then set the new password.");
      return;
    }
    if (!email.trim()) { setStatus("Please enter your email address."); return; }
    if (!password) { setStatus("Please enter your password."); return; }
    if (mode === "register") {
      if (password !== confirm) { setStatus("Passwords don't match."); return; }
      register(name, email.trim(), phone);
    } else {
      login(email.trim(), password);
    }
    setStatus("");
    onClose();
  };
  const sendResetCode = () => {
    if (!email) { setStatus("Enter your email address."); return; }
    setResetSent(true);
    setStatus("Reset code sent.");
  };

  const title = mode === "login" ? "Login" : mode === "register" ? "Register" : "Reset password";

  return (
    <>
      <div
        onClick={onClose}
        className={`tpl-auth-backdrop${open ? " tpl-auth-backdrop--open" : ""}`}
        aria-hidden={!open}
      />
      <div className={`tpl-auth${open ? " tpl-auth--open" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="tpl-auth__head">
          {mode === "reset" && (
            <button type="button" className="tpl-nav__icon" aria-label="Back" onClick={() => setMode("login")}><FiArrowLeft size={18} /></button>
          )}
          <h2 className="tpl-auth__title">{title}</h2>
          <button type="button" className="tpl-nav__icon" aria-label="Close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* Login / Register tabs */}
        {mode !== "reset" && (
          <div className="tpl-auth__tabs">
            <button type="button" className={mode === "login" ? "tpl-auth__tab--on" : ""} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={mode === "register" ? "tpl-auth__tab--on" : ""} onClick={() => setMode("register")}>Register</button>
          </div>
        )}

        <div className="tpl-auth__body">
          <form className="tpl-auth__form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {/* REGISTER */}
            {mode === "register" && (
              <>
                <label className="tpl-authfield">
                  <FiUser size={16} />
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </label>
                <label className="tpl-authfield">
                  <FiMail size={16} />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </label>
                <label className="tpl-authfield">
                  <FiPhone size={16} />
                  <input type="tel" inputMode="tel" placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                </label>
                <label className="tpl-authfield">
                  <FiLock size={16} />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </label>
                <label className="tpl-authfield">
                  <FiLock size={16} />
                  <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
                </label>
                <button type="submit" className="tpl-btn" style={{ width: "100%" }}>Register</button>
              </>
            )}

            {/* LOGIN */}
            {mode === "login" && (
              <>
                <label className="tpl-authfield">
                  <FiMail size={16} />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </label>
                <label className="tpl-authfield">
                  <FiLock size={16} />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </label>
                <button type="button" className="tpl-auth__forgot" onClick={() => setMode("reset")}>Forgot password?</button>
                <button type="submit" className="tpl-btn" style={{ width: "100%" }}>Login</button>
              </>
            )}

            {/* RESET */}
            {mode === "reset" && (
              <>
                <label className="tpl-authfield">
                  <FiMail size={16} />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </label>
                {!resetSent ? (
                  <button type="button" className="tpl-btn" style={{ width: "100%" }} onClick={sendResetCode}>Send Reset Code</button>
                ) : (
                  <>
                    <label className="tpl-authfield">
                      <input type="text" inputMode="numeric" maxLength={6} placeholder="Reset code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} style={{ letterSpacing: "0.25em", textAlign: "center" }} />
                    </label>
                    <label className="tpl-authfield">
                      <FiLock size={16} />
                      <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                    </label>
                    <label className="tpl-authfield">
                      <FiLock size={16} />
                      <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
                    </label>
                    <button type="submit" className="tpl-btn" style={{ width: "100%" }}>Set New Password</button>
                    <button type="button" className="tpl-auth__resend" onClick={sendResetCode}>Resend reset code</button>
                  </>
                )}
              </>
            )}
          </form>

          {status && <p className="tpl-auth__status">{status}</p>}
        </div>
      </div>
    </>
  );
}
