import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AppLayout } from '~/layouts/AppLayout';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';

export default function ForgotPasswordPage() {
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    email: '',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post('/forgot-password');
  };

  return (
    <AppLayout>
      <Head title="Forgot Password" />
      <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentlySuccessful ? (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">A password reset link has been sent to your email address.</p>
                    </div>
                  </div>
                </div>
              ) : (
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
                      disabled={processing}
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <Button type="submit" className="w-full" loading={processing} disabled={processing}>
                      Send reset link
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center text-sm">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to Sign In
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}