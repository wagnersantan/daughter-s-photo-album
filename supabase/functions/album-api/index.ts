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
  const route = url.searchParams.get("route") || "overview";

  try {
    let result: unknown;

    switch (route) {
      case "overview": {
        const [photos, messages, milestones, members, invites] = await Promise.all([
          supabase.from("photos").select("id", { count: "exact", head: true }),
          supabase.from("messages").select("id", { count: "exact", head: true }),
          supabase.from("milestones").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("invite_links").select("id", { count: "exact", head: true }).eq("active", true),
        ]);
        result = {
          total_photos: photos.count ?? 0,
          total_messages: messages.count ?? 0,
          total_milestones: milestones.count ?? 0,
          total_members: members.count ?? 0,
          active_invites: invites.count ?? 0,
        };
        break;
      }

      case "photos": {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const category = url.searchParams.get("category");
        let query = supabase
          .from("photos")
          .select("id, caption, storage_path, created_at, category_id, user_id")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (category) query = query.eq("category_id", category);
        const { data, error } = await query;
        if (error) throw error;

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        result = (data || []).map((p) => ({
          ...p,
          public_url: `${SUPABASE_URL}/storage/v1/object/public/photos/${p.storage_path}`,
        }));
        break;
      }

      case "categories": {
        const { data, error } = await supabase
          .from("photo_categories")
          .select("id, name, created_at")
          .order("name");
        if (error) throw error;
        result = data;
        break;
      }

      case "messages": {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const { data, error } = await supabase
          .from("messages")
          .select("id, content, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw error;
        result = data;
        break;
      }

      case "milestones": {
        const { data, error } = await supabase
          .from("milestones")
          .select("id, title, description, icon, milestone_date, photo_path, created_at")
          .order("milestone_date", { ascending: true });
        if (error) throw error;
        result = data;
        break;
      }

      case "members": {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, display_name, avatar_url, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        result = data;
        break;
      }

      case "invites": {
        const activeOnly = url.searchParams.get("active") !== "false";
        let query = supabase
          .from("invite_links")
          .select("id, code, active, uses, max_uses, created_at");
        if (activeOnly) query = query.eq("active", true);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        result = (data || []).map((inv) => ({
          ...inv,
          invite_url: `https://albumsophia.lovable.app/register?invite=${inv.code}`,
        }));
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            error: "Rota não encontrada",
            available_routes: ["overview", "photos", "categories", "messages", "milestones", "members", "invites"],
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify({ route, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
