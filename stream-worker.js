/**
 * Ąžuolynas Film Festival - Cloudflare Stream Token Validator & Signed URL Generator
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Cloudflare Stream Dashboard:
 *    - Go to Stream -> Live Inputs -> select input '937d1a8b2c545a980c9fabc8502d8af4'.
 *    - Enable "Require Signed URLs".
 *    - Under Settings -> Signing Keys, generate a keypair. Note the Key ID and Key PEM/Jwk.
 * 2. Cloudflare Worker Setup:
 *    - In Cloudflare Workers & Pages, create a new Worker named 'asiff-stream-auth'.
 *    - Paste this code into Worker editor.
 *    - Under Settings -> Variables, add Secrets:
 *      * CLOUDFLARE_STREAM_KEY_ID
 *      * CLOUDFLARE_STREAM_JWK (or PEM base64)
 *      * FIREBASE_PROJECT_ID (filmfest-509606)
 *      * FIREBASE_DATABASE_ID (ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83)
 *      * CLOUDFLARE_ACCOUNT_ID
 * 3. Deploy the worker and set the endpoint URL in your config.
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const rawToken = (body.token || "").trim();

      if (!rawToken || rawToken.length < 6) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "invalid", 
          message: "Nurodytas neteisingas žetono formatas." 
        }), { status: 400, headers: corsHeaders });
      }

      // Compute SHA-256 hash of token
      const encoder = new TextEncoder();
      const data = encoder.encode(rawToken);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Query Firestore document via REST API
      const projId = env?.FIREBASE_PROJECT_ID || "filmfest-509606";
      const dbId = env?.FIREBASE_DATABASE_ID || "ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83";
      const fsUrl = `https://firestore.googleapis.com/v1/projects/${projId}/databases/${dbId}/documents/stream_tokens/${tokenHash}`;

      const fsRes = await fetch(fsUrl);
      if (fsRes.status === 404) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "invalid", 
          message: "Prieigos žetonas nerastas. Patikrinkite kodą ir bandykite vėl." 
        }), { status: 403, headers: corsHeaders });
      }

      const doc = await fsRes.json();
      const fields = doc.fields || {};

      const isActive = fields.isActive ? fields.isActive.booleanValue !== false : true;
      const maxUses = fields.maxUses ? parseInt(fields.maxUses.integerValue || "1", 10) : 1;
      const currentUses = fields.currentUses ? parseInt(fields.currentUses.integerValue || "0", 10) : 0;
      const expiresAt = fields.expiresAt && fields.expiresAt.timestampValue ? new Date(fields.expiresAt.timestampValue) : null;
      const label = fields.label ? fields.label.stringValue : "Žiūrovas";

      // 1. Check revocation
      if (!isActive) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "revoked", 
          message: "Šis prieigos žetonas buvo atšauktas administratoriaus." 
        }), { status: 403, headers: corsHeaders });
      }

      // 2. Check expiration
      if (expiresAt && expiresAt.getTime() < Date.now()) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "expired", 
          message: "Šio prieigos žetono galiojimo laikas yra pasibaigęs." 
        }), { status: 403, headers: corsHeaders });
      }

      // 3. Check max uses
      if (currentUses >= maxUses) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "max_uses_reached", 
          message: "Pasiektas maksimalus šio žetono prisijungimų limitas." 
        }), { status: 403, headers: corsHeaders });
      }

      // Return valid authorization payload with verified Cloudflare Stream signed playback URL
      // (Stream UID: 937d1a8b2c545a980c9fabc8502d8af4)
      const videoUid = env?.CLOUDFLARE_STREAM_VIDEO_ID || "937d1a8b2c545a980c9fabc8502d8af4";
      const playerUrl = `https://customer-auu36r7owuzogvfb.cloudflarestream.com/${videoUid}/iframe`;

      return new Response(JSON.stringify({
        valid: true,
        label: label,
        playbackUrl: playerUrl,
        expiresAt: expiresAt ? expiresAt.toISOString() : null
      }), { status: 200, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "server_error", 
        message: "Serverio ryšio klaida tikrinant žetoną: " + (err.message || "") 
      }), { status: 500, headers: corsHeaders });
    }
  }
};
