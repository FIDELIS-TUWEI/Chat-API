const { Pool } = require('pg');
const config = require('../src/utils/config');

const pool = new Pool({
    user: config.POSTGRES_USER,
    host: config.POSTGRES_HOST || 'postgres',
    database: config.POSTGRES_DB,
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT || 5432,
});

const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the PostgreSQL database');
        client.release();
        return true;
    } catch (err) {
        console.error('Error connecting to the database', err);
        return false;
    }
};

const checkTablesExist = async () => {
    const client = await pool.connect();
    try {
        const tables = ['User', 'Friendship', 'Group', 'GroupMember', 'Message', 'GroupMessage', 'Notification'];
        for (const table of tables) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = $1
                );
            `, [table]);
            if (!result.rows[0].exists) {
                return false;
            }
        }
        return true;
    } finally {
        client.release();
    }
};

const createTables = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create User table
        await client.query(`
        CREATE TABLE IF NOT EXISTS "User" (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            profile_picture VARCHAR(255),
            is_verified BOOLEAN DEFAULT FALSE,
            mfa_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `);

        // Create Friendship table
        await client.query(`
        CREATE TABLE IF NOT EXISTS "Friendship" (
            friendship_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            friend_user_id INTEGER NOT NULL,
            status VARCHAR(10) CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "User" (user_id),
            FOREIGN KEY (friend_user_id) REFERENCES "User" (user_id)
        );
        `);

        // Create Group table
        await client.query(`
        CREATE TABLE IF NOT EXISTS "Group" (
            group_id SERIAL PRIMARY KEY,
            group_name VARCHAR(100) NOT NULL,
            group_picture VARCHAR(255),
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES "User" (user_id)
        );
        `);

        // Create GroupMember table
        await client.query(`
        CREATE TABLE IF NOT EXISTS "GroupMember" (
            group_member_id SERIAL PRIMARY KEY,
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES "Group" (group_id),
            FOREIGN KEY (user_id) REFERENCES "User" (user_id)
        );
        `);

        // Create Message table
        await client.query(`
        CREATE TABLE IF NOT EXISTS "Message" (
            message_id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            content TEXT,
            file_url VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES "User" (user_id),
            FOREIGN KEY (recipient_id) REFERENCES "User" (user_id)
        );
        `);

        // Create GroupMessage table
        await client.query(`
        CREATE TABLE IF NOT EXISTS "GroupMessage" (
            group_message_id SERIAL PRIMARY KEY,
            group_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            content TEXT,
            file_url VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES "Group" (group_id),
            FOREIGN KEY (sender_id) REFERENCES "User" (user_id)
        );
        `);

        // Create Notification table
        await client.query(`
        CREATE TABLE IF NOT EXISTS "Notification" (
            notification_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            message VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "User" (user_id)
        );
        `);

        await client.query('COMMIT');
        console.log('All tables created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const query = (text, params) => pool.query(text, params);

module.exports = {
    testConnection,
    checkTablesExist,
    createTables,
    query,
};