import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AppLayout } from '~/layouts/AppLayout';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label'; // Assuming you'll create a Label component

export default function LoginPage() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <AppLayout>
      <Head title="Login" />
      <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Sign in to your account</CardTitle>
              <CardDescription>
                Or{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  create a new account
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <div className="text-sm">
                      <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      className={errors.password ? 'border-red-500' : ''}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm leading-5 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>

                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={data.remember}
                      onChange={(e) => setData('remember', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </Label>
                  </div>
                </div>

                <div>
                  <Button type="submit" className="w-full" loading={processing} disabled={processing}>
                    Sign in
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center text-sm">
                <p className="text-gray-600">
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
                </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}