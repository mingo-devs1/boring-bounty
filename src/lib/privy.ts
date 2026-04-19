import { PrivyClient } from '@privy-io/server-auth';

const privyAppId = process.env.PRIVY_APP_ID!;
const privyAppSecret = process.env.PRIVY_APP_SECRET!;

export const privy = new PrivyClient(privyAppId, privyAppSecret);
