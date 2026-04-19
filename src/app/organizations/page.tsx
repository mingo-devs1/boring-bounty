import { getOrganizations } from '@/lib/server-actions/organizations';
import { Building2, Globe, Star } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default async function OrganizationsPage() {
  const { success, organizations, error } = await getOrganizations();

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <div className="bg-white border-b border-[#1F2A2E]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-4 text-[#1F2A2E]">Organizations</h1>
          <p className="text-[#64748B] text-lg">
            Discover companies and hiring managers posting bounties
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!success ? (
          <div className="text-center py-12">
            <p className="text-[#FF3B3B]">{error || 'Failed to load organizations'}</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-[#1F2A2E]/20 mx-auto mb-4" />
            <p className="text-[#64748B] text-lg">No organizations yet</p>
            <p className="text-[#64748B] mt-2">Be the first to join!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 hover:border-[#14B8A6]/50 transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#14B8A6]/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#14B8A6]" />
                  </div>
                  {org.rating > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-[#FF3B3B] fill-[#FF3B3B]" />
                      <span className="font-medium text-[#1F2A2E]">{org.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/profile/${org.id}`}
                  className="text-xl font-semibold mb-2 text-[#1F2A2E] hover:text-[#FF3B3B] transition-colors"
                >
                  {org.name || org.username || 'Anonymous Organization'}
                </Link>
                
                {org.description && (
                  <p className="text-[#64748B] text-sm mb-4 line-clamp-2">
                    {org.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-[#64748B]">
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#FF3B3B]"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  <span>
                    Joined {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
