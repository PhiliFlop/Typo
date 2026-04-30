export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /api/scores - retrieve top scores
    if (path === '/api/scores' && request.method === 'GET') {
      try {
        const stmt = env.DB.prepare(
          'SELECT name, score FROM scores ORDER BY score DESC LIMIT 100'
        );
        const result = await stmt.all();
        return new Response(JSON.stringify({ scores: result.results || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /api/scores - save a new score
    if (path === '/api/scores' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, score } = body;

        if (!name || score === undefined) {
          return new Response(JSON.stringify({ error: 'Missing name or score' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Sanitize input
        const cleanName = String(name).substring(0, 50);
        const cleanScore = Math.max(0, Math.min(999999, parseInt(score) || 0));

        const stmt = env.DB.prepare(
          'INSERT INTO scores (name, score, timestamp) VALUES (?, ?, ?)'
        );
        await stmt.bind(cleanName, cleanScore, new Date().toISOString()).run();

        const rankStmt = env.DB.prepare(
          'SELECT COUNT(*) as higher FROM scores WHERE score > ?'
        );
        const rankResult = await rankStmt.bind(cleanScore).first();
        const rank = (rankResult?.higher || 0) + 1;

        return new Response(JSON.stringify({ success: true, rank }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 404 for other routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
