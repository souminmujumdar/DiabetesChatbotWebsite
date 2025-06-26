'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  username: string;
  password: string;
}

export function Header() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    { username: "admin", password: "password123" },
  ]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Form states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Restore user from localStorage - only runs once
  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem("diabetesGuideUser");
      if (storedUsername) {
        const foundUser = users.find((u) => u.username === storedUsername);
        if (foundUser) {
          setUser(foundUser);
          setIsAuthModalOpen(false);
        } else {
          localStorage.removeItem("diabetesGuideUser");
          setIsAuthModalOpen(true);
        }
      } else {
        setIsAuthModalOpen(true);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setIsAuthModalOpen(true);
    } finally {
      setInitialCheckDone(true);
    }
  }, []); // Empty dependency array ensures this only runs once

  // Authentication functions
  const login = (username: string, password: string): boolean => {
    const foundUser = users.find(
      (u) => u.username === username && u.password === password
    );
    if (foundUser) {
      setUser(foundUser);
      try {
        localStorage.setItem("diabetesGuideUser", foundUser.username);
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      setLoginUsername("");
      setLoginPassword("");
      setLoginError("");
      setIsAuthModalOpen(false);
      return true;
    }
    setLoginError("Invalid username or password");
    return false;
  };

  const register = (username: string, password: string): boolean => {
    if (users.some((u) => u.username === username)) {
      setRegisterError("Username already exists");
      return false;
    }
    const newUser = { username, password };
    setUsers([...users, newUser]);
    setUser(newUser);
    try {
      localStorage.setItem("diabetesGuideUser", newUser.username);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
    setRegisterUsername("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setRegisterError("");
    setIsAuthModalOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("diabetesGuideUser");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
    setIsLoginView(true);
    setIsAuthModalOpen(true);
  };

  // Form submission handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginUsername, loginPassword);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    register(registerUsername, registerPassword);
  };

  // Toggle between login and register views
  const toggleView = (view: "login" | "register") => {
    setIsLoginView(view === "login");
    setLoginError("");
    setRegisterError("");
    setLoginUsername("");
    setLoginPassword("");
    setRegisterUsername("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
  };

  // If initial check hasn't completed, don't render modal to prevent flash
  if (!initialCheckDone) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-between max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-blue-600"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
              <path d="M9 11v2" />
              <path d="M15 11v2" />
            </svg>
            <span className="text-2xl font-bold text-blue-600">DiabBot</span>
          </div>
          {/* Minimal header while checking authentication */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="opacity-50">
              Loading...
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Dimmed overlay - only when modal is open */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none" />
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-between max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-blue-600"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
              <path d="M9 11v2" />
              <path d="M15 11v2" />
            </svg>
            <span className="text-2xl font-bold text-blue-600">DiabBot</span>
          </div>
          <nav className="hidden md:flex items-center gap-3">
            <Link
              href="#about"
              className={`text-sm font-medium transition-colors ${
                !user
                  ? "text-gray-400 pointer-events-none"
                  : "hover:text-blue-600"
              }`}
            >
              About Diabetes
            </Link>
            <Link
              href="#resources"
              className={`text-sm font-medium transition-colors ${
                !user
                  ? "text-gray-400 pointer-events-none"
                  : "hover:text-blue-600"
              }`}
            >
              Resources
            </Link>
            <Link
              href="/meal-planner"
              className={`text-sm font-medium transition-colors ${
                !user
                  ? "text-gray-400 pointer-events-none"
                  : "hover:text-blue-600"
              }`}
            >
              Meal Planner
            </Link>
            <Link
              href="/exercise"
              className={`text-sm font-medium transition-colors ${
                !user
                  ? "text-gray-400 pointer-events-none"
                  : "hover:text-blue-600"
              }`}
            >
              Exercise Tracker
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm">Welcome, {user.username}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoginView(true);
                    setIsAuthModalOpen(true);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsLoginView(false);
                    setIsAuthModalOpen(true);
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      {/* Authentication Modal */}
      <Dialog 
        open={isAuthModalOpen} 
        onOpenChange={(open) => {
          // Only allow closing if user is logged in
          if (!open && user) {
            setIsAuthModalOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] z-50">
          <DialogHeader>
            <DialogTitle>DiabBot Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 mb-4">
            <Button
              variant={isLoginView ? "default" : "outline"}
              onClick={() => toggleView("login")}
              className="w-1/2"
            >
              Login
            </Button>
            <Button
              variant={!isLoginView ? "default" : "outline"}
              onClick={() => toggleView("register")}
              className="w-1/2"
            >
              Register
            </Button>
          </div>
          {isLoginView ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {registerError && <p className="text-red-500 text-sm">{registerError}</p>}
              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}