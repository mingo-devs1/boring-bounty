import { getBountyById } from '@/lib/server-actions/bounties';
import { getSubmissionsByBounty } from '@/lib/server-actions/submissions';
import { Trophy, Clock, DollarSign, Building2, Calendar, MapPin, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import SubmitBountyForm from '@/components/submit-bounty-form';
import ReviewSubmissionsWrapper from '@/components/review-submissions-wrapper';
import FadeIn from '@/components/motion/fade-in';

export default async function BountyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { success, bounty, error } = await getBountyById(id);
  const { success: subsSuccess, submissions } = await getSubmissionsByBounty(id);

  if (!success || !bounty) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#FF3B3B] text-lg">{error || 'Bounty not found'}</p>
          <Link href="/bounties" className="mt-4 inline-block text-[#FF3B3B] hover:underline font-medium">
            Back to Bounties
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = bounty.status === 'open' && new Date(bounty.deadline) > new Date();

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <FadeIn>
        <div className="bg-white border-b border-[#1F2A2E]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/bounties"
              className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#FF3B3B] mb-6 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bounties
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {bounty.industry && (
                    <span className="px-3 py-1 bg-[#14B8A6]/10 text-[#14B8A6] text-sm font-medium rounded-full border border-[#14B8A6]/20">
                      {bounty.industry}
                    </span>
                  )}
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    isOpen 
                      ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                      : 'bg-[#1F2A2E]/10 text-[#64748B]'
                  }`}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>

                <h1 className="text-4xl font-bold mb-4 text-[#1F2A2E]">{bounty.title}</h1>
                
                <div className="flex flex-wrap items-center gap-6 text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <Link href={`/profile/${bounty.created_by}`} className="hover:text-[#FF3B3B] transition-colors">
                      {bounty.organization_name || 'Anonymous Organization'}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>Posted {formatDistanceToPosted(bounty.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className={new Date(bounty.deadline) < new Date() ? 'text-[#FF3B3B]' : ''}>
                      Deadline: {format(new Date(bounty.deadline), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 lg:items-end">
                <div className="flex items-center gap-2 text-3xl font-bold text-[#FF3B3B]">
                  <DollarSign className="w-8 h-8" />
                  <span>{bounty.reward.toLocaleString()}</span>
                </div>
                {isOpen && (
                  <SubmitBountyForm bountyId={bounty.id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <FadeIn delay={0.1}>
              <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4 text-[#1F2A2E]">Description</h2>
                <div className="prose max-w-none">
                  <p className="text-[#64748B] whitespace-pre-wrap">{bounty.description}</p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4 text-[#1F2A2E]">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {bounty.required_skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-4 py-2 bg-[#F8F4ED] text-[#1F2A2E] rounded-lg font-medium border border-[#1F2A2E]/10 hover:border-[#FF3B3B]/50 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>

            {subsSuccess && submissions.length > 0 && (
              <FadeIn delay={0.3}>
                <ReviewSubmissionsWrapper 
                  submissions={submissions} 
                  bountyId={bounty.id} 
                  creatorId={bounty.created_by}
                />
              </FadeIn>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FadeIn delay={0.4}>
              <div className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm">
                <h3 className="font-semibold mb-4 text-[#1F2A2E]">Organization</h3>
                <Link
                  href={`/profile/${bounty.created_by}`}
                  className="flex items-center gap-3 p-4 bg-[#F8F4ED] rounded-xl hover:bg-[#F8F4ED]/80 transition-colors border border-[#1F2A2E]/10"
                >
                  <div className="w-10 h-10 bg-[#FF3B3B]/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#FF3B3B]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1F2A2E]">{bounty.organization_name || 'Anonymous'}</p>
                    {bounty.organization_rating > 0 && (
                      <p className="text-sm text-[#FF3B3B]">★ {bounty.organization_rating.toFixed(1)}</p>
                    )}
                  </div>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm">
                <h3 className="font-semibold mb-4 text-[#1F2A2E]">Bounty Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Reward</span>
                    <span className="font-medium text-[#FF3B3B]">${bounty.reward.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Deadline</span>
                    <span className="font-medium text-[#1F2A2E]">{format(new Date(bounty.deadline), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Status</span>
                    <span className={`font-medium ${isOpen ? 'text-[#14B8A6]' : 'text-[#64748B]'}`}>
                      {isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {subsSuccess && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Submissions</span>
                      <span className="font-medium text-[#1F2A2E]">{submissions.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDistanceToPosted(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const { formatDistanceToNow } = require('date-fns');
  return formatDistanceToNow(date, options);
}
