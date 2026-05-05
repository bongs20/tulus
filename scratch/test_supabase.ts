import { Client } from 'pg';

async function testConnection() {
    const password = 'saitamacuiah1';
    const projectId = 'sjqoxlnrnffbypvznbcl';
    
    const hosts = [
        `db.${projectId}.supabase.co`,
        `aws-0-ap-southeast-1.pooler.supabase.com` // common region
    ];
    
    for (const host of hosts) {
        console.log(`Testing host: ${host}`);
        const client = new Client({
            host,
            port: 5432,
            user: 'postgres',
            password,
            database: 'postgres',
            connectionTimeoutMillis: 5000,
        });
        
        try {
            await client.connect();
            console.log(`Successfully connected to ${host} on port 5432`);
            await client.end();
            break;
        } catch (err: any) {
            console.error(`Failed to connect to ${host} on port 5432: ${err.message}`);
        }

        const poolerClient = new Client({
            host,
            port: 6543,
            user: host.includes('pooler') ? `postgres.${projectId}` : 'postgres',
            password,
            database: 'postgres',
            connectionTimeoutMillis: 5000,
        });

        try {
            await poolerClient.connect();
            console.log(`Successfully connected to ${host} on port 6543`);
            await poolerClient.end();
            break;
        } catch (err: any) {
            console.error(`Failed to connect to ${host} on port 6543: ${err.message}`);
        }
    }
}

testConnection();
