'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/contexts/auth-context';
import { createUser } from '@/lib/server-actions/auth';
import { UserRole } from '@/lib/supabase';
import { User, Building2, ArrowRight, Loader2 } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user: privyUser, authenticated } = usePrivy();
  const { user, refreshUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if user already has a profile
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const [formData, setFormData] = useState({
    username: '',
    telegram: '',
    bio: '',
    skills: '',
    github: '',
    portfolio: '',
    linkedin: '',
    x: '',
    name: '',
    description: '',
    website: '',
  });

  if (!authenticated || !privyUser?.wallet?.address) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F4ED]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF3B3B]" />
          <p className="text-[#64748B]">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    setError('');

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

      const result = await createUser({
        wallet_address: privyUser.wallet?.address || '',
        role,
        username: formData.username || undefined,
        telegram: formData.telegram || undefined,
        bio: formData.bio || undefined,
        skills: skillsArray.length > 0 ? skillsArray : undefined,
        github: formData.github || undefined,
        portfolio: formData.portfolio || undefined,
        linkedin: formData.linkedin || undefined,
        x: formData.x || undefined,
        name: formData.name || undefined,
        description: formData.description || undefined,
        website: formData.website || undefined,
      });

      if (result.success) {
        await refreshUser();
        // Small delay to ensure auth context updates
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        setError(result.error || 'Failed to create profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F4ED] p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-[#1F2A2E]">Complete Your Profile</h1>
          <p className="text-[#64748B]">
            {step === 'role' ? 'Choose your role to get started' : 'Tell us more about yourself'}
          </p>
        </div>

        {step === 'role' && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Builder Card */}
            <button
              onClick={() => handleRoleSelect('builder')}
              className="p-8 bg-white rounded-2xl border-2 border-[#1F2A2E]/10 hover:border-[#FF3B3B]/50 transition-all text-left group shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 bg-[#FF3B3B]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <User className="w-6 h-6 text-[#FF3B3B]" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-[#1F2A2E]">Builder</h2>
              <p className="text-[#64748B] text-sm">
                I'm a talent looking to complete bounties and prove my skills
              </p>
            </button>

            {/* Organization Card */}
            <button
              onClick={() => handleRoleSelect('organization')}
              className="p-8 bg-white rounded-2xl border-2 border-[#1F2A2E]/10 hover:border-[#14B8A6]/50 transition-all text-left group shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 bg-[#14B8A6]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-[#14B8A6]" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-[#1F2A2E]">Organization</h2>
              <p className="text-[#64748B] text-sm">
                I'm a company looking to post bounties and hire talent
              </p>
            </button>
          </div>
        )}

        {step === 'details' && role && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
            <button
              type="button"
              onClick={() => setStep('role')}
              className="text-[#64748B] hover:text-[#FF3B3B] mb-6 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to role selection
            </button>

            {error && (
              <div className="mb-6 p-4 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-lg text-[#FF3B3B] text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {role === 'builder' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="yourusername"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Telegram (optional)</label>
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="@yourtelegram"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="React, TypeScript, Solidity..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">GitHub</label>
                      <input
                        type="url"
                        value={formData.github}
                        onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Portfolio</label>
                      <input
                        type="url"
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">LinkedIn</label>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">X (Twitter)</label>
                      <input
                        type="url"
                        value={formData.x}
                        onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                        placeholder="https://x.com/username"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Organization Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="Your Company"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Telegram (optional)</label>
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="@yourtelegram"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="Tell us about your organization..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FF3B3B] hover:bg-[#E53333] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B3B]/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating profile...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
