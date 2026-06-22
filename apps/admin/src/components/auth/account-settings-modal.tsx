'use client';

import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { AdminRole } from '@avitus/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, ApiResponse } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
}

export function AccountSettingsModal({
  open,
  onOpenChange,
  username,
}: AccountSettingsModalProps) {
  const { updateSession } = useAuth();

  const [login, setLogin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLogin(username ?? '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [open, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedLogin = login.trim();
    const loginChanged = trimmedLogin !== (username ?? '');
    const passwordChanged = newPassword.length > 0 || confirmPassword.length > 0;

    if (!trimmedLogin) {
      setError('Login bo\'sh bo\'lmasligi kerak');
      return;
    }

    if (!currentPassword) {
      setError('Joriy parolni kiriting');
      return;
    }

    if (!loginChanged && !passwordChanged) {
      setError('Login yoki parolni o\'zgartiring');
      return;
    }

    if (passwordChanged) {
      if (newPassword.length < 8) {
        setError('Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak');
        return;
      }
      if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        setError('Parol kamida bitta harf va bitta raqam bo\'lishi kerak');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Yangi parollar mos kelmadi');
        return;
      }
    }

    setLoading(true);
    try {
      let latestToken: string | undefined;
      let latestAdmin: { _id: string; username: string; role: AdminRole } | undefined;

      if (loginChanged) {
        const { data } = await api.patch<
          ApiResponse<{ token: string; admin: { _id: string; username: string; role: AdminRole } }>
        >('/auth/change-username', {
          newUsername: trimmedLogin,
          currentPassword,
        });
        latestToken = data.data.token;
        latestAdmin = data.data.admin;
      }

      if (passwordChanged) {
        const { data } = await api.patch<
          ApiResponse<{ token: string; admin: { _id: string; username: string; role: AdminRole } }>
        >('/auth/change-password', {
          currentPassword,
          newPassword,
          confirmPassword,
        });
        latestToken = data.data?.token;
        latestAdmin = data.data?.admin;
      }

      if (latestToken && latestAdmin) {
        updateSession(latestToken, {
          sub: latestAdmin._id,
          username: latestAdmin.username,
          role: latestAdmin.role,
        });
      }

      const messages: string[] = [];
      if (loginChanged) messages.push('login');
      if (passwordChanged) messages.push('parol');

      setSuccess(
        messages.length === 2
          ? 'Login va parol muvaffaqiyatli yangilandi'
          : loginChanged
            ? 'Login muvaffaqiyatli yangilandi'
            : 'Parol muvaffaqiyatli yangilandi',
      );

      setTimeout(() => onOpenChange(false), 1200);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Saqlashda xatolik yuz berdi';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[420px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:mx-0">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Login va parol</DialogTitle>
          <DialogDescription>
            Login yoki parolni o&apos;zgartiring. Saqlash uchun joriy parol talab qilinadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-login">Login</Label>
            <Input
              id="modal-login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Login"
              required
              minLength={3}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-current-password">Joriy parol</Label>
            <Input
              id="modal-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-new-password">Yangi parol</Label>
            <Input
              id="modal-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="O'zgartirmasangiz bo'sh qoldiring"
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-confirm-password">Yangi parolni tasdiqlang</Label>
            <Input
              id="modal-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Parolni qayta kiriting"
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading} className={cn(loading && 'opacity-80')}>
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
