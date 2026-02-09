import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dzmiisuxwruoeklbkyzc.supabase.co',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY'
);

async function checkTables() {
  console.log('Checking database tables...\n');

  const tables = ['users', 'devices', 'flow_data', 'alerts', 'companies', 'user_sessions'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`${table}: NOT FOUND - ${error.message}`);
      } else {
        console.log(`${table}: EXISTS (${data?.length || 0} sample rows)`);
      }
    } catch (e: unknown) {
      console.log(`${table}: ERROR - ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  process.exit(0);
}

checkTables();
