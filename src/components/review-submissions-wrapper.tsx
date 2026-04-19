'use client';

import { useAuth } from '@/contexts/auth-context';
import ReviewSubmissions from './review-submissions';

interface ReviewSubmissionsWrapperProps {
  submissions: any[];
  bountyId: string;
  creatorId: string;
}

export default function ReviewSubmissionsWrapper({ submissions, bountyId, creatorId }: ReviewSubmissionsWrapperProps) {
  const { user, isAuthenticated } = useAuth();
  
  const isCreator = Boolean(isAuthenticated && user && user.id === creatorId);

  return <ReviewSubmissions submissions={submissions} bountyId={bountyId} isCreator={isCreator} />;
}
