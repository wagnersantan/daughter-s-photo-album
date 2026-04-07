import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Authenticate with API key
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("AUTOMATION_API_KEY");

  if (!apiKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const activeOnly = url.searchParams.get("active") !== "false";

  let query = supabase.from("invite_links").select("id, code, active, uses, max_uses, created_at");

  if (activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Build full invite URLs
  const invites = (data || []).map((inv) => ({
    ...inv,
    invite_url: `https://albumsophia.lovable.app/register?invite=${inv.code}`,
  }));

  return new Response(JSON.stringify({ invites }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
