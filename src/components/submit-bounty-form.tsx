'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { createApplication, getApplicationByUserAndBounty, updateApplication, submitApplication } from '@/lib/server-actions/applications';
import { getCategoriesByBounty } from '@/lib/server-actions/categories';
import { Send, Loader2, Globe, Tag } from 'lucide-react';

interface SubmitBountyFormProps {
  bountyId: string;
}

export default function SubmitBountyForm({ bountyId }: SubmitBountyFormProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [formData, setFormData] = useState({
    github_link: '',
    demo_link: '',
    description: '',
  });

  useEffect(() => {
    // Fetch categories for this bounty
    getCategoriesByBounty(bountyId).then((result) => {
      if (result.success) {
        setCategories(result.categories);
      }
    });

    // Check if user already has an application for this bounty
    if (user) {
      getApplicationByUserAndBounty(user.id, bountyId).then((result) => {
        if (result.success) {
          setExistingApplication(result.application);
          if (result.application) {
            // Pre-fill form with existing data
            setFormData({
              github_link: result.application.github_link || '',
              demo_link: result.application.demo_link || '',
              description: result.application.description || '',
            });
            setSelectedCategoryIds(
              result.application.application_categories?.map((ac: any) => ac.categories.id) || []
            );
          }
        }
        setCheckingApplication(false);
      });
    }
  }, [bountyId, user]);

  if (!isAuthenticated || !user || user.role !== 'builder') {
    return (
      <button
        onClick={() => router.push('/complete-profile')}
        className="w-full py-3 bg-[#FF3B3B] hover:bg-[#E53333] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B3B]/20"
      >
        <Send className="w-5 h-5" />
        Connect as Builder to Submit
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;
      if (existingApplication) {
        // Update existing application
        result = await updateApplication({
          application_id: existingApplication.id,
          user_id: user.id,
          github_link: formData.github_link || undefined,
          demo_link: formData.demo_link || undefined,
          description: formData.description,
          category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        });
      } else {
        // Create new application
        result = await createApplication({
          bounty_id: bountyId,
          user_id: user.id,
          github_link: formData.github_link || undefined,
          demo_link: formData.demo_link || undefined,
          description: formData.description,
          category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        });
      }

      if (result.success) {
        router.refresh();
        setIsOpen(false);
        setFormData({ github_link: '', demo_link: '', description: '' });
        setSelectedCategoryIds([]);
      } else {
        setError(result.error || 'Failed to save application');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!existingApplication || !user) return;

    setLoading(true);
    const result = await submitApplication(existingApplication.id, user.id);
    if (result.success) {
      router.refresh();
      setExistingApplication({ ...existingApplication, status: 'submitted' });
    } else {
      setError(result.error || 'Failed to submit application');
    }
    setLoading(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (!isOpen) {
    if (checkingApplication) {
      return (
        <button
          disabled
          className="w-full py-3 bg-[#F8F4ED] text-[#64748B] rounded-xl font-semibold flex items-center justify-center gap-2 border border-[#1F2A2E]/10"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          Checking...
        </button>
      );
    }

    if (existingApplication) {
      // Show Edit and Update Submission buttons for both draft and submitted applications
      return (
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 py-3 bg-[#F8F4ED] hover:bg-[#FF3B3B] hover:text-white text-[#1F2A2E] rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-[#1F2A2E]/10"
          >
            <Tag className="w-5 h-5" />
            Edit
          </button>
          <button
            onClick={handleSubmitApplication}
            disabled={loading}
            className="flex-1 py-3 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#14B8A6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {existingApplication.status === 'submitted' ? 'Update' : 'Submit'}
          </button>
        </div>
      );
    }

    // No application - show Apply button
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 bg-[#FF3B3B] hover:bg-[#E53333] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B3B]/20"
      >
        <Send className="w-5 h-5" />
        Apply
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(false)}
        className="w-full py-3 bg-[#F8F4ED] hover:bg-[#F8F4ED]/80 text-[#1F2A2E] rounded-xl font-semibold transition-colors mb-4 border border-[#1F2A2E]/10"
      >
        Cancel
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-lg text-[#FF3B3B] text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">GitHub Link (optional)</label>
            <div className="relative">
              <input
                type="url"
                value={formData.github_link}
                onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                placeholder="https://github.com/username/repo"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Demo Link (optional)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
              <input
                type="url"
                value={formData.demo_link}
                onChange={(e) => setFormData({ ...formData, demo_link: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                placeholder="https://your-demo.vercel.app"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
              className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
              placeholder="Describe your solution, approach, and any relevant details..."
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Select Categories (optional)</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedCategoryIds.includes(category.id)
                        ? 'bg-[#FF3B3B] border-[#FF3B3B] text-white'
                        : 'bg-[#F8F4ED] border-[#1F2A2E]/10 text-[#1F2A2E] hover:border-[#FF3B3B]/50'
                    }`}
                  >
                    <Tag className="w-4 h-4 inline mr-1" />
                    {category.name}
                  </button>
                ))}
              </div>
              <p className="text-sm text-[#64748B] mt-2">
                Select one or more categories that match your submission.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FF3B3B] hover:bg-[#E53333] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#FF3B3B]/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Save as Draft
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
