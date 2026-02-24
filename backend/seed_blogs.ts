import pool from './src/db';

async function seedData() {
    try {
        console.log('Connecting to database to clean and seed data...');

        // 1. Delete customer dummy data
        console.log('Deleting Test Customer Dummy Data...');
        const deleteRes = await pool.query(`DELETE FROM customers WHERE form_data->>'email' = 'test@example.com'`);
        console.log(`Deleted ${deleteRes.rowCount} dummy customers.`);

        // 2. Add Dummy Blogs
        console.log('Seeding Blogs Table...');
        const blogsToInsert = [
            {
                title: 'Understanding Anxiety in the Modern Workplace',
                content: 'Anxiety is a highly prevalent condition affecting millions of professionals globally. In this post, we explore the origins of workplace-induced anxiety and present actionable strategies for mitigating stress. Techniques such as mindfulness meditation, structured breaks, and clear boundary-setting are critically reviewed.\n\nThis article aims to provide a comprehensive toolkit for employees struggling to maintain mental equilibrium in high-performance environments.',
                image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80',
                is_active: true
            },
            {
                title: 'The Power of Cognitive Restructuring',
                content: 'Cognitive Restructuring is a core component of Cognitive Behavioral Therapy (CBT). It involves identifying irrational or maladaptive thought patterns, systematically challenging them, and replacing them with balanced, realistic alternatives.\n\nHere we provide a step-by-step guide to recognizing cognitive distortions like "catastrophizing" and "black-and-white thinking," empowering you to take proactive control over your internal narrative.',
                image_url: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80',
                is_active: true
            },
            {
                title: 'Navigating Relationship Conflicts Constructively',
                content: 'Conflict is an inevitable facet of human relationships. However, a conflict does not necessitate a breakdown in communication. In this deep dive, we outline the principles of non-violent communication and active listening.\n\nBy prioritizing emotional regulation and empathetic engagement, couples and individuals can foster deeper connections even during periods of intense disagreement.',
                image_url: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80',
                is_active: false
            }
        ];

        let insertedCount = 0;
        for (const blog of blogsToInsert) {
            const check = await pool.query('SELECT id FROM blogs WHERE title = $1', [blog.title]);
            if (check.rowCount === 0) {
                await pool.query(
                    `INSERT INTO blogs (title, content, image_url, is_active) VALUES ($1, $2, $3, $4)`,
                    [blog.title, blog.content, blog.image_url, blog.is_active]
                );
                insertedCount++;
            }
        }
        console.log(`Successfully seeded ${insertedCount} new dummy blogs.`);

    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

seedData();
