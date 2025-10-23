import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: contractorRequests } = await supabase
  .from('contractor_requests')
  .select('*')
  .order('created_at', { ascending: false });

console.log('📋 CONTRACTOR_REQUESTS - Dados Completos:\n');
console.log(JSON.stringify(contractorRequests, null, 2));
