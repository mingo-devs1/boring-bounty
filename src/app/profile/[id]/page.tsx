import { getOrganizationById } from '@/lib/server-actions/organizations';
import { getUserByWalletAddress } from '@/lib/server-actions/auth';
import { getBountiesByCreator } from '@/lib/server-actions/bounties';
import { getSubmissionsByUser } from '@/lib/server-actions/submissions';
import { Building2, User, Star, Trophy, Globe, Mail, MapPin, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import FadeIn from '@/components/motion/fade-in';
import AnimatedCard from '@/components/motion/animated-card';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { success: orgSuccess, organization } = await getOrganizationById(id);
  
  if (!orgSuccess || !organization) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B] text-lg">Profile not found</p>
          <Link href="/" className="mt-4 inline-block text-[#FF3B3B] hover:underline font-medium">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isBuilder = organization.role === 'builder';
  const { success: bountiesSuccess, bounties } = await getBountiesByCreator(organization.id);
  const { success: subsSuccess, submissions } = await getSubmissionsByUser(organization.id);

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <FadeIn>
        <div className="bg-white border-b border-[#1F2A2E]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#FF3B3B] mb-6 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className={`w-32 h-32 rounded-2xl flex items-center justify-center ${
                  isBuilder 
                    ? 'bg-[#FF3B3B]/10' 
                    : 'bg-[#14B8A6]/10'
                }`}>
                  {isBuilder ? (
                    <User className="w-16 h-16 text-[#FF3B3B]" />
                  ) : (
                    <Building2 className="w-16 h-16 text-[#14B8A6]" />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2 text-[#1F2A2E]">
                      {isBuilder ? organization.username : organization.name || organization.username}
                    </h1>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        isBuilder 
                          ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20'
                          : 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                      }`}>
                        {isBuilder ? 'Builder' : 'Organization'}
                      </span>
                      {organization.rating > 0 && (
                        <div className="flex items-center gap-1 text-[#FF3B3B]">
                          <Star className="w-4 h-4 fill-[#FF3B3B]" />
                          <span className="font-medium">{organization.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {organization.bio && (
                  <p className="text-[#64748B] mb-4">{organization.bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
                  {organization.website && (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#FF3B3B] transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {organization.github && (
                    <a
                      href={organization.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#FF3B3B] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {organization.linkedin && (
                    <a
                      href={organization.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#FF3B3B] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDistanceToNow(new Date(organization.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {isBuilder && organization.skills && organization.skills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2 text-[#1F2A2E]">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {organization.skills.map((skill: string, index: number) => (
                        <FadeIn key={skill} delay={index * 0.05}>
                          <span
                            className="px-3 py-1 bg-[#F8F4ED] text-[#1F2A2E] text-sm rounded-full border border-[#1F2A2E]/10 hover:border-[#FF3B3B]/50 transition-colors"
                          >
                            {skill}
                          </span>
                        </FadeIn>
                      ))}
                    </div>
                  </div>
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
            {isBuilder ? (
              <>
                {subsSuccess && submissions.length > 0 && (
                  <FadeIn delay={0.1}>
                    <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
                      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-[#1F2A2E]">
                        <Trophy className="w-6 h-6 text-[#FF3B3B]" />
                        Submissions ({submissions.length})
                      </h2>
                      <div className="space-y-4">
                        {submissions.map((submission: any, index: number) => (
                          <AnimatedCard
                            key={submission.id}
                            href={`/bounty/${submission.bounty_id}`}
                            delay={index * 0.05}
                            className="p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-[#1F2A2E]">{submission.bounty_title || 'Unknown Bounty'}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                submission.status === 'won' ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20' :
                                submission.status === 'accepted' ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20' :
                                submission.status === 'rejected' ? 'bg-[#1F2A2E]/10 text-[#64748B]' :
                                'bg-[#1F2A2E]/10 text-[#64748B]'
                              }`}>
                                {submission.status}
                              </span>
                            </div>
                            <p className="text-sm text-[#64748B] line-clamp-2">{submission.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-[#64748B]">
                              <span>{formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}</span>
                              {submission.score && <span>• Score: {submission.score}</span>}
                            </div>
                          </AnimatedCard>
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                )}
              </>
            ) : (
              <>
                {bountiesSuccess && bounties.length > 0 && (
                  <FadeIn delay={0.1}>
                    <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
                      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-[#1F2A2E]">
                        <Trophy className="w-6 h-6 text-[#FF3B3B]" />
                        Posted Bounties ({bounties.length})
                      </h2>
                      <div className="space-y-4">
                        {bounties.map((bounty: any, index: number) => (
                          <AnimatedCard
                            key={bounty.id}
                            href={`/bounty/${bounty.id}`}
                            delay={index * 0.05}
                            className="p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-[#1F2A2E]">{bounty.title}</h3>
                              <span className="text-[#FF3B3B] font-semibold">${bounty.reward.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-[#64748B] line-clamp-2 mb-2">{bounty.description}</p>
                            <div className="flex items-center gap-2 text-xs text-[#64748B]">
                              <span className={`px-2 py-1 rounded-full ${
                                bounty.status === 'open' ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20' : 'bg-[#1F2A2E]/10 text-[#64748B]'
                              }`}>
                                {bounty.status}
                              </span>
                              <span>{formatDistanceToNow(new Date(bounty.created_at), { addSuffix: true })}</span>
                            </div>
                          </AnimatedCard>
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                )}
              </>
            )}

            {!isBuilder && subsSuccess && submissions.length > 0 && (
              <FadeIn delay={0.2}>
                <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
                  <h2 className="text-2xl font-semibold mb-6 text-[#1F2A2E]">Received Submissions</h2>
                  <div className="space-y-4">
                    {submissions.map((submission: any, index: number) => (
                      <AnimatedCard
                        key={submission.id}
                        delay={index * 0.05}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-[#1F2A2E]">{submission.builder_username || 'Anonymous'}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            submission.status === 'won' ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20' :
                            submission.status === 'accepted' ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20' :
                            submission.status === 'rejected' ? 'bg-[#1F2A2E]/10 text-[#64748B]' :
                            'bg-[#1F2A2E]/10 text-[#64748B]'
                          }`}>
                            {submission.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#64748B] line-clamp-2">{submission.description}</p>
                        {submission.score && (
                          <div className="mt-2 text-sm text-[#FF3B3B]">Score: {submission.score}</div>
                        )}
                      </AnimatedCard>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FadeIn delay={0.3}>
              <div className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm">
                <h3 className="font-semibold mb-4 text-[#1F2A2E]">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Rating</span>
                    <span className="font-medium text-[#1F2A2E]">
                      {organization.rating > 0 ? `${organization.rating.toFixed(1)}/5` : 'No ratings yet'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">
                      {isBuilder ? 'Completed Bounties' : 'Posted Bounties'}
                    </span>
                    <span className="font-medium text-[#1F2A2E]">{organization.completed_bounties}</span>
                  </div>
                  {isBuilder && subsSuccess && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Total Submissions</span>
                        <span className="font-medium text-[#1F2A2E]">{submissions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Won</span>
                        <span className="font-medium text-[#14B8A6]">
                          {submissions.filter((s: any) => s.status === 'won').length}
                        </span>
                      </div>
                    </>
                  )}
                  {!isBuilder && bountiesSuccess && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Open Bounties</span>
                        <span className="font-medium text-[#14B8A6]">
                          {bounties.filter((b: any) => b.status === 'open').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Total Reward Pool</span>
                        <span className="font-medium text-[#FF3B3B]">
                          ${bounties.reduce((sum: number, b: any) => sum + b.reward, 0).toLocaleString()}
                        </span>
                      </div>
                    </>
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
