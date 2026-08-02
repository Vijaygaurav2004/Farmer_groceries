import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SupabaseService } from '../../src/services/supabase';
import { storageService } from '../../src/services/storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { validateEmail, validatePhone } from '../../src/utils/helpers';
import { Button, Input, useToast, FadeInUp } from '../../src/components/ui';
import { gradients, palette, radii, shadows } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser, setJustLoggedIn } = useAuth();
  const toast = useToast();

  const handleAuth = async () => {
    if (!email || !password) return toast.show('Please enter email and password', 'error');
    if (isSignUp && !name) return toast.show('Please enter your name', 'error');
    if (isSignUp && !phone) return toast.show('Please enter your phone number', 'error');
    if (!validateEmail(email.trim())) return toast.show('Please enter a valid email address', 'error');
    if (password.length < 6) return toast.show('Password must be at least 6 characters', 'error');
    if (isSignUp && !validatePhone(phone.replace(/\D/g, '').slice(-10)))
      return toast.show('Enter a valid 10-digit mobile number', 'error');

    setLoading(true);
    try {
      if (isSignUp) {
        const { user } = await SupabaseService.signUp(email, password);
        if (user) {
          try {
            await SupabaseService.createUser(user.id, {
              email: user.email || email,
              name: name.trim(),
              phoneNumber: `+91 ${phone.replace(/\D/g, '').slice(-10)}`,
            });
          } catch {}
          await SupabaseService.signOut();
          await storageService.clearUser();
          setEmail(''); setPassword(''); setName(''); setPhone('');
          setIsSignUp(false);
          toast.show('Account created! Please sign in.', 'success');
        }
      } else {
        const { user } = await SupabaseService.signIn(email, password);
        if (user) {
          const userData = await SupabaseService.getUser(user.id);
          if (userData && userData.role) {
            await refreshUser();
            toast.show(`Welcome back, ${userData.name || 'friend'}!`, 'success');
            if (userData.role === 'customer') router.replace('/(customer)/home');
            else if (userData.role === 'farmer') router.replace('/(farmer)/dashboard');
            else if (userData.role === 'delivery') router.replace('/(delivery)/orders');
          } else {
            if (!userData) {
              try {
                await SupabaseService.createUser(user.id, {
                  email: user.email || email,
                  name: user.email?.split('@')[0] || 'User',
                });
              } catch (error: any) {
                if (error?.code !== '23505') console.error('Login: Error creating user:', error);
              }
            }
            await storageService.saveUser({
              id: user.id, email: user.email || email,
              name: userData?.name || user.email?.split('@')[0] || 'User',
              createdAt: new Date(), updatedAt: new Date(),
            } as any);
            setJustLoggedIn(true);
            await refreshUser();
            await new Promise((r) => setTimeout(r, 300));
            router.replace('/role-select');
          }
        }
      }
    } catch (error: any) {
      toast.show(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: palette.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 72, paddingBottom: 90, paddingHorizontal: 24, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
          <FadeInUp distance={-16}>
            <View style={[{ width: 76, height: 76, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }]}>
              <Text style={{ fontSize: 40 }}>🌾</Text>
            </View>
            <Text style={{ fontSize: 34, fontWeight: '900', color: palette.white, letterSpacing: -0.6 }}>Farmer{'\n'}Groceries</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 8, fontWeight: '500' }}>
              Farm-fresh produce, delivered to your door 🚚
            </Text>
          </FadeInUp>
        </LinearGradient>

        {/* Form card */}
        <FadeInUp
          delay={120}
          distance={24}
          style={[{ marginTop: -56, marginHorizontal: 18, backgroundColor: palette.white, borderRadius: radii.xl, padding: 22 }, shadows.lg] as any}
        >
          {/* Segmented toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: palette.slate100, borderRadius: radii.pill, padding: 4, marginBottom: 22 }}>
            {[{ k: false, label: 'Sign In' }, { k: true, label: 'Sign Up' }].map((t) => {
              const active = isSignUp === t.k;
              return (
                <Pressable key={t.label} onPress={() => { setIsSignUp(t.k); setName(''); setPhone(''); }} style={{ flex: 1 }}>
                  <View style={[{ paddingVertical: 11, borderRadius: radii.pill, alignItems: 'center', backgroundColor: active ? palette.white : 'transparent' }, active ? shadows.sm : undefined]}>
                    <Text style={{ fontWeight: '800', fontSize: 14.5, color: active ? palette.green700 : palette.slate500 }}>{t.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ fontSize: 22, fontWeight: '900', color: palette.ink, letterSpacing: -0.4 }}>
            {isSignUp ? 'Create your account' : 'Welcome back 👋'}
          </Text>
          <Text style={{ fontSize: 14, color: palette.slate500, marginTop: 4, marginBottom: 20 }}>
            {isSignUp ? 'Join thousands buying direct from farms' : 'Sign in to continue shopping fresh'}
          </Text>

          {isSignUp && <Input label="Full Name" icon="person-outline" placeholder="Enter your full name" autoCapitalize="words" value={name} onChangeText={setName} />}
          <Input label="Email" icon="mail-outline" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          {isSignUp && <Input label="Phone Number" icon="call-outline" prefix="+91" placeholder="9876543210" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />}
          <Input label="Password" icon="lock-closed-outline" placeholder={isSignUp ? 'Create a password' : 'Enter your password'} isPassword value={password} onChangeText={setPassword} />

          <View style={{ marginTop: 6 }}>
            <Button label={isSignUp ? 'Create Account' : 'Sign In'} icon={isSignUp ? 'sparkles' : 'log-in-outline'} loading={loading} onPress={handleAuth} size="lg" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <Ionicons name="shield-checkmark" size={14} color={palette.green600} />
            <Text style={{ fontSize: 12, color: palette.slate400, marginLeft: 6 }}>Secure · By continuing you agree to our Terms</Text>
          </View>
        </FadeInUp>

        {/* Trust badges */}
        <FadeInUp delay={300} style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 26, marginBottom: 30, paddingHorizontal: 20 } as any}>
          {[{ i: '🌱', t: '100% Organic' }, { i: '🚜', t: 'Direct Farms' }, { i: '⚡', t: 'Fast Delivery' }].map((b) => (
            <View key={b.t} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22 }}>{b.i}</Text>
              <Text style={{ fontSize: 11.5, color: palette.slate500, marginTop: 5, fontWeight: '600' }}>{b.t}</Text>
            </View>
          ))}
        </FadeInUp>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
