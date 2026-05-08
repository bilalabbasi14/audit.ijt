import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { usernameToEmail } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AuthBackground } from '@/components/shared/AuthBackground';
import { toast } from 'sonner';
import { UserIcon, LockIcon, BuildingIcon, SparklesIcon } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !orgName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const email = usernameToEmail(username);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      const userId = authData.user.id;

      // 2. Create organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({ id: userId, name: orgName });

      if (orgError) throw orgError;

      // 3. Seed default categories
      const { error: rpcError } = await supabase.rpc('seed_default_categories', {
        p_org_id: userId,
      });

      if (rpcError) console.error('Error seeding categories:', rpcError);

      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      <AuthBackground />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-4"
          >
            <span className="text-4xl font-black italic tracking-tighter text-primary">audit.<span className="text-foreground/80">ijt</span></span>
          </motion.div>
          <motion.h1 
            variants={itemVariants}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Get Started
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="mt-2 text-muted-foreground"
          >
            Set up your organization for auditing
          </motion.p>
        </div>

        <Card className="border-none shadow-2xl shadow-primary/5 bg-background/80 backdrop-blur-xl shrink-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight">Create Account</CardTitle>
            <CardDescription>Enter details to build your organization's finance portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="orgName" className="text-sm font-medium">Organization Name</Label>
                <div className="relative">
                  <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="e.g. Bait-ul-Maal Markaz"
                    className="pl-10 h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="choose a username"
                      className="pl-10 h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic px-1">
                    System shared username for your org.
                  </p>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" title="Password input" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </motion.div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <motion.div variants={itemVariants} className="w-full">
                <Button 
                  type="submit" 
                  id="signup-button"
                  className="w-full h-11 text-base font-semibold transition-all hover:translate-y-[-1px] active:translate-y-0" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account 
                    </span>
                  )}
                </Button>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Login instead
                </Link>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
